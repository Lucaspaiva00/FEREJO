import React, { useState, useEffect, useMemo, useRef } from "react";
import { useApp } from "@/contexts/AppContext";
import { useRealtime } from "@/contexts/RealtimeContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import confetti from "canvas-confetti";

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconShare = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>;
const IconDoc = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
const IconChat = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>;
const IconBroadcast = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" /></svg>;
const IconCalendar = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const IconStar = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
const IconChart = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>;
const IconList = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>;
const IconKanban = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="5" height="18" /><rect x="10" y="3" width="5" height="11" /><rect x="17" y="3" width="5" height="15" /></svg>;
const IconPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
const IconTrash = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>;
const IconChevron = ({ open }: { open: boolean }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms" }}><polyline points="6 9 12 15 18 9" /></svg>;
const IconFilter = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>;

const ICON_MAP: Record<string, React.ReactNode> = {
  share: <IconShare />, document: <IconDoc />, chat: <IconChat />, broadcast: <IconBroadcast />,
  calendar: <IconCalendar />, star: <IconStar />, chart: <IconChart />, list: <IconList />,
};

const PRIORITY_LABELS: Record<string, string> = { urgent: "Urgente", week: "Essa semana", later: "Próximas" };
const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-500/15 text-red-600 border-red-500/30",
  week: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  later: "bg-gray-500/15 text-gray-500 border-gray-500/30",
};
const STATUS_LABELS: Record<string, string> = { pending: "Pendente", in_progress: "Em andamento", done: "Concluída" };
const STATUS_COLORS: Record<string, string> = {
  pending: "border-gray-400 bg-transparent",
  in_progress: "border-[#C9A227] bg-[#C9A227]/20",
  done: "border-green-500 bg-green-500",
};
const STATUS_CYCLE: Record<string, string> = { pending: "in_progress", in_progress: "done", done: "pending" };

type Task = { id: number; tenantId: number; categoryId: number | null; name: string; status: "pending" | "in_progress" | "done"; priority: "urgent" | "week" | "later"; responsible: string | null; responsibleUserId: number | null; position: number | null; alertCampaignId: number | null; alertDaysBefore: number | null; recurrence: "once" | "daily" | "weekly" | null; imageUrl: string | null; link: string | null; recurringDays: string | null; createdAt: Date; updatedAt: Date; };

const IconRepeat = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" /></svg>;
const IconLink = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>;
const IconImage = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>;
const IconSort = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>;

// Alert badge config
const ALERT_BADGE: Record<number, { label: string; classes: string }> = {
  7: { label: "7d", classes: "bg-red-500 text-white border-red-600" },
  15: { label: "15d", classes: "bg-amber-500 text-black border-amber-600" },
  45: { label: "45d", classes: "bg-sky-500/20 text-sky-600 border-sky-500/50" },
};

