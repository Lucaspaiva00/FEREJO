import React, { useState, useEffect, useRef } from "react";
import { useApp, FontSize } from "@/contexts/AppContext";
import { useRealtime } from "@/contexts/RealtimeContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DEFAULT_BANNER = "/manus-storage/farejo-banner-default_d5ae2d1c.jpg";

const IconUpload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
  </svg>
);

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconWhatsApp = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const IconSend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

// Toggle switch component
function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227] ${
        checked ? "bg-[#25D366]" : "bg-muted"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function Settings() {
  const { user, activeTenantId, setTenantTheme, fontSize, setFontSize } = useApp();
  const { broadcast } = useRealtime();
  const isReadOnly = user?.role === "client";
  const isAdmin = user?.role === "admin";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    profileName: "",
    headerColor: "#0B0F14",
    accentColor: "#C9A227",
    logoUrl: "",
    bannerUrl: DEFAULT_BANNER,
  });
  const [saved, setSaved] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // ── WhatsApp Prefs state ──────────────────────────────────────────────────
  const [wpForm, setWpForm] = useState({
    phone: "",
    enabled: false,
    notifNovaTarefa: false,
    notifReuniao: false,
    notifResumoDiario: false,
    resumoHorario: "08:00",
  });
  const [wpSaved, setWpSaved] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const { data: settings, refetch } = trpc.settings.get.useQuery(
    { tenantId: activeTenantId! }, { enabled: !!activeTenantId }
  );

  const { data: wpPrefs, refetch: refetchWp } = trpc.whatsapp.getPrefs.useQuery(
    { tenantId: activeTenantId! }, { enabled: !!activeTenantId }
  );

  useEffect(() => {
    if (settings) {
      setForm({
        profileName: settings.profileName ?? "",
        headerColor: settings.headerColor ?? "#0B0F14",
        accentColor: settings.accentColor ?? "#C9A227",
        logoUrl: settings.logoUrl ?? "",
        bannerUrl: settings.bannerUrl ?? DEFAULT_BANNER,
      });
    }
  }, [settings]);

  useEffect(() => {
    if (wpPrefs) {
      setWpForm({
        phone: wpPrefs.phone ?? "",
        enabled: !!wpPrefs.enabled,
        notifNovaTarefa: !!wpPrefs.notifNovaTarefa,
        notifReuniao: !!wpPrefs.notifReuniao,
        notifResumoDiario: !!wpPrefs.notifResumoDiario,
        resumoHorario: wpPrefs.resumoHorario ?? "08:00",
      });
    }
  }, [wpPrefs]);

  const handleColorChange = (field: "headerColor" | "accentColor", value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setTenantTheme({ [field]: value });
  };

  const handleBannerChange = (url: string) => {
    setForm((prev) => ({ ...prev, bannerUrl: url }));
    setTenantTheme({ bannerUrl: url });
  };

  const handleFileUpload = async (file: File, type: "banner" | "logo") => {
    const setter = type === "banner" ? setUploadingBanner : setUploadingLogo;
    setter(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "x-content-type": file.type || "image/jpeg",
          "x-filename": file.name,
        },
        body: arrayBuffer,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      if (type === "banner") {
        handleBannerChange(url);
        toast.success("Banner carregado com sucesso");
      } else {
        setForm((prev) => ({ ...prev, logoUrl: url }));
        setTenantTheme({ logoUrl: url });
        toast.success("Logo carregado com sucesso");
      }
    } catch {
      toast.error("Erro no upload. Verifique o arquivo e tente novamente.");
    } finally {
      setter(false);
    }
  };

  const saveMutation = trpc.settings.save.useMutation({
    onSuccess: () => {
      toast.success("Configurações salvas");
      setSaved(true);
      refetch();
      setTenantTheme({
        headerColor: form.headerColor,
        accentColor: form.accentColor,
        bannerUrl: form.bannerUrl,
        logoUrl: form.logoUrl,
        profileName: form.profileName,
      });
      broadcast({ type: "settings", tenantId: activeTenantId!, action: "updated" });
      setTimeout(() => setSaved(false), 2000);
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const saveWpMutation = trpc.whatsapp.savePrefs.useMutation({
    onSuccess: () => {
      toast.success("Preferências WhatsApp salvas");
      setWpSaved(true);
      refetchWp();
      setTimeout(() => setWpSaved(false), 2500);
    },
    onError: (e) => toast.error(e.message || "Erro ao salvar preferências WhatsApp"),
  });

  const testWpMutation = trpc.whatsapp.testSend.useMutation({
    onSuccess: () => {
      toast.success("✅ Mensagem de teste enviada!");
      setTestResult({ ok: true, msg: "Mensagem enviada com sucesso! Verifique seu WhatsApp." });
      setTimeout(() => setTestResult(null), 8000);
    },
    onError: (e) => {
      const msg = e.message || "Falha no envio do teste";
      toast.error(msg);
      setTestResult({ ok: false, msg });
      setTimeout(() => setTestResult(null), 10000);
    },
  });

  if (!activeTenantId) return <div className="flex items-center justify-center h-64 text-muted-foreground">Selecione um cliente.</div>;

  return (
    <div>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold uppercase tracking-wider mb-6">Configurações</h1>

        {/* Profile */}
        <Section title="Perfil do Cliente">
          <Field label="Nome do Perfil">
            <Input
              value={form.profileName}
              onChange={(e) => setForm({ ...form, profileName: e.target.value })}
              placeholder="Ex: Supermercado Central"
              disabled={isReadOnly}
            />
          </Field>
        </Section>

        {/* White-label */}
        <Section title="Personalização Visual">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Cor do Cabeçalho">
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.headerColor}
                  onChange={(e) => handleColorChange("headerColor", e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-border"
                  disabled={isReadOnly}
                />
                <Input
                  value={form.headerColor}
                  onChange={(e) => handleColorChange("headerColor", e.target.value)}
                  placeholder="#0B0F14"
                  disabled={isReadOnly}
                  className="flex-1"
                />
              </div>
            </Field>
            <Field label="Cor de Destaque">
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.accentColor}
                  onChange={(e) => handleColorChange("accentColor", e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-border"
                  disabled={isReadOnly}
                />
                <Input
                  value={form.accentColor}
                  onChange={(e) => handleColorChange("accentColor", e.target.value)}
                  placeholder="#C9A227"
                  disabled={isReadOnly}
                  className="flex-1"
                />
              </div>
            </Field>
          </div>

          <div className="mt-2 rounded-xl overflow-hidden border border-border">
            <div className="px-4 py-3 font-bold text-sm relative overflow-hidden" style={{ backgroundColor: form.headerColor }}>
              <span style={{ color: form.accentColor }}>FAREJO</span>
              <span className="text-white/60 ml-3 text-xs">— Pré-visualização do Cabeçalho</span>
              <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: form.accentColor }} />
            </div>
            <div className="px-4 py-3 bg-card text-sm text-muted-foreground">
              Cor de destaque: <span className="font-bold" style={{ color: form.accentColor }}>{form.accentColor}</span>
            </div>
          </div>

          {isAdmin && <>
          <Field label="Logo (URL ou upload)">
            <div className="flex gap-2">
              <Input
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                placeholder="https://... ou clique em Upload"
                disabled={isReadOnly}
                className="flex-1"
              />
              {!isReadOnly && (
                <>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "logo")}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="flex-shrink-0"
                  >
                    <IconUpload />
                    <span className="ml-1">{uploadingLogo ? "..." : "Upload"}</span>
                  </Button>
                </>
              )}
            </div>
            {form.logoUrl && (
              <div className="mt-2 p-2 border border-border rounded-lg bg-muted/30 flex items-center justify-center">
                <img src={form.logoUrl} alt="Logo preview" className="max-h-16 object-contain" onError={(e) => (e.currentTarget.style.display = "none")} />
              </div>
            )}
          </Field>
          <Field label="Banner (exibido em todas as abas)">
            <div className="flex gap-2">
              <Input
                value={form.bannerUrl}
                onChange={(e) => handleBannerChange(e.target.value)}
                placeholder="https://... ou clique em Upload"
                disabled={isReadOnly}
                className="flex-1"
              />
              {!isReadOnly && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "banner")}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingBanner}
                    className="flex-shrink-0"
                  >
                    <IconUpload />
                    <span className="ml-1">{uploadingBanner ? "..." : "Upload"}</span>
                  </Button>
                </>
              )}
            </div>
            <div className="mt-2 rounded-lg overflow-hidden border border-border">
              <img
                src={form.bannerUrl || DEFAULT_BANNER}
                alt="Banner preview"
                className="w-full object-cover object-center"
                style={{ maxHeight: "100px" }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_BANNER; }}
              />
            </div>
            {form.bannerUrl !== DEFAULT_BANNER && !isReadOnly && (
              <button
                className="text-xs text-muted-foreground hover:text-foreground mt-1 underline"
                onClick={() => handleBannerChange(DEFAULT_BANNER)}
              >
                Restaurar banner padrão FAREJO
              </button>
            )}
          </Field>
          </>
          }
        </Section>

        {/* Font size */}
        <Section title="Acessibilidade e Exibição">
          <Field label="Tamanho do Texto e Ícones">
            <div className="flex gap-2">
              {(["medium", "large", "xlarge"] as FontSize[]).map((size) => {
                const labels: Record<FontSize, string> = { medium: "Médio", large: "Grande", xlarge: "Muito Grande" };
                const isActive = fontSize === size;
                return (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    className="flex-1 py-2 rounded-lg border font-semibold transition-all"
                    style={
                      isActive
                        ? { backgroundColor: form.accentColor, color: "#000", borderColor: form.accentColor }
                        : { borderColor: "var(--border)", color: "var(--muted-foreground)" }
                    }
                  >
                    <span className={size === "xlarge" ? "text-base" : size === "large" ? "text-sm" : "text-xs"}>
                      {labels[size]}
                    </span>
                    {isActive && (
                      <span className="ml-1.5 inline-flex"><IconCheck /></span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Ajusta o tamanho de textos e ícones em toda a aplicação. A preferência é salva no seu dispositivo.
            </p>
          </Field>
        </Section>

        {/* Z-API integration info — admin only */}
        {isAdmin && (
          <Section title="Integração WhatsApp (Z-API)">
            <div className="rounded-xl border border-[#25D366]/30 bg-[#25D366]/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[#25D366] text-lg">✅</span>
                <p className="text-sm font-semibold text-foreground">Z-API configurada e ativa</p>
              </div>
              <p className="text-xs text-muted-foreground">
                As mensagens WhatsApp são enviadas via <strong className="text-foreground">Z-API</strong> — sem necessidade de configurar credenciais adicionais.
              </p>
              <p className="text-xs text-muted-foreground">
                Para que os envios funcionem, certifique-se de que o número WhatsApp está <strong className="text-foreground">conectado na instância Z-API</strong> (QR Code escaneado em{" "}
                <a href="https://app.z-api.io" target="_blank" rel="noopener noreferrer" className="text-[#C9A227] underline">app.z-api.io</a>).
              </p>
            </div>
          </Section>
        )}

        {/* Save settings button */}
        {!isReadOnly && (
          <div className="flex justify-end mt-2 mb-8">
            <Button
              className="font-bold transition-colors"
              style={
                saved
                  ? { backgroundColor: "#16a34a", color: "#fff" }
                  : { backgroundColor: form.accentColor, color: "#000" }
              }
              onClick={() => saveMutation.mutate({ tenantId: activeTenantId!, ...form })}
              disabled={saveMutation.isPending}
            >
              {saved ? (
                <><IconCheck /><span className="ml-1">Salvo!</span></>
              ) : saveMutation.isPending ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        )}

        {/* ── WhatsApp Notifications — all users ─────────────────────────────── */}
        <Section title="Notificações WhatsApp">
          {/* Master enable toggle */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#25D366]/15 flex items-center justify-center text-[#25D366]">
                  <IconWhatsApp />
                </div>
                <div>
                  <p className="font-semibold text-sm">Ativar notificações WhatsApp</p>
                  <p className="text-xs text-muted-foreground">Receba alertas diretamente no seu WhatsApp</p>
                </div>
              </div>
              <Toggle
                checked={wpForm.enabled}
                onChange={(v) => setWpForm((p) => ({ ...p, enabled: v }))}
              />
            </div>

            {/* Phone number */}
            <div className="px-4 py-4 border-b border-border">
              <Field label="Seu número de WhatsApp">
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-muted-foreground font-mono bg-muted px-3 py-2 rounded-l-md border border-border border-r-0 select-none">+55</span>
                  <Input
                    value={wpForm.phone.replace(/^\+55/, "")}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                      setWpForm((p) => ({ ...p, phone: digits ? `+55${digits}` : "" }));
                    }}
                    placeholder="11 99999-9999"
                    className="rounded-l-none flex-1 font-mono"
                    disabled={!wpForm.enabled}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">DDD + número (ex: 11 99999-9999). Sem espaços ou traços.</p>
              </Field>
            </div>

            {/* Notification types */}
            <div className={`divide-y divide-border transition-opacity duration-200 ${!wpForm.enabled ? "opacity-40 pointer-events-none" : ""}`}>
              <NotifRow
                icon="📋"
                title="Nova tarefa criada"
                description="Receba um aviso quando uma nova tarefa for adicionada ao checklist"
                checked={wpForm.notifNovaTarefa}
                onChange={(v) => setWpForm((p) => ({ ...p, notifNovaTarefa: v }))}
              />
              <NotifRow
                icon="📅"
                title="Nova reunião agendada"
                description="Seja notificado quando uma reunião operacional ou estratégica for criada"
                checked={wpForm.notifReuniao}
                onChange={(v) => setWpForm((p) => ({ ...p, notifReuniao: v }))}
              />
              <div className="px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">🌅</span>
                    <div>
                      <p className="text-sm font-medium">Resumo diário</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Receba um resumo das tarefas em aberto e reuniões do dia no horário escolhido
                      </p>
                      {/* Time picker */}
                      {wpForm.notifResumoDiario && (
                        <div className="mt-3 flex items-center gap-2">
                          <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Horário do resumo:</label>
                          <input
                            type="time"
                            value={wpForm.resumoHorario}
                            onChange={(e) => setWpForm((p) => ({ ...p, resumoHorario: e.target.value }))}
                            className="text-sm font-mono bg-muted border border-border rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#C9A227] text-foreground"
                          />
                          <span className="text-xs text-muted-foreground">(horário local)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Toggle
                    checked={wpForm.notifResumoDiario}
                    onChange={(v) => setWpForm((p) => ({ ...p, notifResumoDiario: v }))}
                  />
                </div>
              </div>
            </div>

            {/* Test result banner */}
            {testResult && (
              <div
                className={`mx-4 mt-3 mb-1 rounded-lg px-4 py-3 flex items-start gap-3 text-sm font-medium border ${
                  testResult.ok
                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}
                style={{ animation: "fadeIn 0.2s ease-out" }}
              >
                <span className="text-lg leading-none mt-0.5">{testResult.ok ? "✅" : "❌"}</span>
                <span>{testResult.msg}</span>
                <button
                  className="ml-auto opacity-60 hover:opacity-100 transition-opacity text-xs"
                  onClick={() => setTestResult(null)}
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </div>
            )}
            {/* Footer: save + test */}
            <div className="px-4 py-4 bg-muted/30 flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center border-t border-border">
              <p className="text-xs text-muted-foreground">
                {wpForm.enabled
                  ? "As notificações serão enviadas para o número acima."
                  : "Ative as notificações para configurar as preferências."}
              </p>
              <div className="flex gap-2">
                {wpForm.enabled && wpForm.phone && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testWpMutation.mutate({ tenantId: activeTenantId! })}
                    disabled={testWpMutation.isPending}
                    className="text-[#25D366] border-[#25D366]/30 hover:bg-[#25D366]/10"
                  >
                    <IconSend />
                    <span className="ml-1.5">{testWpMutation.isPending ? "Enviando..." : "Testar"}</span>
                  </Button>
                )}
                <Button
                  size="sm"
                  className="font-bold"
                  style={
                    wpSaved
                      ? { backgroundColor: "#16a34a", color: "#fff" }
                      : { backgroundColor: "#C9A227", color: "#000" }
                  }
                  onClick={() =>
                    saveWpMutation.mutate({
                      tenantId: activeTenantId!,
                      ...wpForm,
                    })
                  }
                  disabled={saveWpMutation.isPending}
                >
                  {wpSaved ? (
                    <><IconCheck /><span className="ml-1">Salvo!</span></>
                  ) : saveWpMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </div>

          {/* Info box */}
          <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">Como funciona?</p>
            <p>As mensagens são enviadas via <strong>Z-API WhatsApp</strong>. A integração já está configurada — basta ativar as notificações e informar seu número acima.</p>
            <p>Para o <strong>resumo diário</strong>, o sistema enviará automaticamente no horário configurado com um resumo das tarefas em aberto e reuniões do dia.</p>
            <p>Para <strong>lembretes de reunião</strong>, você receberá um aviso 30 minutos antes do início.</p>
          </div>
        </Section>

        {/* Team photo */}
        <div className="mt-12 rounded-2xl overflow-hidden border border-border shadow-lg">
          <img
            src="/manus-storage/team-farejo_fc74c707.jpg"
            alt="Equipe Farejo"
            className="w-full object-cover object-center"
            style={{ maxHeight: "320px" }}
          />
          <div className="px-6 py-4 bg-card text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Dados. Estratégia. Desempenho.</p>
            <p className="text-lg font-bold text-[#C9A227] mt-0.5">RESULTADOS.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotifRow({
  icon, title, description, checked, onChange,
}: {
  icon: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-4">
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5">{icon}</span>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2 mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-semibold mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}
