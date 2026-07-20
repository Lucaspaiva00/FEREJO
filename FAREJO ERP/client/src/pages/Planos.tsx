import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useApp } from "@/contexts/AppContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ─── Plan definitions ─────────────────────────────────────────────────────────
const PLANS = [
  // {
  //   id: "boi",
  //   emoji: "🐂",
  //   name: "BOI",
  //   price: 297,
  //   subtitle: "Para quem está começando",
  //   color: "#6B7280",
  //   gradient: "from-gray-700/40 to-gray-800/40",
  //   border: "border-gray-600/40",
  //   highlight: false,
  //   maxLojas: 1,
  //   features: [
  //     { label: "1 loja", included: true },
  //     { label: "Até 5 usuários", included: true },
  //     { label: "Checklists", included: true },
  //     { label: "Tarefas", included: true },
  //     { label: "Fotos", included: true },
  //     { label: "Relatórios básicos", included: true },
  //     { label: "Dashboard completo", included: false },
  //     { label: "Ranking de lojas", included: false },
  //     { label: "Calendário de ações", included: false },
  //     { label: "Auditorias", included: false },
  //     { label: "IA e integrações", included: false },
  //   ],
  // },
  {
    id: "leao",
    emoji: "🦁",
    name: "LEÃO",
    price: 797,
    subtitle: "O mais escolhido pelas equipes",
    color: "#C9A227",
    gradient: "from-amber-700/30 to-yellow-900/30",
    border: "border-amber-500/60",
    highlight: true,
    maxLojas: 5,
    features: [
      { label: "Até 5 lojas", included: true },
      { label: "Usuários ilimitados", included: true },
      { label: "Checklists", included: true },
      { label: "Tarefas", included: true },
      { label: "Fotos", included: true },
      { label: "Relatórios completos", included: true },
      { label: "Dashboard completo", included: true },
      { label: "Ranking de lojas e colaboradores", included: true },
      { label: "Calendário de ações", included: true },
      { label: "Auditorias e aprovações", included: true },
      { label: "Suporte prioritário", included: true },
    ],
  },
  {
    id: "aguia",
    emoji: "🦅",
    name: "ÁGUIA",
    price: 1997,
    subtitle: "Para operações de alto impacto",
    color: "#3B82F6",
    gradient: "from-blue-900/40 to-indigo-900/40",
    border: "border-blue-500/50",
    highlight: false,
    maxLojas: 20,
    features: [
      { label: "Até 20 lojas", included: true },
      { label: "Usuários ilimitados", included: true },
      { label: "Tudo do plano LEÃO", included: true },
      { label: "IA (checklists, análises, planos de ação)", included: true },
      { label: "Dashboard executivo", included: true },
      { label: "API e integrações", included: true },
      { label: "3 visitas presenciais/ano", included: true },
      { label: "Implantação, treinamento ou consultoria", included: true },
      { label: "Suporte VIP dedicado", included: true },
      { label: "Relatórios avançados", included: true },
      { label: "Acesso antecipado a novidades", included: true },
    ],
  },
] as const;

type PlanId = "boi" | "leao" | "aguia";

// ─── Plan limit constants (shared with upgrade logic) ─────────────────────────
export const PLAN_STORE_LIMITS: Record<PlanId, number> = {
  boi: 1,
  leao: 5,
  aguia: 20,
};