function AlertBadge({ daysBefore }: { daysBefore: number | null }) {
  if (!daysBefore) return null;
  const cfg = ALERT_BADGE[daysBefore];
  if (!cfg) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded border ${cfg.classes}`}
      title={`Alerta automático: campanha inicia em ${daysBefore} dias`}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
      {cfg.label}
    </span>
  );
}
type Category = { id: number; tenantId: number; title: string; icon: string | null; position: number | null; createdAt: Date; };

// Auto-detect category by keyword
function detectCategory(name: string, categories: Category[]): number | null {
  const lower = name.toLowerCase();
  const keywords: Record<string, string[]> = {
    "Redes Sociais": ["instagram", "facebook", "tiktok", "post", "reels", "stories", "social"],
    "Encartes e Ofertas": ["encarte", "oferta", "desconto", "promoção", "panfleto", "tabloide"],
    "Relacionamento CRM": ["crm", "cliente", "fidelidade", "app", "cadastro", "whatsapp", "mensagem"],
    "Midia Offline": ["outdoor", "rádio", "tv", "jornal", "banner", "faixa", "placa"],
    "Eventos e Acoes": ["evento", "ação", "degustação", "feira", "festa", "show", "promoção"],
    "Reputacao Online": ["google", "review", "avaliação", "reputação", "nota", "estrela"],
    "Geracao de Demanda": ["campanha", "ads", "tráfego", "lead", "conversão", "meta"],
  };
  for (const [catTitle, kws] of Object.entries(keywords)) {
    if (kws.some((kw) => lower.includes(kw))) {
      const cat = categories.find((c) => c.title.toLowerCase() === catTitle.toLowerCase());
      if (cat) return cat.id;
    }
  }
  return null;
}

export default function Checklist() {
  const { user, activeTenantId, setActiveTenantId } = useApp();
  const { subscribe, broadcast } = useRealtime();
  const isReadOnly = user?.role === "client"; // client can't create/edit tasks
  const canManageCategories = true; // all roles can manage their own categories
  const [view, setView] = useState<"list" | "kanban">("list");
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"urgent" | "week" | "later">("week");
  const [newTaskCategory, setNewTaskCategory] = useState<string>("auto");
  const [
    newTaskResponsibleUserId,
    setNewTaskResponsibleUserId,
  ] = useState("none");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterResponsible, setFilterResponsible] = useState("");
  const [sortBy, setSortBy] = useState("category");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [renamingCatId, setRenamingCatId] = useState<number | null>(null);
  const [renamingCatValue, setRenamingCatValue] = useState("");
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickAddStatus, setQuickAddStatus] = useState<Task["status"]>("pending");
  const [quickAddName, setQuickAddName] = useState("");
  const [quickAddPriority, setQuickAddPriority] = useState<"urgent" | "week" | "later">("week");
  const [newTaskRecurrence, setNewTaskRecurrence] = useState<"once" | "daily" | "weekly">("once");
  const [newTaskLink, setNewTaskLink] = useState("");
  const [newTaskRecurringDays, setNewTaskRecurringDays] = useState<number[]>([]);
  const [quickAddRecurrence, setQuickAddRecurrence] = useState<"once" | "daily">("once");
  const [confirmDeleteTask, setConfirmDeleteTask] = useState<Task | null>(null);
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<Category | null>(null);
  const [taskImageFile, setTaskImageFile] = useState<File | null>(null);
  const [taskImageUploading, setTaskImageUploading] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState({ name: "", priority: "week" as Task["priority"], responsible: "", responsibleUserId: "none", recurrence: "once" as "once" | "daily" | "weekly", imageFile: null as File | null, imageUrl: null as string | null, link: "", recurringDays: [] as number[] });

  const { data: categories = [], refetch: refetchCats } = trpc.categories.list.useQuery(
    { tenantId: activeTenantId! }, { enabled: !!activeTenantId }
  );
  const { data: tasks = [], refetch: refetchTasks } = trpc.tasks.list.useQuery(
    { tenantId: activeTenantId! }, { enabled: !!activeTenantId }
  );

  // Fetch tenant users for avatar display on responsible field
  const { data: tenantUsers = [] } = trpc.profile.tenantUsers.useQuery(
    { tenantId: activeTenantId! }, { enabled: !!activeTenantId }
  );
  // Map name -> { id, avatarUrl } for quick lookup
  const responsibleAvatarMap = useMemo(() => {
    const map = new Map<string, { id: number; avatarUrl: string | null }>();
    (tenantUsers as { id: number; name: string | null; avatarUrl: string | null }[]).forEach((u) => {
      if (u.name) map.set(u.name.trim().toLowerCase(), { id: u.id, avatarUrl: u.avatarUrl });
    });
    return map;
  }, [tenantUsers]);

  const createTaskMutation = trpc.tasks.create.useMutation({
    onSuccess: () => { refetchTasks(); broadcast({ type: "tasks", tenantId: activeTenantId!, action: "created" }); },
    onError: () => toast.error("Erro ao criar tarefa"),
  });
  const updateTaskMutation = trpc.tasks.update.useMutation({
    onSuccess: () => { refetchTasks(); broadcast({ type: "tasks", tenantId: activeTenantId!, action: "updated" }); },
    onError: () => toast.error("Erro ao atualizar"),
  });
  const deleteTaskMutation = trpc.tasks.delete.useMutation({
    onSuccess: () => { refetchTasks(); broadcast({ type: "tasks", tenantId: activeTenantId!, action: "deleted" }); },
    onError: () => toast.error("Erro ao remover"),
  });
  const createCatMutation = trpc.categories.create.useMutation({
    onSuccess: () => { refetchCats(); setShowCatModal(false); setNewCatName(""); broadcast({ type: "categories", tenantId: activeTenantId!, action: "created" }); },
    onError: () => toast.error("Erro ao criar categoria"),
  });
  const deleteCatMutation = trpc.categories.delete.useMutation({
    onSuccess: () => { refetchCats(); refetchTasks(); broadcast({ type: "categories", tenantId: activeTenantId!, action: "deleted" }); },
    onError: () => toast.error("Erro ao remover categoria"),
  });
  const renameCatMutation = trpc.categories.rename.useMutation({
    onSuccess: () => { refetchCats(); setRenamingCatId(null); setRenamingCatValue(""); broadcast({ type: "categories", tenantId: activeTenantId!, action: "updated" }); toast.success("Categoria renomeada"); },
    onError: () => toast.error("Erro ao renomear categoria"),
  });

  const syncAlertsMutation = trpc.campaigns.syncAlerts.useMutation({
    onSuccess: (data) => {
      if (data.created > 0) {
        refetchTasks();
        refetchCats();
        toast.success(`${data.created} alerta${data.created > 1 ? "s" : ""} de campanha gerado${data.created > 1 ? "s" : ""} no checklist`);
        broadcast({ type: "tasks", tenantId: activeTenantId!, action: "created" });
      }
    },
  });

  // Auto-sync alerts when tenant changes or on mount (admin/marketer only)
  useEffect(() => {
    if (!activeTenantId) return;
    if (user?.role === "client") return; // read-only role cannot create alert tasks
    syncAlertsMutation.mutate({ tenantId: activeTenantId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTenantId, user?.role]);

  // Realtime
  useEffect(() => {
    if (!activeTenantId) return;
    return subscribe((event) => {
      if (event.tenantId === activeTenantId) {
        if (event.type === "tasks") refetchTasks();
        if (event.type === "categories") { refetchCats(); refetchTasks(); }
      }
    });
  }, [activeTenantId, subscribe, refetchTasks, refetchCats]);

  // Open all sections by default
  useEffect(() => {
    const init: Record<string, boolean> = {};
    categories.forEach((c) => { init[c.id] = true; });
    init["uncategorized"] = true;
    setOpenSections(init);
  }, [categories.length]);

  const uploadTaskImage = async (file: File): Promise<string | null> => {
    setTaskImageUploading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "x-filename": file.name, "x-content-type": file.type },
        body: file,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload falhou");
      const data = await res.json() as { url: string };
      return data.url;
    } catch {
      toast.error("Erro ao fazer upload da imagem");
      return null;
    } finally {
      setTaskImageUploading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskName.trim() || !activeTenantId) return;
    const catId = newTaskCategory === "auto"
      ? detectCategory(newTaskName, categories as Category[])
      : newTaskCategory === "none" ? null : parseInt(newTaskCategory);
    let imageUrl: string | undefined;
    if (taskImageFile) {
      const url = await uploadTaskImage(taskImageFile);
      if (url) imageUrl = url;
      setTaskImageFile(null);
    }
    const selectedResponsible =
      newTaskResponsibleUserId === "none"
        ? undefined
        : (
          tenantUsers as {
            id: number;
            name: string | null;
          }[]
        ).find(
          user =>
            user.id === Number(newTaskResponsibleUserId)
        );
    createTaskMutation.mutate({
      tenantId: activeTenantId,
      name: newTaskName.trim(),
      priority: newTaskPriority,
      categoryId: catId ?? undefined,
      responsible:
        selectedResponsible?.name?.trim() || undefined,

      responsibleUserId:
        selectedResponsible?.id,
      recurrence: newTaskRecurrence,
      imageUrl,
      link: newTaskLink.trim() || undefined,
      recurringDays: newTaskRecurringDays.length > 0 ? JSON.stringify(newTaskRecurringDays) : undefined,
    });
    setNewTaskName("");
    setNewTaskResponsibleUserId("none");
    setNewTaskRecurrence("once");
    setNewTaskLink("");
    setNewTaskRecurringDays([]);
  };

  const cycleStatus = (task: Task) => {
    if (isReadOnly) return;
    const next = STATUS_CYCLE[task.status] as Task["status"];

    updateTaskMutation.mutate({ id: task.id, tenantId: task.tenantId, status: next });
  };

  // Filtered & sorted tasks
  const filteredTasks = useMemo(() => {
    const PRIORITY_ORDER: Record<string, number> = { urgent: 0, week: 1, later: 2 };
    const STATUS_ORDER: Record<string, number> = { pending: 0, in_progress: 1, done: 2 };
    const filtered = (tasks as Task[]).filter((t) => {
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterResponsible && !t.responsible?.toLowerCase().includes(filterResponsible.toLowerCase())) return false;
      return true;
    });
    return filtered.sort((a, b) => {
      if (sortBy === "priority") return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (sortBy === "status") return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (sortBy === "responsible") return (a.responsible ?? "").localeCompare(b.responsible ?? "");
      return (a.categoryId ?? 999) - (b.categoryId ?? 999); // default: category
    });
  }, [tasks, filterPriority, filterStatus, filterResponsible, sortBy]);

  // Stats
  const total = filteredTasks.length;
  const urgent = filteredTasks.filter((t) => t.priority === "urgent" && t.status !== "done").length;
  const inProgress = filteredTasks.filter((t) => t.status === "in_progress").length;
  const done = filteredTasks.filter((t) => t.status === "done").length;

  const hasFilters = filterPriority !== "all" || filterStatus !== "all" || filterResponsible !== "";

  // Confetti when all tasks are done
  const prevDoneRef = useRef(0);
  useEffect(() => {
    if (total > 0 && done === total && prevDoneRef.current !== total) {
      const fire = (particleRatio: number, opts: confetti.Options) =>
        confetti({
          ...opts,
          origin: { y: 0.55 },
          disableForReducedMotion: true,
          particleCount: Math.floor(200 * particleRatio),
        });
      fire(0.25, { spread: 26, startVelocity: 55, colors: ["#C9A227", "#E8C84A", "#fff"] });
      fire(0.2, { spread: 60, colors: ["#C9A227", "#9A7A1A", "#fff"] });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ["#C9A227", "#E8C84A", "#22c55e"] });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ["#C9A227", "#fff"] });
      fire(0.1, { spread: 120, startVelocity: 45, colors: ["#C9A227", "#E8C84A"] });
    }
    prevDoneRef.current = done;
  }, [done, total]);

  if (!activeTenantId) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Selecione um cliente para ver o checklist.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Tenant selector (marketer) */}
      {user?.role === "marketer" && user.tenants && user.tenants.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-5">
          {user.tenants.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTenantId(t.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${activeTenantId === t.id
                ? "bg-[#C9A227] text-black border-[#C9A227]"
                : "border-border text-muted-foreground hover:border-[#C9A227]/50"
                }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: total, color: "text-foreground" },
          { label: "Urgentes", value: urgent, color: "text-red-600" },
          { label: "Em Andamento", value: inProgress, color: "text-[#C9A227]" },
          { label: "Concluídas", value: done, color: "text-green-600" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      {total > 0 && (
        <div className="bg-card border border-border rounded-xl px-4 py-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#C9A227]"><polyline points="20 6 9 17 4 12" /></svg>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Progresso Geral</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-[#C9A227]">{Math.round((done / total) * 100)}%</span>
              <span className="text-xs text-muted-foreground">{done}/{total} concluídas</span>
            </div>
          </div>
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.round((done / total) * 100)}%`,
                background: done === total
                  ? "linear-gradient(90deg, #22c55e, #16a34a)"
                  : "linear-gradient(90deg, #C9A227, #E8C84A)",
              }}
            />
            {/* Shimmer overlay */}
            {done < total && (
              <div
                className="absolute inset-y-0 left-0 rounded-full overflow-hidden pointer-events-none"
                style={{ width: `${Math.round((done / total) * 100)}%` }}
              >
                <div className="absolute inset-0 animate-[shimmer_2s_linear_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{ backgroundSize: "200% 100%" }} />
              </div>
            )}
          </div>
          {done === total && total > 0 && (
            <p className="text-xs text-green-600 font-semibold mt-1.5 text-center">Todas as tarefas concluídas!</p>
          )}
        </div>
      )}

      {/* Add task bar */}
      {!isReadOnly && (
        <div className="bg-card border border-border rounded-xl p-3 mb-4 space-y-2">
          <div className="flex gap-2">
            <Input
              className="flex-1"
              placeholder="Nome da tarefa..."
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            />
            <Button className="bg-[#C9A227] text-black hover:bg-[#E8C84A] font-bold shrink-0" onClick={handleAddTask} disabled={!newTaskName.trim()}>
              <IconPlus /> <span className="ml-1 hidden sm:inline">Adicionar</span>
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={newTaskPriority} onValueChange={(v) => setNewTaskPriority(v as any)}>
              <SelectTrigger className="w-36 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="week">Essa semana</SelectItem>
                <SelectItem value="later">Próximas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={newTaskCategory} onValueChange={setNewTaskCategory}>
              <SelectTrigger className="flex-1 min-w-32 text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-detectar</SelectItem>
                <SelectItem value="none">Sem categoria</SelectItem>
                {(categories as Category[]).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={newTaskResponsibleUserId}
              onValueChange={setNewTaskResponsibleUserId}
            >
              <SelectTrigger className="w-48 text-xs">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="none">
                  Sem responsável
                </SelectItem>

                {(
                  tenantUsers as {
                    id: number;
                    name: string | null;
                    avatarUrl: string | null;
                    role: "admin" | "marketer" | "client";
                  }[]
                ).map(user => (
                  <SelectItem
                    key={user.id}
                    value={String(user.id)}
                  >
                    {user.name || `Usuário ${user.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={newTaskRecurrence} onValueChange={(v) => { setNewTaskRecurrence(v as "once" | "daily" | "weekly"); if (v !== "weekly") setNewTaskRecurringDays([]); }}>
              <SelectTrigger className="w-44 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="once">Esporádica</SelectItem>
                <SelectItem value="daily">Diária (renova todo dia)</SelectItem>
                <SelectItem value="weekly">Semanal (dias específicos)</SelectItem>
              </SelectContent>
            </Select>
            {newTaskRecurrence === "weekly" && (
              <div className="flex gap-1 flex-wrap">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setNewTaskRecurringDays(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                    className={`px-2 py-0.5 rounded text-xs border transition-colors ${newTaskRecurringDays.includes(i)
                      ? "bg-[#C9A227] text-black border-[#C9A227] font-bold"
                      : "border-border text-muted-foreground hover:border-[#C9A227]/50"
                      }`}
                  >{d}</button>
                ))}
              </div>
            )}
            <label className="flex items-center gap-1.5 px-2 py-1 border border-dashed border-border rounded-lg cursor-pointer hover:border-[#C9A227]/50 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <IconImage />
              <span>{taskImageFile ? taskImageFile.name.slice(0, 16) + "..." : "Anexar imagem"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setTaskImageFile(e.target.files?.[0] ?? null)} />
            </label>
            {taskImageFile && (
              <button onClick={() => setTaskImageFile(null)} className="text-xs text-muted-foreground hover:text-destructive px-1">x</button>
            )}
            <div className="flex items-center gap-1.5 flex-1 min-w-40 px-2 py-1 border border-dashed border-border rounded-lg hover:border-[#C9A227]/50 transition-colors">
              <IconLink />
              <input
                type="url"
                placeholder="Link (opcional)"
                value={newTaskLink}
                onChange={(e) => setNewTaskLink(e.target.value)}
                className="bg-transparent text-xs outline-none flex-1 text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter bar + view toggle */}
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className={`w-36 text-xs ${filterPriority !== "all" ? "border-amber-500 text-amber-600" : ""}`}>
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas prioridades</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
            <SelectItem value="week">Essa semana</SelectItem>
            <SelectItem value="later">Próximas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className={`w-36 text-xs ${filterStatus !== "all" ? "border-amber-500 text-amber-600" : ""}`}>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="in_progress">Em andamento</SelectItem>
            <SelectItem value="done">Concluída</SelectItem>
          </SelectContent>
        </Select>
        <Input className="w-32 text-xs" placeholder="Responsável..." value={filterResponsible} onChange={(e) => setFilterResponsible(e.target.value)} />
        {hasFilters && (
          <Button size="sm" variant="outline" className="text-xs text-amber-600 border-amber-500/50" onClick={() => { setFilterPriority("all"); setFilterStatus("all"); setFilterResponsible(""); }}>
            Limpar filtros
          </Button>
        )}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40 text-xs">
            <span className="flex items-center gap-1.5"><IconSort /> <SelectValue /></span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="category">Por categoria</SelectItem>
            <SelectItem value="priority">Por prioridade</SelectItem>
            <SelectItem value="status">Por status</SelectItem>
            <SelectItem value="responsible">Por responsável</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex gap-1">
          <button onClick={() => setView("list")} className={`p-2 rounded-md border transition-colors ${view === "list" ? "bg-[#C9A227] text-black border-[#C9A227]" : "border-border text-muted-foreground hover:text-foreground"}`}><IconList /></button>
          <button onClick={() => setView("kanban")} className={`p-2 rounded-md border transition-colors ${view === "kanban" ? "bg-[#C9A227] text-black border-[#C9A227]" : "border-border text-muted-foreground hover:text-foreground"}`}><IconKanban /></button>
        </div>
      </div>

      {/* Views */}
      {view === "list" ? (
        <ListView
          tasks={filteredTasks}
          categories={categories as Category[]}
          openSections={openSections}
          setOpenSections={setOpenSections}
          isReadOnly={isReadOnly}
          onCycleStatus={cycleStatus}
          onDelete={(t: Task) => setConfirmDeleteTask(t)}
          responsibleAvatarMap={responsibleAvatarMap}
          onEdit={(t: Task) => {
            setEditingTask(t);
            setEditForm({ name: t.name, priority: t.priority, responsible: t.responsible ?? "", responsibleUserId: t.responsibleUserId ? String(t.responsibleUserId) : "none", recurrence: (t.recurrence ?? "once") as "once" | "daily" | "weekly", imageFile: null, imageUrl: t.imageUrl ?? null, link: t.link ?? "", recurringDays: t.recurringDays ? JSON.parse(t.recurringDays) : [] });
          }}
        />
      ) : (
        <KanbanView
          tasks={filteredTasks}
          categories={categories as Category[]}
          isReadOnly={isReadOnly}
          onCycleStatus={cycleStatus}
          onDelete={(t: Task) => setConfirmDeleteTask(t)}
          responsibleAvatarMap={responsibleAvatarMap}
          onStatusChange={(taskId: number, tenantId: number, newStatus: Task["status"]) => {
            updateTaskMutation.mutate({ id: taskId, tenantId, status: newStatus });
          }}
          onQuickAdd={(status: string) => {
            setQuickAddStatus(status as Task["status"]);
            setShowQuickAddModal(true);
          }}
        />
      )}

      {/* Category Manager — all roles can manage categories */}
      {canManageCategories && (
        <div className="mt-8 border border-border rounded-xl overflow-hidden">
          <div className="bg-[#0B0F14] px-4 py-3 flex items-center justify-between">
            <h3 className="text-[#C9A227] font-bold text-sm uppercase tracking-widest">Categorias</h3>
            <Button size="sm" className="bg-[#C9A227] text-black hover:bg-[#E8C84A] text-xs" onClick={() => setShowCatModal(true)}>
              <IconPlus /> <span className="ml-1">Nova</span>
            </Button>
          </div>
          <div className="divide-y divide-border">
            {(categories as Category[]).map((cat) => {
              const count = (tasks as Task[]).filter((t) => t.categoryId === cat.id && t.status !== "done").length;
              const isRenaming = renamingCatId === cat.id;
              return (
                <div key={cat.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 group">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-[#C9A227] flex-shrink-0">{ICON_MAP[cat.icon ?? "list"] ?? <IconList />}</span>
                    {isRenaming ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <Input
                          className="h-7 text-sm py-0 flex-1"
                          value={renamingCatValue}
                          onChange={(e) => setRenamingCatValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && renamingCatValue.trim()) renameCatMutation.mutate({ id: cat.id, tenantId: activeTenantId!, title: renamingCatValue.trim() });
                            if (e.key === "Escape") { setRenamingCatId(null); setRenamingCatValue(""); }
                          }}
                          autoFocus
                        />
                        <Button size="sm" className="h-7 text-xs bg-[#C9A227] text-black px-2" onClick={() => renamingCatValue.trim() && renameCatMutation.mutate({ id: cat.id, tenantId: activeTenantId!, title: renamingCatValue.trim() })} disabled={!renamingCatValue.trim()}>OK</Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => { setRenamingCatId(null); setRenamingCatValue(""); }}>X</Button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-medium truncate">{cat.title}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">({count} pendentes)</span>
                      </>
                    )}
                  </div>
                  {!isRenaming && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => { setRenamingCatId(cat.id); setRenamingCatValue(cat.title); }}
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Renomear"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      </button>
                      <button
                        onClick={() => setConfirmDeleteCat(cat)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Excluir"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Add Modal (Kanban) */}
      <Dialog open={showQuickAddModal} onOpenChange={(open) => { setShowQuickAddModal(open); if (!open) { setQuickAddName(""); setQuickAddPriority("week"); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar tarefa — {STATUS_LABELS[quickAddStatus]}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Nome da tarefa"
              value={quickAddName}
              onChange={(e) => setQuickAddName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && quickAddName.trim()) {
                  createTaskMutation.mutate({ tenantId: activeTenantId!, name: quickAddName.trim(), priority: quickAddPriority, status: quickAddStatus });
                  setShowQuickAddModal(false);
                  setQuickAddName("");
                }
              }}
              autoFocus
            />
            <div className="flex gap-2">
              {(["urgent", "week", "later"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setQuickAddPriority(p)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${quickAddPriority === p ? "bg-[#C9A227] text-black border-[#C9A227]" : "border-border text-muted-foreground hover:border-[#C9A227]/50"
                    }`}
                >
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuickAddModal(false)}>Cancelar</Button>
            <Button
              className="bg-[#C9A227] text-black"
              disabled={!quickAddName.trim()}
              onClick={() => {
                createTaskMutation.mutate({ tenantId: activeTenantId!, name: quickAddName.trim(), priority: quickAddPriority, status: quickAddStatus });
                setShowQuickAddModal(false);
                setQuickAddName("");
              }}
            >Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Task Modal */}
      <Dialog open={!!confirmDeleteTask} onOpenChange={(o) => !o && setConfirmDeleteTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir a tarefa <strong className="text-foreground">"{confirmDeleteTask?.name}"</strong>? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteTask(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => {
              if (confirmDeleteTask) deleteTaskMutation.mutate({ id: confirmDeleteTask.id, tenantId: confirmDeleteTask.tenantId });
              setConfirmDeleteTask(null);
            }}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Category Modal */}
      <Dialog open={!!confirmDeleteCat} onOpenChange={(o) => !o && setConfirmDeleteCat(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão de categoria</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir a categoria <strong className="text-foreground">"{confirmDeleteCat?.title}"</strong>? As tarefas associadas ficarão sem categoria.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteCat(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => {
              if (confirmDeleteCat) deleteCatMutation.mutate({ id: confirmDeleteCat.id, tenantId: activeTenantId! });
              setConfirmDeleteCat(null);
            }}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Modal */}
      <Dialog open={!!editingTask} onOpenChange={(o) => !o && setEditingTask(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Tarefa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Nome da tarefa"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
            <div className="flex gap-2 flex-wrap">
              <Select value={editForm.priority} onValueChange={(v) => setEditForm({ ...editForm, priority: v as Task["priority"] })}>
                <SelectTrigger className="w-36 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgente</SelectItem>
                  <SelectItem value="week">Essa semana</SelectItem>
                  <SelectItem value="later">Próximas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={editForm.recurrence} onValueChange={(v) => setEditForm({ ...editForm, recurrence: v as "once" | "daily" | "weekly", recurringDays: v !== "weekly" ? [] : editForm.recurringDays })}>
                <SelectTrigger className="w-44 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Esporádica</SelectItem>
                  <SelectItem value="daily">Diária (renova todo dia)</SelectItem>
                  <SelectItem value="weekly">Semanal (dias específicos)</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={editForm.responsibleUserId}
                onValueChange={value =>
                  setEditForm({
                    ...editForm,
                    responsibleUserId: value,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Responsável" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="none">
                    Sem responsável
                  </SelectItem>

                  {(
                    tenantUsers as {
                      id: number;
                      name: string | null;
                      avatarUrl: string | null;
                      role: "admin" | "marketer" | "client";
                    }[]
                  ).map(user => (
                    <SelectItem
                      key={user.id}
                      value={String(user.id)}
                    >
                      {user.name || `Usuário ${user.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editForm.recurrence === "weekly" && (
              <div className="flex gap-1 flex-wrap">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setEditForm({ ...editForm, recurringDays: editForm.recurringDays.includes(i) ? editForm.recurringDays.filter(x => x !== i) : [...editForm.recurringDays, i] })}
                    className={`px-2 py-0.5 rounded text-xs border transition-colors ${editForm.recurringDays.includes(i)
                      ? "bg-[#C9A227] text-black border-[#C9A227] font-bold"
                      : "border-border text-muted-foreground hover:border-[#C9A227]/50"
                      }`}
                  >{d}</button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-1.5 px-2 py-1 border border-dashed border-border rounded-lg hover:border-[#C9A227]/50 transition-colors">
              <IconLink />
              <input
                type="url"
                placeholder="Link (opcional)"
                value={editForm.link}
                onChange={(e) => setEditForm({ ...editForm, link: e.target.value })}
                className="bg-transparent text-xs outline-none flex-1 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Imagem anexada</p>
              {editForm.imageUrl && (
                <div className="flex items-center gap-2">
                  <img src={editForm.imageUrl} alt="Anexo" className="h-16 w-24 object-cover rounded border border-border" />
                  <button onClick={() => setEditForm({ ...editForm, imageUrl: null })} className="text-xs text-destructive hover:underline">Remover</button>
                </div>
              )}
              <label className="flex items-center gap-1.5 px-2 py-1 border border-dashed border-border rounded-lg cursor-pointer hover:border-[#C9A227]/50 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit">
                <IconImage />
                <span>{editForm.imageFile ? editForm.imageFile.name.slice(0, 20) + "..." : "Substituir imagem"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setEditForm({ ...editForm, imageFile: e.target.files?.[0] ?? null })} />
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTask(null)}>Cancelar</Button>
            <Button
              className="bg-[#C9A227] text-black"
              disabled={!editForm.name.trim() || taskImageUploading}
              onClick={async () => {
                if (!editingTask) return;
                let imageUrl: string | undefined | null = editForm.imageUrl;
                if (editForm.imageFile) {
                  const url = await uploadTaskImage(editForm.imageFile);
                  if (url) imageUrl = url;
                }
                const selectedEditResponsible =
                  editForm.responsibleUserId === "none"
                    ? undefined
                    : (
                      tenantUsers as {
                        id: number;
                        name: string | null;
                      }[]
                    ).find(
                      user =>
                        user.id ===
                        Number(editForm.responsibleUserId)
                    );
                updateTaskMutation.mutate({
                  id: editingTask.id,
                  tenantId: editingTask.tenantId,
                  name: editForm.name.trim(),
                  priority: editForm.priority,
                  responsible:
                    selectedEditResponsible?.name?.trim() ?? null,

                  responsibleUserId:
                    selectedEditResponsible?.id ?? null,
                  recurrence: editForm.recurrence,
                  imageUrl: imageUrl ?? undefined,
                  link: editForm.link.trim() || undefined,
                  recurringDays: editForm.recurringDays.length > 0 ? JSON.stringify(editForm.recurringDays) : undefined,
                });
                setEditingTask(null);
              }}
            >{taskImageUploading ? "Enviando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Category Modal */}
      <Dialog open={showCatModal} onOpenChange={setShowCatModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Categoria</DialogTitle></DialogHeader>
          <Input placeholder="Nome da categoria" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && newCatName.trim() && createCatMutation.mutate({ tenantId: activeTenantId!, title: newCatName.trim() })} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCatModal(false)}>Cancelar</Button>
            <Button className="bg-[#C9A227] text-black" onClick={() => createCatMutation.mutate({ tenantId: activeTenantId!, title: newCatName.trim() })} disabled={!newCatName.trim()}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── LIST VIEW ────────────────────────────────────────────────────────────────
function ListView({ tasks, categories, openSections, setOpenSections, isReadOnly, onCycleStatus, onDelete, onEdit, responsibleAvatarMap }: any) {
  const grouped: Record<string, Task[]> = {};
  tasks.forEach((t: Task) => {
    const key = t.categoryId ? String(t.categoryId) : "uncategorized";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  });

  const getCatTitle = (key: string) => {
    if (key === "uncategorized") return "Sem Categoria";
    const cat = categories.find((c: Category) => c.id === parseInt(key));
    return cat?.title ?? key;
  };
  const getCatIcon = (key: string) => {
    if (key === "uncategorized") return <IconList />;
    const cat = categories.find((c: Category) => c.id === parseInt(key));
    return ICON_MAP[cat?.icon ?? "list"] ?? <IconList />;
  };

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([key, sectionTasks]) => {
        const urgentCount = sectionTasks.filter((t: Task) => t.priority === "urgent" && t.status !== "done").length;
        const isOpen = openSections[key] !== false;
        return (
          <div key={key} className="bg-card border border-border rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
              onClick={() => setOpenSections((prev: any) => ({ ...prev, [key]: !isOpen }))}
            >
              <div className="flex items-center gap-2">
                <span className="text-[#C9A227]">{getCatIcon(key)}</span>
                <span className="font-bold uppercase tracking-wider text-sm">{getCatTitle(key)}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${urgentCount > 0 ? "bg-red-500/15 text-red-600" : "bg-muted text-muted-foreground"}`}>
                  {sectionTasks.filter((t) => t.status !== "done").length} pendentes
                </span>
              </div>
              <IconChevron open={isOpen} />
            </button>
            {isOpen && (
              <div className="divide-y divide-border">
                {(sectionTasks as Task[]).map((task: Task) => (
                  <TaskRow key={task.id} task={task} isReadOnly={isReadOnly} onCycleStatus={onCycleStatus} onDelete={onDelete} onEdit={onEdit} responsibleAvatarMap={responsibleAvatarMap} />
                ))}
              </div>
            )}
          </div>
        );
      })}
      {tasks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-base font-semibold">Nenhuma tarefa encontrada</p>
          <p className="text-sm mt-1">Adicione uma tarefa acima ou ajuste os filtros.</p>
        </div>
      )}
    </div>
  );
}

// ─── KANBAN CARD (draggable) ──────────────────────────────────────────────────
function ResponsibleChip({ name, avatarMap }: { name: string; avatarMap?: Map<string, { id: number; avatarUrl: string | null }> }) {
  const info = avatarMap?.get(name.trim().toLowerCase());
  if (info?.avatarUrl) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
        <img src={info.avatarUrl} alt={name} className="w-4 h-4 rounded-full object-cover shrink-0" />
        {name}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
      <span className="w-4 h-4 rounded-full bg-[#C9A227]/20 text-[#C9A227] flex items-center justify-center text-[9px] font-bold shrink-0">
        {name.charAt(0).toUpperCase()}
      </span>
      {name}
    </span>
  );
}

function KanbanCard({ task, isReadOnly, onCycleStatus, onDelete, isDragOverlay = false, responsibleAvatarMap }: {
  task: Task; isReadOnly: boolean;
  onCycleStatus: (t: Task) => void;
  onDelete: (t: Task) => void;
  isDragOverlay?: boolean;
  responsibleAvatarMap?: Map<string, { id: number; avatarUrl: string | null }>;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id, disabled: isReadOnly });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={[
        "kanban-card bg-background border border-border rounded-lg p-3 group select-none",
        isDragging && !isDragOverlay ? "opacity-30 scale-95" : "",
        isDragOverlay ? "shadow-2xl ring-2 ring-[#C9A227]/60 rotate-1 cursor-grabbing" : "cursor-grab active:cursor-grabbing",
        "transition-all duration-150",
      ].join(" ")}
      style={{ touchAction: "none" }}
    >
      <div className="flex items-start gap-2">
        <button
          className={`status-btn mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${STATUS_COLORS[task.status]}`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onCycleStatus(task); }}
          disabled={isReadOnly}
          title={`Status: ${STATUS_LABELS[task.status]}`}
        />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-snug ${task.status === "done" ? "line-through opacity-55" : ""}`}>{task.name}</p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {task.alertDaysBefore && <AlertBadge daysBefore={task.alertDaysBefore} />}
            {task.recurrence === "daily" && (
              <span className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded border border-blue-400/40 bg-blue-500/10 text-blue-600 font-semibold">
                <IconRepeat /> Diária
              </span>
            )}
            <span className={`text-xs px-1.5 py-0.5 rounded border font-semibold ${PRIORITY_COLORS[task.priority]}`}>
              {PRIORITY_LABELS[task.priority]}
            </span>
            {task.responsible && (
              <ResponsibleChip name={task.responsible} avatarMap={responsibleAvatarMap} />
            )}
          </div>
          {task.imageUrl && (
            <div className="mt-2 rounded overflow-hidden border border-border">
              <img src={task.imageUrl} alt="Anexo" className="w-full h-24 object-cover" />
            </div>
          )}
        </div>
        {!isReadOnly && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onDelete(task); }}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all flex-shrink-0"
          >
            <IconTrash />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── KANBAN COLUMN (droppable) ────────────────────────────────────────────────
function KanbanColumn({ colId, label, colorClass, tasks, isReadOnly, onCycleStatus, onDelete, isOver, onQuickAdd, responsibleAvatarMap }: {
  colId: string; label: string; colorClass: string; tasks: Task[];
  isReadOnly: boolean;
  onCycleStatus: (t: Task) => void;
  onDelete: (t: Task) => void;
  isOver: boolean;
  onQuickAdd: (status: string) => void;
  responsibleAvatarMap?: Map<string, { id: number; avatarUrl: string | null }>;
}) {
  const { setNodeRef } = useDroppable({ id: colId });
  return (
    <div
      ref={setNodeRef}
      className={[
        "bg-card border border-border rounded-xl overflow-hidden flex flex-col transition-all duration-150",
        isOver ? "ring-2 ring-[#C9A227]/70 bg-[#C9A227]/5" : "",
      ].join(" ")}
    >
      <div className={`border-t-4 ${colorClass} px-4 py-3 flex items-center justify-between`}>
        <span className="font-bold text-sm uppercase tracking-wider">{label}</span>
        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-semibold">{tasks.length}</span>
      </div>
      <div className="p-3 space-y-2 flex-1" style={{ minHeight: "8rem" }}>
        {tasks.map((task) => (
          <KanbanCard
            key={task.id}
            task={task}
            isReadOnly={isReadOnly}
            onCycleStatus={onCycleStatus}
            onDelete={onDelete}
            responsibleAvatarMap={responsibleAvatarMap}
          />
        ))}
        {tasks.length === 0 && (
          <div className={`flex items-center justify-center h-16 rounded-lg border-2 border-dashed transition-colors ${isOver ? "border-[#C9A227]/50 text-[#C9A227]" : "border-border text-muted-foreground"
            }`}>
            <p className="text-xs">{isOver ? "Solte aqui" : "Nenhuma tarefa"}</p>
          </div>
        )}
      </div>
      {!isReadOnly && (
        <div className="px-3 pb-3">
          <button
            onClick={() => onQuickAdd(colId)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-border text-muted-foreground hover:border-[#C9A227] hover:text-[#C9A227] transition-all text-xs font-medium"
          >
            <IconPlus /> Adicionar tarefa
          </button>
        </div>
      )}
    </div>
  );
}

// ─── KANBAN VIEW ──────────────────────────────────────────────────────────────
function KanbanView({ tasks, categories: _categories, isReadOnly, onCycleStatus, onDelete, onStatusChange, onQuickAdd, responsibleAvatarMap }: any) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [searchKanban, setSearchKanban] = useState("");
  const [filterKanbanPriority, setFilterKanbanPriority] = useState("all");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const columns: { id: Task["status"]; label: string; color: string }[] = [
    { id: "pending", label: "Pendente", color: "border-gray-400" },
    { id: "in_progress", label: "Em Andamento", color: "border-[#C9A227]" },
    { id: "done", label: "Concluída", color: "border-green-500" },
  ];

  const handleDragStart = (event: DragStartEvent) => {
    const task = (tasks as Task[]).find((t: Task) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id as string | undefined;
    if (overId && columns.some((c) => c.id === overId)) {
      setOverColumn(overId);
    } else if (overId) {
      // hovering over a card — find which column it belongs to
      const overTask = (tasks as Task[]).find((t: Task) => t.id === Number(overId));
      if (overTask) setOverColumn(overTask.status);
    } else {
      setOverColumn(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setOverColumn(null);
    if (!over) return;

    const draggedTask = (tasks as Task[]).find((t: Task) => t.id === active.id);
    if (!draggedTask) return;

    // Determine target column
    let targetStatus: Task["status"] | null = null;
    const overId = over.id as string;
    if (columns.some((c) => c.id === overId)) {
      targetStatus = overId as Task["status"];
    } else {
      const overTask = (tasks as Task[]).find((t: Task) => t.id === Number(overId));
      if (overTask) targetStatus = overTask.status;
    }

    if (targetStatus && targetStatus !== draggedTask.status) {
      onStatusChange(draggedTask.id, draggedTask.tenantId, targetStatus);
    }
  };

  const filteredKanbanTasks = (tasks as Task[]).filter((t: Task) => {
    const matchSearch = !searchKanban || t.name.toLowerCase().includes(searchKanban.toLowerCase());
    const matchPriority = filterKanbanPriority === "all" || t.priority === filterKanbanPriority;
    return matchSearch && matchPriority;
  });

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* Kanban search & filter bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            type="text"
            placeholder="Buscar tarefa..."
            value={searchKanban}
            onChange={(e) => setSearchKanban(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-[#C9A227]/50"
          />
        </div>
        <select
          value={filterKanbanPriority}
          onChange={(e) => setFilterKanbanPriority(e.target.value)}
          className="px-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-[#C9A227]/50"
        >
          <option value="all">Todas prioridades</option>
          <option value="urgent">Urgente</option>
          <option value="week">Essa semana</option>
          <option value="later">Próximas</option>
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            colId={col.id}
            label={col.label}
            colorClass={col.color}
            tasks={filteredKanbanTasks.filter((t: Task) => t.status === col.id)}
            isReadOnly={isReadOnly}
            onCycleStatus={onCycleStatus}
            onDelete={onDelete}
            isOver={overColumn === col.id}
            onQuickAdd={onQuickAdd}
            responsibleAvatarMap={responsibleAvatarMap}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 150, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }}>
        {activeTask ? (
          <KanbanCard
            task={activeTask}
            isReadOnly={false}
            onCycleStatus={() => { }}
            onDelete={() => { }}
            isDragOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// ─── TASK ROW ─────────────────────────────────────────────────────────────────
function TaskRow({ task, isReadOnly, onCycleStatus, onDelete, onEdit, responsibleAvatarMap }: { task: Task; isReadOnly: boolean; onCycleStatus: (t: Task) => void; onDelete: (t: Task) => void; onEdit?: (t: Task) => void; responsibleAvatarMap?: Map<string, { id: number; avatarUrl: string | null }> }) {
  return (
    <div className={`flex items-start gap-3 px-4 py-3 group hover:bg-muted/20 transition-colors ${task.status === "done" ? "opacity-55" : ""}`}>
      {/* Status button — alinhado ao topo */}
      <button
        className={`status-btn w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all ${STATUS_COLORS[task.status]}`}
        onClick={() => onCycleStatus(task)}
        disabled={isReadOnly}
        title={`Status: ${STATUS_LABELS[task.status]} — clique para avançar`}
      />

      {/* Conteúdo principal: nome + badges em coluna */}
      <div className="flex-1 min-w-0">
        {/* Nome da tarefa */}
        <span className={`text-sm font-medium leading-snug block ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
          {task.name}
        </span>

        {/* Badges em linha, com wrap */}
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          {task.alertDaysBefore && <AlertBadge daysBefore={task.alertDaysBefore} />}
          {task.recurrence === "daily" && (
            <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded border border-blue-400/40 bg-blue-500/10 text-blue-600 font-semibold" title="Tarefa diária">
              <IconRepeat /> Diária
            </span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${PRIORITY_COLORS[task.priority]}`}>
            {PRIORITY_LABELS[task.priority]}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${task.status === "pending" ? "bg-gray-500/10 text-gray-500" :
            task.status === "in_progress" ? "bg-amber-500/10 text-amber-600" :
              "bg-green-500/10 text-green-600"
            }`}>
            {STATUS_LABELS[task.status]}
          </span>
          {task.responsible && (
            <ResponsibleChip name={task.responsible} avatarMap={responsibleAvatarMap} />
          )}
        </div>

        {/* Imagem anexada */}
        {task.imageUrl && (
          <a href={task.imageUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block" title="Ver imagem anexada">
            <img src={task.imageUrl} alt="Anexo" className="h-12 w-20 object-cover rounded border border-border hover:opacity-80 transition-opacity" />
          </a>
        )}
      </div>

      {/* Ações: edit/delete */}
      {!isReadOnly && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-all flex-shrink-0 mt-0.5">
          {onEdit && (
            <button
              onClick={() => onEdit(task)}
              className="text-muted-foreground hover:text-[#C9A227] transition-colors p-0.5"
              title="Editar tarefa"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            </button>
          )}
          <button
            onClick={() => onDelete(task)}
            className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
            title="Excluir tarefa"
          >
            <IconTrash />
          </button>
        </div>
      )}
    </div>
  );
}
