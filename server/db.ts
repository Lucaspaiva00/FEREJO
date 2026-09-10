import {
  and,
  eq,
  ne,
  inArray,
  desc,
  asc,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users, tenants, userTenants, userSettings,
  taskCategories, tasks, dashboardMetrics, campaigns, accessLogs,
  strategies, strategyCompletions, testimonials, trainings, insights,
  insightLikes, insightComments,
  meetings, meetingInvites,
  whatsappPrefs,
  InsertUser, InsertTenant, InsertUserTenant, InsertUserSettings,
  InsertTaskCategory, InsertTask, InsertDashboardMetric, InsertCampaign,
  InsertTraining, InsertInsight,
  InsertMeeting, InsertMeetingInvite,
  InsertWhatsappPrefs, WhatsappPrefs,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── USERS ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const fields = ["name", "email", "loginMethod"] as const;
  for (const f of fields) {
    if (user[f] !== undefined) {
      values[f] = user[f] ?? null;
      updateSet[f] = user[f] ?? null;
    }
  }

  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;

  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}


export async function getUserByOpenId(openId: string) {
  const db = await getDb();

  if (!db) {
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result[0];
}

export async function getUserById(userId: number) {
  const db = await getDb();

  if (!db) {
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return result[0];
}
export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(asc(users.createdAt));
}

export async function updateUserRole(userId: number, role: "admin" | "marketer" | "client") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function createUser(data: InsertUser) {
  const db = await getDb();
  if (!db) return;
  await db.insert(users).values(data);
  const result = await db.select().from(users).where(eq(users.openId, data.openId!)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function updateUserPassword(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(userTenants).where(eq(userTenants.userId, userId));
  await db.delete(userSettings).where(eq(userSettings.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
}

// ─── TENANTS ─────────────────────────────────────────────────────────────────

export async function getAllTenants() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tenants).orderBy(asc(tenants.createdAt));
}

export async function createTenant(name: string) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(tenants).values({ name });
  const result = await db.select().from(tenants).orderBy(desc(tenants.createdAt)).limit(1);
  return result[0];
}

export async function deleteTenant(tenantId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(campaigns).where(eq(campaigns.tenantId, tenantId));
  await db.delete(dashboardMetrics).where(eq(dashboardMetrics.tenantId, tenantId));
  await db.delete(tasks).where(eq(tasks.tenantId, tenantId));
  await db.delete(taskCategories).where(eq(taskCategories.tenantId, tenantId));
  await db.delete(userSettings).where(eq(userSettings.tenantId, tenantId));
  await db.delete(userTenants).where(eq(userTenants.tenantId, tenantId));
  await db.delete(tenants).where(eq(tenants.id, tenantId));
}

// ─── USER_TENANTS ─────────────────────────────────────────────────────────────

export async function getUserTenants(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const uts = await db.select().from(userTenants).where(eq(userTenants.userId, userId));
  if (!uts.length) return [];
  const ids = uts.map((ut) => ut.tenantId);
  return db.select().from(tenants).where(inArray(tenants.id, ids));
}

export async function setUserTenants(userId: number, tenantIds: number[]) {
  const db = await getDb();
  if (!db) return;
  await db.delete(userTenants).where(eq(userTenants.userId, userId));
  if (tenantIds.length) {
    await db.insert(userTenants).values(tenantIds.map((tid) => ({ userId, tenantId: tid })));
  }
}

export async function getTenantUsers(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  const uts = await db.select().from(userTenants).where(eq(userTenants.tenantId, tenantId));
  if (!uts.length) return [];
  const ids = uts.map((ut) => ut.userId);
  return db.select().from(users).where(inArray(users.id, ids));
}

// ─── USER_SETTINGS ────────────────────────────────────────────────────────────

export async function getUserSettings(userId: number, tenantId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(userSettings)
    .where(and(eq(userSettings.userId, userId), eq(userSettings.tenantId, tenantId)))
    .limit(1);
  return result[0] ?? null;
}

export async function upsertUserSettings(data: InsertUserSettings) {
  const db = await getDb();
  if (!db) return;
  const existing = await getUserSettings(data.userId!, data.tenantId!);
  if (existing) {
    await db
      .update(userSettings)
      .set(data)
      .where(and(eq(userSettings.userId, data.userId!), eq(userSettings.tenantId, data.tenantId!)));
  } else {
    await db.insert(userSettings).values(data);
  }
  return getUserSettings(data.userId!, data.tenantId!);
}

// ─── TASK_CATEGORIES ─────────────────────────────────────────────────────────

export async function getTaskCategories(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(taskCategories)
    .where(eq(taskCategories.tenantId, tenantId))
    .orderBy(asc(taskCategories.position), asc(taskCategories.createdAt));
}

export async function createTaskCategory(data: InsertTaskCategory) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(taskCategories).values(data);
  const result = await db
    .select()
    .from(taskCategories)
    .where(eq(taskCategories.tenantId, data.tenantId))
    .orderBy(desc(taskCategories.createdAt))
    .limit(1);
  return result[0];
}

export async function deleteTaskCategory(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(tasks).set({ categoryId: null }).where(and(eq(tasks.categoryId, id), eq(tasks.tenantId, tenantId)));
  await db.delete(taskCategories).where(and(eq(taskCategories.id, id), eq(taskCategories.tenantId, tenantId)));
}

export async function renameTaskCategory(id: number, tenantId: number, title: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(taskCategories).set({ title }).where(and(eq(taskCategories.id, id), eq(taskCategories.tenantId, tenantId)));
}

const DEFAULT_CATEGORIES = [
  { title: "Redes Sociais", icon: "share", position: 0 },
  { title: "Ponto de Venda", icon: "broadcast", position: 1 },
  { title: "Anuncios", icon: "chart", position: 2 },
  { title: "Interno", icon: "list", position: 3 },
  { title: "WhatsApp", icon: "chat", position: 4 },
  { title: "Aplicativo", icon: "star", position: 5 },
  { title: "Acoes Especificas", icon: "calendar", position: 6 },
  { title: "Comercial", icon: "document", position: 7 },
  { title: "Trade", icon: "chart", position: 8 },
];

export async function ensureDefaultCategories(tenantId: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await getTaskCategories(tenantId);
  const existingTitles = new Set(existing.map((c) => c.title));

  // Add any default categories that don't exist yet (incremental — works for new and existing tenants)
  const missing = DEFAULT_CATEGORIES.filter((c) => !existingTitles.has(c.title));
  if (missing.length > 0) {
    // Offset position to avoid conflicts with user-created categories
    const maxPos = existing.reduce((m, c) => Math.max(m, c.position ?? 0), -1);
    await db.insert(taskCategories).values(
      missing.map((c, i) => ({ ...c, tenantId, position: maxPos + 1 + i }))
    );
  }

  // Always run task seed (it's idempotent per category)
  await ensureDefaultTasks(tenantId);
}

const DEFAULT_TASKS_BY_CATEGORY: Record<string, { name: string; priority: "urgent" | "week" | "later"; recurrence: "once" | "daily" }[]> = {
  // Categorias exatas conforme checklist padrão FAREJO
  "Redes Sociais": [
    { name: "Responder Directs / Comentários", priority: "urgent", recurrence: "daily" },
    { name: "Conferir Stories (Top 5 Ofertas)", priority: "urgent", recurrence: "daily" },
    { name: "Canal — Postar Oportunidades", priority: "week", recurrence: "daily" },
    { name: "1 Reels", priority: "week", recurrence: "once" },
  ],
  "Ponto de Venda": [
    { name: "Subir Vídeos pra TV (EPJ)", priority: "urgent", recurrence: "once" },
    { name: "Fazer Lotes de Cartazes (EPJ)", priority: "urgent", recurrence: "once" },
    { name: "Estimular Avaliações no Google", priority: "week", recurrence: "daily" },
  ],
  "Anuncios": [
    { name: "Anunciar Jornal do Dia", priority: "urgent", recurrence: "daily" },
    { name: "Acompanhar Sazonais", priority: "week", recurrence: "once" },
    { name: "Checar Métricas", priority: "week", recurrence: "daily" },
  ],
  "Interno": [
    { name: "Comunicar Agenda Mensal", priority: "week", recurrence: "once" },
    { name: "Verificar Vagas de Emprego", priority: "later", recurrence: "once" },
  ],
  "WhatsApp": [
    { name: "Programar Envios (Broadcast)", priority: "urgent", recurrence: "daily" },
    { name: "Postar Status", priority: "week", recurrence: "daily" },
    { name: "Acompanhar Recebimentos", priority: "week", recurrence: "daily" },
  ],
  "Aplicativo": [
    { name: "Impactar com Push / Lembretes", priority: "urgent", recurrence: "daily" },
    { name: "Conferir Variação de Cupons", priority: "week", recurrence: "once" },
  ],
  "Acoes Especificas": [
    { name: "Postar Oferta Relâmpago", priority: "urgent", recurrence: "once" },
    { name: "Aniversariantes Mês", priority: "week", recurrence: "once" },
    { name: "Checar Material Gráfico", priority: "week", recurrence: "once" },
  ],
  "Comercial": [
    { name: "Conferência de Jornal", priority: "urgent", recurrence: "daily" },
    { name: "Lançamento das Ofertas", priority: "urgent", recurrence: "daily" },
  ],
  "Trade": [
    { name: "Acompanhar Plano de Vendas", priority: "week", recurrence: "once" },
    { name: "Garantir Entrega dos Parceiros", priority: "week", recurrence: "once" },
  ],
};

export async function ensureDefaultTasks(tenantId: number) {
  const db = await getDb();
  if (!db) return;
  const cats = await getTaskCategories(tenantId);
  for (const cat of cats) {
    const defaultTasks = DEFAULT_TASKS_BY_CATEGORY[cat.title];
    if (!defaultTasks) continue;
    // Check if this category already has tasks (incremental: only seed empty categories)
    const existingInCat = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.tenantId, tenantId), eq(tasks.categoryId, cat.id)))
      .limit(1);
    if (existingInCat.length > 0) continue; // already seeded for this category
    for (const t of defaultTasks) {
      await db.insert(tasks).values({
        tenantId,
        categoryId: cat.id,
        name: t.name,
        status: "pending",
        priority: t.priority,
        recurrence: t.recurrence,
        responsible: null,
        position: 0,
      });
    }
  }
}

