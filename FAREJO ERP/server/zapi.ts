/**
 * Z-API WhatsApp Helper
 * Documentação: https://developer.z-api.io/
 */

const ZAPI_INSTANCE_ID = "3F570B02B11DB2476A7B2A880C3D74BD";
const ZAPI_TOKEN = "34C833931809A3204D9A1FDF";
const ZAPI_BASE_URL = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}`;

/**
 * Normaliza o número de telefone para o formato esperado pela Z-API.
 * Aceita: +55 11 99999-9999, 11999999999, 5511999999999
 * Retorna: 5511999999999 (somente dígitos, com DDI)
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // Se já começa com 55 e tem 12-13 dígitos, está correto
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  // Se tem 10-11 dígitos (DDD + número), adiciona 55
  if (digits.length >= 10 && digits.length <= 11) return `55${digits}`;
  return digits;
}

/**
 * Envia uma mensagem de texto via WhatsApp usando a Z-API.
 * @param phone - Número de telefone do destinatário (qualquer formato)
 * @param message - Texto da mensagem
 * @returns { success: boolean; error?: string }
 */
export async function sendWhatsApp(
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const normalizedPhone = normalizePhone(phone);

    const response = await fetch(`${ZAPI_BASE_URL}/send-text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": ZAPI_TOKEN,
      },
      body: JSON.stringify({
        phone: normalizedPhone,
        message,
      }),
    });

    const data = await response.json() as { zaapId?: string; messageId?: string; error?: string };

    if (!response.ok) {
      console.error("[Z-API] Error sending message:", data);
      return { success: false, error: data?.error ?? `HTTP ${response.status}` };
    }

    console.log("[Z-API] Message sent:", data);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Z-API] Exception:", message);
    return { success: false, error: message };
  }
}

/**
 * Verifica o status da instância Z-API.
 */
export async function checkZAPIStatus(): Promise<{ connected: boolean; status?: string }> {
  try {
    const response = await fetch(`${ZAPI_BASE_URL}/status`, {
      headers: { "Client-Token": ZAPI_TOKEN },
    });
    const data = await response.json() as { connected?: boolean; status?: string };
    return { connected: data?.connected ?? false, status: data?.status };
  } catch {
    return { connected: false };
  }
}

// ─── Message Builders ─────────────────────────────────────────────────────────

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
