import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const BANNER_URL = "/manus-storage/login-bg_d6152c05.png";
const LOGO_URL = "/manus-storage/farejo-logo_3338acb7.png";

// ─── Animated particles canvas ───────────────────────────────────────────────
function ParticlesCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number; da: number }[] = [];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    for (let i = 0; i < 55; i++) {
      particles.push({ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, r: Math.random() * 1.8 + 0.4, alpha: Math.random() * 0.5 + 0.1, da: (Math.random() - 0.5) * 0.003 });
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.alpha += p.da;
        if (p.alpha <= 0.05 || p.alpha >= 0.65) p.da *= -1;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201,162,39,${p.alpha})`; ctx.fill();
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x; const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) { ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.strokeStyle = `rgba(201,162,39,${0.12 * (1 - dist / 110)})`; ctx.lineWidth = 0.5; ctx.stroke(); }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconGoogle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);

const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconEye = ({ show }: { show: boolean }) => show ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

// ─── Email/Password Login Form ────────────────────────────────────────────────
function EmailLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const loginMutation = trpc.auth.emailLogin.useMutation({
    onSuccess: () => { window.location.href = "/"; },
    onError: (err: { message?: string }) => { toast.error(err.message || "Email ou senha incorretos"); setLoading(false); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    loginMutation.mutate({ email: email.trim(), password });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"><IconMail /></span>
        <Input
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="pl-9 bg-white/5 border-white/15 text-white placeholder:text-white/25 focus:border-[#C9A227]/60 h-11"
          required
          autoComplete="email"
        />
      </div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"><IconLock /></span>
        <Input
          type={showPw ? "text" : "password"}
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="pl-9 pr-10 bg-white/5 border-white/15 text-white placeholder:text-white/25 focus:border-[#C9A227]/60 h-11"
          required
          autoComplete="current-password"
        />
        <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
          <IconEye show={showPw} />
        </button>
      </div>
      <Button
        type="submit"
        disabled={loading || !email.trim() || !password}
        className="w-full h-11 font-bold text-sm tracking-wider transition-all active:scale-[0.97]"
        style={{ backgroundColor: "#C9A227", color: "#000" }}
      >
        {loading ? (
          <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />Entrando...</span>
        ) : "Entrar"}
      </Button>
    </form>
  );
}

// ─── Email/Password Register Form ─────────────────────────────────────────────
function EmailRegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const registerMutation = trpc.auth.emailRegister.useMutation({
    onSuccess: () => {
      toast.success("Conta criada! Faça login para continuar.");
      onSuccess();
      setLoading(false);
    },
    onError: (err: { message?: string }) => { toast.error(err.message || "Erro ao criar conta"); setLoading(false); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) return;
    if (password !== confirm) { toast.error("As senhas não coincidem"); return; }
    if (password.length < 6) { toast.error("A senha deve ter pelo menos 6 caracteres"); return; }
    setLoading(true);
    registerMutation.mutate({ name: name.trim(), email: email.trim(), password });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"><IconUser /></span>
        <Input
          type="text"
          placeholder="Seu nome completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="pl-9 bg-white/5 border-white/15 text-white placeholder:text-white/25 focus:border-[#C9A227]/60 h-11"
          required
          autoComplete="name"
        />
      </div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"><IconMail /></span>
        <Input
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="pl-9 bg-white/5 border-white/15 text-white placeholder:text-white/25 focus:border-[#C9A227]/60 h-11"
          required
          autoComplete="email"
        />
      </div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"><IconLock /></span>
        <Input
          type={showPw ? "text" : "password"}
          placeholder="Senha (mín. 6 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="pl-9 pr-10 bg-white/5 border-white/15 text-white placeholder:text-white/25 focus:border-[#C9A227]/60 h-11"
          required
          autoComplete="new-password"
        />
        <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
          <IconEye show={showPw} />
        </button>
      </div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"><IconLock /></span>
        <Input
          type={showPw ? "text" : "password"}
          placeholder="Confirmar senha"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={`pl-9 bg-white/5 border-white/15 text-white placeholder:text-white/25 focus:border-[#C9A227]/60 h-11 ${confirm && confirm !== password ? "border-red-500/60" : ""}`}
          required
          autoComplete="new-password"
        />
      </div>
      {confirm && confirm !== password && (
        <p className="text-red-400 text-xs -mt-1">As senhas não coincidem</p>
      )}
      <Button
        type="submit"
        disabled={loading || !name.trim() || !email.trim() || !password || password !== confirm}
        className="w-full h-11 font-bold text-sm tracking-wider transition-all active:scale-[0.97]"
        style={{ backgroundColor: "#C9A227", color: "#000" }}
      >
        {loading ? (
          <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />Criando conta...</span>
        ) : "Criar conta"}
      </Button>
    </form>
  );
}