// ─── TASKS ────────────────────────────────────────────────────────────────────

export async function getTasks(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(tasks)
    .where(eq(tasks.tenantId, tenantId))
    .orderBy(asc(tasks.position), asc(tasks.createdAt));
}

export async function getPendingTasksForUser(
  tenantId: number,
  userId: number
) {
  const db = await getDb();

  if (!db) {
    return [];
  }

  return db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.tenantId, tenantId),
        eq(tasks.responsibleUserId, userId),
        ne(tasks.status, "done")
      )
    )
    .orderBy(
      asc(tasks.position),
      asc(tasks.createdAt)
    );
}

export async function createTask(data: InsertTask) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(tasks).values(data);
  const result = await db
    .select()
    .from(tasks)
    .where(eq(tasks.tenantId, data.tenantId))
    .orderBy(desc(tasks.createdAt))
    .limit(1);
  return result[0];
}

export async function updateTask(id: number, tenantId: number, data: Partial<InsertTask>) {
  const db = await getDb();
  if (!db) return;
  await db.update(tasks).set(data).where(and(eq(tasks.id, id), eq(tasks.tenantId, tenantId)));
  const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return result[0];
}

export async function deleteTask(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.tenantId, tenantId)));
}

// ─── DASHBOARD_METRICS ───────────────────────────────────────────────────────

