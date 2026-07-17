import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import bcrypt from "bcryptjs";
import {
  upsertUser, getUserByOpenId, getAllUsers, updateUserRole, createUser, deleteUser,
  getUserByEmail, updateUserPassword,
  getAllTenants, createTenant, deleteTenant, updateTenantPlan,
  getUserTenants, setUserTenants,
  getUserSettings, upsertUserSettings,
  getTaskCategories, createTaskCategory, deleteTaskCategory, renameTaskCategory, ensureDefaultCategories,
  getTasks, createTask, updateTask, deleteTask, ensureDefaultTasks,
  getDashboardMetrics, upsertDashboardConfig, createDashboardMetric, updateDashboardMetric, deleteDashboardMetric,
  getCampaigns, createCampaign, updateCampaign, deleteCampaign,
  generateCampaignAlerts, resetCampaignAlerts,
  logAccess, getAccessStats,
  getStrategies, getStrategyCompletions, completeStrategy, uncompleteStrategy,
  getTestimonials, createTestimonial, deleteTestimonial,
  listTrainings, createTraining, updateTraining, deleteTraining,
  listInsights, createInsight, deleteInsight, ensureDefaultInsights,
  toggleInsightLike, getInsightLikesForTenant,
  getInsightCommentsForTenant, createInsightComment, deleteInsightComment,
  updateUserAvatar, getUserAvatars, getUsersByTenant,
  getMeetings, getMeetingById, createMeeting, updateMeetingStatus, deleteMeeting,
  getMeetingInvites, upsertMeetingInvites, respondMeetingInvite, getMyMeetingInvites,
  getWhatsappPrefs, upsertWhatsappPrefs, getWhatsappPrefsForMeetingNotif, getWhatsappPrefsForTaskNotif,
  getWhatsappPrefsByHorario,
} from "./db";
import { sendWhatsApp, buildNewTaskMessage, buildNewMeetingMessage, buildDailySummaryMessage } from "./zapi";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores." });
  return next({ ctx });
});

const marketerOrAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role === "client") throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para esta ação." });
  return next({ ctx });
});

// Validates that the current user has access to the given tenantId
async function assertTenantAccess(userId: number, role: string, tenantId: number) {
  if (role === "admin") return; // admin has access to all tenants
  const tenants = await getUserTenants(userId);
  const hasAccess = tenants.some((t: { id: number }) => t.id === tenantId);
  if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Sem acesso a este cliente." });
}

// ─── ROUTERS ─────────────────────────────────────────────────────────────────

// ─── TRAININGS ROUTER ────────────────────────────────────────────────────────
const trainingsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await listTrainings(ctx.user.role);
  }),
  create: adminProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      videoUrl: z.string().optional(),
      thumbnailUrl: z.string().optional(),
      audience: z.enum(["client", "marketer", "all"]).default("all"),
      category: z.string().default("Geral"),
      orderIdx: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      return await createTraining(input);
    }),
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      videoUrl: z.string().optional(),
      thumbnailUrl: z.string().optional(),
      audience: z.enum(["client", "marketer", "all"]).optional(),
      category: z.string().optional(),
      orderIdx: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateTraining(id, data);
      return { success: true };
    }),
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteTraining(input.id);
      return { success: true };
    }),
});

