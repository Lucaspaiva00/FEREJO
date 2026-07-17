import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { GraduationCap, Play, Plus, Pencil, Trash2, Lock, Users } from "lucide-react";

type Training = {
  id: number;
  title: string;
  description: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  audience: "client" | "marketer" | "all";
  category: string;
  orderIdx: number;
  createdAt: Date;
  updatedAt: Date;
};

type TrainingFormData = {
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  audience: "client" | "marketer" | "all";
  category: string;
};

const EMPTY_FORM: TrainingFormData = {
  title: "",
  description: "",
  videoUrl: "",
  thumbnailUrl: "",
  audience: "all",
  category: "Geral",
};

const AUDIENCE_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  client: { label: "Clientes", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: <Users className="w-3 h-3" /> },
  marketer: { label: "Marqueteiros", color: "bg-purple-500/10 text-purple-400 border-purple-500/20", icon: <Lock className="w-3 h-3" /> },
  all: { label: "Todos", color: "bg-green-500/10 text-green-400 border-green-500/20", icon: <GraduationCap className="w-3 h-3" /> },
};

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
  return match ? match[1] : null;
}

function getThumbnail(training: Training): string | null {
  if (training.thumbnailUrl) return training.thumbnailUrl;
  if (training.videoUrl) {
    const ytId = getYouTubeId(training.videoUrl);
    if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }
  return null;
}