export async function getDashboardMetrics(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(dashboardMetrics)
    .where(eq(dashboardMetrics.tenantId, tenantId))
    .orderBy(asc(dashboardMetrics.orderIdx), asc(dashboardMetrics.createdAt));
}

export async function upsertDashboardConfig(tenantId: number, config: { title: string; subtitle: string; period: string }) {
  const db = await getDb();
  if (!db) return;
  const existing = await db
    .select()
    .from(dashboardMetrics)
    .where(and(eq(dashboardMetrics.tenantId, tenantId), eq(dashboardMetrics.section, "_config")))
    .limit(1);
  const label = JSON.stringify(config);
  if (existing[0]) {
    await db.update(dashboardMetrics).set({ label }).where(eq(dashboardMetrics.id, existing[0].id));
  } else {
    await db.insert(dashboardMetrics).values({ tenantId, section: "_config", label, orderIdx: -1 });
  }
}

export async function createDashboardMetric(data: InsertDashboardMetric) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(dashboardMetrics).values(data);
  const result = await db
    .select()
    .from(dashboardMetrics)
    .where(eq(dashboardMetrics.tenantId, data.tenantId))
    .orderBy(desc(dashboardMetrics.createdAt))
    .limit(1);
  return result[0];
}

export async function updateDashboardMetric(id: number, tenantId: number, data: Partial<InsertDashboardMetric>) {
  const db = await getDb();
  if (!db) return;
  await db.update(dashboardMetrics).set(data).where(and(eq(dashboardMetrics.id, id), eq(dashboardMetrics.tenantId, tenantId)));
}

export async function deleteDashboardMetric(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(dashboardMetrics).where(and(eq(dashboardMetrics.id, id), eq(dashboardMetrics.tenantId, tenantId)));
}

// ─── CAMPAIGNS ───────────────────────────────────────────────────────────────

export async function getCampaigns(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(campaigns)
    .where(eq(campaigns.tenantId, tenantId))
    .orderBy(asc(campaigns.startDate));
}

export async function createCampaign(data: InsertCampaign) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(campaigns).values(data);
  const result = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.tenantId, data.tenantId))
    .orderBy(desc(campaigns.createdAt))
    .limit(1);
  return result[0];
}

export async function updateCampaign(id: number, tenantId: number, data: Partial<InsertCampaign>) {
  const db = await getDb();
  if (!db) return;
  await db.update(campaigns).set(data).where(and(eq(campaigns.id, id), eq(campaigns.tenantId, tenantId)));
}

export async function deleteCampaign(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(campaigns).where(and(eq(campaigns.id, id), eq(campaigns.tenantId, tenantId)));
}

// ─── CAMPAIGN ALERTS ─────────────────────────────────────────────────────────

const ALERT_MILESTONES = [45, 15, 7] as const;