// ─── Upgrade modal ────────────────────────────────────────────────────────────
function UpgradeModal({
  currentPlan,
  onClose,
  onSelectPlan,
}: {
  currentPlan: PlanId;
  onClose: () => void;
  onSelectPlan: (plan: PlanId) => void;
}) {
  const upgradePlans = PLANS.filter((p) => {
    const order: PlanId[] = ["boi", "leao", "aguia"];
    return order.indexOf(p.id) > order.indexOf(currentPlan);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0F1318] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">🚀</div>
          <h2 className="text-xl font-bold text-white">Limite de lojas atingido</h2>
          <p className="text-sm text-white/50 mt-1">
            Seu plano atual não permite adicionar mais lojas. Faça upgrade para continuar crescendo.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {upgradePlans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => onSelectPlan(plan.id)}
              className="w-full flex items-center gap-4 p-4 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ borderColor: plan.color + "60", background: `${plan.color}10` }}
            >
              <span className="text-2xl">{plan.emoji}</span>
              <div className="flex-1 text-left">
                <div className="font-bold text-white">{plan.name}</div>
                <div className="text-xs text-white/50">Até {plan.maxLojas} lojas</div>
              </div>
              <div className="text-right">
                <div className="font-bold" style={{ color: plan.color }}>
                  R$ {plan.price.toLocaleString("pt-BR")}/mês
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 border-white/20 text-white/60 hover:text-white">
            Cancelar
          </Button>
          <Button
            onClick={() => {
              window.open("https://wa.me/5519997537883?text=Olá, quero fazer upgrade do meu plano FAREJO!", "_blank");
            }}
            className="flex-1 font-bold"
            style={{ backgroundColor: "#C9A227", color: "#000" }}
          >
            Falar com consultor
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Planos() {
  const { activeTenantId } = useApp();
  const [showUpgradeFor, setShowUpgradeFor] = useState<PlanId | null>(null);
  const [annual, setAnnual] = useState(false);

  // Get current tenant plan
  const { data: tenantData } = trpc.tenants.get.useQuery(
    { tenantId: activeTenantId! },
    { enabled: !!activeTenantId }
  );

  const updatePlanMutation = trpc.tenants.updatePlan.useMutation({
    onSuccess: () => {
      toast.success("Plano atualizado! Entre em contato para finalizar a contratação.");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const currentPlan = (tenantData?.plan ?? "boi") as PlanId;

  const handleSelectPlan = (planId: PlanId) => {
    if (planId === currentPlan) {
      toast.info("Este já é o seu plano atual.");
      return;
    }
    // Redirect to WhatsApp for contracting
    const plan = PLANS.find((p) => p.id === planId)!;
    const msg = encodeURIComponent(
      `Olá! Quero contratar o plano ${plan.emoji} ${plan.name} do FAREJO (R$ ${plan.price}/mês). Pode me ajudar?`
    );
    window.open(`https://wa.me/5519997537883?text=${msg}`, "_blank");
  };

  const annualDiscount = 0.15; // 15% off on annual

  return (
    <div className="min-h-screen bg-[#080B0F] pb-16">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -20%, #C9A22740, transparent)",
          }}
        />
        <div className="relative px-4 pt-12 pb-8 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4"
            style={{ backgroundColor: "#C9A22720", color: "#C9A227", border: "1px solid #C9A22740" }}>
            Planos & Preços
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
            Escolha o plano ideal<br />
            <span style={{ color: "#C9A227" }}>para o seu negócio</span>
          </h1>
          <p className="text-white/50 text-sm sm:text-base max-w-xl mx-auto">
            Do pequeno varejista ao grupo com múltiplas lojas — o FAREJO tem o plano certo para acelerar seus resultados.
          </p>

          {/* Annual toggle */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <span className={`text-sm font-medium ${!annual ? "text-white" : "text-white/40"}`}>Mensal</span>
            <button
              onClick={() => setAnnual((v) => !v)}
              className="relative w-12 h-6 rounded-full transition-colors duration-200"
              style={{ backgroundColor: annual ? "#C9A227" : "#374151" }}
            >
              <span
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
                style={{ left: annual ? "28px" : "4px" }}
              />
            </button>
            <span className={`text-sm font-medium ${annual ? "text-white" : "text-white/40"}`}>
              Anual{" "}
              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                style={{ backgroundColor: "#16A34A20", color: "#4ADE80" }}>
                -15%
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Plans grid */}
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-5 mt-4">
        {PLANS.map((plan) => {
          const isCurrentPlan = plan.id === currentPlan;
          const price = annual ? Math.round(plan.price * (1 - annualDiscount)) : plan.price;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border transition-all duration-300 overflow-hidden
                ${plan.highlight ? "shadow-[0_0_40px_rgba(201,162,39,0.15)]" : ""}
                ${isCurrentPlan ? "ring-2" : ""}
              `}
              style={{
                borderColor: plan.highlight ? plan.color + "80" : plan.color + "30",
                background: `linear-gradient(160deg, ${plan.color}12, #0F1318 60%)`,
                outline: isCurrentPlan ? `2px solid ${plan.color}` : undefined,
              }}
            >
              {/* Most popular badge */}
              {plan.highlight && (
                <div
                  className="absolute top-0 left-0 right-0 text-center py-1.5 text-xs font-bold uppercase tracking-widest"
                  style={{ backgroundColor: plan.color, color: "#000" }}
                >
                  ⭐ Mais vendido
                </div>
              )}

              {/* Current plan badge */}
              {isCurrentPlan && (
                <div
                  className="absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: plan.color + "30", color: plan.color, border: `1px solid ${plan.color}50` }}
                >
                  Plano atual
                </div>
              )}

              <div className={`flex flex-col flex-1 p-6 ${plan.highlight ? "pt-10" : ""}`}>
                {/* Plan header */}
                <div className="mb-5">
                  <div className="text-4xl mb-2">{plan.emoji}</div>
                  <h2 className="text-xl font-black text-white tracking-wider">{plan.name}</h2>
                  <p className="text-xs text-white/40 mt-0.5">{plan.subtitle}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <span className="text-sm text-white/40 font-medium">R$</span>
                    <span className="text-4xl font-black text-white leading-none">
                      {price.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-sm text-white/40 mb-1">/mês</span>
                  </div>
                  {annual && (
                    <div className="text-xs text-white/30 mt-1">
                      <span className="line-through">R$ {plan.price.toLocaleString("pt-BR")}/mês</span>
                      {" "}
                      <span style={{ color: "#4ADE80" }}>economize 15%</span>
                    </div>
                  )}
                  
                </div>

                {/* Features */}
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span
                        className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px]"
                        style={{
                          backgroundColor: feature.included ? plan.color + "25" : "transparent",
                          color: feature.included ? plan.color : "#4B5563",
                          border: feature.included ? `1px solid ${plan.color}40` : "1px solid #374151",
                        }}
                      >
                        {feature.included ? "✓" : "×"}
                      </span>
                      <span
                        className={`text-sm leading-snug ${feature.included ? "text-white/80" : "text-white/25 line-through"}`}
                      >
                        {feature.label}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isCurrentPlan}
                  className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:cursor-default"
                  style={
                    isCurrentPlan
                      ? { backgroundColor: plan.color + "20", color: plan.color, border: `1px solid ${plan.color}40` }
                      : plan.highlight
                      ? { backgroundColor: plan.color, color: "#000" }
                      : { backgroundColor: plan.color + "20", color: plan.color, border: `1px solid ${plan.color}40` }
                  }
                  onMouseEnter={(e) => {
                    if (!isCurrentPlan && !plan.highlight) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = plan.color + "35";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrentPlan && !plan.highlight) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = plan.color + "20";
                    }
                  }}
                >
                  {isCurrentPlan ? "Plano atual" : "Contratar agora"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ / bottom section */}
      <div className="max-w-3xl mx-auto px-4 mt-12">
        <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
          <h3 className="text-base font-bold text-white mb-4">Perguntas frequentes</h3>
          <div className="space-y-4">
            {[
              {
                q: "Posso mudar de plano a qualquer momento?",
                a: "Sim! O upgrade é imediato. O downgrade é aplicado no próximo ciclo de cobrança.",
              },
              {
                q: "O que acontece se eu atingir o limite de lojas?",
                a: "O sistema avisa antes e bloqueia a criação de novas lojas. Você pode fazer upgrade a qualquer momento para desbloquear.",
              },
              {
                q: "As visitas presenciais do plano ÁGUIA são em todo o Brasil?",
                a: "Sim, realizamos visitas em todo o território nacional. Agendamento com antecedência de 15 dias.",
              },
              {
                q: "Existe período de teste gratuito?",
                a: "Sim, oferecemos 14 dias gratuitos para novos clientes. Entre em contato pelo WhatsApp para ativar.",
              },
            ].map((item, i) => (
              <div key={i} className="border-b border-white/8 pb-4 last:border-0 last:pb-0">
                <p className="text-sm font-semibold text-white/80 mb-1">{item.q}</p>
                <p className="text-sm text-white/40">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-6 text-center">
          <p className="text-white/40 text-sm mb-3">Ainda tem dúvidas? Fale com um consultor FAREJO</p>
          <button
            onClick={() => window.open("https://wa.me/5519997537883?text=Olá, quero saber mais sobre os planos FAREJO!", "_blank")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 hover:opacity-90"
            style={{ backgroundColor: "#25D366", color: "#fff" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Falar no WhatsApp
          </button>
        </div>
      </div>

      {/* Upgrade modal */}
      {showUpgradeFor && (
        <UpgradeModal
          currentPlan={showUpgradeFor}
          onClose={() => setShowUpgradeFor(null)}
          onSelectPlan={(plan) => {
            setShowUpgradeFor(null);
            handleSelectPlan(plan);
          }}
        />
      )}
    </div>
  );
}

// ─── Export upgrade trigger for use in other components ───────────────────────
export { UpgradeModal };
