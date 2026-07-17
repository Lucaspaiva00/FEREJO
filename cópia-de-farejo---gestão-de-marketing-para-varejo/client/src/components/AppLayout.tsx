import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/contexts/AppContext";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRealtime } from "@/contexts/RealtimeContext";
import { useDailyNotifications } from "@/hooks/useDailyNotifications";
import SupportButton from "@/components/SupportButton";

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconDashboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
  </svg>
);
const IconChecklist = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
  </svg>
);
const IconCampaigns = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
);
const IconFunnel = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);
const IconStrategies = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IconCommercial = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
);
const IconAgenda = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
    <circle cx="12" cy="16" r="2"/>
  </svg>
);
const IconTrainings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);
const IconSettings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
);
const IconAdmin = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);
const IconSun = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const IconMoon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
);
const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconBell = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
);
const IconMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconRocket = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/>
    <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>
);
const IconPlanos = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="7" height="18" rx="1.5"/>
    <rect x="9" y="8" width="7" height="13" rx="1.5"/>
    <rect x="16" y="12" width="6" height="9" rx="1.5"/>
  </svg>
);

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "dashboard",  label: "Visão Geral",  Icon: IconDashboard },
  { id: "checklist",  label: "Tarefas",      Icon: IconChecklist },
  { id: "campaigns",  label: "Campanhas",    Icon: IconCampaigns },
  { id: "funnel",     label: "Indicadores",  Icon: IconFunnel },
  { id: "strategies", label: "Estratégias",  Icon: IconStrategies },
  { id: "commercial", label: "Comercial",    Icon: IconCommercial },
  { id: "agenda",     label: "Agenda",       Icon: IconAgenda },
  { id: "trainings",  label: "Treinamentos", Icon: IconTrainings },
  { id: "planos",     label: "Planos",       Icon: IconPlanos },
  { id: "settings",   label: "Configurações",Icon: IconSettings },
];

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  alert:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  task:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  campaign: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  info:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
};