/**
 * For each campaign in the tenant, checks if alert tasks need to be created
 * for the 45, 15, and 7-day milestones before the campaign start date.
 * Skips milestones already recorded in `alertsSent`.
 * Returns the count of newly created alert tasks.
 */
export async function generateCampaignAlerts(tenantId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  // Ensure the "Alertas de Campanha" category exists
  const alertCategoryTitle = "Alertas de Campanha";
  let alertCat = await db
    .select()
    .from(taskCategories)
    .where(and(eq(taskCategories.tenantId, tenantId), eq(taskCategories.title, alertCategoryTitle)))
    .limit(1);

  if (alertCat.length === 0) {
    await db.insert(taskCategories).values({
      tenantId,
      title: alertCategoryTitle,
      icon: "bell",
      position: 99,
    });
    alertCat = await db
      .select()
      .from(taskCategories)
      .where(and(eq(taskCategories.tenantId, tenantId), eq(taskCategories.title, alertCategoryTitle)))
      .limit(1);
  }

  const alertCategoryId = alertCat[0]?.id ?? null;

  // Get all campaigns for this tenant
  const allCampaigns = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.tenantId, tenantId));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let created = 0;

  for (const campaign of allCampaigns) {
    // Parse start date
    const startDate = new Date(campaign.startDate + "T00:00:00");
    startDate.setHours(0, 0, 0, 0);

    // Skip campaigns that have already started or ended (no retroactive alerts)
    if (today >= startDate) continue;

    const alertsSent: number[] = JSON.parse(campaign.alertsSent ?? "[]");
    const newAlertsSent = [...alertsSent];

    for (const daysBefore of ALERT_MILESTONES) {
      // Skip if already recorded in alertsSent
      if (alertsSent.includes(daysBefore)) continue;

      // Calculate the alert trigger date (startDate - daysBefore)
      const triggerDate = new Date(startDate);
      triggerDate.setDate(triggerDate.getDate() - daysBefore);
      triggerDate.setHours(0, 0, 0, 0);

      // Only trigger if today >= triggerDate
      if (today >= triggerDate) {
        // Idempotency check: verify no existing alert task for this campaign+milestone
        const existing = await db
          .select({ id: tasks.id })
          .from(tasks)
          .where(
            and(
              eq(tasks.tenantId, tenantId),
              eq(tasks.alertCampaignId, campaign.id),
              eq(tasks.alertDaysBefore, daysBefore)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          // Task already exists, just mark as sent to keep alertsSent in sync
          newAlertsSent.push(daysBefore);
          continue;
        }

        // Determine priority based on days before
        const priority = daysBefore === 7 ? "urgent" : daysBefore === 15 ? "week" : "later";

        const daysUntil = Math.round((startDate.getTime() - today.getTime()) / 86400000);
        const taskName = `[Alerta ${daysBefore}d] ${campaign.name} — inicia em ${daysUntil} dia${daysUntil !== 1 ? "s" : ""} (${campaign.startDate})`;

        // Create the alert task
        await db.insert(tasks).values({
          tenantId,
          categoryId: alertCategoryId,
          name: taskName,
          status: "pending",
          priority,
          alertCampaignId: campaign.id,
          alertDaysBefore: daysBefore,
        });

        newAlertsSent.push(daysBefore);
        created++;
      }
    }

    // Update alertsSent if new milestones were triggered
    if (newAlertsSent.length !== alertsSent.length) {
      await db
        .update(campaigns)
        .set({ alertsSent: JSON.stringify(newAlertsSent) })
        .where(and(eq(campaigns.id, campaign.id), eq(campaigns.tenantId, tenantId)));
    }
  }

  return created;
}

/**
 * Resets alertsSent for a campaign (used when campaign dates change).
 */
export async function resetCampaignAlerts(campaignId: number, tenantId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(campaigns)
    .set({ alertsSent: "[]" })
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.tenantId, tenantId)));
  // Remove existing alert tasks for this campaign
  await db
    .delete(tasks)
    .where(and(eq(tasks.alertCampaignId, campaignId), eq(tasks.tenantId, tenantId)));
}

// ─── ACCESS LOGS ──────────────────────────────────────────────────────────────

export async function logAccess(userId: number, tenantId?: number, action = "login"): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(accessLogs).values({ userId, tenantId: tenantId ?? null, action });
}

