import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "marketer", "client"]);
export const taskStatusEnum = pgEnum("task_status", ["pending", "in_progress", "done"]);
export const taskPriorityEnum = pgEnum("task_priority", ["urgent", "week", "later"]);
export const taskRecurrenceEnum = pgEnum("task_recurrence", ["once", "daily"]);
export const campaignTypeEnum = pgEnum("campaign_type", [
  "custom",
  "nacional",
  "saude",
  "varejo",
  "sazonal",
]);
export const testimonialFileTypeEnum = pgEnum("testimonial_file_type", ["image", "video"]);
export const trainingAudienceEnum = pgEnum("training_audience", ["client", "marketer", "all"]);
export const meetingTypeEnum = pgEnum("meeting_type", ["operacional", "estrategico"]);
export const meetingStatusEnum = pgEnum("meeting_status", [
  "agendada",
  "confirmada",
  "cancelada",
  "realizada",
]);
export const meetingRsvpEnum = pgEnum("meeting_rsvp", ["pendente", "confirmado", "declinado"]);

// ─── USERS ───────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("client").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  mustChangePassword: boolean("mustChangePassword").default(false).notNull(),
  avatarUrl: text("avatarUrl"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const accessLogs = pgTable("access_logs", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  tenantId: integer("tenantId"),
  action: varchar("action", { length: 64 }).notNull().default("login"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AccessLog = typeof accessLogs.$inferSelect;

// ─── TENANTS ─────────────────────────────────────────────────────────────────
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  plan: varchar("plan", { length: 20 }).default("boi").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

// ─── USER_TENANTS ─────────────────────────────────────────────────────────────
export const userTenants = pgTable("user_tenants", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  tenantId: integer("tenantId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserTenant = typeof userTenants.$inferSelect;
export type InsertUserTenant = typeof userTenants.$inferInsert;

// ─── USER_SETTINGS ────────────────────────────────────────────────────────────
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  tenantId: integer("tenantId").notNull(),
  profileName: varchar("profileName", { length: 255 }),
  headerColor: varchar("headerColor", { length: 32 }).default("#0B0F14"),
  accentColor: varchar("accentColor", { length: 32 }).default("#C9A227"),
  logoUrl: text("logoUrl"),
  bannerUrl: text("bannerUrl"),
  twilioSid: varchar("twilioSid", { length: 128 }),
  twilioToken: varchar("twilioToken", { length: 128 }),
  twilioPhone: varchar("twilioPhone", { length: 32 }),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

// ─── TASK_CATEGORIES ─────────────────────────────────────────────────────────
export const taskCategories = pgTable("task_categories", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenantId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  icon: varchar("icon", { length: 64 }).default("list"),
  position: integer("position").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskCategory = typeof taskCategories.$inferSelect;
export type InsertTaskCategory = typeof taskCategories.$inferInsert;

// ─── TASKS ────────────────────────────────────────────────────────────────────
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenantId").notNull(),
  categoryId: integer("categoryId"),
  name: varchar("name", { length: 512 }).notNull(),
  status: taskStatusEnum("status").default("pending").notNull(),
  priority: taskPriorityEnum("priority").default("week").notNull(),
  responsible: varchar("responsible", { length: 255 }),
  responsibleUserId: integer("responsibleUserId"),
  position: integer("position").default(0),
  recurrence: taskRecurrenceEnum("recurrence").default("once").notNull(),
  imageUrl: text("imageUrl"),
  link: text("link"),
  recurringDays: text("recurringDays"),
  alertCampaignId: integer("alertCampaignId"),
  alertDaysBefore: integer("alertDaysBefore"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// ─── DASHBOARD_METRICS ───────────────────────────────────────────────────────
export const dashboardMetrics = pgTable("dashboard_metrics", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenantId").notNull(),
  section: varchar("section", { length: 255 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  valueFrom: varchar("valueFrom", { length: 128 }),
  valueTo: varchar("valueTo", { length: 128 }),
  deltaText: varchar("deltaText", { length: 128 }),
  growthPct: real("growthPct"),
  orderIdx: integer("orderIdx").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type DashboardMetric = typeof dashboardMetrics.$inferSelect;
export type InsertDashboardMetric = typeof dashboardMetrics.$inferInsert;

// ─── CAMPAIGNS ───────────────────────────────────────────────────────────────
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenantId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  campType: campaignTypeEnum("campType").default("custom").notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  tema: text("tema"),
  acoes: text("acoes"),
  responsible: varchar("responsible", { length: 255 }),
  alertsSent: text("alertsSent").default("[]"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

// ─── STRATEGIES ───────────────────────────────────────────────────────────────
export const strategies = pgTable("strategies", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenantId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  points: integer("points").default(70).notNull(),
  icon: varchar("icon", { length: 64 }).default("star").notNull(),
  isDefault: boolean("isDefault").default(true).notNull(),
  orderIdx: integer("orderIdx").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Strategy = typeof strategies.$inferSelect;
export type InsertStrategy = typeof strategies.$inferInsert;

export const strategyCompletions = pgTable("strategy_completions", {
  id: serial("id").primaryKey(),
  strategyId: integer("strategyId").notNull(),
  tenantId: integer("tenantId").notNull(),
  completedBy: integer("completedBy").notNull(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

export type StrategyCompletion = typeof strategyCompletions.$inferSelect;

// ─── TESTIMONIALS ───────────────────────────────────────────────────────────
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenantId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  fileUrl: text("fileUrl").notNull(),
  fileType: testimonialFileTypeEnum("fileType").default("image").notNull(),
  uploadedBy: integer("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = typeof testimonials.$inferInsert;

// ─── INSIGHTS ─────────────────────────────────────────────────────────────────
export const insights = pgTable("insights", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenantId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  imageUrl: text("imageUrl"),
  authorId: integer("authorId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Insight = typeof insights.$inferSelect;
export type InsertInsight = typeof insights.$inferInsert;

// ─── TRAININGS ────────────────────────────────────────────────────────────────
export const trainings = pgTable("trainings", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  videoUrl: text("videoUrl"),
  thumbnailUrl: text("thumbnailUrl"),
  audience: trainingAudienceEnum("audience").default("all").notNull(),
  category: varchar("category", { length: 128 }).default("Geral").notNull(),
  orderIdx: integer("orderIdx").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Training = typeof trainings.$inferSelect;
export type InsertTraining = typeof trainings.$inferInsert;

// ─── INSIGHT_LIKES ────────────────────────────────────────────────────────────
export const insightLikes = pgTable("insight_likes", {
  id: serial("id").primaryKey(),
  insightId: integer("insightId").notNull(),
  userId: integer("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InsightLike = typeof insightLikes.$inferSelect;

// ─── INSIGHT_COMMENTS ───────────────────────────────────────────────────────
export const insightComments = pgTable("insight_comments", {
  id: serial("id").primaryKey(),
  insightId: integer("insightId").notNull(),
  userId: integer("userId").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InsightComment = typeof insightComments.$inferSelect;

// ─── MEETINGS ─────────────────────────────────────────────────────────────────
export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenantId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  meetingType: meetingTypeEnum("meetingType").default("operacional").notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  durationMin: integer("durationMin").default(60).notNull(),
  agenda: text("agenda"),
  notes: text("notes"),
  status: meetingStatusEnum("status").default("agendada").notNull(),
  createdBy: integer("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = typeof meetings.$inferInsert;

// ─── MEETING_INVITES ──────────────────────────────────────────────────────────
export const meetingInvites = pgTable("meeting_invites", {
  id: serial("id").primaryKey(),
  meetingId: integer("meetingId").notNull(),
  userId: integer("userId").notNull(),
  rsvp: meetingRsvpEnum("rsvp").default("pendente").notNull(),
  respondedAt: timestamp("respondedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MeetingInvite = typeof meetingInvites.$inferSelect;
export type InsertMeetingInvite = typeof meetingInvites.$inferInsert;

// ─── WHATSAPP_PREFS ───────────────────────────────────────────────────────────
export const whatsappPrefs = pgTable("whatsapp_prefs", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  tenantId: integer("tenantId").notNull(),
  phone: varchar("phone", { length: 32 }),
  enabled: boolean("enabled").default(false).notNull(),
  notifNovaTarefa: boolean("notifNovaTarefa").default(false).notNull(),
  notifReuniao: boolean("notifReuniao").default(false).notNull(),
  notifResumoDiario: boolean("notifResumoDiario").default(false).notNull(),
  resumoHorario: varchar("resumoHorario", { length: 5 }).default("08:00").notNull(),
  heartbeatUid: varchar("heartbeatUid", { length: 128 }),
  lastDailySummaryDate: varchar("lastDailySummaryDate", { length: 10 }),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type WhatsappPrefs = typeof whatsappPrefs.$inferSelect;
export type InsertWhatsappPrefs = typeof whatsappPrefs.$inferInsert;