export const appRouter = router({
  system: systemRouter,

  // ── AUTH ──────────────────────────────────────────────────────────────────
  auth: router({
    emailRegister: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
      }))
      .mutation(async ({ input, ctx }) => {
        const existing = await getUserByEmail(input.email);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Este e-mail já está cadastrado." });
        const hash = await bcrypt.hash(input.password, 10);
        const openId = `email_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        await createUser({
          openId,
          name: input.name,
          email: input.email,
          loginMethod: "email",
          role: "client",
          lastSignedIn: new Date(),
          passwordHash: hash,
        });
        return { success: true };
      }),

    emailLogin: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByEmail(input.email);
        if (!user || !user.passwordHash) throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha incorretos." });
        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha incorretos." });
        const token = await sdk.createSessionToken(user.openId, { name: user.name ?? "" });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        await upsertUser({ openId: user.openId, lastSignedIn: new Date() });
        await logAccess(user.id, undefined, "email_login");
        return { success: true };
      }),

    me: publicProcedure.query(async (opts) => {
      const user = opts.ctx.user;
      if (!user) return null;
      // Return user with their accessible tenants
      const userTenants = await getUserTenants(user.id);
      // Log access on session check (throttled: only once per 30min per user)
      await logAccess(user.id, undefined, "session").catch(() => {});
      return { ...user, tenants: userTenants };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── TENANTS ───────────────────────────────────────────────────────────────
  tenants: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === "admin") return getAllTenants();
      return getUserTenants(ctx.user.id);
    }),
    create: adminProcedure.input(z.object({ name: z.string().min(1) })).mutation(async ({ input, ctx }) => {
      // Verificar limite de lojas por plano
      const allTenants = await getAllTenants();
      const PLAN_LIMITS: Record<string, number> = { boi: 1, leao: 5, aguia: 20 };
      // Pegar plano do primeiro tenant do admin (owner)
      const ownerTenants = await getUserTenants(ctx.user.id);
      const currentPlan = (ownerTenants[0] as { plan?: string })?.plan ?? "boi";
      const limit = PLAN_LIMITS[currentPlan] ?? 1;
      if (allTenants.length >= limit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `PLAN_LIMIT:${currentPlan}:${limit}`,
        });
      }
      return createTenant(input.name);
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteTenant(input.id);
      return { success: true };
    }),
    get: protectedProcedure
      .input(z.object({ tenantId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertTenantAccess(ctx.user.id, ctx.user.role, input.tenantId);
        const tenants = await getUserTenants(ctx.user.id);
        const all = await getAllTenants();
        const tenant = all.find((t) => t.id === input.tenantId);
        return tenant ?? null;
      }),
    updatePlan: adminProcedure
      .input(z.object({ tenantId: z.number(), plan: z.enum(["boi", "leao", "aguia"]) }))
      .mutation(async ({ input }) => {
        await updateTenantPlan(input.tenantId, input.plan);
        return { success: true };
      }),
  }),

  // ── USERS (admin) ─────────────────────────────────────────────────────────
  users: router({
    list: adminProcedure.query(() => getAllUsers()),
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        role: z.enum(["admin", "marketer", "client"]),
        tenantIds: z.array(z.number()),
      }))
      .mutation(async ({ input }) => {
        const DEFAULT_PASSWORD = "Farejo@2025";
        const openId = `manual_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
        const user = await createUser({
          openId,
          name: input.name,
          email: input.email,
          role: input.role,
          loginMethod: "email",
          lastSignedIn: new Date(),
          passwordHash,
          mustChangePassword: true,
        });
        if (user && input.tenantIds.length) {
          await setUserTenants(user.id, input.tenantIds);
        }
        return { ...user, defaultPassword: DEFAULT_PASSWORD };
      }),
    changePassword: protectedProcedure
      .input(z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(6) }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUserByOpenId(ctx.user.openId);
        if (!user || !user.passwordHash) throw new TRPCError({ code: "BAD_REQUEST", message: "Conta sem senha definida." });
        const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
        if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Senha atual incorreta." });
        const hash = await bcrypt.hash(input.newPassword, 10);
        await updateUserPassword(user.id, hash);
        // Clear mustChangePassword flag
        const db = await import("./db").then(m => m.getDb());
        if (db) {
          const { users } = await import("../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          await db.update(users).set({ mustChangePassword: false }).where(eq(users.id, user.id));
        }
        return { success: true };
      }),
    me: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserByOpenId(ctx.user.openId);
      return user ? { mustChangePassword: user.mustChangePassword } : null;
    }),
    updateRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["admin", "marketer", "client"]) }))
      .mutation(async ({ input }) => {
        await updateUserRole(input.userId, input.role);
        return { success: true };
      }),
    setTenants: adminProcedure
      .input(z.object({ userId: z.number(), tenantIds: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        await setUserTenants(input.userId, input.tenantIds);
        return { success: true };
      }),
    getUserTenants: adminProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => getUserTenants(input.userId)),
    allUserTenants: adminProcedure.query(async () => {
      const users = await getAllUsers();
      const result: Record<number, { id: number; name: string }[]> = {};
      await Promise.all(users.map(async (u: { id: number }) => {
        result[u.id] = await getUserTenants(u.id);
      }));
      return result;
    }),
    delete: adminProcedure.input(z.object({ userId: z.number() })).mutation(async ({ input }) => {
      await deleteUser(input.userId);
      return { success: true };
    }),
    accessStats: adminProcedure.query(() => getAccessStats()),
  }),

  // ── USER SETTINGS ─────────────────────────────────────────────────────────
  settings: router({
    get: protectedProcedure
      .input(z.object({ tenantId: z.number() }))
      .query(async ({ ctx, input }) => getUserSettings(ctx.user.id, input.tenantId)),
    save: protectedProcedure
      .input(z.object({
        tenantId: z.number(),
        profileName: z.string().optional(),
        headerColor: z.string().optional(),
        accentColor: z.string().optional(),
        logoUrl: z.string().optional(),
        bannerUrl: z.string().optional(),

      }))
      .mutation(async ({ ctx, input }) => {
        return upsertUserSettings({ userId: ctx.user.id, ...input });
      }),
  }),

  // ── TASK CATEGORIES ───────────────────────────────────────────────────────
  categories: router({
    list: protectedProcedure
      .input(z.object({ tenantId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertTenantAccess(ctx.user.id, ctx.user.role, input.tenantId);
        await ensureDefaultCategories(input.tenantId);
        return getTaskCategories(input.tenantId);
      }),
    create: protectedProcedure
      .input(z.object({ tenantId: z.number(), title: z.string().min(1), icon: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        await assertTenantAccess(ctx.user.id, ctx.user.role, input.tenantId);
        return createTaskCategory({ tenantId: input.tenantId, title: input.title, icon: input.icon ?? "list" });
      }),
    rename: protectedProcedure
      .input(z.object({ id: z.number(), tenantId: z.number(), title: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        await assertTenantAccess(ctx.user.id, ctx.user.role, input.tenantId);
        await renameTaskCategory(input.id, input.tenantId, input.title);
        return { success: true };
      }),
    delete: marketerOrAdminProcedure
      .input(z.object({ id: z.number(), tenantId: z.number() }))
      .mutation(async ({ input }) => {
        await deleteTaskCategory(input.id, input.tenantId);
        return { success: true };
      }),
  }),

  // ── TASKS ─────────────────────────────────────────────────────────────────
  tasks: router({
    list: protectedProcedure
      .input(z.object({ tenantId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertTenantAccess(ctx.user.id, ctx.user.role, input.tenantId);
        // Seed default tasks for any empty category (incremental — safe to call every time)
        await ensureDefaultTasks(input.tenantId);
        return getTasks(input.tenantId);
      }),
    create: marketerOrAdminProcedure
      .input(z.object({
        tenantId: z.number(),
        name: z.string().min(1),
        priority: z.enum(["urgent", "week", "later"]).default("week"),
        status: z.enum(["pending", "in_progress", "done"]).default("pending"),
        categoryId: z.number().optional(),
        responsible: z.string().optional(),
        recurrence: z.enum(["once", "daily", "weekly"]).default("once"),
        imageUrl: z.string().optional(),
        link: z.string().optional(),
        recurringDays: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const task = await createTask({
          tenantId: input.tenantId,
          name: input.name,
          priority: input.priority,
          categoryId: input.categoryId ?? null,
          responsible: input.responsible ?? null,
          status: input.status,
          recurrence: input.recurrence as "once" | "daily",
          imageUrl: input.imageUrl ?? null,
          link: input.link ?? null,
          recurringDays: input.recurringDays ?? null,
        });
        // Disparar WhatsApp para usuários do tenant com notifNovaTarefa ativo
        void (async () => {
          try {
            const wPrefs = await getWhatsappPrefsForTaskNotif(input.tenantId);
            for (const pref of wPrefs) {
              if (!pref.phone) continue;
              const settings = await getUserSettings(pref.userId, input.tenantId);
              
              const tenants = await import("./db").then(m => m.getAllTenants());
              const tenant = tenants.find((t: { id: number }) => t.id === input.tenantId);
              const msg = buildNewTaskMessage(input.name, input.priority, tenant?.name ?? "FAREJO");
              await sendWhatsApp(pref.phone, msg);
            }
          } catch {}
        })();
        return task;
      }),
    update: marketerOrAdminProcedure
      .input(z.object({
        id: z.number(),
        tenantId: z.number(),
        name: z.string().optional(),
        status: z.enum(["pending", "in_progress", "done"]).optional(),
        priority: z.enum(["urgent", "week", "later"]).optional(),
        categoryId: z.number().nullable().optional(),
        responsible: z.string().nullable().optional(),
        recurrence: z.enum(["once", "daily", "weekly"]).optional(),
        imageUrl: z.string().nullable().optional(),
        link: z.string().nullable().optional(),
        recurringDays: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, tenantId, ...data } = input;
        return updateTask(id, tenantId, data as Parameters<typeof updateTask>[2]);
      }),
    delete: marketerOrAdminProcedure
      .input(z.object({ id: z.number(), tenantId: z.number() }))
      .mutation(async ({ input }) => {
        await deleteTask(input.id, input.tenantId);
        return { success: true };
      }),
  }),

  // ── DASHBOARD METRICS ─────────────────────────────────────────────────────
  metrics: router({
    list: protectedProcedure
      .input(z.object({ tenantId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertTenantAccess(ctx.user.id, ctx.user.role, input.tenantId);
        return getDashboardMetrics(input.tenantId);
      }),
    saveConfig: adminProcedure
      .input(z.object({
        tenantId: z.number(),
        title: z.string(),
        subtitle: z.string(),
        period: z.string(),
      }))
      .mutation(async ({ input }) => {
        await upsertDashboardConfig(input.tenantId, { title: input.title, subtitle: input.subtitle, period: input.period });
        return { success: true };
      }),
    create: adminProcedure
      .input(z.object({
        tenantId: z.number(),
        section: z.string(),
        label: z.string(),
        valueFrom: z.string().optional(),
        valueTo: z.string().optional(),
        deltaText: z.string().optional(),
        growthPct: z.number().optional(),
        orderIdx: z.number().optional(),
      }))
      .mutation(async ({ input }) => createDashboardMetric(input)),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        tenantId: z.number(),
        section: z.string().optional(),
        label: z.string().optional(),
        valueFrom: z.string().optional(),
        valueTo: z.string().optional(),
        deltaText: z.string().optional(),
        growthPct: z.number().optional(),
        orderIdx: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, tenantId, ...data } = input;
        await updateDashboardMetric(id, tenantId, data);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number(), tenantId: z.number() }))
      .mutation(async ({ input }) => {
        await deleteDashboardMetric(input.id, input.tenantId);
        return { success: true };
      }),
  }),

  // ── CAMPAIGNS ─────────────────────────────────────────────────────────────
  campaigns: router({
    list: protectedProcedure
      .input(z.object({ tenantId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertTenantAccess(ctx.user.id, ctx.user.role, input.tenantId);
        return getCampaigns(input.tenantId);
      }),
    create: marketerOrAdminProcedure
      .input(z.object({
        tenantId: z.number(),
        name: z.string().min(1),
        campType: z.enum(["custom", "nacional", "saude", "varejo", "sazonal"]).default("custom"),
        startDate: z.string(),
        endDate: z.string(),
        tema: z.string().optional(),
        acoes: z.string().optional(),
        responsible: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return createCampaign({
          ...input,
          startDate: input.startDate as unknown as Date,
          endDate: input.endDate as unknown as Date,
        });
      }),
    createBulk: marketerOrAdminProcedure
      .input(z.object({
        tenantId: z.number(),
        campaigns: z.array(z.object({
          name: z.string(),
          campType: z.enum(["custom", "nacional", "saude", "varejo", "sazonal"]),
          startDate: z.string(),
          endDate: z.string(),
          tema: z.string().optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        const results = [];
        for (const c of input.campaigns) {
          const result = await createCampaign({
            tenantId: input.tenantId,
            name: c.name,
            campType: c.campType,
            startDate: c.startDate as unknown as Date,
            endDate: c.endDate as unknown as Date,
            tema: c.tema ?? null,
          });
          if (result) results.push(result);
        }
        return results;
      }),
    update: marketerOrAdminProcedure
      .input(z.object({
        id: z.number(),
        tenantId: z.number(),
        name: z.string().optional(),
        campType: z.enum(["custom", "nacional", "saude", "varejo", "sazonal"]).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        tema: z.string().optional(),
        acoes: z.string().optional(),
        responsible: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, tenantId, ...data } = input;
        await updateCampaign(id, tenantId, data as any);
        return { success: true };
      }),
    delete: marketerOrAdminProcedure
      .input(z.object({ id: z.number(), tenantId: z.number() }))
      .mutation(async ({ input }) => {
        // Remove alert tasks linked to this campaign before deleting
        await resetCampaignAlerts(input.id, input.tenantId);
        await deleteCampaign(input.id, input.tenantId);
        return { success: true };
      }),

    // Sync alerts: checks all campaigns and generates pending alert tasks
    // Restricted to admin/marketer — client role is read-only
    syncAlerts: marketerOrAdminProcedure
      .input(z.object({ tenantId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await assertTenantAccess(ctx.user.id, ctx.user.role, input.tenantId);
        const created = await generateCampaignAlerts(input.tenantId);
        return { created };
      }),

    // Reset alerts for a specific campaign (e.g., when dates change)
    resetAlerts: marketerOrAdminProcedure
      .input(z.object({ id: z.number(), tenantId: z.number() }))
      .mutation(async ({ input }) => {
        await resetCampaignAlerts(input.id, input.tenantId);
        return { success: true };
      }),
  }),

  // ── STRATEGIES ────────────────────────────────────────────────────────────────────────
  strategies: router({
    list: protectedProcedure
      .input(z.object({ tenantId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertTenantAccess(ctx.user.id, ctx.user.role, input.tenantId);
        const strats = await getStrategies(input.tenantId);
        const completions = await getStrategyCompletions(input.tenantId);
        const completedIds = new Set(completions.map((c: { strategyId: number }) => c.strategyId));
        return strats.map((s: { id: number }) => ({ ...s, completed: completedIds.has(s.id) }));
      }),
    complete: protectedProcedure
      .input(z.object({ strategyId: z.number(), tenantId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await assertTenantAccess(ctx.user.id, ctx.user.role, input.tenantId);
        await completeStrategy(input.strategyId, input.tenantId, ctx.user.id);
        return { success: true };
      }),
    uncomplete: protectedProcedure
      .input(z.object({ strategyId: z.number(), tenantId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await assertTenantAccess(ctx.user.id, ctx.user.role, input.tenantId);
        await uncompleteStrategy(input.strategyId, input.tenantId);
        return { success: true };
      }),
  }),

  // ── TESTIMONIALS ────────────────────────────────────────────────────────────────────
  testimonials: router({
    list: protectedProcedure
      .input(z.object({ tenantId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertTenantAccess(ctx.user.id, ctx.user.role, input.tenantId);
        return getTestimonials(input.tenantId);
      }),
    create: protectedProcedure
      .input(z.object({
        tenantId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        fileUrl: z.string().url(),
        fileType: z.enum(["image", "video"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertTenantAccess(ctx.user.id, ctx.user.role, input.tenantId);
        return createTestimonial({ ...input, uploadedBy: ctx.user.id });
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number(), tenantId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await assertTenantAccess(ctx.user.id, ctx.user.role, input.tenantId);
        await deleteTestimonial(input.id, input.tenantId);
        return { success: true };
      }),
  }),
  trainings: trainingsRouter,
  insights: router({
    list: protectedProcedure
      .input(z.object({ tenantId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertTenantAccess(ctx.user.id, ctx.user.role, input.tenantId);
        await ensureDefaultInsights(input.tenantId, ctx.user.id);
        return listInsights(input.tenantId);
      }),
    create: protectedProcedure
      .input(z.object({
        tenantId: z.number(),
        title: z.string().min(1),
        body: z.string().optional(),
        imageUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertTenantAccess(ctx.user.id, ctx.user.role, input.tenantId);
        return createInsight({
          tenantId: input.tenantId,
          title: input.title,
          body: input.body ?? null,
          imageUrl: input.imageUrl ?? null,
          authorId: ctx.user.id,
        });
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number(), tenantId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await assertTenantAccess(ctx.user.id, ctx.user.role, input.tenantId);
        await deleteInsight(input.id, input.tenantId);
        return { success: true };
      }),
    // Returns all likes for the tenant's insights
    likes: protectedProcedure
      .input(z.object({ tenantId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertTenantAccess(ctx.user.id, ctx.user.role, input.tenantId);
        return getInsightLikesForTenant(input.tenantId);
      }),
    toggleLike: protectedProcedure
      .input(z.object({ insightId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return toggleInsightLike(input.insightId, ctx.user.id);
      }),
    // Returns all comments for the tenant's insights
    comments: protectedProcedure
      .input(z.object({ tenantId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertTenantAccess(ctx.user.id, ctx.user.role, input.tenantId);
        return getInsightCommentsForTenant(input.tenantId);
      }),
    addComment: protectedProcedure
      .input(z.object({ insightId: z.number(), body: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        return createInsightComment(input.insightId, ctx.user.id, input.body);
      }),
    deleteComment: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteInsightComment(input.id, ctx.user.id);
        return { success: true };
      }),
  }),
  // ── USER AVATAR ───────────────────────────────────────────────────────────

  // ── SOCIAL MEDIA SCRAPER ──────────────────────────────────────────────────
  social: router({
    fetchProfile: protectedProcedure
      .input(z.object({
        platform: z.enum(["instagram", "facebook", "linkedin", "google", "app", "ads", "whatsapp"]),
        url: z.string().url(),
      }))
      .mutation(async ({ input }) => {
        const { fetchSocialProfile } = await import("./socialScraper");
        return fetchSocialProfile(input.platform, input.url);
      }),
  }),

  profile: router({
    updateAvatar: protectedProcedure
      .input(z.object({ avatarUrl: z.string().url() }))
      .mutation(async ({ ctx, input }) => {
        await updateUserAvatar(ctx.user.id, input.avatarUrl);
        return { success: true };
      }),
    avatars: protectedProcedure
      .input(z.object({ userIds: z.array(z.number()) }))
      .query(async ({ input }) => {
        return getUserAvatars(input.userIds);
      }),
    tenantUsers: protectedProcedure
      .input(z.object({ tenantId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertTenantAccess(ctx.user.id, ctx.user.role, input.tenantId);
                return getUsersByTenant(input.tenantId);
      }),
  }),
  // ─── MEETINGS ─────────────────────────────────────────────────────────────────────────
  meetings: router({
    list: protectedProcedure
      .input(z.object({ tenantId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertTenantAccess(ctx.user.id, ctx.user.role, input.tenantId);
        const rows = await getMeetings(input.tenantId);
        const withInvites = await Promise.all(
          rows.map(async (m) => ({
            ...m,
            agenda: m.agenda ? (JSON.parse(m.agenda) as string[]) : [],
            invites: await getMeetingInvites(m.id),
          }))
        );
        return withInvites;
      }),
    myInvites: protectedProcedure.query(async ({ ctx }) => {
      return getMyMeetingInvites(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        tenantId: z.number(),
        title: z.string().min(1),
        meetingType: z.enum(["operacional", "estrategico"]),
        scheduledAt: z.date(),
        durationMin: z.number().min(15).max(480).default(60),
        agenda: z.array(z.string()).default([]),
        notes: z.string().optional(),
        inviteeIds: z.array(z.number()).default([]),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertTenantAccess(ctx.user.id, ctx.user.role, input.tenantId);
        const insertId = await createMeeting({
          tenantId: input.tenantId,
          title: input.title,
          meetingType: input.meetingType,
          scheduledAt: input.scheduledAt,
          durationMin: input.durationMin,
          agenda: JSON.stringify(input.agenda),
          notes: input.notes ?? null,
          status: "agendada",
          createdBy: ctx.user.id,
        });
        if (!insertId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao criar reunião." });
        if ((input.inviteeIds ?? []).length) {
          await upsertMeetingInvites(insertId, input.inviteeIds!);
        }
        // Disparar WhatsApp para usuários do tenant com notifReuniao ativo
        void (async () => {
          try {
            const wPrefs = await getWhatsappPrefsForMeetingNotif(input.tenantId);
            for (const pref of wPrefs) {
              if (!pref.phone) continue;
              const settings = await getUserSettings(pref.userId, input.tenantId);
              
              const tenants = await import("./db").then(m => m.getAllTenants());
              const tenant = tenants.find((t: { id: number }) => t.id === input.tenantId);
              const msg = buildNewMeetingMessage(input.title, input.meetingType, new Date(input.scheduledAt), tenant?.name ?? "FAREJO");
              await sendWhatsApp(pref.phone, msg);
            }
          } catch {}
        })();
        return { id: insertId };
      }),
    updateStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.enum(["agendada", "confirmada", "cancelada", "realizada"]) }))
      .mutation(async ({ ctx, input }) => {
        const meeting = await getMeetingById(input.id);
        if (!meeting) throw new TRPCError({ code: "NOT_FOUND" });
        await assertTenantAccess(ctx.user.id, ctx.user.role, meeting.tenantId);
        return updateMeetingStatus(input.id, input.status);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const meeting = await getMeetingById(input.id);
        if (!meeting) throw new TRPCError({ code: "NOT_FOUND" });
        await assertTenantAccess(ctx.user.id, ctx.user.role, meeting.tenantId);
        if (meeting.createdBy !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas o criador pode excluir a reunião." });
        }
        return deleteMeeting(input.id);
      }),
    respond: protectedProcedure
      .input(z.object({ meetingId: z.number(), rsvp: z.enum(["confirmado", "declinado"]) }))
      .mutation(async ({ ctx, input }) => {
        return respondMeetingInvite(input.meetingId, ctx.user.id, input.rsvp);
      }),
  }),
  // ── WHATSAPP ─────────────────────────────────────────────────────────────────────────────
  whatsapp: router({
    getPrefs: protectedProcedure
      .input(z.object({ tenantId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertTenantAccess(ctx.user.id, ctx.user.role, input.tenantId);
        return getWhatsappPrefs(ctx.user.id, input.tenantId);
      }),

    savePrefs: protectedProcedure
      .input(z.object({
        tenantId: z.number(),
        phone: z.string().optional(),
        enabled: z.boolean(),
        notifNovaTarefa: z.boolean(),
        notifReuniao: z.boolean(),
        notifResumoDiario: z.boolean(),
        resumoHorario: z.string().regex(/^\d{2}:\d{2}$/).default("08:00"),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertTenantAccess(ctx.user.id, ctx.user.role, input.tenantId);
        return upsertWhatsappPrefs({
          userId: ctx.user.id,
          tenantId: input.tenantId,
          phone: input.phone ?? null,
          enabled: input.enabled ? 1 : 0,
          notifNovaTarefa: input.notifNovaTarefa ? 1 : 0,
          notifReuniao: input.notifReuniao ? 1 : 0,
          notifResumoDiario: input.notifResumoDiario ? 1 : 0,
          resumoHorario: input.resumoHorario,
        });
      }),

    testSend: protectedProcedure
      .input(z.object({ tenantId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await assertTenantAccess(ctx.user.id, ctx.user.role, input.tenantId);
        const prefs = await getWhatsappPrefs(ctx.user.id, input.tenantId);
        if (!prefs?.phone) throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhum telefone configurado." });
        const result = await sendWhatsApp(prefs.phone, `✅ *Teste FAREJO*\n\nSuas notificações WhatsApp estão configuradas corretamente!\n\n_Você receberá alertas de tarefas, reuniões e resumos diários neste número._`
        );
        if (!result.success) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error ?? "Falha no envio." });
        return { success: true };
      }),
  }),
});
// ─── File Upload REST endpoint (outside tRPC) ─────────────────────────────────
// Registered in server/_core/index.ts via the express app
export async function registerFileUploadRoute(app: import("express").Express) {
  const multer = (await import("multer")).default;
  const { storagePut } = await import("./storage");
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
  app.post("/api/upload", upload.single("file"), async (req: any, res: any) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file" });
      const ext = req.file.originalname.split(".").pop() ?? "bin";
      const key = `testimonials/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { url } = await storagePut(key, req.file.buffer, req.file.mimetype);
      res.json({ url });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}

export type AppRouter = typeof appRouter;