export async function getAccessStats(): Promise<{
  totalUsers: number;
  activeToday: number;
  activeThisWeek: number;
  activeThisMonth: number;
  recentLogins: { userId: number; userName: string | null; userEmail: string | null; lastAccess: Date }[];
}> {
  const db = await getDb();
  if (!db) return { totalUsers: 0, activeToday: 0, activeThisWeek: 0, activeThisMonth: 0, recentLogins: [] };

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const allUsers = await db.select({ id: users.id }).from(users);
  const totalUsers = allUsers.length;

  const allLogs = await db
    .select({ userId: accessLogs.userId, createdAt: accessLogs.createdAt })
    .from(accessLogs)
    .orderBy(desc(accessLogs.createdAt));

  const activeToday = new Set(allLogs.filter(l => l.createdAt >= startOfDay).map(l => l.userId)).size;
  const activeThisWeek = new Set(allLogs.filter(l => l.createdAt >= startOfWeek).map(l => l.userId)).size;
  const activeThisMonth = new Set(allLogs.filter(l => l.createdAt >= startOfMonth).map(l => l.userId)).size;

  // Last 10 unique user logins
  const seen = new Set<number>();
  const recentRaw: { userId: number; createdAt: Date }[] = [];
  for (const log of allLogs) {
    if (!seen.has(log.userId)) {
      seen.add(log.userId);
      recentRaw.push(log);
      if (recentRaw.length >= 10) break;
    }
  }

  const userIds = recentRaw.map(r => r.userId);
  const userRows = userIds.length > 0
    ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, userIds))
    : [];

  const recentLogins = recentRaw.map(r => {
    const u = userRows.find(u => u.id === r.userId);
    return { userId: r.userId, userName: u?.name ?? null, userEmail: u?.email ?? null, lastAccess: r.createdAt };
  });

  return { totalUsers, activeToday, activeThisWeek, activeThisMonth, recentLogins };
}

// ─── STRATEGIES ───────────────────────────────────────────────────────────────

const DEFAULT_STRATEGIES = [
  {
    title: "Calendário Anual Estruturado",
    description: "Todo o ano planejado com antecipação — sem improviso. Monte um calendário completo com todas as datas sazonais relevantes para o seu segmento, campanhas de lançamento, promoções recorrentes e marcos internos. Cada ação deve ter data, responsável, canal de divulgação e objetivo claro. Quem planeja com antecedência executa melhor, gasta menos e vende mais.",
    points: 70,
    icon: "calendar",
    orderIdx: 1,
  },
  {
    title: "Ativação de Canal de Venda Digital",
    description: "E-commerce, Mercado Livre e TikTok Shop operando e convertendo. Não basta ter presença digital — é preciso ter canais de venda ativos e otimizados. Configure sua loja virtual, ative o Mercado Livre com catálogo atualizado e explore o TikTok Shop para alcançar novos públicos. Cada canal é uma nova fonte de receita que funciona 24h por dia.",
    points: 70,
    icon: "store",
    orderIdx: 2,
  },
  {
    title: "Assessoria de Imprensa & Advertorial",
    description: "Presença em 10+ portais reforçando posicionamento e quebrando objeções. Publique notícias e conteúdos editoriais sobre a empresa em portais de notícias, blogs do setor e veículos parceiros. O advertorial (conteúdo pago com formato editorial) gera credibilidade, aumenta a visibilidade orgânica e posiciona a marca como referência no mercado local e nacional.",
    points: 65,
    icon: "newspaper",
    orderIdx: 3,
  },
  {
    title: "Programa de UGC",
    description: "Clientes como influenciadores — conteúdo autêntico todo dia nas redes. Crie um programa estruturado para incentivar clientes a produzirem e compartilharem conteúdo sobre a marca (fotos, vídeos, stories, reels). O UGC (User Generated Content) é a forma mais barata e eficiente de publicidade: é real, é diário e gera confiança muito além do que qualquer anúncio pago.",
    points: 65,
    icon: "share",
    orderIdx: 4,
  },
  {
    title: "Humanização da Marca",
    description: "Dono e time como personagens de uma narrativa contínua de conexão e venda. Mostre os bastidores, as histórias, os valores e as pessoas por trás da empresa. O consumidor moderno compra de quem ele conhece, gosta e confia. Quando o dono aparece, quando o time tem rosto e voz, a marca deixa de ser uma loja e vira uma referência emocional na vida do cliente.",
    points: 60,
    icon: "quote",
    orderIdx: 5,
  },
  {
    title: "Marketing que Dá Lucro",
    description: "Ativos da loja vendidos a fornecedores em contratos de 6 meses — marketing vira receita. Monetize os espaços e canais da sua loja: fachada, TV interna, redes sociais, e-mail marketing e WhatsApp podem ser oferecidos como mídia para fornecedores e parceiros. Transforme o custo de marketing em uma fonte de receita recorrente com contratos de mídia cooperada.",
    points: 60,
    icon: "star",
    orderIdx: 6,
  },
  {
    title: "Elementos de Tribo",
    description: "Identidade, símbolos e pertencimento construídos de dentro pra fora — transformando a empresa numa nação, numa torcida, numa causa. Crie elementos que gerem identificação profunda: nome de comunidade, linguagem própria, rituais de compra, programa de embaixadores e conteúdo que une as pessoas em torno de um propósito maior do que o produto. Tribo é o maior ativo de uma marca.",
    points: 55,
    icon: "map",
    orderIdx: 7,
  },
];

