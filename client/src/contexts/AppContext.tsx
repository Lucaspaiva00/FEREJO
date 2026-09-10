import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";

export type Role = "admin" | "marketer" | "client";
export type FontSize = "medium" | "large" | "xlarge";

export interface AppTenant {
  id: number;
  name: string;
  createdAt: Date;
}

export interface AppUser {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  role: Role;
  tenants: AppTenant[];
  avatarUrl?: string | null;
}

export interface TenantTheme {
  headerColor: string;
  accentColor: string;
  bannerUrl: string;
  logoUrl: string;
  profileName: string;
}

const DEFAULT_THEME: TenantTheme = {
  headerColor: "#0B0F14",
  accentColor: "#C9A227",
  bannerUrl: "/manus-storage/farejo-banner-default_d5ae2d1c.jpg",
  logoUrl: "",
  profileName: "",
};

interface AppContextValue {
  user: AppUser | null;
  loading: boolean;
  activeTenantId: number | null;
  setActiveTenantId: (id: number) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  refetchUser: () => void;
  tenantTheme: TenantTheme;
  setTenantTheme: (theme: Partial<TenantTheme>) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  // Notifications
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, "id" | "at" | "read">) => void;
  markAllRead: () => void;
  unreadCount: number;
}

export interface AppNotification {
  id: string;
  type: "alert" | "task" | "campaign" | "info";
  title: string;
  body: string;
  at: number; // timestamp ms
  read: boolean;
}

const AppContext = createContext<AppContextValue>({
  user: null,
  loading: true,
  activeTenantId: null,
  setActiveTenantId: () => {},
  activeTab: "dashboard",
  setActiveTab: () => {},
  refetchUser: () => {},
  tenantTheme: DEFAULT_THEME,
  setTenantTheme: () => {},
  fontSize: "medium",
  setFontSize: () => {},
  notifications: [],
  addNotification: () => {},
  markAllRead: () => {},
  unreadCount: 0,
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { data: userData, isLoading, refetch } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const [activeTenantId, setActiveTenantIdState] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [tenantTheme, setTenantThemeState] = useState<TenantTheme>(DEFAULT_THEME);
  const [fontSize, setFontSizeState] = useState<FontSize>("medium");
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const user = userData as AppUser | null | undefined;

  // Load font size from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("farejo_fontSize") as FontSize | null;
    // Migrate legacy 'small' -> 'medium', 'medium' -> 'large', 'large' -> 'xlarge'
    const legacyMap: Record<string, FontSize> = { small: "medium", medium: "large", large: "xlarge" };
    const migrated: FontSize | null = saved ? (legacyMap[saved] ?? ((["medium", "large", "xlarge"].includes(saved) ? saved : null) as FontSize | null)) : null;
    if (migrated && ["medium", "large", "xlarge"].includes(migrated)) {
      setFontSizeState(migrated as FontSize);
    }
  }, []);

  // Apply font size to root element
  useEffect(() => {
    const root = document.documentElement;
    const sizes: Record<FontSize, string> = {
      medium: "14px",
      large: "17px",
      xlarge: "21px",
    };
    root.style.fontSize = sizes[fontSize];
  }, [fontSize]);

  // Apply tenant theme CSS variables to header
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--tenant-header-bg", tenantTheme.headerColor);
    root.style.setProperty("--tenant-accent", tenantTheme.accentColor);
  }, [tenantTheme]);

  // Restore tenant on login
  useEffect(() => {
    if (user && user.tenants && user.tenants.length > 0 && activeTenantId === null) {
      const saved = localStorage.getItem(`farejo_tenant_${user.id}`);
      const savedId = saved ? parseInt(saved) : null;
      const validId = savedId && user.tenants.find((t) => t.id === savedId) ? savedId : user.tenants[0].id;
      setActiveTenantIdState(validId);
    }
  }, [user, activeTenantId]);

  // Load notifications from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("farejo_notifications");
    if (saved) {
      try { setNotifications(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  const setActiveTenantId = useCallback((id: number) => {
    setActiveTenantIdState(id);
    if (user) localStorage.setItem(`farejo_tenant_${user.id}`, String(id));
  }, [user]);

  const setTenantTheme = useCallback((partial: Partial<TenantTheme>) => {
    setTenantThemeState((prev) => ({ ...prev, ...partial }));
  }, []);

  const setFontSize = useCallback((size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem("farejo_fontSize", size);
  }, []);

  const addNotification = useCallback((n: Omit<AppNotification, "id" | "at" | "read">) => {
    const notif: AppNotification = {
      ...n,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      at: Date.now(),
      read: false,
    };
    setNotifications((prev) => {
      const updated = [notif, ...prev].slice(0, 50); // keep last 50
      localStorage.setItem("farejo_notifications", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      localStorage.setItem("farejo_notifications", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const refetchUser = useCallback(() => { refetch(); }, [refetch]);

  return (
    <AppContext.Provider value={{
      user: user ?? null,
      loading: isLoading,
      activeTenantId,
      setActiveTenantId,
      activeTab,
      setActiveTab,
      refetchUser,
      tenantTheme,
      setTenantTheme,
      fontSize,
      setFontSize,
      notifications,
      addNotification,
      markAllRead,
      unreadCount,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