export default function Trainings() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isMarketer = user?.role === "marketer";
  const canManage = isAdmin;

  const { data: trainings = [], refetch } = trpc.trainings.list.useQuery();
  const createMutation = trpc.trainings.create.useMutation({ onSuccess: () => { refetch(); toast.success("Treinamento criado!"); setShowForm(false); setForm(EMPTY_FORM); } });
  const updateMutation = trpc.trainings.update.useMutation({ onSuccess: () => { refetch(); toast.success("Treinamento atualizado!"); setEditId(null); setShowForm(false); setForm(EMPTY_FORM); } });
  const deleteMutation = trpc.trainings.delete.useMutation({ onSuccess: () => { refetch(); toast.success("Treinamento removido."); setDeleteId(null); } });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<TrainingFormData>(EMPTY_FORM);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [watchTraining, setWatchTraining] = useState<Training | null>(null);

  const categories = Array.from(new Set(trainings.map((t) => t.category))).sort();

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(t: Training) {
    setEditId(t.id);
    setForm({
      title: t.title,
      description: t.description ?? "",
      videoUrl: t.videoUrl ?? "",
      thumbnailUrl: t.thumbnailUrl ?? "",
      audience: t.audience,
      category: t.category,
    });
    setShowForm(true);
  }

  function handleSubmit() {
    if (!form.title.trim()) { toast.error("Título é obrigatório."); return; }
    if (editId) {
      updateMutation.mutate({ id: editId, ...form });
    } else {
      createMutation.mutate(form);
    }
  }

  const grouped = categories.reduce<Record<string, Training[]>>((acc, cat) => {
    acc[cat] = trainings.filter((t) => t.category === cat);
    return acc;
  }, {});

  const audienceInfo = (audience: string) => AUDIENCE_LABELS[audience] ?? AUDIENCE_LABELS.all;

  return (
    <div className="p-4 md:p-6 pb-24 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-[#C9A227]" />
            Treinamentos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin || isMarketer
              ? "Acesso completo — treinamentos de clientes e marqueteiros"
              : "Treinamentos disponíveis para clientes"}
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate} className="bg-[#C9A227] hover:bg-[#b8911f] text-black font-semibold gap-2">
            <Plus className="w-4 h-4" />
            Novo Treinamento
          </Button>
        )}
      </div>

      {/* Role badge */}
      {(isAdmin || isMarketer) && (
        <div className="mb-6 flex gap-2 flex-wrap">
          <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 gap-1">
            <Users className="w-3 h-3" /> Treinamentos de Clientes
          </Badge>
          <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 gap-1">
            <Lock className="w-3 h-3" /> Treinamentos de Marqueteiros
          </Badge>
        </div>
      )}

      {/* Empty state */}
      {trainings.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum treinamento disponível ainda.</p>
          {canManage && (
            <Button onClick={openCreate} variant="outline" className="mt-4 gap-2">
              <Plus className="w-4 h-4" /> Adicionar primeiro treinamento
            </Button>
          )}
        </div>
      )}

      {/* Categories */}
      {categories.map((cat) => (
        <div key={cat} className="mb-10">
          <h2 className="text-base font-bold text-[#C9A227] uppercase tracking-widest mb-4 border-b border-[#C9A227]/20 pb-2">
            {cat}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {grouped[cat].map((t) => {
              const thumb = getThumbnail(t);
              const info = audienceInfo(t.audience);
              return (
                <div
                  key={t.id}
                  className="group relative rounded-2xl border border-border bg-card overflow-hidden hover:border-[#C9A227]/40 transition-all duration-200 hover:shadow-lg hover:shadow-[#C9A227]/5"
                >
                  {/* Thumbnail */}
                  <div
                    className="relative w-full aspect-video bg-muted cursor-pointer"
                    onClick={() => setWatchTraining(t)}
                  >
                    {thumb ? (
                      <img src={thumb} alt={t.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#C9A227]/10 to-transparent">
                        <GraduationCap className="w-10 h-10 text-[#C9A227]/40" />
                      </div>
                    )}
                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="w-12 h-12 rounded-full bg-[#C9A227] flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                      </div>
                    </div>
                    {/* Audience badge */}
                    <div className="absolute top-2 left-2">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${info.color}`}>
                        {info.icon} {info.label}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3
                      className="font-semibold text-foreground text-sm leading-snug cursor-pointer hover:text-[#C9A227] transition-colors"
                      onClick={() => setWatchTraining(t)}
                    >
                      {t.title}
                    </h3>
                    {t.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                    )}
                  </div>

                  {/* Admin actions */}
                  {canManage && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(t); }}
                        className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-[#C9A227]/80 transition-colors"
                      >
                        <Pencil className="w-3 h-3 text-white" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteId(t.id); }}
                        className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-red-500/80 transition-colors"
                      >
                        <Trash2 className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Watch modal */}
      <Dialog open={!!watchTraining} onOpenChange={(o) => !o && setWatchTraining(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {watchTraining && (
            <>
              {watchTraining.videoUrl ? (
                (() => {
                  const ytId = getYouTubeId(watchTraining.videoUrl!);
                  return ytId ? (
                    <div className="aspect-video w-full">
                      <iframe
                        src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="aspect-video w-full">
                      <video src={watchTraining.videoUrl!} controls autoPlay className="w-full h-full object-contain bg-black" />
                    </div>
                  );
                })()
              ) : (
                <div className="aspect-video w-full bg-muted flex items-center justify-center">
                  <GraduationCap className="w-16 h-16 text-[#C9A227]/40" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{watchTraining.title}</h2>
                    {watchTraining.description && (
                      <p className="text-sm text-muted-foreground mt-1">{watchTraining.description}</p>
                    )}
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${audienceInfo(watchTraining.audience).color}`}>
                    {audienceInfo(watchTraining.audience).icon}
                    {audienceInfo(watchTraining.audience).label}
                  </span>
                </div>
                {watchTraining.videoUrl && !getYouTubeId(watchTraining.videoUrl) && (
                  <a href={watchTraining.videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#C9A227] hover:underline mt-2 inline-block">
                    Abrir link externo →
                  </a>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit modal */}
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Treinamento" : "Novo Treinamento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Título *</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Como usar o Checklist" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descrição</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Breve descrição do conteúdo..." className="mt-1 resize-none" rows={3} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">URL do Vídeo</label>
              <Input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://youtube.com/watch?v=... ou link direto" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Público</label>
                <Select value={form.audience} onValueChange={(v) => setForm({ ...form, audience: v as "client" | "marketer" | "all" })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="client">Clientes</SelectItem>
                    <SelectItem value="marketer">Marqueteiros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categoria</label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex: Geral, Avançado..." className="mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="bg-[#C9A227] hover:bg-[#b8911f] text-black font-semibold">
              {editId ? "Salvar Alterações" : "Criar Treinamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir treinamento?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })} disabled={deleteMutation.isPending}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