export async function ensureDefaultStrategies(tenantId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select({ id: strategies.id, orderIdx: strategies.orderIdx })
    .from(strategies)
    .where(and(eq(strategies.tenantId, tenantId), eq(strategies.isDefault, true)));

  if (existing.length === 0) {
    // First time: insert all defaults
    for (const s of DEFAULT_STRATEGIES) {
      await db.insert(strategies).values({ tenantId, ...s, isDefault: true });
    }
  } else {
    // Sync titles/descriptions/icons/points for existing default strategies
    for (const s of DEFAULT_STRATEGIES) {
      const row = existing.find((e) => e.orderIdx === s.orderIdx);
      if (row) {
        await db.update(strategies)
          .set({ title: s.title, description: s.description, icon: s.icon, points: s.points })
          .where(and(eq(strategies.id, row.id), eq(strategies.isDefault, true)));
      } else {
        // Missing entry: insert it
        await db.insert(strategies).values({ tenantId, ...s, isDefault: true });
      }
    }
  }
}

export async function getStrategies(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  await ensureDefaultStrategies(tenantId);
  return db.select().from(strategies).where(eq(strategies.tenantId, tenantId)).orderBy(asc(strategies.orderIdx));
}

export async function getStrategyCompletions(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(strategyCompletions).where(eq(strategyCompletions.tenantId, tenantId));
}

export async function completeStrategy(strategyId: number, tenantId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  // Idempotent: only insert if not already completed
  const existing = await db.select({ id: strategyCompletions.id })
    .from(strategyCompletions)
    .where(and(eq(strategyCompletions.strategyId, strategyId), eq(strategyCompletions.tenantId, tenantId)))
    .limit(1);
  if (existing.length === 0) {
    await db.insert(strategyCompletions).values({ strategyId, tenantId, completedBy: userId });
  }
}

export async function uncompleteStrategy(strategyId: number, tenantId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(strategyCompletions).where(and(eq(strategyCompletions.strategyId, strategyId), eq(strategyCompletions.tenantId, tenantId)));
}

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────

export async function getTestimonials(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(testimonials).where(eq(testimonials.tenantId, tenantId)).orderBy(desc(testimonials.createdAt));
}

export async function createTestimonial(data: { tenantId: number; title: string; description?: string; fileUrl: string; fileType: "image" | "video"; uploadedBy: number }) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(testimonials).values(data);
  const result = await db.select().from(testimonials).where(eq(testimonials.tenantId, data.tenantId)).orderBy(desc(testimonials.createdAt)).limit(1);
  return result[0];
}

export async function deleteTestimonial(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(testimonials).where(and(eq(testimonials.id, id), eq(testimonials.tenantId, tenantId)));
}

// ─── TRAININGS ─────────────────────────────────────────────────────────────────────────────────

export async function listTrainings(role: "admin" | "marketer" | "client") {
  const db = await getDb();
  if (!db) return [];
  // admin and marketer see all; client sees only 'client' and 'all'
  const rows = await db.select().from(trainings).orderBy(trainings.orderIdx, trainings.createdAt);
  if (role === "admin" || role === "marketer") return rows;
  return rows.filter((t) => t.audience === "client" || t.audience === "all");
}

export async function createTraining(data: InsertTraining) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(trainings).values(data);
  const result = await db.select().from(trainings).orderBy(desc(trainings.createdAt)).limit(1);
  return result[0];
}

export async function updateTraining(id: number, data: Partial<InsertTraining>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(trainings).set(data).where(eq(trainings.id, id));
}

export async function deleteTraining(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(trainings).where(eq(trainings.id, id));
}

// ─── INSIGHTS ─────────────────────────────────────────────────────────────────
const DEFAULT_INSIGHTS = [
  {
    title: "Divulgar Ofertas da Curva A",
    body: "Produtos da curva A representam 80% do faturamento. Priorize a divulgação desses itens em todos os canais: stories, feed, WhatsApp e encarte. Destaque o preço, a disponibilidade e o benefício para o cliente.",
  },
  {
    title: "Divulgar Produtos Próximos do Vencimento",
    body: "Produtos com vencimento próximo precisam de giro rápido. Crie ofertas relâmpago, comunique urgência nos stories e no WhatsApp. Isso evita perdas e gera percepção de valor para o cliente.",
  },
  {
    title: "Divulgar Serviços da Loja (Produção Própria)",
    body: "Padaria, açougue, rotisserie e outros serviços de produção própria são diferenciais competitivos. Mostre o processo, a qualidade e a conveniência. Conteúdo autêntico gera conexão e aumenta o ticket médio.",
  },
];

export async function ensureDefaultInsights(tenantId: number, authorId: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select({ id: insights.id }).from(insights).where(eq(insights.tenantId, tenantId)).limit(1);
  if (existing.length > 0) return; // already seeded
  for (const ins of DEFAULT_INSIGHTS) {
    await db.insert(insights).values({ tenantId, authorId, title: ins.title, body: ins.body });
  }
}

