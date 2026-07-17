import React, { useState, useEffect, useCallback } from "react";
import { useApp } from "@/contexts/AppContext";
import { useRealtime } from "@/contexts/RealtimeContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
);
const IconTrendUp = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);

interface Metric {
  id: number;
  section: string;
  label: string;
  valueFrom?: string | null;
  valueTo?: string | null;
  deltaText?: string | null;
  growthPct?: number | null;
  orderIdx?: number | null;
}

interface DashboardConfig {
  title: string;
  subtitle: string;
  period: string;
}

// Hook: relógio ao vivo com data e hora de Brasília
function useBrasiliaDateTime() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const weekday = now.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long" })
    .replace(/^(\w)/, (c) => c.toUpperCase());
  const datePart = now.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const hh = now.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", hour12: false }).padStart(2, "0");
  const mm = now.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", minute: "2-digit" }).padStart(2, "0");
  const ss = now.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", second: "2-digit" }).padStart(2, "0");
  return { weekday, datePart, hh, mm, ss };
}

// Separador piscante para o relógio premium
function BlinkColon() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setVisible(v => !v), 500);
    return () => clearInterval(id);
  }, []);
  return (
    <span
      className="font-mono text-4xl font-black tabular-nums leading-none mx-0.5 transition-opacity duration-150"
      style={{ color: "#C9A227", opacity: visible ? 1 : 0.15, textShadow: "0 0 16px rgba(201,162,39,0.5)" }}
    >:</span>
  );
}

