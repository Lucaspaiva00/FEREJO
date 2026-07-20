/**
 * Integração Z-API
 * Documentação: https://developer.z-api.io/
 */

type ZAPIResult = {
  success: boolean;
  disabled?: boolean;
  messageId?: string;
  error?: string;
};

type ZAPIStatus = {
  configured: boolean;
  enabled: boolean;
  connected: boolean;
  status?: string;
  error?: string;
};

function getZAPIConfig() {
  const instanceId = process.env.ZAPI_INSTANCE_ID?.trim() ?? "";
  const token = process.env.ZAPI_TOKEN?.trim() ?? "";
  const clientToken = process.env.ZAPI_CLIENT_TOKEN?.trim() ?? "";
  const enabled = process.env.ZAPI_ENABLED === "true";

  return {
    instanceId,
    token,
    clientToken,
    enabled,
    configured: Boolean(instanceId && token && clientToken),
  };
}

function getZAPIBaseUrl() {
  const config = getZAPIConfig();

  if (!config.configured) {
    return null;
  }

  return `https://api.z-api.io/instances/${encodeURIComponent(
    config.instanceId
  )}/token/${encodeURIComponent(config.token)}`;
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("55") && digits.length >= 12) {
    return digits;
  }

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
}

export function isValidBrazilianPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);

  return /^55\d{10,11}$/.test(normalized);
}

export function getZAPIConfigurationStatus() {
  const config = getZAPIConfig();

  return {
    configured: config.configured,
    enabled: config.enabled,
  };
}

