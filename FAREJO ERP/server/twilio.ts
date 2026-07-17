/**
 * Twilio WhatsApp helper
 * Envia mensagens via Twilio usando as credenciais salvas nas configurações do usuário.
 * As credenciais (SID, Token, número remetente) vêm da tabela user_settings.
 */

export interface TwilioCredentials {
  sid: string;
  token: string;
  fromPhone: string; // número Twilio no formato whatsapp:+1415...
}

/**
 * Envia uma mensagem WhatsApp via Twilio REST API.
 * Não usa o SDK twilio para manter dependências mínimas.
 */
export async function sendWhatsApp(
  creds: TwilioCredentials,
  toPhone: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  if (!creds.sid || !creds.token || !creds.fromPhone) {
    return { success: false, error: "Credenciais Twilio incompletas." };
  }

  const to = toPhone.startsWith("whatsapp:") ? toPhone : `whatsapp:${toPhone}`;
  const from = creds.fromPhone.startsWith("whatsapp:") ? creds.fromPhone : `whatsapp:${creds.fromPhone}`;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${creds.sid}/Messages.json`;
  const params = new URLSearchParams({ To: to, From: from, Body: body });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${creds.sid}:${creds.token}`).toString("base64"),
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as Record<string, unknown>;
      return { success: false, error: (err.message as string) ?? `HTTP ${res.status}` };
    }

    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Formata uma mensagem de resumo diário de tarefas e reuniões.
 */
export function buildDailySummaryMessage(
  tenantName: string,
  tasks: { name: string; status: string; priority: string }[],
  meetings: { title: string; scheduledAt: Date; meetingType: string }[]
): string {
  const date = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  const lines: string[] = [];

  lines.push(`📋 *Resumo Diário FAREJO*`);
  lines.push(`📅 ${date.charAt(0).toUpperCase() + date.slice(1)}`);
  lines.push(`🏢 ${tenantName}`);
  lines.push("");

  // Tarefas pendentes/em andamento
  const activeTasks = tasks.filter((t) => t.status !== "concluida");
  if (activeTasks.length > 0) {
    lines.push(`✅ *Tarefas em aberto (${activeTasks.length})*`);
    const urgentes = activeTasks.filter((t) => t.priority === "urgente");
    const semana = activeTasks.filter((t) => t.priority === "semana");
    if (urgentes.length) lines.push(`🔴 Urgentes: ${urgentes.map((t) => t.name).join(", ")}`);
    if (semana.length) lines.push(`🟡 Esta semana: ${semana.map((t) => t.name).join(", ")}`);
    const outros = activeTasks.filter((t) => t.priority !== "urgente" && t.priority !== "semana");
    if (outros.length) lines.push(`⚪ Outras: ${outros.length} tarefa(s)`);
  } else {
    lines.push(`✅ *Nenhuma tarefa pendente — parabéns!* 🎉`);
  }

  // Reuniões do dia
  const today = new Date();
  const todayMeetings = meetings.filter((m) => {
    const d = new Date(m.scheduledAt);
    return d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();
  });

  if (todayMeetings.length > 0) {
    lines.push("");
    lines.push(`📆 *Reuniões de hoje (${todayMeetings.length})*`);
    todayMeetings.forEach((m) => {
      const hora = new Date(m.scheduledAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const tipo = m.meetingType === "estrategico" ? "🎯 Estratégica" : "⚙️ Operacional";
      lines.push(`${tipo} — ${m.title} às ${hora}`);
    });
  }

  lines.push("");
  lines.push(`_Enviado pelo FAREJO — Gestão de Marketing para Varejo_`);

  return lines.join("\n");
}

/**
 * Formata mensagem de nova tarefa criada.
 */
export function buildNewTaskMessage(taskName: string, priority: string, tenantName: string): string {
  const prioEmoji = priority === "urgente" ? "🔴" : priority === "semana" ? "🟡" : "⚪";
  return `${prioEmoji} *Nova tarefa criada no FAREJO*\n\n📋 ${taskName}\n🏢 ${tenantName}\n\n_Acesse o FAREJO para gerenciar._`;
}

/**
 * Formata mensagem de nova reunião agendada.
 */
export function buildNewMeetingMessage(
  title: string,
  meetingType: string,
  scheduledAt: Date,
  tenantName: string
): string {
  const tipo = meetingType === "estrategico" ? "🎯 Estratégica" : "⚙️ Operacional";
  const data = scheduledAt.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
  const hora = scheduledAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `📅 *Reunião ${tipo} agendada no FAREJO*\n\n📌 ${title}\n🏢 ${tenantName}\n🕐 ${data} às ${hora}\n\n_Confirme sua presença na aba Agenda._`;
}

/**
 * Formata mensagem de lembrete de reunião (30 min antes).
 */
export function buildMeetingReminderMessage(title: string, hora: string, tenantName: string): string {
  return `⏰ *Lembrete FAREJO*\n\nSua reunião *${title}* começa em 30 minutos (${hora}).\n🏢 ${tenantName}\n\n_Boa reunião!_`;
}
