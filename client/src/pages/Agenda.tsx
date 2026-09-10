import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useApp } from "@/contexts/AppContext";
import { useRealtime } from "@/contexts/RealtimeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  CalendarDays, Plus, Clock, Users, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Briefcase, Target, Trash2, ListChecks,
  MessageSquare, AlertCircle,
} from "lucide-react";

type MeetingStatus = "agendada" | "confirmada" | "cancelada" | "realizada";
type MeetingType = "operacional" | "estrategico";

interface Invite {
  userId: number;
  rsvp: "pendente" | "confirmado" | "declinado";
  userName?: string;
  userAvatarUrl?: string | null;
}

interface Meeting {
  id: number;
  title: string;
  meetingType: MeetingType;
  scheduledAt: Date;
  durationMin: number;
  agenda: string[];
  notes: string | null;
  status: MeetingStatus;
  createdBy: number;
  invites: Invite[];
}

const MONTH_NAMES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];
const DAY_NAMES = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}
function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" });
}

const STATUS_LABELS: Record<MeetingStatus, string> = {
  agendada: "Agendada",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
  realizada: "Realizada",
};
const STATUS_COLORS: Record<MeetingStatus, string> = {
  agendada: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  confirmada: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  cancelada: "bg-red-500/15 text-red-400 border-red-500/30",
  realizada: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};
const TYPE_COLORS: Record<MeetingType, string> = {
  operacional: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  estrategico: "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

function AvatarChip({ name, avatarUrl, rsvp }: { name?: string; avatarUrl?: string | null; rsvp: string }) {
  const initials = (name ?? "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const rsvpColor = rsvp === "confirmado" ? "ring-emerald-500" : rsvp === "declinado" ? "ring-red-500" : "ring-zinc-600";
  return (
    <div className={`relative w-7 h-7 rounded-full ring-2 ${rsvpColor} overflow-hidden flex-shrink-0`} title={`${name ?? "?"} — ${rsvp}`}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-300">
          {initials}
        </div>
      )}
    </div>
  );
}