export async function sendWhatsApp(
  phone: string,
  message: string
): Promise<ZAPIResult> {
  const config = getZAPIConfig();

  if (!config.enabled) {
    console.log(
      `[Z-API] Envio ignorado: integração desativada. Destino: ${normalizePhone(
        phone
      )}`
    );

    return {
      success: false,
      disabled: true,
      error: "A integração Z-API está desativada.",
    };
  }

  if (!config.configured) {
    return {
      success: false,
      error: "As credenciais da Z-API ainda não foram configuradas.",
    };
  }

  const normalizedPhone = normalizePhone(phone);

  if (!isValidBrazilianPhone(normalizedPhone)) {
    return {
      success: false,
      error: "Número de WhatsApp inválido.",
    };
  }

  if (!message.trim()) {
    return {
      success: false,
      error: "A mensagem está vazia.",
    };
  }

  const baseUrl = getZAPIBaseUrl();

  if (!baseUrl) {
    return {
      success: false,
      error: "Não foi possível montar a URL da Z-API.",
    };
  }

  try {
    const response = await fetch(`${baseUrl}/send-text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": config.clientToken,
      },
      body: JSON.stringify({
        phone: normalizedPhone,
        message: message.trim(),
      }),
    });

    const data = (await response.json().catch(() => null)) as {
      zaapId?: string;
      messageId?: string;
      id?: string;
      error?: string;
      message?: string;
    } | null;

    if (!response.ok) {
      const error =
        data?.error ??
        data?.message ??
        `Erro HTTP ${response.status}`;

      console.error("[Z-API] Falha no envio:", error);

      return {
        success: false,
        error,
      };
    }

    const messageId =
      data?.messageId ?? data?.zaapId ?? data?.id;

    console.log(
      `[Z-API] Mensagem enviada para ${normalizedPhone}. ID: ${messageId ?? "não informado"
      }`
    );

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    console.error("[Z-API] Erro de conexão:", errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function checkZAPIStatus(): Promise<ZAPIStatus> {
  const config = getZAPIConfig();

  if (!config.enabled || !config.configured) {
    return {
      configured: config.configured,
      enabled: config.enabled,
      connected: false,
      status: !config.enabled
        ? "disabled"
        : "missing_credentials",
    };
  }

  const baseUrl = getZAPIBaseUrl();

  if (!baseUrl) {
    return {
      configured: false,
      enabled: config.enabled,
      connected: false,
      error: "Configuração inválida.",
    };
  }

  try {
    const response = await fetch(`${baseUrl}/status`, {
      headers: {
        "Client-Token": config.clientToken,
      },
    });

    const data = (await response.json().catch(() => null)) as {
      connected?: boolean;
      status?: string;
      error?: string;
    } | null;

    if (!response.ok) {
      return {
        configured: true,
        enabled: true,
        connected: false,
        error: data?.error ?? `Erro HTTP ${response.status}`,
      };
    }

    return {
      configured: true,
      enabled: true,
      connected: data?.connected === true,
      status: data?.status,
    };
  } catch (error) {
    return {
      configured: true,
      enabled: true,
      connected: false,
      error:
        error instanceof Error ? error.message : String(error),
    };
  }
}

type SummaryTask = {
  name: string;
  status: string;
  priority: string;
};

type SummaryMeeting = {
  title: string;
  scheduledAt: Date;
  meetingType: string;
};

export function buildDailySummaryMessage(
  tenantName: string,
  tasks: SummaryTask[],
  meetings: SummaryMeeting[]
): string {
  const today = new Date();

  const formattedDate = today.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  const pendingTasks = tasks.filter(
    task => task.status !== "done"
  );

  const urgentTasks = pendingTasks.filter(
    task => task.priority === "urgent"
  );

  const weekTasks = pendingTasks.filter(
    task => task.priority === "week"
  );

  const laterTasks = pendingTasks.filter(
    task => task.priority === "later"
  );

  const lines: string[] = [
    "📋 *Resumo diário FAREJO*",
    `📅 ${formattedDate.charAt(0).toUpperCase() +
    formattedDate.slice(1)
    }`,
    `🏢 ${tenantName}`,
    "",
  ];

  if (pendingTasks.length === 0) {
    lines.push("✅ Você não possui tarefas pendentes. Parabéns!");
  } else {
    lines.push(
      `📌 *Tarefas pendentes: ${pendingTasks.length}*`
    );

    if (urgentTasks.length > 0) {
      lines.push("");
      lines.push("🔴 *Urgentes*");

      urgentTasks.forEach(task => {
        lines.push(`• ${task.name}`);
      });
    }

    if (weekTasks.length > 0) {
      lines.push("");
      lines.push("🟡 *Para esta semana*");

      weekTasks.forEach(task => {
        lines.push(`• ${task.name}`);
      });
    }

    if (laterTasks.length > 0) {
      lines.push("");
      lines.push("⚪ *Para depois*");

      laterTasks.forEach(task => {
        lines.push(`• ${task.name}`);
      });
    }
  }

  const todayKey = today.toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });

  const todayMeetings = meetings.filter(meeting => {
    const meetingKey = new Date(
      meeting.scheduledAt
    ).toLocaleDateString("en-CA", {
      timeZone: "America/Sao_Paulo",
    });

    return meetingKey === todayKey;
  });

  if (todayMeetings.length > 0) {
    lines.push("");
    lines.push(
      `📆 *Reuniões de hoje: ${todayMeetings.length}*`
    );

    todayMeetings.forEach(meeting => {
      const time = new Date(
        meeting.scheduledAt
      ).toLocaleTimeString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
      });

      const type =
        meeting.meetingType === "estrategico"
          ? "🎯 Estratégica"
          : "⚙️ Operacional";

      lines.push(`• ${type}: ${meeting.title} às ${time}`);
    });
  }

  lines.push("");
  lines.push(
    "_Enviado pelo FAREJO — Gestão de Marketing para Varejo_"
  );

  return lines.join("\n");
}

export function buildNewTaskMessage(
  taskName: string,
  priority: string,
  tenantName: string,
  responsible?: string | null
): string {
  const priorityEmoji =
    priority === "urgent"
      ? "🔴"
      : priority === "week"
        ? "🟡"
        : "⚪";

  const lines = [
    `${priorityEmoji} *Nova tarefa no FAREJO*`,
    "",
    `📋 ${taskName}`,
    `🏢 ${tenantName}`,
  ];

  if (responsible) {
    lines.push(`👤 Responsável: ${responsible}`);
  }

  lines.push("");
  lines.push("_Acesse o FAREJO para visualizar._");

  return lines.join("\n");
}

export function buildNewMeetingMessage(
  title: string,
  meetingType: string,
  scheduledAt: Date,
  tenantName: string
): string {
  const type =
    meetingType === "estrategico"
      ? "🎯 Estratégica"
      : "⚙️ Operacional";

  const date = scheduledAt.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });

  const time = scheduledAt.toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });

  return [
    `📅 *Nova reunião ${type}*`,
    "",
    `📌 ${title}`,
    `🏢 ${tenantName}`,
    `🕐 ${date} às ${time}`,
    "",
    "_Acesse a agenda do FAREJO para visualizar._",
  ].join("\n");
}

export function buildMeetingReminderMessage(
  title: string,
  time: string,
  tenantName: string
): string {
  return [
    "⏰ *Lembrete FAREJO*",
    "",
    `A reunião *${title}* começa em 30 minutos (${time}).`,
    `🏢 ${tenantName}`,
    "",
    "_Boa reunião!_",
  ].join("\n");
}