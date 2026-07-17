import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/contexts/AppContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import confetti from "canvas-confetti";
import Testimonials from "./Testimonials";

// ─── Icon map ─────────────────────────────────────────────────────────────────
const ICONS: Record<string, React.ReactNode> = {
  newspaper: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/>
      <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>
    </svg>
  ),
  quote: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
    </svg>
  ),
  calendar: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  share: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  ),
  star: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  store: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  map: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 00-8 8c0 5.25 8 14 8 14s8-8.75 8-14a8 8 0 00-8-8z"/>
    </svg>
  ),
};

type Strategy = {
  id: number;
  title: string;
  description: string;
  points: number;
  icon: string;
  orderIdx: number;
  completed: boolean;
};

// ─── Strategy Card ─────────────────────────────────────────────────────────────
function StrategyCard({ strategy, onOpen }: { strategy: Strategy; onOpen: (s: Strategy) => void }) {
  return (
    <button
      onClick={() => onOpen(strategy)}
      className={`group relative w-full text-left rounded-2xl border transition-all duration-200 p-5 flex flex-col gap-3 cursor-pointer
        ${strategy.completed
          ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800"
          : "bg-card border-border hover:border-[#C9A227]/60 hover:shadow-md hover:-translate-y-0.5"
        }`}
    >
      {/* Completed badge */}
      {strategy.completed && (
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          Concluída
        </div>
      )}

      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors
        ${strategy.completed ? "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400" : "bg-[#C9A227]/10 text-[#C9A227] group-hover:bg-[#C9A227]/20"}`}>
        {ICONS[strategy.icon] ?? ICONS.star}
      </div>

      {/* Title */}
      <div className="flex-1">
        <h3 className={`font-bold text-sm leading-snug ${strategy.completed ? "text-green-700 dark:text-green-400 line-through opacity-70" : "text-foreground"}`}>
          {strategy.title}
        </h3>
      </div>

      {/* Points badge */}
      <div className={`flex items-center gap-1.5 mt-auto
        ${strategy.completed ? "text-green-600 dark:text-green-400" : "text-[#C9A227]"}`}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <span className="text-xs font-bold">{strategy.points} pts</span>
        <span className="text-xs text-muted-foreground ml-auto">Clique para abrir →</span>
      </div>
    </button>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Strategies() {
  const { activeTenantId } = useApp();
  const [selected, setSelected] = useState<Strategy | null>(null);
  const prevCompletedRef = useRef(0);

  const { data: strategies = [], refetch } = trpc.strategies.list.useQuery(
    { tenantId: activeTenantId! },
    { enabled: !!activeTenantId }
  );

  const completeMutation = trpc.strategies.complete.useMutation({
    onSuccess: () => {
      refetch();
      setSelected(null);
      toast.success("Estratégia concluída! 🎉");
    },
    onError: (e) => toast.error(e.message),
  });

  const uncompleteMutation = trpc.strategies.uncomplete.useMutation({
    onSuccess: () => {
      refetch();
      setSelected(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const typedStrategies = strategies as Strategy[];
  const totalPoints = typedStrategies.reduce((acc, s) => acc + (s.completed ? s.points : 0), 0);
  const maxPoints = typedStrategies.reduce((acc, s) => acc + s.points, 0);
  const completedCount = typedStrategies.filter((s) => s.completed).length;

  // Confetti when all strategies are done
  useEffect(() => {
    if (strategies.length > 0 && completedCount === strategies.length && prevCompletedRef.current !== strategies.length) {
      const fire = (ratio: number, opts: confetti.Options) =>
        confetti({ ...opts, origin: { y: 0.5 }, disableForReducedMotion: true, particleCount: Math.floor(250 * ratio) });
      fire(0.25, { spread: 26, startVelocity: 55, colors: ["#C9A227", "#E8C84A", "#fff"] });
      fire(0.2, { spread: 60, colors: ["#C9A227", "#9A7A1A", "#fff"] });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ["#C9A227", "#E8C84A", "#22c55e"] });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ["#C9A227", "#fff"] });
      fire(0.1, { spread: 120, startVelocity: 45, colors: ["#C9A227", "#E8C84A"] });
    }
    prevCompletedRef.current = completedCount;
  }, [completedCount, strategies.length]);

  if (!activeTenantId) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Selecione um cliente para ver as estratégias.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Estratégias de Marketing</h1>
            <p className="text-sm text-muted-foreground mt-1">Complete as estratégias abaixo para acumular pontos e fortalecer sua marca.</p>
          </div>
          {/* Score badge */}
          <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-5 py-3">
            <div className="text-center">
              <div className="text-2xl font-black text-[#C9A227]">{totalPoints}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">pontos</div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-black text-foreground">{completedCount}<span className="text-sm font-normal text-muted-foreground">/{strategies.length}</span></div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">concluídas</div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {maxPoints > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Progresso</span>
              <span className="text-xs font-bold text-[#C9A227]">{Math.round((totalPoints / maxPoints) * 100)}%</span>
            </div>
            <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.round((totalPoints / maxPoints) * 100)}%`,
                  background: completedCount === strategies.length
                    ? "linear-gradient(90deg, #22c55e, #16a34a)"
                    : "linear-gradient(90deg, #C9A227, #E8C84A)",
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {typedStrategies.map((s) => (
          <StrategyCard key={s.id} strategy={s} onOpen={setSelected} />
        ))}
      </div>

      {/* Testimonials section */}
      <Testimonials />

      {/* Detail Modal */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-1">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
                    ${selected.completed ? "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400" : "bg-[#C9A227]/10 text-[#C9A227]"}`}>
                    {ICONS[selected.icon] ?? ICONS.star}
                  </div>
                  <div>
                    <DialogTitle className="text-base leading-snug">{selected.title}</DialogTitle>
                    <div className={`flex items-center gap-1 mt-0.5 ${selected.completed ? "text-green-600" : "text-[#C9A227]"}`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      <span className="text-xs font-bold">{selected.points} pontos</span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <p className="text-sm text-muted-foreground leading-relaxed">{selected.description}</p>

              {selected.completed && (
                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 flex-shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                  <span className="text-xs font-semibold text-green-700 dark:text-green-400">Esta estratégia foi concluída e os pontos foram contabilizados.</span>
                </div>
              )}

              <DialogFooter className="gap-2 flex-row justify-end">
                {selected.completed ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => uncompleteMutation.mutate({ strategyId: selected.id, tenantId: activeTenantId! })}
                    disabled={uncompleteMutation.isPending}
                  >
                    Desfazer conclusão
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="bg-[#C9A227] hover:bg-[#B8911E] text-black font-bold"
                    onClick={() => completeMutation.mutate({ strategyId: selected.id, tenantId: activeTenantId! })}
                    disabled={completeMutation.isPending}
                  >
                    {completeMutation.isPending ? "Salvando..." : "✓ Marcar como concluída"}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
