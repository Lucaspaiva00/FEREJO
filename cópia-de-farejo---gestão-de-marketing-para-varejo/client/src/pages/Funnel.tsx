import React from "react";

const STAGES = [
  {
    id: "impactado",
    label: "Impactado",
    description: "Alcance total da comunicação",
    gradient: "from-[#C9A227] to-[#E8C84A]",
    textColor: "text-black",
    widthPct: 100,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
      </svg>
    ),
  },
  {
    id: "visita",
    label: "Visita",
    description: "Clientes que visitaram a loja",
    gradient: "from-[#B8891E] to-[#C9A227]",
    textColor: "text-black",
    widthPct: 82,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    id: "compra_mais",
    label: "Compra Mais",
    description: "Clientes com ticket médio elevado",
    gradient: "from-[#A07818] to-[#B8891E]",
    textColor: "text-white",
    widthPct: 64,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
      </svg>
    ),
  },
  {
    id: "baixa_app",
    label: "Baixa App",
    description: "Clientes que instalaram o aplicativo",
    gradient: "from-[#886012] to-[#A07818]",
    textColor: "text-white",
    widthPct: 48,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
      </svg>
    ),
  },
  {
    id: "retorna",
    label: "Retorna",
    description: "Clientes recorrentes e fiéis",
    gradient: "from-[#6B4C0E] to-[#886012]",
    textColor: "text-white",
    widthPct: 34,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
      </svg>
    ),
  },
  {
    id: "indica",
    label: "Indica",
    description: "Promotores e embaixadores da marca",
    gradient: "from-[#4A3408] to-[#6B4C0E]",
    textColor: "text-white",
    widthPct: 20,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
];

export default function Funnel() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold uppercase tracking-widest mb-2">Funil do Cliente</h1>
        <p className="text-muted-foreground text-sm">Jornada completa do consumidor — do impacto à indicação</p>
        <div className="mt-3 inline-block border border-[#C9A227]/40 text-[#C9A227] text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full">
          Método Burst · JBC Brasil
        </div>
      </div>

      {/* Funnel */}
      <div className="flex flex-col items-center gap-1">
        {STAGES.map((stage, idx) => (
          <div
            key={stage.id}
            className="relative flex items-center justify-center"
            style={{ width: `max(${stage.widthPct}%, min(100%, 240px))` }}
          >
            {/* Stage bar */}
            <div
              className={`w-full relative overflow-hidden rounded-lg bg-gradient-to-r ${stage.gradient} shadow-md hover:shadow-lg transition-shadow duration-200 cursor-default`}
              style={{ clipPath: idx < STAGES.length - 1 ? "polygon(0 0, 100% 0, 95% 100%, 5% 100%)" : undefined }}
            >
              <div className={`flex items-center gap-4 px-6 py-4 ${stage.textColor}`}>
                {/* Icon */}
                <div className="flex-shrink-0 opacity-90">{stage.icon}</div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg tracking-wide uppercase">{stage.label}</p>
                  <p className="text-sm opacity-75 font-medium">{stage.description}</p>
                </div>
                {/* Step number */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {STAGES.map((stage) => (
          <div key={stage.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${stage.gradient} flex-shrink-0`} />
            <div>
              <p className="text-sm font-bold">{stage.label}</p>
              <p className="text-xs text-muted-foreground">{stage.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Methodology note */}
      <div className="mt-8 bg-[#0B0F14] dark:bg-[#060809] rounded-xl p-5 text-center">
        <p className="text-[#C9A227] font-bold text-sm uppercase tracking-widest mb-2">Método Burst</p>
        <p className="text-white/60 text-sm leading-relaxed">
          O funil representa a jornada completa do consumidor no varejo. Cada etapa é trabalhada com ações específicas de marketing para maximizar a conversão e o valor do cliente ao longo do tempo.
        </p>
        <p className="text-white/30 text-xs mt-3 uppercase tracking-widest">FAREJO · Brasil de Lojas Lotadas</p>
      </div>
    </div>
  );
}
