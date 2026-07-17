/**
 * Heartbeat handlers para notificações WhatsApp agendadas.
 *
 * Dois jobs são registrados via manus-heartbeat CLI após o deploy:
 *
 * 1. /api/scheduled/whatsapp-daily-summary
 *    Cron: "0 * * * * *" (todo minuto) — verifica quais usuários têm resumo
 *    configurado para o minuto atual (UTC) e envia.
 *
 * 2. /api/scheduled/whatsapp-meeting-reminder
 *    Cron: "0 * * * * *" (todo minuto) — verifica reuniões que começam em
 *    ~30 min e envia lembrete para participantes com notifReuniao ativo.
 */

import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import {
  getWhatsappPrefsByHorario,
  getUserSettings,
  getTasks,
  getMeetings,
  getAllTenants,
  getWhatsappPrefsForMeetingNotif,
} from "./db";
import {
  sendWhatsApp,
  buildDailySummaryMessage,
  buildMeetingReminderMessage,
} from "./zapi";

// ─── Helper: current HH:MM in UTC ────────────────────────────────────────────
function nowHHMM(): string {
  const now = new Date();
  const h = String(now.getUTCHours()).padStart(2, "0");
  const m = String(now.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

// ─── Handler: Resumo Diário ───────────────────────────────────────────────────
export async function whatsappDailySummaryHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron) return res.status(403).json({ error: "cron-only" });

    const currentHHMM = nowHHMM();
    const prefsForThisHour = await getWhatsappPrefsByHorario(currentHHMM);

    if (prefsForThisHour.length === 0) {
      return res.json({ ok: true, sent: 0, skipped: "no-users-at-this-hour" });
    }

    const allTenants = await getAllTenants();
    let sent = 0;
    const errors: string[] = [];

    for (const pref of prefsForThisHour) {
      if (!pref.phone) continue;

      try {

        // Get tasks and meetings for this tenant
        const tasks = await getTasks(pref.tenantId);
        const meetings = await getMeetings(pref.tenantId);
        const tenant = allTenants.find((t) => t.id === pref.tenantId);
        const tenantName = tenant?.name ?? "FAREJO";

        const message = buildDailySummaryMessage(tenantName, tasks, meetings);

        const result = await sendWhatsApp(pref.phone, message
        );

        if (result.success) {
          sent++;
        } else {
          errors.push(`user ${pref.userId}: ${result.error}`);
        }
      } catch (e: unknown) {
        errors.push(`user ${pref.userId}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    return res.json({ ok: true, sent, errors: errors.length ? errors : undefined });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg, timestamp: new Date().toISOString() });
  }
}

// ─── Handler: Lembrete de Reunião (30 min antes) ─────────────────────────────
export async function whatsappMeetingReminderHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron) return res.status(403).json({ error: "cron-only" });

    const now = new Date();
    // Window: meetings starting between 29 and 31 minutes from now
    const windowStart = new Date(now.getTime() + 29 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 31 * 60 * 1000);

    const allTenants = await getAllTenants();
    let sent = 0;
    const errors: string[] = [];

    for (const tenant of allTenants) {
      try {
        const meetings = await getMeetings(tenant.id);
        const upcoming = meetings.filter((m) => {
          const scheduledAt = new Date(m.scheduledAt);
          return scheduledAt >= windowStart && scheduledAt <= windowEnd && m.status !== "cancelada";
        });

        if (upcoming.length === 0) continue;

        const wPrefs = await getWhatsappPrefsForMeetingNotif(tenant.id);
        if (wPrefs.length === 0) continue;

        for (const meeting of upcoming) {
          const hora = new Date(meeting.scheduledAt).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          });

          for (const pref of wPrefs) {
            if (!pref.phone) continue;
            try {
              const settings = await getUserSettings(pref.userId, tenant.id);
              

              const msg = buildMeetingReminderMessage(meeting.title, hora, tenant.name);
              const result = await sendWhatsApp(pref.phone, msg
              );

              if (result.success) {
                sent++;
              } else {
                errors.push(`meeting ${meeting.id} user ${pref.userId}: ${result.error}`);
              }
            } catch (e: unknown) {
              errors.push(`meeting ${meeting.id} user ${pref.userId}: ${e instanceof Error ? e.message : String(e)}`);
            }
          }
        }
      } catch (e: unknown) {
        errors.push(`tenant ${tenant.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    return res.json({ ok: true, sent, errors: errors.length ? errors : undefined });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg, timestamp: new Date().toISOString() });
  }
}