function MeetingCard({
  meeting, currentUserId, onRespond, onDelete, onClick,
}: {
  meeting: Meeting;
  currentUserId: number;
  onRespond: (meetingId: number, rsvp: "confirmado" | "declinado") => void;
  onDelete: (id: number) => void;
  onClick: (m: Meeting) => void;
}) {
  const myInvite = meeting.invites.find(i => i.userId === currentUserId);
  const isCreator = meeting.createdBy === currentUserId;

  return (
    <div
      onClick={() => onClick(meeting)}
      className="group relative bg-zinc-900 border border-zinc-800 rounded-xl p-4 cursor-pointer hover:border-zinc-600 transition-all duration-200 hover:shadow-lg hover:shadow-black/30"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${TYPE_COLORS[meeting.meetingType]}`}>
          {meeting.meetingType === "operacional"
            ? <><Briefcase className="inline w-3 h-3 mr-1" />Operacional</>
            : <><Target className="inline w-3 h-3 mr-1" />Estratégico</>}
        </span>
        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ml-auto ${STATUS_COLORS[meeting.status]}`}>
          {STATUS_LABELS[meeting.status]}
        </span>
      </div>
      <h3 className="font-semibold text-white text-sm mb-2 leading-tight">{meeting.title}</h3>
      <div className="flex items-center gap-3 text-xs text-zinc-400 mb-3">
        <span className="flex items-center gap-1">
          <CalendarDays className="w-3.5 h-3.5" />
          {formatDate(meeting.scheduledAt)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {formatTime(meeting.scheduledAt)} · {meeting.durationMin}min
        </span>
      </div>
      {meeting.agenda.length > 0 && (
        <div className="mb-3 space-y-1">
          {meeting.agenda.slice(0, 2).map((item, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs text-zinc-400">
              <ListChecks className="w-3 h-3 mt-0.5 flex-shrink-0 text-zinc-500" />
              <span className="truncate">{item}</span>
            </div>
          ))}
          {meeting.agenda.length > 2 && (
            <span className="text-xs text-zinc-500">+{meeting.agenda.length - 2} itens</span>
          )}
        </div>
      )}
      {meeting.invites.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3">
          <Users className="w-3.5 h-3.5 text-zinc-500" />
          <div className="flex -space-x-1">
            {meeting.invites.slice(0, 5).map(inv => (
              <AvatarChip key={inv.userId} name={inv.userName} avatarUrl={inv.userAvatarUrl} rsvp={inv.rsvp} />
            ))}
            {meeting.invites.length > 5 && (
              <div className="w-7 h-7 rounded-full bg-zinc-700 ring-2 ring-zinc-600 flex items-center justify-center text-[10px] text-zinc-400">
                +{meeting.invites.length - 5}
              </div>
            )}
          </div>
        </div>
      )}
      {myInvite && myInvite.rsvp === "pendente" && (
        <div className="flex gap-2 mt-2" onClick={e => e.stopPropagation()}>
          <Button size="sm" className="flex-1 h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => onRespond(meeting.id, "confirmado")}>
            <CheckCircle2 className="w-3 h-3 mr-1" /> Confirmar
          </Button>
          <Button size="sm" variant="outline" className="flex-1 h-7 text-xs border-red-500/40 text-red-400 hover:bg-red-500/10" onClick={() => onRespond(meeting.id, "declinado")}>
            <XCircle className="w-3 h-3 mr-1" /> Declinar
          </Button>
        </div>
      )}
      {myInvite && myInvite.rsvp !== "pendente" && (
        <div className={`text-xs font-medium mt-2 ${myInvite.rsvp === "confirmado" ? "text-emerald-400" : "text-red-400"}`}>
          {myInvite.rsvp === "confirmado" ? "✓ Você confirmou presença" : "✗ Você declinou"}
        </div>
      )}
      {isCreator && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(meeting.id); }}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export default function Agenda() {
  const { activeTenantId, user, addNotification } = useApp();
  const { broadcast } = useRealtime();
  const tenantId = activeTenantId ?? 0;
  const utils = trpc.useUtils();

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [filterType, setFilterType] = useState<"all" | MeetingType>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [detailMeeting, setDetailMeeting] = useState<Meeting | null>(null);

  const [form, setForm] = useState({
    title: "",
    meetingType: "operacional" as MeetingType,
    date: "",
    time: "09:00",
    durationMin: 60,
    agendaInput: "",
    agendaItems: [] as string[],
    notes: "",
    inviteeIds: [] as number[],
  });

  const { data: meetings = [], isLoading } = trpc.meetings.list.useQuery(
    { tenantId },
    { enabled: tenantId > 0 }
  );
  const { data: tenantUsers = [] } = trpc.profile.tenantUsers.useQuery(
    { tenantId },
    { enabled: tenantId > 0 }
  );

  const createMutation = trpc.meetings.create.useMutation({
    onSuccess: (_, vars) => {
      utils.meetings.list.invalidate();
      setShowCreate(false);
      // Notificar participantes convidados via notificação in-app
      if ((vars.inviteeIds ?? []).length > 0) {
        const typeLabel = vars.meetingType === "operacional" ? "Operacional" : "Estratégica";
        const dateStr = new Date(vars.scheduledAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
        addNotification({
          type: "task",
          title: `Reunião ${typeLabel} agendada`,
          body: `"${vars.title}" — ${dateStr}. Você foi convidado(a). Confirme sua presença na aba Agenda.`,
        });
        broadcast({ type: "tasks", tenantId: vars.tenantId, action: "created" });
      }
      resetForm();
      toast.success("Reunião agendada com sucesso!");
    },
    onError: (e) => toast.error(e.message),
  });
  const respondMutation = trpc.meetings.respond.useMutation({
    onSuccess: (_, vars) => {
      utils.meetings.list.invalidate();
      // Notificar o criador da reunião sobre a resposta
      const meeting = (meetings as Meeting[]).find(m => m.id === vars.meetingId);
      if (meeting) {
        const responderName = user?.name ?? "Um participante";
        const action = vars.rsvp === "confirmado" ? "confirmou presença" : "declinou";
        addNotification({
          type: "info",
          title: `RSVP: ${meeting.title}`,
          body: `${responderName} ${action} na reunião "${meeting.title}".`,
        });
      }
      toast.success(vars.rsvp === "confirmado" ? "Presença confirmada!" : "Declínio registrado.");
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.meetings.delete.useMutation({
    onSuccess: () => {
      utils.meetings.list.invalidate();
      setDetailMeeting(null);
      toast.success("Reunião excluída.");
    },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setForm({ title: "", meetingType: "operacional", date: "", time: "09:00", durationMin: 60, agendaInput: "", agendaItems: [], notes: "", inviteeIds: [] });
  }

  const daysInMonth = useMemo(() => {
    const first = new Date(calYear, calMonth, 1).getDay();
    const total = new Date(calYear, calMonth + 1, 0).getDate();
    return { first, total };
  }, [calYear, calMonth]);

  const meetingsByDate = useMemo(() => {
    const map: Record<string, Meeting[]> = {};
    (meetings as Meeting[]).forEach(m => {
      const d = new Date(m.scheduledAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map[key]) map[key] = [];
      map[key].push(m);
    });
    return map;
  }, [meetings]);

  const filteredMeetings = useMemo(() => {
    let list = meetings as Meeting[];
    if (filterType !== "all") list = list.filter(m => m.meetingType === filterType);
    if (selectedDate) {
      list = list.filter(m => {
        const d = new Date(m.scheduledAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return key === selectedDate;
      });
    }
    return list.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [meetings, filterType, selectedDate]);

  function addAgendaItem() {
    const trimmed = form.agendaInput.trim();
    if (!trimmed) return;
    setForm(f => ({ ...f, agendaItems: [...f.agendaItems, trimmed], agendaInput: "" }));
  }

  function handleCreate() {
    if (!form.title || !form.date) {
      toast.error("Preencha o título e a data.");
      return;
    }
    const [h, min] = form.time.split(":").map(Number);
    const scheduledAt = new Date(`${form.date}T${form.time}:00`);
    scheduledAt.setHours(h, min, 0, 0);
    createMutation.mutate({
      tenantId,
      title: form.title,
      meetingType: form.meetingType,
      scheduledAt,
      durationMin: form.durationMin,
      agenda: form.agendaItems,
      notes: form.notes || undefined,
      inviteeIds: form.inviteeIds,
    });
  }

  const pendingInvites = (meetings as Meeting[]).filter(m =>
    m.invites.some(i => i.userId === user?.id && i.rsvp === "pendente")
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-amber-400" />
              Agenda
            </h1>
            <p className="text-sm text-zinc-400 mt-1">Encontros operacionais e estratégicos da consultoria</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1">
              <button onClick={() => setView("calendar")} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${view === "calendar" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"}`}>
                Calendário
              </button>
              <button onClick={() => setView("list")} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${view === "list" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"}`}>
                Lista
              </button>
            </div>
            <Button onClick={() => setShowCreate(true)} className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-sm h-9">
              <Plus className="w-4 h-4 mr-1" /> Agendar
            </Button>
          </div>
        </div>

        {pendingInvites.length > 0 && (
          <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-300">
                {pendingInvites.length === 1 ? "Você tem 1 convite pendente" : `Você tem ${pendingInvites.length} convites pendentes`}
              </p>
              <p className="text-xs text-amber-400/70 mt-0.5">Confirme ou decline sua presença nos cards abaixo.</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mb-6">
          {(["all", "operacional", "estrategico"] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filterType === t
                  ? t === "operacional" ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                    : t === "estrategico" ? "bg-orange-500/20 border-orange-500/50 text-orange-300"
                    : "bg-zinc-700 border-zinc-600 text-white"
                  : "bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
              }`}
            >
              {t === "all" ? "Todos" : t === "operacional" ? "Operacional" : "Estratégico"}
            </button>
          ))}
          {selectedDate && (
            <button onClick={() => setSelectedDate(null)} className="px-3 py-1.5 rounded-full text-xs font-medium border border-zinc-600 text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors">
              ✕ {selectedDate.split("-").reverse().join("/")}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {view === "calendar" && (
            <div className="lg:col-span-1">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}
                      className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <CardTitle className="text-sm font-semibold text-white">{MONTH_NAMES[calMonth]} {calYear}</CardTitle>
                    <button
                      onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}
                      className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 mb-2">
                    {DAY_NAMES.map(d => (
                      <div key={d} className="text-center text-[10px] font-semibold text-zinc-500 py-1">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5">
                    {Array.from({ length: daysInMonth.first }).map((_, i) => <div key={`e${i}`} />)}
                    {Array.from({ length: daysInMonth.total }).map((_, i) => {
                      const day = i + 1;
                      const key = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const hasMeetings = !!meetingsByDate[key];
                      const isToday = calYear === today.getFullYear() && calMonth === today.getMonth() && day === today.getDate();
                      const isSelected = selectedDate === key;
                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedDate(isSelected ? null : key)}
                          className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-medium transition-all ${
                            isSelected ? "bg-amber-500 text-black"
                            : isToday ? "bg-zinc-700 text-white ring-1 ring-amber-500/50"
                            : "text-zinc-300 hover:bg-zinc-800"
                          }`}
                        >
                          {day}
                          {hasMeetings && !isSelected && (
                            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                              {meetingsByDate[key].slice(0, 3).map((m, idx) => (
                                <span key={idx} className={`w-1 h-1 rounded-full ${m.meetingType === "operacional" ? "bg-violet-400" : "bg-orange-400"}`} />
                              ))}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-zinc-800">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400"><span className="w-2 h-2 rounded-full bg-violet-400" /> Operacional</div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400"><span className="w-2 h-2 rounded-full bg-orange-400" /> Estratégico</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className={view === "calendar" ? "lg:col-span-2" : "lg:col-span-3"}>
            {isLoading ? (
              <div className="flex items-center justify-center h-40 text-zinc-500 text-sm">Carregando...</div>
            ) : filteredMeetings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-zinc-500">
                <CalendarDays className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">{selectedDate ? "Nenhuma reunião neste dia." : "Nenhuma reunião encontrada."}</p>
                <Button variant="outline" size="sm" className="mt-3 border-zinc-700 text-zinc-400" onClick={() => setShowCreate(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Agendar reunião
                </Button>
              </div>
            ) : (
              <div className={`grid gap-4 ${view === "list" ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
                {filteredMeetings.map(m => (
                  <MeetingCard
                    key={m.id}
                    meeting={m}
                    currentUserId={user?.id ?? 0}
                    onRespond={(id, rsvp) => respondMutation.mutate({ meetingId: id, rsvp })}
                    onDelete={(id) => deleteMutation.mutate({ id })}
                    onClick={setDetailMeeting}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-amber-400" />
              Agendar Reunião
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-zinc-300 text-xs mb-1.5 block">Título *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Revisão de campanhas Q3" className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" />
            </div>
            <div>
              <Label className="text-zinc-300 text-xs mb-1.5 block">Tipo de encontro *</Label>
              <Select value={form.meetingType} onValueChange={v => setForm(f => ({ ...f, meetingType: v as MeetingType }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="operacional" className="text-white hover:bg-zinc-700">
                    <div className="flex items-center gap-2"><Briefcase className="w-3.5 h-3.5 text-violet-400" /> Operacional</div>
                  </SelectItem>
                  <SelectItem value="estrategico" className="text-white hover:bg-zinc-700">
                    <div className="flex items-center gap-2"><Target className="w-3.5 h-3.5 text-orange-400" /> Estratégico</div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-300 text-xs mb-1.5 block">Data *</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white w-full" />
              </div>
              <div>
                <Label className="text-zinc-300 text-xs mb-1.5 block">Horário</Label>
                <Input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white w-full" />
              </div>
            </div>
            <div>
              <Label className="text-zinc-300 text-xs mb-1.5 block">Duração (minutos)</Label>
              <Select value={String(form.durationMin)} onValueChange={v => setForm(f => ({ ...f, durationMin: Number(v) }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {[30, 45, 60, 90, 120, 180].map(d => (
                    <SelectItem key={d} value={String(d)} className="text-white hover:bg-zinc-700">{d} minutos</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-zinc-300 text-xs mb-1.5 block">Pauta / Atividades do encontro</Label>
              <div className="flex gap-2">
                <Input
                  value={form.agendaInput}
                  onChange={e => setForm(f => ({ ...f, agendaInput: e.target.value }))}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addAgendaItem(); } }}
                  placeholder="Adicionar item de pauta..."
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 flex-1"
                />
                <Button type="button" onClick={addAgendaItem} size="sm" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-700">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              {form.agendaItems.length > 0 && (
                <div className="mt-2 space-y-1">
                  {form.agendaItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-zinc-800 rounded px-2 py-1.5">
                      <ListChecks className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                      <span className="text-xs text-zinc-300 flex-1">{item}</span>
                      <button onClick={() => setForm(f => ({ ...f, agendaItems: f.agendaItems.filter((_, j) => j !== i) }))} className="text-zinc-500 hover:text-red-400">
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {(tenantUsers as any[]).length > 0 && (
              <div>
                <Label className="text-zinc-300 text-xs mb-1.5 block">Participantes</Label>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {(tenantUsers as any[]).filter((u: any) => u.id !== user?.id).map((u: any) => (
                    <label key={u.id} className="flex items-center gap-2.5 cursor-pointer group">
                      <Checkbox
                        checked={form.inviteeIds.includes(u.id)}
                        onCheckedChange={checked => {
                          setForm(f => ({
                            ...f,
                            inviteeIds: checked ? [...f.inviteeIds, u.id] : f.inviteeIds.filter((id: number) => id !== u.id),
                          }));
                        }}
                        className="border-zinc-600"
                      />
                      <div className="flex items-center gap-2">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                            {(u.name ?? "?").slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">{u.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div>
              <Label className="text-zinc-300 text-xs mb-1.5 block">Observações</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Informações adicionais, link de videochamada, local..." className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 resize-none" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">Cancelar</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
              {createMutation.isPending ? "Agendando..." : "Agendar Reunião"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {detailMeeting && (
        <Dialog open={!!detailMeeting} onOpenChange={() => setDetailMeeting(null)}>
          <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${detailMeeting.meetingType === "operacional" ? "bg-violet-500/20" : "bg-orange-500/20"}`}>
                  {detailMeeting.meetingType === "operacional" ? <Briefcase className="w-5 h-5 text-violet-400" /> : <Target className="w-5 h-5 text-orange-400" />}
                </div>
                <div>
                  <DialogTitle className="text-white text-base">{detailMeeting.title}</DialogTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`text-[10px] border ${TYPE_COLORS[detailMeeting.meetingType]}`}>
                      {detailMeeting.meetingType === "operacional" ? "Operacional" : "Estratégico"}
                    </Badge>
                    <Badge className={`text-[10px] border ${STATUS_COLORS[detailMeeting.status]}`}>
                      {STATUS_LABELS[detailMeeting.status]}
                    </Badge>
                  </div>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-4 text-sm text-zinc-300">
                <div className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-zinc-500" />{formatDate(detailMeeting.scheduledAt)}</div>
                <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-zinc-500" />{formatTime(detailMeeting.scheduledAt)} · {detailMeeting.durationMin}min</div>
              </div>
              {detailMeeting.agenda.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Pauta</p>
                  <div className="space-y-1.5">
                    {detailMeeting.agenda.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                        <span className="text-amber-400 font-bold text-xs mt-0.5">{i + 1}.</span>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {detailMeeting.notes && (
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Observações</p>
                  <div className="flex items-start gap-2 bg-zinc-800 rounded-lg p-3">
                    <MessageSquare className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">{detailMeeting.notes}</p>
                  </div>
                </div>
              )}
              {detailMeeting.invites.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Participantes</p>
                  <div className="space-y-2">
                    {detailMeeting.invites.map(inv => (
                      <div key={inv.userId} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AvatarChip name={inv.userName} avatarUrl={inv.userAvatarUrl} rsvp={inv.rsvp} />
                          <span className="text-sm text-zinc-300">{inv.userName ?? `Usuário ${inv.userId}`}</span>
                        </div>
                        <span className={`text-xs font-medium ${inv.rsvp === "confirmado" ? "text-emerald-400" : inv.rsvp === "declinado" ? "text-red-400" : "text-zinc-500"}`}>
                          {inv.rsvp === "confirmado" ? "✓ Confirmado" : inv.rsvp === "declinado" ? "✗ Declinado" : "Pendente"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(() => {
                const myInvite = detailMeeting.invites.find(i => i.userId === user?.id);
                if (myInvite && myInvite.rsvp === "pendente") {
                  return (
                    <div className="flex gap-2 pt-2">
                      <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { respondMutation.mutate({ meetingId: detailMeeting.id, rsvp: "confirmado" }); setDetailMeeting(null); }}>
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Confirmar Presença
                      </Button>
                      <Button variant="outline" className="flex-1 border-red-500/40 text-red-400 hover:bg-red-500/10" onClick={() => { respondMutation.mutate({ meetingId: detailMeeting.id, rsvp: "declinado" }); setDetailMeeting(null); }}>
                        <XCircle className="w-4 h-4 mr-1.5" /> Declinar
                      </Button>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            <DialogFooter>
              {detailMeeting.createdBy === user?.id && (
                <Button variant="outline" className="border-red-500/40 text-red-400 hover:bg-red-500/10 mr-auto" onClick={() => deleteMutation.mutate({ id: detailMeeting.id })} disabled={deleteMutation.isPending}>
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Excluir
                </Button>
              )}
              <Button variant="outline" onClick={() => setDetailMeeting(null)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
