import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext; clearedCookies: Array<{ name: string; options: Record<string, unknown> }> } {
  const clearedCookies: Array<{ name: string; options: Record<string, unknown> }> = [];
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@farejo.com",
    name: "Admin FAREJO",
    loginMethod: "oauth",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

function createMarketerContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "marketer-user",
    email: "marketer@farejo.com",
    name: "Marketer FAREJO",
    loginMethod: "oauth",
    role: "marketer",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
  return { ctx };
}

function createClientContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 3,
    openId: "client-user",
    email: "client@farejo.com",
    name: "Client FAREJO",
    loginMethod: "oauth",
    role: "client",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
  return { ctx };
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1 });
  });
});

describe("auth.me", () => {
  it("returns null for unauthenticated user", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("role-based access control", () => {
  it("admin can access tenant creation", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    // Should not throw FORBIDDEN
    await expect(
      caller.tenants.list()
    ).resolves.toBeDefined();
  });

  it("client cannot create tasks", async () => {
    const { ctx } = createClientContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.tasks.create({ tenantId: 1, name: "Test task" })
    ).rejects.toThrow();
  });

  it("marketer cannot access tenant they are not assigned to", async () => {
    const { ctx } = createMarketerContext();
    const caller = appRouter.createCaller(ctx);
    // Marketer without tenant assignment should get FORBIDDEN
    await expect(
      caller.tasks.list({ tenantId: 999 })
    ).rejects.toThrow("Sem acesso a este cliente.");
  });
});

describe("admin-only procedures", () => {
  it("non-admin cannot access users.list", async () => {
    const { ctx } = createMarketerContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.users.list()).rejects.toThrow("Acesso restrito a administradores.");
  });

  it("non-admin cannot create tenants", async () => {
    const { ctx } = createClientContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.tenants.create({ name: "Test" })).rejects.toThrow("Acesso restrito a administradores.");
  });
});
