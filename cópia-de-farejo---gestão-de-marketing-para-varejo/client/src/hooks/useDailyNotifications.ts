import { useEffect, useRef } from "react";
import { toast } from "sonner";

// ─── Mensagens rotativas com linguagem de consultor de marketing ──────────────
const MORNING_MESSAGES = [
  "Bom dia! Sua lista de tarefas está esperando. Cada pendência resolvida hoje é um passo a mais em direção ao resultado.",
  "Comece o dia com foco: revise suas tarefas pendentes e priorize o que gera mais impacto para o seu cliente.",
  "Consultores de alta performance começam o dia com clareza. Quais tarefas você vai zerar hoje?",
  "O mercado não espera. Revise seu checklist agora e mantenha a execução no ritmo certo.",
  "Bom dia! Tarefas pendentes são oportunidades não aproveitadas. Que tal começar a mudar isso agora?",
  "Cada tarefa concluída é um sinal de que sua operação está evoluindo. Vamos zerar o checklist hoje?",
  "A diferença entre uma boa semana e uma semana excelente está nas tarefas que você executa hoje de manhã.",
  "Seu cliente conta com você. Verifique as pendências e mantenha a entrega em dia.",
];

const AFTERNOON_MESSAGES = [
  "Já passou do meio-dia. Como está seu checklist? Ainda há tempo para fechar as tarefas mais importantes do dia.",
  "Pausa estratégica: revise o que foi feito e o que ainda precisa de atenção até o fim do expediente.",
  "Consultores eficientes revisam o progresso no meio do dia. Quais tarefas ainda estão em aberto?",
  "A tarde é o momento certo para acelerar. Finalize as pendências antes que virem urgências amanhã.",
  "Verifique seu checklist agora: tarefas adiadas hoje viram problemas amanhã.",
  "Metade do dia passou. Sua execução está no ritmo? Revise as pendências e ajuste o plano.",
  "Lembrete de consultor: tarefas em andamento precisam de atenção agora para serem concluídas hoje.",
  "Ainda há tempo para um dia produtivo. Revise o checklist e feche as tarefas prioritárias.",
];

const STORAGE_KEY_MORNING = "farejo_notif_morning";
const STORAGE_KEY_AFTERNOON = "farejo_notif_afternoon";
const STORAGE_KEY_MSG_INDEX = "farejo_notif_msg_index";

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function getNextMessageIndex(): number {
  const raw = localStorage.getItem(STORAGE_KEY_MSG_INDEX);
  const current = raw ? parseInt(raw, 10) : 0;
  const next = (current + 1) % MORNING_MESSAGES.length;
  localStorage.setItem(STORAGE_KEY_MSG_INDEX, String(next));
  return current;
}

export function useDailyNotifications(enabled = true) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    function checkAndNotify() {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const todayKey = getTodayKey();

      // Morning: 7:00
      if (hours === 7 && minutes === 0) {
        const lastMorning = localStorage.getItem(STORAGE_KEY_MORNING);
        if (lastMorning !== todayKey) {
          localStorage.setItem(STORAGE_KEY_MORNING, todayKey);
          const idx = getNextMessageIndex();
          toast(MORNING_MESSAGES[idx % MORNING_MESSAGES.length], {
            duration: 8000,
            description: "Lembrete matinal — FAREJO",
          });
        }
      }

      // Afternoon: 13:30
      if (hours === 13 && minutes === 30) {
        const lastAfternoon = localStorage.getItem(STORAGE_KEY_AFTERNOON);
        if (lastAfternoon !== todayKey) {
          localStorage.setItem(STORAGE_KEY_AFTERNOON, todayKey);
          const idx = getNextMessageIndex();
          toast(AFTERNOON_MESSAGES[idx % AFTERNOON_MESSAGES.length], {
            duration: 8000,
            description: "Lembrete de tarde — FAREJO",
          });
        }
      }
    }

    // Check every minute
    intervalRef.current = setInterval(checkAndNotify, 60 * 1000);
    // Also check immediately on mount (in case user opens app at exactly the right time)
    checkAndNotify();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled]);
}

// ─── Utility: preview a notification immediately (for testing) ────────────────
export function previewDailyNotification(type: "morning" | "afternoon") {
  const idx = parseInt(localStorage.getItem(STORAGE_KEY_MSG_INDEX) ?? "0", 10);
  const messages = type === "morning" ? MORNING_MESSAGES : AFTERNOON_MESSAGES;
  toast(messages[idx % messages.length], {
    duration: 8000,
    description: type === "morning" ? "Lembrete matinal — FAREJO" : "Lembrete de tarde — FAREJO",
  });
}
