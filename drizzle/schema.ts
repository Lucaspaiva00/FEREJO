import {
  boolean,
  int,
  tinyint,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
  date,
} from "drizzle-orm/mysql-core";

// ─── USERS ───────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "marketer", "client"]).default("client").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  mustChangePassword: boolean("mustChangePassword").default(false).notNull(),
  avatarUrl: text("avatarUrl"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const accessLogs = mysqlTable("access_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tenantId: int("tenantId"),
  action: varchar("action", { length: 64 }).notNull().default("login"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AccessLog = typeof accessLogs.$inferSelect;

// ─── TENANTS ─────────────────────────────────────────────────────────────────
export const tenants = mysqlTable("tenants", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  plan: varchar("plan", { length: 20 }).default("boi").notNull(), // boi | leao | aguia
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

// ─── USER_TENANTS ─────────────────────────────────────────────────────────────
export const userTenants = mysqlTable("user_tenants", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tenantId: int("tenantId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserTenant = typeof userTenants.$inferSelect;
export type InsertUserTenant = typeof userTenants.$inferInsert;

// ─── USER_SETTINGS ────────────────────────────────────────────────────────────
export const userSettings = mysqlTable("user_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tenantId: int("tenantId").notNull(),
  profileName: varchar("profileName", { length: 255 }),
  headerColor: varchar("headerColor", { length: 32 }).default("#0B0F14"),
  accentColor: varchar("accentColor", { length: 32 }).default("#C9A227"),
  logoUrl: text("logoUrl"),
  bannerUrl: text("bannerUrl"),
  twilioSid: varchar("twilioSid", { length: 128 }),
  twilioToken: varchar("twilioToken", { length: 128 }),
  twilioPhone: varchar("twilioPhone", { length: 32 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

// ─── TASK_CATEGORIES ─────────────────────────────────────────────────────────
export const taskCategories = mysqlTable("task_categories", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  icon: varchar("icon", { length: 64 }).default("list"),
  position: int("position").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskCategory = typeof taskCategories.$inferSelect;
export type InsertTaskCategory = typeof taskCategories.$inferInsert;

// ─── TASKS ────────────────────────────────────────────────────────────────────
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  categoryId: int("categoryId"),
  name: varchar("name", { length: 512 }).notNull(),

  status: mysqlEnum("status", [
    "pending",
    "in_progress",
    "done",
  ])
    .default("pending")
    .notNull(),

  priority: mysqlEnum("priority", [
    "urgent",
    "week",
    "later",
  ])
    .default("week")
    .notNull(),

  responsible: varchar("responsible", { length: 255 }),

  // Usuário efetivamente responsável pela tarefa.
  responsibleUserId: int("responsibleUserId"),

  position: int("position").default(0),

  recurrence: mysqlEnum("recurrence", [
    "once",
    "daily",
  ])
    .default("once")
    .notNull(),

  imageUrl: text("imageUrl"),
  link: text("link"),
  recurringDays: text("recurringDays"),
  alertCampaignId: int("alertCampaignId"),
  alertDaysBefore: int("alertDaysBefore"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),

  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .onUpdateNow()
    .notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// ─── DASHBOARD_METRICS ───────────────────────────────────────────────────────
export const dashboardMetrics = mysqlTable("dashboard_metrics", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  section: varchar("section", { length: 255 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  valueFrom: varchar("valueFrom", { length: 128 }),
  valueTo: varchar("valueTo", { length: 128 }),
  deltaText: varchar("deltaText", { length: 128 }),
  growthPct: float("growthPct"),
  orderIdx: int("orderIdx").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Special row: section='_config' stores dashboard title/subtitle/period as JSON in label
export type DashboardMetric = typeof dashboardMetrics.$inferSelect;
export type InsertDashboardMetric = typeof dashboardMetrics.$inferInsert;

// ─── CAMPAIGNS ───────────────────────────────────────────────────────────────
export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  campType: mysqlEnum("campType", ["custom", "nacional", "saude", "varejo", "sazonal"]).default("custom").notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  tema: text("tema"),
  acoes: text("acoes"),
  responsible: varchar("responsible", { length: 255 }),
  // Tracks which alert milestones have already been generated (JSON array: [45, 15, 7])
  alertsSent: text("alertsSent").default("[]"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

// ─── STRATEGIES ───────────────────────────────────────────────────────────────
export const strategies = mysqlTable("strategies", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  points: int("points").default(70).notNull(),
  icon: varchar("icon", { length: 64 }).default("star").notNull(),
  isDefault: boolean("isDefault").default(true).notNull(),
  orderIdx: int("orderIdx").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Strategy = typeof strategies.$inferSelect;
export type InsertStrategy = typeof strategies.$inferInsert;

export const strategyCompletions = mysqlTable("strategy_completions", {
  id: int("id").autoincrement().primaryKey(),
  strategyId: int("strategyId").notNull(),
  tenantId: int("tenantId").notNull(),
  completedBy: int("completedBy").notNull(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

export type StrategyCompletion = typeof strategyCompletions.$inferSelect;

// ─── TESTIMONIALS ───────────────────────────────────────────────────────────
export const testimonials = mysqlTable("testimonials", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  fileUrl: text("fileUrl").notNull(),
  fileType: mysqlEnum("fileType", ["image", "video"]).default("image").notNull(),
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = typeof testimonials.$inferInsert;

// ─── INSIGHTS ─────────────────────────────────────────────────────────────────
export const insights = mysqlTable("insights", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  imageUrl: text("imageUrl"),
  authorId: int("authorId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Insight = typeof insights.$inferSelect;
export type InsertInsight = typeof insights.$inferInsert;

// ─── TRAININGS ─────────────────────────────────────────────────────────────────────────────────
export const trainings = mysqlTable("trainings", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  videoUrl: text("videoUrl"),
  thumbnailUrl: text("thumbnailUrl"),
  // audience: 'client' = only clients, 'marketer' = marketers+admins, 'all' = everyone
  audience: mysqlEnum("audience", ["client", "marketer", "all"]).default("all").notNull(),
  category: varchar("category", { length: 128 }).default("Geral").notNull(),
  orderIdx: int("orderIdx").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Training = typeof trainings.$inferSelect;
export type InsertTraining = typeof trainings.$inferInsert;

// ─── INSIGHT_LIKES ───────────────────────────────────────────────────────────────────────────────
export const insightLikes = mysqlTable("insight_likes", {
  id: int("id").autoincrement().primaryKey(),
  insightId: int("insightId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InsightLike = typeof insightLikes.$inferSelect;

// ─── INSIGHT_COMMENTS ─────────────────────────────────────────────────────────────────────────────
export const insightComments = mysqlTable("insight_comments", {
  id: int("id").autoincrement().primaryKey(),
  insightId: int("insightId").notNull(),
  userId: int("userId").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InsightComment = typeof insightComments.$inferSelect;

// ─── MEETINGS ────────────────────────────────────────────────────────────────────────────────────
export const meetings = mysqlTable("meetings", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  meetingType: mysqlEnum("meetingType", ["operacional", "estrategico"]).default("operacional").notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  durationMin: int("durationMin").default(60).notNull(),
  agenda: text("agenda"),           // pauta / foco do encontro (JSON array de strings)
  notes: text("notes"),             // observações gerais
  status: mysqlEnum("status", ["agendada", "confirmada", "cancelada", "realizada"]).default("agendada").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = typeof meetings.$inferInsert;

// ─── MEETING_INVITES ─────────────────────────────────────────────────────────────────────────────
export const meetingInvites = mysqlTable("meeting_invites", {
  id: int("id").autoincrement().primaryKey(),
  meetingId: int("meetingId").notNull(),
  userId: int("userId").notNull(),
  rsvp: mysqlEnum("rsvp", ["pendente", "confirmado", "declinado"]).default("pendente").notNull(),
  respondedAt: timestamp("respondedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MeetingInvite = typeof meetingInvites.$inferSelect;
export type InsertMeetingInvite = typeof meetingInvites.$inferInsert;

// ─── WHATSAPP_PREFS ────────────────────────────────────────────────────────────────────────────────────────────────
export const whatsappPrefs = mysqlTable("whatsapp_prefs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tenantId: int("tenantId").notNull(),

  phone: varchar("phone", { length: 32 }),

  enabled: tinyint("enabled").default(0).notNull(),

  notifNovaTarefa: tinyint("notifNovaTarefa")
    .default(0)
    .notNull(),

  notifReuniao: tinyint("notifReuniao")
    .default(0)
    .notNull(),

  notifResumoDiario: tinyint("notifResumoDiario")
    .default(0)
    .notNull(),

  resumoHorario: varchar("resumoHorario", {
    length: 5,
  })
    .default("08:00")
    .notNull(),

  heartbeatUid: varchar("heartbeatUid", {
    length: 128,
  }),

  // Evita enviar o mesmo resumo mais de uma vez por dia.
  lastDailySummaryDate: varchar("lastDailySummaryDate", {
    length: 10,
  }),

  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .onUpdateNow()
    .notNull(),
});
export type WhatsappPrefs = typeof whatsappPrefs.$inferSelect;
export type InsertWhatsappPrefs = typeof whatsappPrefs.$inferInsert;