export default function Dashboard() {
  const { user, activeTenantId, setActiveTenantId } = useApp();
  const { subscribe, broadcast } = useRealtime();
  const isAdmin = user?.role === "admin";
  const { weekday, datePart, hh, mm, ss } = useBrasiliaDateTime();
  const [editMode, setEditMode] = useState(false);
  const [config, setConfig] = useState<DashboardConfig>({ title: "Visão Geral de Marketing", subtitle: "Indicadores do seu negócio em tempo real", period: "" });
  const [editConfig, setEditConfig] = useState<DashboardConfig>(config);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showMetricModal, setShowMetricModal] = useState(false);
  const [editingMetric, setEditingMetric] = useState<Metric | null>(null);
  const [metricForm, setMetricForm] = useState({ section: "", label: "", valueFrom: "", valueTo: "", deltaText: "", growthPct: "" });
  // External metrics connection
  const [connectModal, setConnectModal] = useState<{ type: "instagram" | "google" | "app" | "facebook" | "linkedin" | "ads" | "whatsapp" } | null>(null);
  const [connectUrl, setConnectUrl] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [externalLinks, setExternalLinks] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem("farejo_ext_links") ?? "{}"); } catch { return {}; }
  });
  // Social profile data fetched from public pages
  type SocialProfile = {
    platform: string; handle: string | null; name: string | null; bio: string | null;
    avatarUrl: string | null; followers: number | null; rating: number | null;
    reviewCount: number | null; extraLabel: string | null; extraValue: string | null;
    fetchedAt: number; note: string | null;
  };
  const [socialProfiles, setSocialProfiles] = useState<Record<string, SocialProfile>>(() => {
    try { return JSON.parse(localStorage.getItem("farejo_social_profiles") ?? "{}"); } catch { return {}; }
  });

  const fetchProfileMutation = trpc.social.fetchProfile.useMutation({
    onSuccess: (data, vars) => {
      const updated = { ...socialProfiles, [vars.platform]: data as SocialProfile };
      setSocialProfiles(updated);
      localStorage.setItem("farejo_social_profiles", JSON.stringify(updated));
    },
  });

  const saveExternalLink = useCallback(async (type: string, url: string) => {
    const updated = { ...externalLinks, [type]: url };
    setExternalLinks(updated);
    localStorage.setItem("farejo_ext_links", JSON.stringify(updated));
    // Fetch public profile data
    if (["instagram", "facebook", "linkedin", "google", "app"].includes(type)) {
      setIsFetching(true);
      try {
        await fetchProfileMutation.mutateAsync({
          platform: type as "instagram" | "facebook" | "linkedin" | "google" | "app" | "ads" | "whatsapp",
          url,
        });
        toast.success("✅ Conectado! Dados do perfil público carregados.");
      } catch {
        toast.success("Link salvo! Dados públicos não disponíveis para esta rede.");
      } finally {
        setIsFetching(false);
      }
    } else {
      toast.success("Link salvo com sucesso!");
    }
    setConnectModal(null);
    setConnectUrl("");
  }, [externalLinks, fetchProfileMutation]);

  const { data: rawMetrics, refetch } = trpc.metrics.list.useQuery(
    { tenantId: activeTenantId! },
    { enabled: !!activeTenantId }
  );

  const saveConfigMutation = trpc.metrics.saveConfig.useMutation({
    onSuccess: () => { toast.success("Configuração salva"); refetch(); broadcast({ type: "metrics", tenantId: activeTenantId!, action: "updated" }); },
    onError: () => toast.error("Erro ao salvar"),
  });
  const createMetricMutation = trpc.metrics.create.useMutation({
    onSuccess: () => { toast.success("Métrica adicionada"); refetch(); setShowMetricModal(false); broadcast({ type: "metrics", tenantId: activeTenantId!, action: "created" }); },
    onError: () => toast.error("Erro ao criar métrica"),
  });
  const updateMetricMutation = trpc.metrics.update.useMutation({
    onSuccess: () => { toast.success("Métrica atualizada"); refetch(); setShowMetricModal(false); broadcast({ type: "metrics", tenantId: activeTenantId!, action: "updated" }); },
    onError: () => toast.error("Erro ao atualizar"),
  });
  const deleteMetricMutation = trpc.metrics.delete.useMutation({
    onSuccess: () => { toast.success("Métrica removida"); refetch(); broadcast({ type: "metrics", tenantId: activeTenantId!, action: "deleted" }); },
    onError: () => toast.error("Erro ao remover"),
  });
  const reorderMetric = useCallback((metric: Metric, direction: "up" | "down", allInSection: Metric[]) => {
    const idx = allInSection.findIndex((m) => m.id === metric.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= allInSection.length) return;
    const swap = allInSection[swapIdx];
    updateMetricMutation.mutate({ id: metric.id, tenantId: activeTenantId!, orderIdx: swapIdx });
    updateMetricMutation.mutate({ id: swap.id, tenantId: activeTenantId!, orderIdx: idx });
  }, [activeTenantId, updateMetricMutation]);

  // Parse config from _config row
  useEffect(() => {
    if (!rawMetrics) return;
    const configRow = rawMetrics.find((m) => m.section === "_config");
    if (configRow) {
      try {
        const parsed = JSON.parse(configRow.label);
        setConfig(parsed);
        setEditConfig(parsed);
      } catch {}
    }
  }, [rawMetrics]);

  // Realtime subscription
  useEffect(() => {
    if (!activeTenantId) return;
    return subscribe((event) => {
      if (event.type === "metrics" && event.tenantId === activeTenantId) refetch();
    });
  }, [activeTenantId, subscribe, refetch]);

  const metrics = (rawMetrics ?? []).filter((m) => m.section !== "_config");

  // Group metrics by section
  const sections = metrics.reduce<Record<string, Metric[]>>((acc, m) => {
    if (!acc[m.section]) acc[m.section] = [];
    acc[m.section].push(m);
    return acc;
  }, {});

  const openEditMetric = (m: Metric) => {
    setEditingMetric(m);
    setMetricForm({ section: m.section, label: m.label, valueFrom: m.valueFrom ?? "", valueTo: m.valueTo ?? "", deltaText: m.deltaText ?? "", growthPct: m.growthPct != null ? String(m.growthPct) : "" });
    setShowMetricModal(true);
  };

  const openNewMetric = (section = "") => {
    setEditingMetric(null);
    setMetricForm({ section, label: "", valueFrom: "", valueTo: "", deltaText: "", growthPct: "" });
    setShowMetricModal(true);
  };

  const handleSaveMetric = () => {
    const payload = {
      tenantId: activeTenantId!,
      section: metricForm.section,
      label: metricForm.label,
      valueFrom: metricForm.valueFrom || undefined,
      valueTo: metricForm.valueTo || undefined,
      deltaText: metricForm.deltaText || undefined,
      growthPct: metricForm.growthPct ? parseFloat(metricForm.growthPct) : undefined,
    };
    if (editingMetric) {
      updateMetricMutation.mutate({ id: editingMetric.id, ...payload });
    } else {
      createMetricMutation.mutate(payload);
    }
  };

  const { data: allTenants } = trpc.tenants.list.useQuery(undefined, { enabled: user?.role === "admin" && !activeTenantId });

  if (!activeTenantId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="text-4xl font-bold tracking-[0.3em] text-[#C9A227] logo-pulse mb-6">FAREJO</div>
        <p className="text-muted-foreground text-sm mb-6 text-center">
          {user?.role === "admin" ? "Selecione um cliente para visualizar o dashboard." : "Nenhum cliente atribuído ao seu perfil."}
        </p>
        {user?.role === "admin" && Array.isArray(allTenants) && allTenants.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {(allTenants as Array<{ id: number; name: string }>).map((t) => (
              <button key={t.id} onClick={() => setActiveTenantId(t.id)} className="px-4 py-2 rounded-full border border-[#C9A227]/50 text-[#C9A227] hover:bg-[#C9A227] hover:text-black transition-colors text-sm font-semibold">
                {t.name}
              </button>
            ))}
          </div>
        )}
        {user?.role === "admin" && Array.isArray(allTenants) && allTenants.length === 0 && (
          <p className="text-sm text-muted-foreground">Crie um cliente no painel Admin para começar.</p>
        )}
      </div>
    );
  }

  // Greeting
  const greetingHour = Number(new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "numeric", hour12: false }));
  const greetingWord = greetingHour < 12 ? "Bom dia" : greetingHour < 18 ? "Boa tarde" : "Boa noite";
  const firstName = user?.name?.split(" ")[0] ?? "";

  return (
    <div className="min-h-full bg-background">
      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0B0F14] via-[#111820] to-[#0B0F14] border-b border-[#C9A227]/20">
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "linear-gradient(rgba(201,162,39,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(201,162,39,0.4) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative px-5 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[#C9A227] text-xs font-bold tracking-[0.25em] uppercase mb-1">INTELIGÊNCIA · VELOCIDADE · RESULTADO</p>
            <h1 className="text-xl font-bold text-white">{greetingWord}{firstName ? `, ${firstName}` : ""}!</h1>
            <div className="flex items-center gap-2 mt-1">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/40"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span className="text-sm text-white/50 capitalize">{weekday}, {datePart}</span>
              <span className="w-px h-3 bg-white/20" />
              <span className="font-mono text-sm font-bold tabular-nums" style={{ color: "#C9A227" }}>{hh}<BlinkColon />{mm}</span>
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="outline" className="border-[#C9A227]/40 text-[#C9A227] hover:bg-[#C9A227] hover:text-black text-xs gap-1.5 bg-transparent" onClick={() => { setEditConfig(config); setShowConfigModal(true); }}>
                <IconEdit /> Personalizar
              </Button>
              <Button size="sm" className="bg-[#C9A227] text-black hover:bg-[#E8C84A] text-xs gap-1.5" onClick={() => setEditMode(!editMode)}>
                {editMode ? "Concluir" : "Adicionar Métrica"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── DUMMY SECTION PLACEHOLDER for old hero code ── */}
      <div className="hidden"><div><div>
          <div className="flex items-center justify-between gap-4">
            <div>
              {/* Badge shimmer */}
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="badge-shimmer text-xs font-bold tracking-widest uppercase">
                  JBC Brasil · Método Burst
                </span>
              </div>
              {/* Relógio Premium — data e hora de Brasília */}
              <div className="inline-flex flex-col gap-0.5 mb-4">
                {/* Linha superior: dia da semana + data */}
                <div className="flex items-center gap-2">
                  <span className="text-[#C9A227] text-[10px] font-bold tracking-[0.25em] uppercase opacity-90">{weekday}</span>
                  <span className="w-px h-3 bg-[#C9A227]/40" />
                  <span className="text-white/60 text-[10px] tracking-widest uppercase">{datePart}</span>
                </div>
                {/* Linha inferior: relógio digital com separadores piscantes */}
                <div className="flex items-end gap-0 select-none">
                  <span className="font-mono text-4xl font-black text-white tabular-nums leading-none tracking-tight" style={{textShadow:"0 0 24px rgba(201,162,39,0.35)"}}>{hh}</span>
                  <BlinkColon />
                  <span className="font-mono text-4xl font-black text-white tabular-nums leading-none tracking-tight" style={{textShadow:"0 0 24px rgba(201,162,39,0.35)"}}>{mm}</span>
                  <BlinkColon />
                  <span className="font-mono text-2xl font-bold text-[#C9A227]/80 tabular-nums leading-none tracking-tight self-end mb-0.5">{ss}</span>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white">{config.title}</h1>
              <p className="text-white/50 text-sm mt-0.5">{config.subtitle}</p>
              {config.period && (
                <div className="inline-block border border-[#C9A227]/40 text-[#C9A227] text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full mt-2">
                  {config.period}
                </div>
              )}
            </div>
            {/* Admin controls */}
            {isAdmin && (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-[#C9A227]/50 text-[#C9A227] hover:bg-[#C9A227] hover:text-black text-xs"
                  onClick={() => { setEditConfig(config); setShowConfigModal(true); }}
                >
                  <IconEdit /> <span className="ml-1">Personalizar</span>
                </Button>
                <Button
                  size="sm"
                  className="bg-[#C9A227] text-black hover:bg-[#E8C84A] text-xs"
                  onClick={() => setEditMode(!editMode)}
                >
                  {editMode ? "Concluír" : "Adicionar Métrica"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Footer hero */}
        <div className="border-t border-[#C9A227]/20 py-2 text-center">
          <p className="text-[#C9A227] text-xs font-bold tracking-[0.2em] uppercase">
            INTELIGÊNCIA · VELOCIDADE · RESULTADO
          </p>
        </div>
      </div>

      </div>{/* end hidden */}

      {/* ── Main Content ── */}
      <div className="px-5 py-5 space-y-6">

        {/* ── KPI Row ── */}
        {metrics.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">INDICADORES PRINCIPAIS</p>
              <button className="text-xs text-[#C9A227] hover:underline font-semibold flex items-center gap-1">
                Ver todos os indicadores
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
              {metrics.slice(0, 5).map((metric) => (
                <div key={metric.id} className="kpi-card flex-shrink-0 min-w-[180px] bg-card border border-border rounded-xl p-4 cursor-default">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-[#C9A227]/15 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A227" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">{metric.label}</p>
                  </div>
                  <p className="text-xl font-extrabold text-foreground">{metric.valueTo ?? metric.valueFrom ?? "—"}</p>
                  {metric.deltaText && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                        {metric.deltaText}
                      </span>
                      <span className="text-[10px] text-muted-foreground">vs mês anterior</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Middle Row: Tasks + Activities + Channel Performance ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Tarefas Pendentes */}
          <DashboardTasksWidget tenantId={activeTenantId!} />

          {/* Atividades Recentes */}
          <DashboardActivitiesWidget tenantId={activeTenantId!} />

          {/* Desempenho por Canal */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">DESEMPENHO POR CANAL</p>
              <button className="text-xs text-[#C9A227] hover:underline font-semibold">Ver relatório</button>
            </div>
            <div className="space-y-3">
              {[
                { name: "Instagram", color: "#E1306C", pct: socialProfiles.instagram?.followers ? Math.min(99, Math.round((socialProfiles.instagram.followers / 20000) * 100)) : 72 },
                { name: "Facebook", color: "#1877F2", pct: socialProfiles.facebook?.followers ? Math.min(99, Math.round((socialProfiles.facebook.followers / 15000) * 100)) : 58 },
                { name: "Google Ads", color: "#FBBC05", pct: 46 },
                { name: "E-mail Mkt", color: "#C9A227", pct: 31 },
                { name: "WhatsApp", color: "#25D366", pct: 27 },
              ].map((ch) => (
                <div key={ch.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-foreground">{ch.name}</span>
                    <span className="text-sm font-bold" style={{ color: ch.color }}>{ch.pct}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${ch.pct}%`, background: `linear-gradient(90deg, ${ch.color}cc, ${ch.color})` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Acesso Rápido ── */}
        <DashboardQuickAccess />

        {/* ── Indicadores Digitais (redes sociais) ── */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">INDICADORES DIGITAIS</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Instagram */}
            <div className="rounded-2xl p-5 border border-border bg-gradient-to-br from-[#833ab4]/10 via-[#fd1d1d]/10 to-[#fcb045]/10 relative overflow-hidden">
              <div className="absolute top-3 right-3 opacity-20">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" className="text-[#fd1d1d]">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Instagram</p>
              {socialProfiles.instagram?.name && (
                <p className="text-xs text-muted-foreground truncate mb-1">{socialProfiles.instagram.name}</p>
              )}
              <p className="text-3xl font-extrabold text-foreground">
                {socialProfiles.instagram?.followers ? socialProfiles.instagram.followers.toLocaleString("pt-BR") : "12.847"}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">Seguidores</p>
              {socialProfiles.instagram?.bio && (
                <p className="text-[10px] text-muted-foreground/70 mt-1 line-clamp-2">{socialProfiles.instagram.bio}</p>
              )}
              <div className="flex items-center gap-1 mt-3">
                <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                  +4,2%
                </span>
                <span className="text-xs text-muted-foreground">vs. mês anterior</span>
              </div>
              <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Engajamento</p>
                  <p className="font-bold text-foreground">3,8%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Alcance/post</p>
                  <p className="font-bold text-foreground">2.340</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground/50">
                  {externalLinks.instagram
                    ? <span className="text-emerald-500 font-semibold">✅ Conectado{socialProfiles.instagram?.note ? " (parcial)" : ""}</span>
                    : "Dados simulados"}
                </p>
                <button onClick={() => { setConnectModal({ type: "instagram" }); setConnectUrl(externalLinks.instagram ?? ""); }} className="text-[10px] font-semibold text-[#C9A227] hover:underline">
                  {externalLinks.instagram ? "Reconectar" : "Conectar"}
                </button>
              </div>
              {socialProfiles.instagram?.note && externalLinks.instagram && (
                <p className="text-[9px] text-amber-500/70 mt-1">{socialProfiles.instagram.note}</p>
              )}
            </div>

            {/* Facebook */}
            <div className="rounded-2xl p-5 border border-border bg-gradient-to-br from-[#1877F2]/10 via-[#1877F2]/5 to-transparent relative overflow-hidden">
              <div className="absolute top-3 right-3 opacity-20">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" className="text-[#1877F2]">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Facebook</p>
              {socialProfiles.facebook?.name && (
                <p className="text-xs text-muted-foreground truncate mb-1">{socialProfiles.facebook.name}</p>
              )}
              <p className="text-3xl font-extrabold text-foreground">
                {socialProfiles.facebook?.followers ? socialProfiles.facebook.followers.toLocaleString("pt-BR") : "8.432"}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">Seguidores</p>
              <div className="flex items-center gap-1 mt-3">
                <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                  +2,1%
                </span>
                <span className="text-xs text-muted-foreground">vs. mês anterior</span>
              </div>
              <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Curtidas/post</p>
                  <p className="font-bold text-foreground">124</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Alcance/semana</p>
                  <p className="font-bold text-foreground">5.280</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground/50">
                  {externalLinks.facebook
                    ? <span className="text-emerald-500 font-semibold">✅ Conectado{socialProfiles.facebook?.note ? " (parcial)" : ""}</span>
                    : "Dados simulados"}
                </p>
                <button onClick={() => { setConnectModal({ type: "facebook" }); setConnectUrl(externalLinks.facebook ?? ""); }} className="text-[10px] font-semibold text-[#C9A227] hover:underline">
                  {externalLinks.facebook ? "Reconectar" : "Conectar"}
                </button>
              </div>
              {socialProfiles.facebook?.note && externalLinks.facebook && (
                <p className="text-[9px] text-amber-500/70 mt-1">{socialProfiles.facebook.note}</p>
              )}
            </div>

            {/* LinkedIn */}
            <div className="rounded-2xl p-5 border border-border bg-gradient-to-br from-[#0A66C2]/10 via-[#0A66C2]/5 to-transparent relative overflow-hidden">
              <div className="absolute top-3 right-3 opacity-20">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" className="text-[#0A66C2]">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">LinkedIn</p>
              {socialProfiles.linkedin?.name && (
                <p className="text-xs text-muted-foreground truncate mb-1">{socialProfiles.linkedin.name}</p>
              )}
              <p className="text-3xl font-extrabold text-foreground">
                {socialProfiles.linkedin?.followers ? socialProfiles.linkedin.followers.toLocaleString("pt-BR") : "1.204"}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">Seguidores</p>
              <div className="flex items-center gap-1 mt-3">
                <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                  +5,8%
                </span>
                <span className="text-xs text-muted-foreground">vs. mês anterior</span>
              </div>
              <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Impressões</p>
                  <p className="font-bold text-foreground">3.410</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cliques</p>
                  <p className="font-bold text-foreground">87</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground/50">
                  {externalLinks.linkedin
                    ? <span className="text-emerald-500 font-semibold">✅ Conectado{socialProfiles.linkedin?.note ? " (parcial)" : ""}</span>
                    : "Dados simulados"}
                </p>
                <button onClick={() => { setConnectModal({ type: "linkedin" }); setConnectUrl(externalLinks.linkedin ?? ""); }} className="text-[10px] font-semibold text-[#C9A227] hover:underline">
                  {externalLinks.linkedin ? "Reconectar" : "Conectar"}
                </button>
              </div>
              {socialProfiles.linkedin?.note && externalLinks.linkedin && (
                <p className="text-[9px] text-amber-500/70 mt-1">{socialProfiles.linkedin.note}</p>
              )}
            </div>

            {/* Anúncios Ativos */}
            <div className="rounded-2xl p-5 border border-border bg-gradient-to-br from-[#FF6B35]/10 via-[#FF6B35]/5 to-transparent relative overflow-hidden">
              <div className="absolute top-3 right-3 opacity-20">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#FF6B35]">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Anúncios Ativos</p>
              <p className="text-3xl font-extrabold text-foreground">7</p>
              <p className="text-sm text-muted-foreground mt-0.5">Campanhas rodando</p>
              <div className="flex items-center gap-1 mt-3">
                <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                  +3
                </span>
                <span className="text-xs text-muted-foreground">vs. mês anterior</span>
              </div>
              <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Meta Ads</p>
                  <p className="font-bold text-foreground">5 ativos</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Google Ads</p>
                  <p className="font-bold text-foreground">2 ativos</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground/50">{externalLinks.ads ? "✅ Conectado" : "Dados simulados"}</p>
                <button onClick={() => { setConnectModal({ type: "ads" }); setConnectUrl(externalLinks.ads ?? ""); }} className="text-[10px] font-semibold text-[#C9A227] hover:underline">Conectar</button>
              </div>
            </div>

            {/* WhatsApp Comunidade */}
            <div className="rounded-2xl p-5 border border-border bg-gradient-to-br from-[#25D366]/10 via-[#25D366]/5 to-transparent relative overflow-hidden">
              <div className="absolute top-3 right-3 opacity-20">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" className="text-[#25D366]">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">WhatsApp Comunidade</p>
              <p className="text-3xl font-extrabold text-foreground">342</p>
              <p className="text-sm text-muted-foreground mt-0.5">Membros ativos</p>
              <div className="flex items-center gap-1 mt-3">
                <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                  +28
                </span>
                <span className="text-xs text-muted-foreground">vs. mês anterior</span>
              </div>
              <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Grupos</p>
                  <p className="font-bold text-foreground">3</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Msg/semana</p>
                  <p className="font-bold text-foreground">~180</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground/50">{externalLinks.whatsapp ? "✅ Conectado" : "Dados simulados"}</p>
                <button onClick={() => { setConnectModal({ type: "whatsapp" }); setConnectUrl(externalLinks.whatsapp ?? ""); }} className="text-[10px] font-semibold text-[#C9A227] hover:underline">Conectar</button>
              </div>
            </div>

            {/* Google */}
            <div className="rounded-2xl p-5 border border-border bg-gradient-to-br from-[#4285F4]/10 via-[#34A853]/10 to-[#FBBC05]/10 relative overflow-hidden">
              <div className="absolute top-3 right-3 opacity-20">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" className="text-[#4285F4]">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Google Meu Negócio</p>
              {socialProfiles.google?.name && (
                <p className="text-xs text-muted-foreground truncate mb-1">{socialProfiles.google.name}</p>
              )}
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-extrabold text-foreground">
                  {socialProfiles.google?.rating ? socialProfiles.google.rating.toFixed(1) : "4,7"}
                </p>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((s) => {
                    const r = socialProfiles.google?.rating ?? 4.7;
                    return (
                      <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill={s <= Math.round(r) ? "#FBBC05" : "none"} stroke="#FBBC05" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    );
                  })}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">Avaliações no Google</p>
              <div className="flex items-center gap-1 mt-3">
                <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                  +0,2
                </span>
                <span className="text-xs text-muted-foreground">vs. mês anterior</span>
              </div>
              <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Total de reviews</p>
                  <p className="font-bold text-foreground">
                    {socialProfiles.google?.reviewCount ? socialProfiles.google.reviewCount.toLocaleString("pt-BR") : "318"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Respondidas</p>
                  <p className="font-bold text-foreground">94%</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground/50">
                  {externalLinks.google
                    ? <span className="text-emerald-500 font-semibold">✅ Conectado{socialProfiles.google?.note ? " (parcial)" : ""}</span>
                    : "Dados simulados"}
                </p>
                <button onClick={() => { setConnectModal({ type: "google" }); setConnectUrl(externalLinks.google ?? ""); }} className="text-[10px] font-semibold text-[#C9A227] hover:underline">
                  {externalLinks.google ? "Reconectar" : "Conectar"}
                </button>
              </div>
              {socialProfiles.google?.note && externalLinks.google && (
                <p className="text-[9px] text-amber-500/70 mt-1">{socialProfiles.google.note}</p>
              )}
            </div>

            <div className="rounded-2xl p-5 border border-border bg-gradient-to-br from-[#C9A227]/10 via-[#E8C84A]/5 to-transparent relative overflow-hidden">
              <div className="absolute top-3 right-3 opacity-20">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#C9A227]">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                  <line x1="12" y1="18" x2="12.01" y2="18"/>
                </svg>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">App da Loja</p>
              {socialProfiles.app?.name && (
                <p className="text-xs text-muted-foreground truncate mb-1">{socialProfiles.app.name}</p>
              )}
              <p className="text-3xl font-extrabold text-foreground">5.291</p>
              <p className="text-sm text-muted-foreground mt-0.5">Downloads totais</p>
              <div className="flex items-center gap-1 mt-3">
                <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                  +12,5%
                </span>
                <span className="text-xs text-muted-foreground">vs. mês anterior</span>
              </div>
              <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Ativos/mês</p>
                  <p className="font-bold text-foreground">1.847</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Nota na loja</p>
                  <p className="font-bold text-foreground">
                    {socialProfiles.app?.rating ? `${socialProfiles.app.rating.toFixed(1)} ★` : "4,5 ★"}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground/50">
                  {externalLinks.app
                    ? <span className="text-emerald-500 font-semibold">✅ Conectado{socialProfiles.app?.note ? " (parcial)" : ""}</span>
                    : "Dados simulados"}
                </p>
                <button onClick={() => { setConnectModal({ type: "app" }); setConnectUrl(externalLinks.app ?? ""); }} className="text-[10px] font-semibold text-[#C9A227] hover:underline">
                  {externalLinks.app ? "Reconectar" : "Conectar"}
                </button>
              </div>
              {socialProfiles.app?.note && externalLinks.app && (
                <p className="text-[9px] text-amber-500/70 mt-1">{socialProfiles.app.note}</p>
              )}
            </div>
          </div>
        </div>

        {Object.keys(sections).length === 0 && !editMode && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-base font-semibold mb-1">Nenhum indicador personalizado ainda</p>
            {isAdmin && <p className="text-sm">Clique em "Adicionar Métrica" para incluir seus próprios indicadores.</p>}
            {!isAdmin && <p className="text-sm">Indicadores personalizados aparecerão aqui quando configurados.</p>}
          </div>
        )}

        {Object.entries(sections).map(([section, sectionMetrics]) => (
          <div key={section} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold uppercase tracking-wider text-foreground border-l-4 border-[#C9A227] pl-3">
                {section}
              </h2>
              {isAdmin && (
                <Button size="sm" variant="outline" className="text-xs" onClick={() => openNewMetric(section)}>
                  <IconPlus /> <span className="ml-1">Adicionar</span>
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sectionMetrics.map((metric, idx) => (
                <MetricCard
                  key={metric.id}
                  metric={metric}
                  isAdmin={isAdmin}
                  isFirst={idx === 0}
                  isLast={idx === sectionMetrics.length - 1}
                  onEdit={() => openEditMetric(metric)}
                  onDelete={() => deleteMetricMutation.mutate({ id: metric.id, tenantId: activeTenantId! })}
                  onMoveUp={() => reorderMetric(metric, "up", sectionMetrics)}
                  onMoveDown={() => reorderMetric(metric, "down", sectionMetrics)}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Add new section */}
        {isAdmin && (
          <div className="mt-6 text-center">
            <Button variant="outline" className="border-dashed border-[#C9A227]/50 text-[#C9A227] hover:bg-[#C9A227]/10" onClick={() => openNewMetric("")}>
              <IconPlus /> <span className="ml-2">Nova Seção / Métrica</span>
            </Button>
          </div>
        )}

        <div className="h-16" />
      </div>

      {/* Connect External Metric Modal */}
      <Dialog open={!!connectModal} onOpenChange={(o) => { if (!o) { setConnectModal(null); setConnectUrl(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {connectModal?.type === "instagram" && "Conectar Instagram"}
              {connectModal?.type === "facebook" && "Conectar Facebook"}
              {connectModal?.type === "linkedin" && "Conectar LinkedIn"}
              {connectModal?.type === "ads" && "Conectar Anúncios (Meta/Google)"}
              {connectModal?.type === "whatsapp" && "Conectar WhatsApp Comunidade"}
              {connectModal?.type === "google" && "Conectar Google Meu Negócio"}
              {connectModal?.type === "app" && "Conectar App da Loja"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              {connectModal?.type === "instagram" && "Cole o link do seu perfil público do Instagram. O sistema irá buscar automaticamente os dados disponíveis publicamente (nome, bio, seguidores quando exibidos)."}
              {connectModal?.type === "facebook" && "Cole o link da sua página pública no Facebook. O sistema irá buscar automaticamente o nome e dados públicos da página."}
              {connectModal?.type === "linkedin" && "Cole o link da sua página no LinkedIn. O sistema irá buscar automaticamente o nome e dados públicos da empresa."}
              {connectModal?.type === "ads" && "Cole o link do seu painel de anúncios (Meta Business ou Google Ads). Dados de campanhas requerem integração via API."}
              {connectModal?.type === "whatsapp" && "Cole o link de convite da sua comunidade no WhatsApp. Dados de membros requerem integração via API."}
              {connectModal?.type === "google" && "Cole o link da sua página no Google Meu Negócio. O sistema irá buscar automaticamente a nota e número de avaliações."}
              {connectModal?.type === "app" && "Cole o link do seu aplicativo na App Store ou Google Play. O sistema irá buscar automaticamente a nota e número de avaliações."}
            </p>
            <div>
              <label className="text-sm font-semibold mb-1 block">
                {connectModal?.type === "instagram" && "URL do perfil"}
                {connectModal?.type === "facebook" && "URL da página"}
                {connectModal?.type === "linkedin" && "URL da página"}
                {connectModal?.type === "ads" && "URL do painel de anúncios"}
                {connectModal?.type === "whatsapp" && "Link de convite da comunidade"}
                {connectModal?.type === "google" && "URL ou Place ID"}
                {connectModal?.type === "app" && "URL da loja (App Store / Play Store)"}
              </label>
              <Input
                value={connectUrl}
                onChange={(e) => setConnectUrl(e.target.value)}
                placeholder={
                  connectModal?.type === "instagram" ? "https://instagram.com/suamarca" :
                  connectModal?.type === "facebook" ? "https://facebook.com/suapagina" :
                  connectModal?.type === "linkedin" ? "https://linkedin.com/company/suaempresa" :
                  connectModal?.type === "ads" ? "https://business.facebook.com/..." :
                  connectModal?.type === "whatsapp" ? "https://chat.whatsapp.com/..." :
                  connectModal?.type === "google" ? "https://g.page/suaempresa" :
                  "https://play.google.com/store/apps/..."
                }
              />
            </div>
            {connectUrl && !isFetching && (
              <p className="text-xs text-[#C9A227] bg-[#C9A227]/10 rounded-lg px-3 py-2">
                🔍 O sistema irá buscar automaticamente os dados públicos ao salvar.
              </p>
            )}
            {isFetching && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Buscando dados públicos do perfil...
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConnectModal(null); setConnectUrl(""); }} disabled={isFetching}>Cancelar</Button>
            <Button
              className="bg-[#C9A227] text-black hover:bg-[#E8C84A]"
              onClick={() => connectModal && saveExternalLink(connectModal.type, connectUrl)}
              disabled={!connectUrl.trim() || isFetching}
            >
              {isFetching ? "Conectando..." : "Salvar e Conectar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Config Modal */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Hero do Dashboard</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-semibold mb-1 block">Título</label>
              <Input value={editConfig.title} onChange={(e) => setEditConfig({ ...editConfig, title: e.target.value })} placeholder="Ex: Análise de Performance" />
            </div>
            <div>
              <label className="text-sm font-semibold mb-1 block">Subtítulo</label>
              <Input value={editConfig.subtitle} onChange={(e) => setEditConfig({ ...editConfig, subtitle: e.target.value })} placeholder="Ex: Resultados do período" />
            </div>
            <div>
              <label className="text-sm font-semibold mb-1 block">Período</label>
              <Input value={editConfig.period} onChange={(e) => setEditConfig({ ...editConfig, period: e.target.value })} placeholder="Ex: COMPARATIVO: 10/03 → 10/06" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigModal(false)}>Cancelar</Button>
            <Button className="bg-[#C9A227] text-black hover:bg-[#E8C84A]" onClick={() => { saveConfigMutation.mutate({ tenantId: activeTenantId!, ...editConfig }); setShowConfigModal(false); }}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Metric Modal */}
      <Dialog open={showMetricModal} onOpenChange={setShowMetricModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingMetric ? "Editar Métrica" : "Nova Métrica"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-semibold mb-1 block">Seção</label>
              <Input value={metricForm.section} onChange={(e) => setMetricForm({ ...metricForm, section: e.target.value })} placeholder="Ex: Vendas, Aplicativo, etc." />
            </div>
            <div>
              <label className="text-sm font-semibold mb-1 block">Indicador</label>
              <Input value={metricForm.label} onChange={(e) => setMetricForm({ ...metricForm, label: e.target.value })} placeholder="Ex: Ticket Médio" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold mb-1 block">Valor Inicial</label>
                <Input value={metricForm.valueFrom} onChange={(e) => setMetricForm({ ...metricForm, valueFrom: e.target.value })} placeholder="Ex: R$ 45,00" />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Valor Final</label>
                <Input value={metricForm.valueTo} onChange={(e) => setMetricForm({ ...metricForm, valueTo: e.target.value })} placeholder="Ex: R$ 62,00" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold mb-1 block">Delta</label>
                <Input value={metricForm.deltaText} onChange={(e) => setMetricForm({ ...metricForm, deltaText: e.target.value })} placeholder="Ex: +R$ 17,00" />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Crescimento (%)</label>
                <Input type="number" value={metricForm.growthPct} onChange={(e) => setMetricForm({ ...metricForm, growthPct: e.target.value })} placeholder="Ex: 37.8" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMetricModal(false)}>Cancelar</Button>
            <Button className="bg-[#C9A227] text-black hover:bg-[#E8C84A]" onClick={handleSaveMetric} disabled={!metricForm.label || !metricForm.section}>
              {editingMetric ? "Atualizar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({ metric, isAdmin, isFirst, isLast, onEdit, onDelete, onMoveUp, onMoveDown }: {
  metric: Metric;
  isAdmin: boolean;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="group relative bg-card border border-border rounded-xl p-4 hover:translate-x-1 transition-all duration-200 hover:shadow-md hover:border-[#C9A227]/30">
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C9A227] rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity" />

      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-semibold">{metric.label}</p>

      {(metric.valueFrom || metric.valueTo) && (
        <div className="flex items-baseline gap-1.5 mb-1">
          {metric.valueFrom && <span className="text-sm text-muted-foreground">{metric.valueFrom}</span>}
          {metric.valueFrom && metric.valueTo && <span className="text-muted-foreground/50 text-xs">→</span>}
          {metric.valueTo && <span className="text-xl font-bold text-foreground">{metric.valueTo}</span>}
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        {metric.deltaText && <span className="text-xs text-[#C9A227] font-semibold">{metric.deltaText}</span>}
        {metric.growthPct != null && (
          <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
            <IconTrendUp /> +{metric.growthPct}%
          </span>
        )}
      </div>

      {isAdmin && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onMoveUp} disabled={isFirst} className="p-1 rounded bg-background border border-border hover:border-[#C9A227] text-muted-foreground hover:text-[#C9A227] transition-colors disabled:opacity-30" title="Mover para cima">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
          </button>
          <button onClick={onMoveDown} disabled={isLast} className="p-1 rounded bg-background border border-border hover:border-[#C9A227] text-muted-foreground hover:text-[#C9A227] transition-colors disabled:opacity-30" title="Mover para baixo">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <button onClick={onEdit} className="p-1 rounded bg-background border border-border hover:border-[#C9A227] text-muted-foreground hover:text-[#C9A227] transition-colors" title="Editar">
            <IconEdit />
          </button>
          <button onClick={onDelete} className="p-1 rounded bg-background border border-border hover:border-destructive text-muted-foreground hover:text-destructive transition-colors" title="Excluir">
            <IconTrash />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Insights Feed ────────────────────────────────────────────────────────────
interface Insight {
  id: number;
  tenantId: number;
  title: string;
  body: string | null;
  imageUrl: string | null;
  authorId: number | null;
  createdAt: Date;
}

function InsightsFeed({ tenantId, isAdmin }: { tenantId: number; isAdmin: boolean }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Insight | null>(null);
  const [form, setForm] = useState({ title: "", body: "", imageFile: null as File | null, imageUrl: "" });
  const [uploading, setUploading] = useState(false);

  const { data: insights = [], refetch } = trpc.insights.list.useQuery(
    { tenantId },
    { enabled: !!tenantId }
  );

  const createMutation = trpc.insights.create.useMutation({
    onSuccess: () => { refetch(); setShowAddModal(false); setForm({ title: "", body: "", imageFile: null, imageUrl: "" }); toast.success("Insight publicado!"); },
    onError: () => toast.error("Erro ao publicar insight"),
  });
  const deleteMutation = trpc.insights.delete.useMutation({
    onSuccess: () => { refetch(); setConfirmDelete(null); toast.success("Insight removido"); },
    onError: () => toast.error("Erro ao remover"),
  });

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const data = await res.json() as { url: string };
      return data.url;
    } catch {
      toast.error("Erro ao fazer upload da imagem");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handlePublish = async () => {
    if (!form.title.trim()) return;
    let imageUrl: string | undefined;
    if (form.imageFile) {
      const url = await uploadImage(form.imageFile);
      if (url) imageUrl = url;
    }
    createMutation.mutate({ tenantId, title: form.title.trim(), body: form.body.trim() || undefined, imageUrl });
  };

  const DAYS_AGO = (d: Date) => {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    if (diff === 0) return "Hoje";
    if (diff === 1) return "Ontem";
    return `${diff} dias atrás`;
  };

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">Insights de Marketing</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Publicações do time comercial para orientar o marketing</p>
        </div>
        {isAdmin && (
          <Button className="bg-[#C9A227] text-black hover:bg-[#E8C84A] font-bold text-xs" onClick={() => setShowAddModal(true)}>
            <IconPlus /> <span className="ml-1">Novo Insight</span>
          </Button>
        )}
      </div>

      {(insights as Insight[]).length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl p-10 text-center text-muted-foreground text-sm">
          <div className="text-3xl mb-2">💡</div>
          <p className="font-medium">Nenhum insight publicado ainda</p>
          <p className="text-xs mt-1">O time comercial pode publicar insights aqui para orientar as ações de marketing.</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-2xl">
          {(insights as Insight[]).map((insight) => (
            <div key={insight.id} className="group bg-card border border-border rounded-xl overflow-hidden hover:border-[#C9A227]/40 transition-colors">
              {insight.imageUrl && (
                <img src={insight.imageUrl} alt={insight.title} className="w-full h-48 object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-[#C9A227] uppercase tracking-wider">Insight</span>
                      <span className="text-xs text-muted-foreground">{DAYS_AGO(insight.createdAt)}</span>
                    </div>
                    <h3 className="font-bold text-foreground text-base leading-snug">{insight.title}</h3>
                    {insight.body && <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{insight.body}</p>}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => setConfirmDelete(insight)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg border border-border hover:border-destructive text-muted-foreground hover:text-destructive transition-all shrink-0"
                      title="Remover insight"
                    >
                      <IconTrash />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Insight Modal */}
      <Dialog open={showAddModal} onOpenChange={(o) => { if (!o) { setShowAddModal(false); setForm({ title: "", body: "", imageFile: null, imageUrl: "" }); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Insight de Marketing</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Título *</label>
              <Input placeholder="Ex: Divulgar ofertas da curva A" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Descrição</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none outline-none focus:ring-1 focus:ring-[#C9A227] min-h-[80px]"
                placeholder="Detalhe o insight para o time de marketing..."
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Imagem (opcional)</label>
              {form.imageFile ? (
                <div className="flex items-center gap-2">
                  <img src={URL.createObjectURL(form.imageFile)} alt="Preview" className="h-20 w-32 object-cover rounded border border-border" />
                  <button onClick={() => setForm({ ...form, imageFile: null })} className="text-xs text-destructive hover:underline">Remover</button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-border rounded-lg cursor-pointer hover:border-[#C9A227]/50 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                  <IconPlus />
                  <span>Adicionar imagem</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setForm({ ...form, imageFile: e.target.files?.[0] ?? null })} />
                </label>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancelar</Button>
            <Button className="bg-[#C9A227] text-black" disabled={!form.title.trim() || uploading} onClick={handlePublish}>
              {uploading ? "Enviando..." : "Publicar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Remover Insight</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja remover <strong>"{confirmDelete?.title}"</strong>? Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => confirmDelete && deleteMutation.mutate({ id: confirmDelete.id, tenantId })}>Remover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Dashboard Tasks Widget ────────────────────────────────────────────────────
function DashboardTasksWidget({ tenantId }: { tenantId: number }) {
  const { data: tasks = [] } = trpc.tasks.list.useQuery(
    { tenantId },
    { enabled: !!tenantId }
  );
  const { setActiveTab } = useApp();

  const pending = (tasks as Array<{ id: number; name: string; dueDate?: string | null; responsible?: string | null; priority?: string | null; status?: string | null }>)
    .filter((t) => t.status !== "done")
    .slice(0, 5);

  const formatDue = (d: string | null | undefined) => {
    if (!d) return null;
    const date = new Date(d);
    const today = new Date();
    const diff = Math.floor((date.getTime() - today.getTime()) / 86400000);
    if (diff < 0) return { label: "Atrasada", color: "text-red-500 bg-red-500/10" };
    if (diff === 0) return { label: "Hoje", color: "text-red-500 bg-red-500/10" };
    if (diff === 1) return { label: "Amanhã", color: "text-amber-500 bg-amber-500/10" };
    return {
      label: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      color: "text-muted-foreground bg-muted",
    };
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">TAREFAS PENDENTES</p>
        <button
          className="text-xs text-[#C9A227] hover:underline font-semibold"
          onClick={() => setActiveTab("checklist")}
        >
          Ver todas
        </button>
      </div>
      {pending.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          <p>Nenhuma tarefa pendente</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {pending.map((task) => {
            const due = formatDue(task.dueDate);
            const initials = task.responsible
              ? task.responsible.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
              : "?";
            return (
              <div key={task.id} className="flex items-center gap-3 group">
                <div className="w-4 h-4 rounded border border-border group-hover:border-[#C9A227]/60 transition-colors shrink-0 mt-0.5" />
                <span className="text-sm text-foreground flex-1 truncate">{task.name}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {task.responsible && (
                    <div className="w-6 h-6 rounded-full bg-[#C9A227]/20 flex items-center justify-center text-[9px] font-bold text-[#C9A227]">
                      {initials}
                    </div>
                  )}
                  {due && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${due.color}`}>
                      {due.label}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard Activities Widget ──────────────────────────────────────────────
function DashboardActivitiesWidget({ tenantId }: { tenantId: number }) {
  const { data: campaigns = [] } = trpc.campaigns.list.useQuery(
    { tenantId },
    { enabled: !!tenantId }
  );

  const items = (campaigns as Array<{ id: number; name: string; channel?: string | null; status?: string | null; createdAt?: Date | null }>)
    .slice(0, 5);

  const channelIcon = (ch: string | null | undefined) => {
    if (!ch) return "📢";
    const c = ch.toLowerCase();
    if (c.includes("instagram")) return "📸";
    if (c.includes("facebook")) return "👍";
    if (c.includes("google")) return "🔍";
    if (c.includes("whatsapp")) return "💬";
    if (c.includes("email")) return "📧";
    return "📢";
  };

  const timeAgo = (d: Date | null | undefined) => {
    if (!d) return "";
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
    if (diff < 1) return "Agora";
    if (diff < 24) return `${diff}h atrás`;
    return `${Math.floor(diff / 24)}d atrás`;
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">ATIVIDADES RECENTES</p>
        <button className="text-xs text-[#C9A227] hover:underline font-semibold">Ver todas</button>
      </div>
      {items.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          <p>Nenhuma atividade recente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <div key={c.id} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-base shrink-0">
                {channelIcon(c.channel)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                <p className="text-[10px] text-muted-foreground">{c.channel ?? "Campanha"}</p>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(c.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard Quick Access ────────────────────────────────────────────────────
function DashboardQuickAccess() {
  const { setActiveTab } = useApp();

  const actions = [
    { icon: "📢", label: "Criar Campanha", tab: "campaigns" as const },
    { icon: "📋", label: "Nova Tarefa", tab: "checklist" as const },
    { icon: "📅", label: "Agendar Post", tab: "agenda" as const },
 //   { icon: "📊", label: "Relatório de Mídia", tab: "relatorios" as const },
 // { icon: "🖼️", label: "Biblioteca de Artes", tab: "midias" as const },
    { icon: "📆", label: "Agenda", tab: "agenda" as const },
  ];

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">ACESSO RÁPIDO</p>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={() => setActiveTab(a.tab)}
            className="flex flex-col items-center gap-2 p-3 bg-card border border-border rounded-xl hover:border-[#C9A227]/50 hover:bg-[#C9A227]/5 transition-all duration-150 active:scale-95 group"
          >
            <span className="text-xl">{a.icon}</span>
            <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-foreground text-center leading-tight">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