// ─── Main Login Page ──────────────────────────────────────────────────────────
export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <div
      className="relative overflow-hidden"
      style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}
    >
      {/* Background — Ken Burns */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${BANNER_URL})`,
          animation: "bgKenBurns 22s ease-in-out infinite alternate",
          transformOrigin: "center center",
        }}
      />
      {/* Overlay: left heavy for brand legibility, right lighter for image */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/88 via-black/60 to-black/35" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/15" />

      {/* Right panel dark glass — behind the card column */}
      <div className="hidden md:block absolute right-0 top-0 bottom-0 w-[420px] lg:w-[480px] bg-black/40 backdrop-blur-md pointer-events-none" />

      {/* Particles */}
      <ParticlesCanvas />

      {/* Scan line */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A227]/25 to-transparent"
          style={{ animation: "scanLine 10s linear infinite", top: "40%" }}
        />
      </div>

      {/* Main layout — full viewport height split */}
      <div
        className="relative z-10 flex flex-col md:flex-row"
        style={{ minHeight: "100dvh" }}
      >
        {/* ── Left: Brand ── */}
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-20 py-14 md:py-0 text-white items-center md:items-start text-center md:text-left">
          {/* Logo — 30% bigger than before */}
          <img
            src={LOGO_URL}
            alt="FAREJO"
            className="w-auto object-contain mb-8 drop-shadow-2xl"
            style={{ height: "clamp(4rem, 8vw, 7.5rem)", filter: "brightness(0) invert(1)" }}
          />

          {/* Tagline */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-[3px] bg-[#C9A227] self-stretch min-h-[72px] flex-shrink-0 hidden md:block rounded-full" />
            <div className="flex flex-col gap-1.5">
              <p className="text-white/75 text-xl sm:text-2xl lg:text-3xl font-semibold tracking-widest uppercase leading-tight">Inteligência.</p>
              <p
                className="text-[#C9A227] text-xl sm:text-2xl lg:text-3xl font-black tracking-widest uppercase leading-tight"
                style={{ textShadow: "0 0 40px rgba(201,162,39,0.55)" }}
              >Velocidade.</p>
              <p className="text-white/75 text-xl sm:text-2xl lg:text-3xl font-semibold tracking-widest uppercase leading-tight">Resultado.</p>
            </div>
          </div>

          <p className="text-white/40 text-sm lg:text-base leading-relaxed max-w-sm hidden md:block">
            Portal de gestão centralizada de marketing para o setor de varejo. Campanhas, métricas e equipe em um só lugar.
          </p>

          <div className="mt-8 hidden md:flex items-center gap-3">
            <div className="h-px w-12 bg-[#C9A227]/40" />
            <span className="text-white/20 text-xs tracking-widest uppercase">Método Burst</span>
            <div className="h-px flex-1 max-w-24 bg-[#C9A227]/20" />
          </div>
        </div>

        {/* ── Right: Auth card ── */}
        <div
          className="w-full md:w-[420px] lg:w-[480px] flex-shrink-0 flex flex-col justify-center px-6 sm:px-10 md:px-10 lg:px-12 py-10 md:py-0"
        >
          {/* Gold shimmer stripe */}
          <div className="gold-shimmer-stripe rounded-t-xl" />

          <div
            className="bg-black/80 backdrop-blur-2xl border border-[#C9A227]/25 border-t-0 rounded-b-xl shadow-2xl overflow-hidden"
            style={{ boxShadow: "0 30px 70px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,162,39,0.12)" }}
          >
            {/* Mode tabs */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setMode("login")}
                className={`flex-1 py-3.5 text-sm font-bold tracking-wider uppercase transition-colors ${mode === "login" ? "text-[#C9A227] border-b-2 border-[#C9A227]" : "text-white/30 hover:text-white/60"}`}
              >
                Entrar
              </button>
              <button
                onClick={() => setMode("register")}
                className={`flex-1 py-3.5 text-sm font-bold tracking-wider uppercase transition-colors ${mode === "register" ? "text-[#C9A227] border-b-2 border-[#C9A227]" : "text-white/30 hover:text-white/60"}`}
              >
                Cadastrar
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              {mode === "login" ? (
                <EmailLoginForm />
              ) : (
                <EmailRegisterForm onSuccess={() => setMode("login")} />
              )}

              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-white/10" />
                <span className="text-white/25 text-xs uppercase tracking-widest">ou</span>
                <div className="flex-1 border-t border-white/10" />
              </div>

              <Button
                className="w-full bg-white hover:bg-white/90 text-gray-800 font-semibold flex items-center gap-2 justify-center h-11 text-sm transition-all active:scale-[0.97]"
                asChild
              >
                <a href={getLoginUrl()}>
                  <IconGoogle />
                  {mode === "login" ? "Entrar com Google" : "Cadastrar com Google"}
                </a>
              </Button>

              <div className="flex items-center gap-2 justify-center">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#C9A227]/50">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <p className="text-white/20 text-xs">Acesso seguro via OAuth 2.0</p>
              </div>
            </div>
          </div>

          <p className="text-white/15 text-xs text-center mt-4 tracking-widest uppercase">
            FAREJO · Gestão de Marketing para Varejo
          </p>
        </div>
      </div>

      <style>{`
        @keyframes scanLine {
          0% { transform: translateY(-100px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(calc(100vh + 100px)); opacity: 0; }
        }
        @keyframes bgKenBurns {
          0%   { transform: scale(1.0) translate(0%, 0%); }
          25%  { transform: scale(1.06) translate(-1%, 0.5%); }
          50%  { transform: scale(1.04) translate(0.5%, -1%); }
          75%  { transform: scale(1.07) translate(-0.5%, 1%); }
          100% { transform: scale(1.05) translate(1%, -0.5%); }
        }
      `}</style>
    </div>
  );
}
