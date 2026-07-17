import { useState } from "react";

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconHeadset = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18v-6a9 9 0 0118 0v6"/>
    <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/>
  </svg>
);
const IconWhatsApp = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);
const IconPhone = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/>
  </svg>
);
const IconVideo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);
const IconX = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

// ─── Support Button ───────────────────────────────────────────────────────────
export default function SupportButton() {
  const [open, setOpen] = useState(false);

  const WHATSAPP_NUMBER = "5519997537883";
  const WHATSAPP_MESSAGE = encodeURIComponent("Olá, eu preciso de suporte.");
  const PHONE_NUMBER = "tel:+5519997537883";
  const VIDEO_LINK = ""; // Configurar link de videoconferência quando disponível

  const options = [
    {
      icon: <IconWhatsApp />,
      label: "Chat no WhatsApp",
      sublabel: WHATSAPP_NUMBER ? "Resposta imediata" : "Em breve",
      color: WHATSAPP_NUMBER ? "bg-green-500 hover:bg-green-600 text-white" : "bg-green-500/40 text-white/60 cursor-not-allowed",
      href: WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}` : undefined,
      highlight: true,
    },
    {
      icon: <IconPhone />,
      label: "Ligação telefônica",
      sublabel: PHONE_NUMBER ? "Até 20 minutos" : "Em breve",
      color: "bg-card hover:bg-muted text-foreground border border-border",
      href: PHONE_NUMBER || undefined,
      highlight: false,
    },
    {
      icon: <IconVideo />,
      label: "Videoconferência",
      sublabel: VIDEO_LINK ? "Até 20 minutos" : "Em breve",
      color: "bg-card hover:bg-muted text-foreground border border-border",
      href: VIDEO_LINK || undefined,
      highlight: false,
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Options panel */}
      {open && (
        <div
          className="bg-card border border-border rounded-2xl shadow-2xl p-4 w-72 animate-in slide-in-from-bottom-4 fade-in duration-200"
          style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}
        >
          {/* Header */}
          <div className="mb-3 pb-3 border-b border-border">
            <p className="font-bold text-sm text-foreground">Suporte FAREJO</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Atendimento via grupo do WhatsApp tende a ter resposta imediata. Suporte por ligação ou videoconferência: até 20 minutos.
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2">
            {options.map((opt) => (
              <a
                key={opt.label}
                href={opt.href ?? "#"}
                target={opt.href ? "_blank" : undefined}
                rel="noopener noreferrer"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${opt.color}`}
                onClick={(e) => { if (!opt.href) e.preventDefault(); else setOpen(false); }}
              >
                <span className="flex-shrink-0">{opt.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight">{opt.label}</p>
                  <p className={`text-xs leading-tight ${opt.highlight ? "text-green-100" : "text-muted-foreground"}`}>
                    {opt.sublabel}
                  </p>
                </div>
                {opt.highlight && (
                  <span className="text-xs bg-white/20 text-white px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">
                    Recomendado
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={[
          "w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200",
          "active:scale-95",
          open
            ? "bg-foreground text-background"
            : "bg-[#C9A227] text-black hover:bg-[#E8C84A]",
        ].join(" ")}
        aria-label="Suporte"
        title="Suporte FAREJO"
      >
        {open ? <IconX /> : <IconHeadset />}
      </button>
    </div>
  );
}
