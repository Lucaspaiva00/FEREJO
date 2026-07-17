import React from "react";
import { useApp } from "@/contexts/AppContext";

export default function TenantSelector() {
  const { user, activeTenantId, setActiveTenantId } = useApp();

  if (!user || user.role === "admin") return null;
  if (!user.tenants || user.tenants.length <= 1) return null;

  return (
    <div className="bg-[#0B0F14] border-b border-[#C9A227]/20 px-4 py-2">
      <div className="max-w-6xl mx-auto flex items-center gap-2 flex-wrap">
        <span className="text-white/40 text-xs uppercase tracking-widest mr-1">Cliente:</span>
        {user.tenants.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTenantId(t.id)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-150 ${
              activeTenantId === t.id
                ? "bg-[#C9A227] text-black border-[#C9A227]"
                : "border-white/20 text-white/60 hover:border-[#C9A227]/50 hover:text-white/90"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>
    </div>
  );
}