export async function listInsights(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(insights).where(eq(insights.tenantId, tenantId)).orderBy(desc(insights.createdAt));
}
export async function createInsight(data: InsertInsight) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(insights).values(data);
  const result = await db.select().from(insights).orderBy(desc(insights.createdAt)).limit(1);
  return result[0];
}
export async function deleteInsight(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(insights).where(and(eq(insights.id, id), eq(insights.tenantId, tenantId)));
}

// ─── INSIGHT LIKES ───────────────────────────────────────────────────────────────────────────────

export async function getInsightLikes(insightId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(insightLikes).where(eq(insightLikes.insightId, insightId));
}

export async function toggleInsightLike(insightId: number, userId: number) {
  const db = await getDb();
  if (!db) return { liked: false, count: 0 };
  const existing = await db.select().from(insightLikes)
    .where(and(eq(insightLikes.insightId, insightId), eq(insightLikes.userId, userId)))
    .limit(1);
  if (existing.length > 0) {
    await db.delete(insightLikes).where(and(eq(insightLikes.insightId, insightId), eq(insightLikes.userId, userId)));
  } else {
    await db.insert(insightLikes).values({ insightId, userId });
  }
  const all = await db.select().from(insightLikes).where(eq(insightLikes.insightId, insightId));
  return { liked: existing.length === 0, count: all.length };
}

export async function getInsightLikesForTenant(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  // Join insights to get only likes for this tenant's insights
  const tenantInsights = await db.select({ id: insights.id }).from(insights).where(eq(insights.tenantId, tenantId));
  if (!tenantInsights.length) return [];
  const ids = tenantInsights.map((i) => i.id);
  return db.select().from(insightLikes).where(inArray(insightLikes.insightId, ids));
}

// ─── INSIGHT COMMENTS ────────────────────────────────────────────────────────────────────────────

export async function getInsightComments(insightId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(insightComments).where(eq(insightComments.insightId, insightId)).orderBy(asc(insightComments.createdAt));
}

export async function createInsightComment(insightId: number, userId: number, body: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(insightComments).values({ insightId, userId, body });
  const result = await db.select().from(insightComments).orderBy(desc(insightComments.createdAt)).limit(1);
  return result[0];
}

export async function deleteInsightComment(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(insightComments).where(and(eq(insightComments.id, id), eq(insightComments.userId, userId)));
}

export async function getInsightCommentsForTenant(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  const tenantInsights = await db.select({ id: insights.id }).from(insights).where(eq(insights.tenantId, tenantId));
  if (!tenantInsights.length) return [];
  const ids = tenantInsights.map((i) => i.id);
  return db.select().from(insightComments).where(inArray(insightComments.insightId, ids)).orderBy(asc(insightComments.createdAt));
}

// ─── USER AVATAR ──────────────────────────────────────────────────────────────────────────────────

export async function updateUserAvatar(userId: number, avatarUrl: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ avatarUrl }).where(eq(users.id, userId));
}

export async function getUserAvatars(userIds: number[]) {
  const db = await getDb();
  if (!db) return [];
  if (!userIds.length) return [];
  return db.select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl }).from(users).where(inArray(users.id, userIds));
}

export async function getUsersByTenant(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  const uts = await db.select({ userId: userTenants.userId }).from(userTenants).where(eq(userTenants.tenantId, tenantId));
  if (!uts.length) return [];
  const ids = uts.map((ut) => ut.userId);
  return db.select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl, role: users.role }).from(users).where(inArray(users.id, ids));
}

// ─── MEETINGS ────────────────────────────────────────────────────────────────
export async function getMeetings(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(meetings).where(eq(meetings.tenantId, tenantId)).orderBy(asc(meetings.scheduledAt));
}

export async function getMeetingById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(meetings).where(eq(meetings.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createMeeting(data: InsertMeeting): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(meetings).values(data);
  // Drizzle MySQL returns [ResultSetHeader, FieldPacket[]] — insertId is in result[0]
  const header = (result as any)[0] ?? result as any;
  return (header.insertId ?? 0) as number;
}

export async function updateMeetingStatus(id: number, status: "agendada" | "confirmada" | "cancelada" | "realizada") {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.update(meetings).set({ status, updatedAt: new Date() }).where(eq(meetings.id, id));
}

export async function deleteMeeting(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(meetingInvites).where(eq(meetingInvites.meetingId, id));
  return db.delete(meetings).where(eq(meetings.id, id));
}

// ─── MEETING INVITES ─────────────────────────────────────────────────────────
export async function getMeetingInvites(meetingId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: meetingInvites.id,
    meetingId: meetingInvites.meetingId,
    userId: meetingInvites.userId,
    rsvp: meetingInvites.rsvp,
    respondedAt: meetingInvites.respondedAt,
    userName: users.name,
    userAvatarUrl: users.avatarUrl,
  }).from(meetingInvites)
    .leftJoin(users, eq(meetingInvites.userId, users.id))
    .where(eq(meetingInvites.meetingId, meetingId));
}