// ─── Notification Panel ───────────────────────────────────────────────────────
function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { notifications, markAllRead, unreadCount } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return "agora";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min atrás`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`;
    return new Date(ts).toLocaleDateString("pt-BR");
  };
  return (
    <div ref={ref} className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden" style={{ maxHeight: "420px" }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <span className="font-bold text-sm uppercase tracking-wider">Notificações</span>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Marcar todas como lidas</button>
        )}
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: "340px" }}>
        <div className="flex gap-3 px-4 py-3 border-b border-border/50 bg-[#C9A227]/8">
          <div className="mt-0.5 flex-shrink-0 text-[#C9A227]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight text-foreground flex items-center gap-1.5">
              Dica do dia
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A227] bg-[#C9A227]/15 px-1.5 py-0.5 rounded">Fixado</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">Consistência é a chave do marketing de varejo. Revise suas estratégias semanalmente e mantenha o checklist atualizado.</p>
          </div>
        </div>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
            <IconBell />
            <p className="text-sm">Nenhuma notificação</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className={`flex gap-3 px-4 py-3 border-b border-border/50 last:border-0 transition-colors ${!n.read ? "bg-[#C9A227]/5" : "hover:bg-muted/20"}`}>
              <div className={`mt-0.5 flex-shrink-0 ${n.type === "alert" ? "text-red-500" : n.type === "campaign" ? "text-[#C9A227]" : n.type === "task" ? "text-blue-500" : "text-muted-foreground"}`}>
                {NOTIF_ICONS[n.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold leading-tight ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.body}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">{formatTime(n.at)}</p>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-[#C9A227] flex-shrink-0 mt-1.5" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Banner ───────────────────────────────────────────────────────────────────
export function PageBanner() {
  const { tenantTheme } = useApp();
  if (!tenantTheme.bannerUrl) return null;
  return (
    <div className="w-full overflow-hidden" style={{ maxHeight: "160px" }}>
      <img
        src={tenantTheme.bannerUrl}
        alt="Banner"
        className="w-full object-cover object-center"
        style={{ maxHeight: "160px" }}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      />
    </div>
  );
}

// ─── Nav Item ─────────────────────────────────────────────────────────────────
function NavItem({ id, label, Icon, isActive, accentColor, badge, onClick }: {
  id: string; label: string; Icon: () => React.ReactElement;
  isActive: boolean; accentColor: string; badge?: number; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 relative"
      style={isActive ? { backgroundColor: accentColor, color: "#000" } : { color: "rgba(255,255,255,0.65)" }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.07)";
          (e.currentTarget as HTMLButtonElement).style.color = "#fff";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
          (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.65)";
        }
      }}
    >
      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-black/25" />}
      <span className="flex-shrink-0"><Icon /></span>
      <span className="flex-1 text-left truncate">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none"
          style={isActive ? { backgroundColor: "rgba(0,0,0,0.2)", color: "#000" } : { backgroundColor: accentColor, color: "#000" }}>
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
interface AppLayoutProps { children: React.ReactNode; }

export default function AppLayout({ children }: AppLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem("farejo_sidebar_collapsed") === "1"; } catch { return false; }
  });
  const { user, activeTab, setActiveTab, activeTenantId, setActiveTenantId, tenantTheme, setTenantTheme, unreadCount } = useApp();
  useDailyNotifications(!!user);

  const { data: adminTenants } = trpc.tenants.list.useQuery(undefined, { enabled: user?.role === "admin" });
  const { data: settings } = trpc.settings.get.useQuery({ tenantId: activeTenantId! }, { enabled: !!activeTenantId });
  const { theme, toggleTheme } = useTheme();
  const { connected } = useRealtime();
  const [showNotifications, setShowNotifications] = useState(false);
  const mobileSidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (mobileSidebarRef.current && !mobileSidebarRef.current.contains(e.target as Node)) setMobileSidebarOpen(false);
    };
    if (mobileSidebarOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileSidebarOpen]);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { localStorage.clear(); window.location.href = "/"; },
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { refetchUser } = useApp();
  const updateAvatarMutation = trpc.profile.updateAvatar.useMutation({ onSuccess: () => { refetchUser(); } });

  const handleAvatarUpload = async (file: File) => {
    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const data = await res.json() as { url: string };
      updateAvatarMutation.mutate({ avatarUrl: data.url });
    } catch { setAvatarPreview(null); }
  };

  useEffect(() => {
    if (settings) {
      setTenantTheme({
        headerColor: settings.headerColor ?? "#0B0F14",
        accentColor: settings.accentColor ?? "#C9A227",
        bannerUrl: settings.bannerUrl ?? "/manus-storage/farejo-banner-default_d5ae2d1c.jpg",
        logoUrl: settings.logoUrl ?? "",
        profileName: settings.profileName ?? "",
      });
    }
  }, [settings, setTenantTheme]);

  const tabs = user?.role === "admin" ? [...TABS, { id: "admin", label: "Admin", Icon: IconAdmin }] : TABS;
  const initials = user?.name ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : user?.email?.[0]?.toUpperCase() ?? "U";
  const currentAvatarUrl = avatarPreview ?? (user as { avatarUrl?: string | null } | null)?.avatarUrl;
  const headerBg = tenantTheme.headerColor ?? "#0B0F14";
  const accentColor = tenantTheme.accentColor ?? "#C9A227";

  const toggleSidebar = () => {
    setSidebarCollapsed((v) => {
      const next = !v;
      try { localStorage.setItem("farejo_sidebar_collapsed", next ? "1" : "0"); } catch {}
      return next;
    });
  };

  // ── Sidebar inner content (reused in both desktop fixed + mobile overlay) ──
  const SidebarInner = ({ onNav, collapsed = false }: { onNav?: () => void; collapsed?: boolean }) => (
    <div className="flex flex-col h-full" style={{ backgroundColor: headerBg }}>
      {/* Gold accent stripe */}
      <div className="h-0.5 w-full flex-shrink-0" style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}60, transparent)` }} />

      {/* Logo + collapse button */}
      <div className={`${collapsed ? "px-2 pt-4 pb-3 flex justify-center" : "px-5 pt-5 pb-3"} flex-shrink-0 relative`}>
        {!collapsed && (
          <>
            {tenantTheme.logoUrl ? (
              <img src={tenantTheme.logoUrl} alt="Logo" className="h-10 w-auto select-none" style={{ maxWidth: "160px", objectFit: "contain" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <img
                src="/manus-storage/farejo-logo_3338acb7.png"
                alt="FAREJO"
                className="h-10 w-auto select-none"
                style={{ filter: `brightness(0) saturate(100%) invert(72%) sepia(50%) saturate(600%) hue-rotate(5deg) brightness(95%) contrast(90%)` }}
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.style.display = "none";
                  const span = document.createElement("span");
                  span.style.cssText = `color:${accentColor};font-weight:800;font-size:1.25rem;letter-spacing:0.18em;`;
                  span.textContent = "FAREJO";
                  img.parentNode?.insertBefore(span, img);
                }}
              />
            )}
            <p className="text-[9px] text-white/25 uppercase tracking-[0.28em] mt-1.5 font-medium select-none">
              Inteligência · Velocidade · Resultado
            </p>
          </>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentColor}20` }}>
            <span className="text-xs font-black" style={{ color: accentColor }}>F</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto ${collapsed ? "px-1.5" : "px-3"} pb-2 space-y-0.5`}>
        {tabs.map(({ id, label, Icon }) => (
          collapsed ? (
            <button
              key={id}
              title={label}
              onClick={() => { setActiveTab(id); onNav?.(); }}
              className="w-full flex items-center justify-center p-2.5 rounded-xl transition-all duration-150 relative"
              style={activeTab === id
                ? { backgroundColor: accentColor, color: "#000" }
                : { color: "rgba(255,255,255,0.55)" }}
              onMouseEnter={(e) => { if (activeTab !== id) { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; } }}
              onMouseLeave={(e) => { if (activeTab !== id) { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.55)"; } }}
            >
              <Icon />
              {id === "checklist" && unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full text-[8px] font-bold flex items-center justify-center" style={{ backgroundColor: accentColor, color: "#000" }}>{unreadCount > 9 ? "9+" : unreadCount}</span>
              )}
            </button>
          ) : (
            <NavItem
              key={id} id={id} label={label} Icon={Icon}
              isActive={activeTab === id} accentColor={accentColor}
              badge={id === "checklist" ? unreadCount : undefined}
              onClick={() => { setActiveTab(id); onNav?.(); }}
            />
          )
        ))}
      </nav>

      {/* Boost CTA — only when expanded */}
      {!collapsed && (
        <div className="mx-3 mb-3 rounded-xl p-4 flex-shrink-0" style={{ background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}08)`, border: `1px solid ${accentColor}28` }}>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ color: accentColor }}><IconRocket /></span>
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>FAREJO BOOST</span>
          </div>
          <p className="text-[11px] text-white/45 leading-snug mb-3">Seu marketing no automático e com resultados.</p>
          <button
            onClick={() => { setActiveTab("strategies"); onNav?.(); }}
            className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-95 hover:opacity-90"
            style={{ backgroundColor: accentColor, color: "#000" }}
          >
            Conhecer agora
          </button>
        </div>
      )}

      {/* User — only when expanded */}
      {user && !collapsed && (
        <div className="px-4 py-3 border-t flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0"
              style={{ backgroundColor: currentAvatarUrl ? undefined : accentColor, color: "#000" }}>
              {currentAvatarUrl ? <img src={currentAvatarUrl} alt="" className="w-full h-full object-cover" /> : initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white/80 truncate">{user.name ?? user.email ?? ""}</p>
              <p className="text-[10px] font-medium" style={{ color: accentColor }}>
                {user.role === "admin" ? "Administrador" : user.role === "marketer" ? "Marketer" : "Cliente"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* ── Desktop Sidebar (fixed) ─────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col flex-shrink-0 fixed top-0 left-0 bottom-0 z-40 shadow-[4px_0_24px_rgba(0,0,0,0.4)] overflow-hidden"
        style={{ width: sidebarCollapsed ? "56px" : "224px", transition: "width 0.28s cubic-bezier(0.23,1,0.32,1)" }}
      >
        {/* Collapse toggle button */}
        <button
          onClick={toggleSidebar}
          title={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
          className="absolute -right-3 top-16 z-50 w-6 h-6 rounded-full border flex items-center justify-center shadow-lg transition-transform duration-200 hover:scale-110"
          style={{ backgroundColor: headerBg, borderColor: `${accentColor}50`, color: accentColor }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: sidebarCollapsed ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.28s" }}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <SidebarInner collapsed={sidebarCollapsed} />
      </aside>

      {/* ── Mobile Sidebar Overlay ──────────────────────────────────────────── */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-[60] flex lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          <div ref={mobileSidebarRef} className="relative z-10 flex flex-col w-64 h-full shadow-2xl">
            <button onClick={() => setMobileSidebarOpen(false)} className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
              <IconClose />
            </button>
            <SidebarInner onNav={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Main area ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-[280ms]" style={{ marginLeft: typeof window !== "undefined" && window.innerWidth >= 1024 ? (sidebarCollapsed ? "56px" : "224px") : undefined }}>
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex-shrink-0 shadow-md" style={{ backgroundColor: headerBg }}>
          {/* Shimmer stripe */}
          <div className="h-0.5 w-full relative overflow-hidden" style={{ backgroundColor: accentColor }}>
            <div className="absolute inset-y-0 w-1/3" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)", animation: "shimmerSlide 3s linear infinite" }} />
          </div>

          <div className="flex items-center gap-3 px-4 py-2.5">
            {/* Mobile hamburger */}
            <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0">
              <IconMenu />
            </button>

            {/* Mobile logo */}
            <div className="lg:hidden flex-shrink-0">
              <img src="/manus-storage/farejo-logo_3338acb7.png" alt="FAREJO" className="h-8 w-auto"
                style={{ filter: `brightness(0) saturate(100%) invert(72%) sepia(50%) saturate(600%) hue-rotate(5deg) brightness(95%) contrast(90%)` }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            </div>

            {/* Separator */}
            <div className="hidden lg:block h-5 w-px bg-white/10 flex-shrink-0" />

            {/* Client selector pills */}
            {user?.role === "admin" && Array.isArray(adminTenants) && adminTenants.length > 0 && (
              <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                <span className="text-white/30 text-xs uppercase tracking-widest flex-shrink-0 hidden sm:block">Cliente:</span>
                {(adminTenants as Array<{ id: number; name: string }>).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTenantId(t.id)}
                    className="px-3 py-1 rounded-full text-xs font-bold border transition-all duration-150 flex-shrink-0 whitespace-nowrap"
                    style={activeTenantId === t.id
                      ? { backgroundColor: accentColor, color: "#000", borderColor: accentColor }
                      : { borderColor: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.55)", backgroundColor: "transparent" }}
                  >
                    {t.name.length > 4 ? t.name.slice(0, 2).toUpperCase() : t.name.toUpperCase()}
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1" />

            {/* Right cluster */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* LIVE pill */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
                style={{ borderColor: connected ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)", backgroundColor: connected ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)" }}>
                <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-400" : "bg-red-400"}`}
                  style={connected ? { boxShadow: "0 0 5px #4ade80", animation: "pulse 2s infinite" } : {}} />
                <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: connected ? "#4ade80" : "#f87171" }}>LIVE</span>
              </div>

              {/* Bell */}
              <div className="relative">
                <button onClick={() => setShowNotifications((v) => !v)} className="relative p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                  <IconBell />
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 border-2 flex items-center justify-center" style={{ borderColor: headerBg }}>
                    {unreadCount > 0 && <span className="text-white text-[8px] font-bold leading-none">{unreadCount > 9 ? "9+" : unreadCount}</span>}
                  </span>
                </button>
                {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
              </div>

              {/* Avatar */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center hover:opacity-90 transition-all overflow-hidden ring-2 ring-transparent hover:ring-white/20"
                      style={{ backgroundColor: currentAvatarUrl ? undefined : accentColor, color: "#000" }}>
                      {currentAvatarUrl ? <img src={currentAvatarUrl} alt={user?.name ?? ""} className="w-full h-full object-cover" /> : initials}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <div className="px-3 py-2.5">
                      <p className="text-sm font-semibold truncate">{user.name ?? "Usuário"}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email ?? ""}</p>
                      <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-semibold ${user.role === "admin" ? "bg-[#C9A227]/20 text-[#C9A227]" : user.role === "marketer" ? "bg-blue-500/20 text-blue-400" : "bg-gray-500/20 text-gray-400"}`}>
                        {user.role === "admin" ? "Admin" : user.role === "marketer" ? "Marketer" : "Cliente"}
                      </span>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => avatarInputRef.current?.click()}>Alterar foto de perfil</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab("settings")}>Configurações</DropdownMenuItem>
                    <DropdownMenuItem onClick={toggleTheme} className="flex items-center gap-2">
                      {theme === "dark" ? <IconSun /> : <IconMoon />}
                      <span>{theme === "dark" ? "Modo Claro" : "Modo Escuro"}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => logoutMutation.mutate()} className="text-destructive focus:text-destructive">
                      <IconLogout /><span className="ml-2">Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button size="sm" variant="outline" className="border-[#C9A227] text-[#C9A227] hover:bg-[#C9A227] hover:text-black text-xs" asChild>
                  <a href={getLoginUrl()}>Entrar</a>
                </Button>
              )}
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); }} />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <PageBanner />
          {children}
        </main>
      </div>

      <SupportButton />
    </div>
  );
}