export async function upsertMeetingInvites(meetingId: number, userIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Remove old invites
  await db.delete(meetingInvites).where(eq(meetingInvites.meetingId, meetingId));
  if (!userIds.length) return;
  const rows: InsertMeetingInvite[] = userIds.map((uid) => ({ meetingId, userId: uid, rsvp: "pendente" as const }));
  return db.insert(meetingInvites).values(rows);
}

export async function respondMeetingInvite(meetingId: number, userId: number, rsvp: "confirmado" | "declinado") {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.update(meetingInvites)
    .set({ rsvp, respondedAt: new Date() })
    .where(and(eq(meetingInvites.meetingId, meetingId), eq(meetingInvites.userId, userId)));
}

export async function getMyMeetingInvites(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: meetingInvites.id,
    meetingId: meetingInvites.meetingId,
    rsvp: meetingInvites.rsvp,
    respondedAt: meetingInvites.respondedAt,
    title: meetings.title,
    meetingType: meetings.meetingType,
    scheduledAt: meetings.scheduledAt,
    durationMin: meetings.durationMin,
    agenda: meetings.agenda,
    notes: meetings.notes,
    status: meetings.status,
    tenantId: meetings.tenantId,
  }).from(meetingInvites)
    .innerJoin(meetings, eq(meetingInvites.meetingId, meetings.id))
    .where(eq(meetingInvites.userId, userId))
    .orderBy(asc(meetings.scheduledAt));
}

// ─── WHATSAPP_PREFS ───────────────────────────────────────────────────────────
export async function getWhatsappPrefs(userId: number, tenantId: number): Promise<WhatsappPrefs | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(whatsappPrefs)
    .where(and(eq(whatsappPrefs.userId, userId), eq(whatsappPrefs.tenantId, tenantId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertWhatsappPrefs(data: InsertWhatsappPrefs): Promise<WhatsappPrefs | null> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await getWhatsappPrefs(data.userId!, data.tenantId!);
  if (existing) {
    await db.update(whatsappPrefs)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(whatsappPrefs.userId, data.userId!), eq(whatsappPrefs.tenantId, data.tenantId!)));
  } else {
    await db.insert(whatsappPrefs).values(data);
  }
  return getWhatsappPrefs(data.userId!, data.tenantId!);
}

/** Retorna todos os usuários que têm resumo diário ativo em um determinado horário (HH:MM). */
export async function getWhatsappPrefsByHorario(horario: string): Promise<WhatsappPrefs[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(whatsappPrefs)
    .where(and(
      eq(whatsappPrefs.enabled, 1),
      eq(whatsappPrefs.notifResumoDiario, 1),
      eq(whatsappPrefs.resumoHorario, horario),
    ));
}

/** Retorna todos os usuários de um tenant que têm notificação de reunião ativa. */
export async function getWhatsappPrefsForMeetingNotif(tenantId: number): Promise<WhatsappPrefs[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(whatsappPrefs)
    .where(and(
      eq(whatsappPrefs.tenantId, tenantId),
      eq(whatsappPrefs.enabled, 1),
      eq(whatsappPrefs.notifReuniao, 1),
    ));
}

/** Retorna todos os usuários de um tenant que têm notificação de nova tarefa ativa. */
export async function getWhatsappPrefsForTaskNotif(tenantId: number): Promise<WhatsappPrefs[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(whatsappPrefs)
    .where(and(
      eq(whatsappPrefs.tenantId, tenantId),
      eq(whatsappPrefs.enabled, 1),
      eq(whatsappPrefs.notifNovaTarefa, 1),
    ));
}

export async function getWhatsappPrefsForAssignedTask(
  userId: number,
  tenantId: number
): Promise<WhatsappPrefs | null> {
  const db = await getDb();

  if (!db) {
    return null;
  }

  const rows = await db
    .select()
    .from(whatsappPrefs)
    .where(
      and(
        eq(whatsappPrefs.userId, userId),
        eq(whatsappPrefs.tenantId, tenantId),
        eq(whatsappPrefs.enabled, 1),
        eq(whatsappPrefs.notifNovaTarefa, 1)
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function markWhatsappDailySummarySent(
  userId: number,
  tenantId: number,
  date: string
) {
  const db = await getDb();

  if (!db) {
    return;
  }

  await db
    .update(whatsappPrefs)
    .set({
      lastDailySummaryDate: date,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(whatsappPrefs.userId, userId),
        eq(whatsappPrefs.tenantId, tenantId)
      )
    );
}

// ─── TENANT PLAN ─────────────────────────────────────────────────────────────
export async function updateTenantPlan(tenantId: number, plan: "boi" | "leao" | "aguia") {
  const db = await getDb();
  if (!db) return;
  await db.update(tenants).set({ plan }).where(eq(tenants.id, tenantId));
}
