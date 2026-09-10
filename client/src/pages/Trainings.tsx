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
import {
  ArrowLeft,
  Folder,
  FolderOpen,
  GraduationCap,
  Play,
  Plus,
  Pencil,
  Trash2,
  Lock,
  Users,
  Video,
} from "lucide-react";

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

const AUDIENCE_LABELS: Record<
  string,
  {
    label: string;
    color: string;
    icon: React.ReactNode;
  }
> = {
  client: {
    label: "Clientes",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    icon: <Users className="w-3 h-3" />,
  },
  marketer: {
    label: "Marqueteiros",
    color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    icon: <Lock className="w-3 h-3" />,
  },
  all: {
    label: "Todos",
    color: "bg-green-500/10 text-green-400 border-green-500/20",
    icon: <GraduationCap className="w-3 h-3" />,
  },
};

function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
  );

  return match ? match[1] : null;
}

function getThumbnail(training: Training): string | null {
  if (training.thumbnailUrl) {
    return training.thumbnailUrl;
  }

  if (training.videoUrl) {
    const youtubeId = getYouTubeId(training.videoUrl);

    if (youtubeId) {
      return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
    }
  }

  return null;
}

export default function Trainings() {
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";
  const isMarketer = user?.role === "marketer";
  const canManage = isAdmin;

  const { data: trainings = [], refetch } =
    trpc.trainings.list.useQuery();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<TrainingFormData>(EMPTY_FORM);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [watchTraining, setWatchTraining] =
    useState<Training | null>(null);

  const [selectedCategory, setSelectedCategory] =
    useState<string | null>(null);

  const categories = Array.from(
    new Set(
      trainings
        .map((training) => training.category?.trim() || "Geral")
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));

  const grouped = categories.reduce<Record<string, Training[]>>(
    (accumulator, category) => {
      accumulator[category] = trainings
        .filter(
          (training) =>
            (training.category?.trim() || "Geral") === category
        )
        .sort((a, b) => {
          if (a.orderIdx !== b.orderIdx) {
            return a.orderIdx - b.orderIdx;
          }

          return a.title.localeCompare(b.title, "pt-BR");
        });

      return accumulator;
    },
    {}
  );

  const selectedTrainings = selectedCategory
    ? grouped[selectedCategory] ?? []
    : [];

  const createMutation = trpc.trainings.create.useMutation({
    onSuccess: async () => {
      await refetch();
      toast.success("Treinamento criado!");
      closeForm();
    },
    onError: (error) => {
      toast.error(error.message || "Não foi possível criar o treinamento.");
    },
  });

  const updateMutation = trpc.trainings.update.useMutation({
    onSuccess: async () => {
      await refetch();
      toast.success("Treinamento atualizado!");
      closeForm();
    },
    onError: (error) => {
      toast.error(
        error.message || "Não foi possível atualizar o treinamento."
      );
    },
  });

  const deleteMutation = trpc.trainings.delete.useMutation({
    onSuccess: async () => {
      await refetch();
      toast.success("Treinamento removido.");
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error(
        error.message || "Não foi possível excluir o treinamento."
      );
    },
  });

  function closeForm() {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
  }

  function openCreate() {
    setEditId(null);

    setForm({
      ...EMPTY_FORM,
      category: selectedCategory ?? "Geral",
    });

    setShowForm(true);
  }

  function openEdit(training: Training) {
    setEditId(training.id);

    setForm({
      title: training.title,
      description: training.description ?? "",
      videoUrl: training.videoUrl ?? "",
      thumbnailUrl: training.thumbnailUrl ?? "",
      audience: training.audience,
      category: training.category?.trim() || "Geral",
    });

    setShowForm(true);
  }

  function handleSubmit() {
    const title = form.title.trim();
    const category = form.category.trim();

    if (!title) {
      toast.error("Título é obrigatório.");
      return;
    }

    if (!category) {
      toast.error("Informe a pasta do treinamento.");
      return;
    }

    const payload = {
      ...form,
      title,
      category,
      description: form.description.trim(),
      videoUrl: form.videoUrl.trim(),
      thumbnailUrl: form.thumbnailUrl.trim(),
    };

    if (editId !== null) {
      updateMutation.mutate({
        id: editId,
        ...payload,
      });

      return;
    }

    createMutation.mutate(payload);
  }

  function openCategory(category: string) {
    setSelectedCategory(category);
  }

  function returnToFolders() {
    setSelectedCategory(null);
  }

  function audienceInfo(audience: string) {
    return AUDIENCE_LABELS[audience] ?? AUDIENCE_LABELS.all;
  }

  const isSaving =
    createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-4 md:p-6 pb-24 max-w-6xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          {selectedCategory && (
            <button
              type="button"
              onClick={returnToFolders}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#C9A227] transition-colors mb-3"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para as pastas
            </button>
          )}

          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            {selectedCategory ? (
              <FolderOpen className="w-7 h-7 text-[#C9A227]" />
            ) : (
              <GraduationCap className="w-7 h-7 text-[#C9A227]" />
            )}

            {selectedCategory || "Treinamentos"}
          </h1>

          <p className="text-sm text-muted-foreground mt-1">
            {selectedCategory
              ? `${selectedTrainings.length} vídeo${selectedTrainings.length === 1 ? "" : "s"
              } nesta pasta`
              : isAdmin || isMarketer
                ? "Acesso completo — treinamentos de clientes e marqueteiros"
                : "Treinamentos disponíveis para clientes"}
          </p>
        </div>

        {canManage && (
          <Button
            onClick={openCreate}
            className="bg-[#C9A227] hover:bg-[#b8911f] text-black font-semibold gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Treinamento
          </Button>
        )}
      </div>

      {/* Identificação dos públicos */}
      {!selectedCategory && (isAdmin || isMarketer) && (
        <div className="mb-6 flex gap-2 flex-wrap">
          <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 gap-1">
            <Users className="w-3 h-3" />
            Treinamentos de Clientes
          </Badge>

          <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 gap-1">
            <Lock className="w-3 h-3" />
            Treinamentos de Marqueteiros
          </Badge>
        </div>
      )}

      {/* Estado vazio geral */}
      {trainings.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />

          <p className="font-medium">
            Nenhum treinamento disponível ainda.
          </p>

          <p className="text-sm mt-1">
            A primeira pasta será criada junto com o primeiro vídeo.
          </p>

          {canManage && (
            <Button
              onClick={openCreate}
              variant="outline"
              className="mt-4 gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar primeiro treinamento
            </Button>
          )}
        </div>
      )}

      {/* Visualização das pastas */}
      {!selectedCategory && trainings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => {
            const folderTrainings = grouped[category] ?? [];
            const firstTraining = folderTrainings[0];
            const thumbnail = firstTraining
              ? getThumbnail(firstTraining)
              : null;

            return (
              <button
                key={category}
                type="button"
                onClick={() => openCategory(category)}
                className="group text-left rounded-2xl border border-border bg-card overflow-hidden hover:border-[#C9A227]/50 hover:shadow-lg hover:shadow-[#C9A227]/5 transition-all duration-200"
              >
                <div className="relative h-32 bg-gradient-to-br from-[#C9A227]/20 via-[#C9A227]/5 to-transparent overflow-hidden">
                  {thumbnail && (
                    <img
                      src={thumbnail}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity"
                    />
                  )}

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#C9A227]/15 border border-[#C9A227]/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Folder className="w-9 h-9 text-[#C9A227] fill-[#C9A227]/15" />
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <h2 className="font-bold text-foreground group-hover:text-[#C9A227] transition-colors">
                    {category}
                  </h2>

                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Video className="w-3.5 h-3.5" />

                    <span>
                      {folderTrainings.length} vídeo
                      {folderTrainings.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Vídeos da pasta selecionada */}
      {selectedCategory && (
        <>
          {selectedTrainings.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">
                Esta pasta não possui vídeos.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedTrainings.map((training) => {
                const thumbnail = getThumbnail(training);
                const info = audienceInfo(training.audience);

                return (
                  <div
                    key={training.id}
                    className="group relative rounded-2xl border border-border bg-card overflow-hidden hover:border-[#C9A227]/40 transition-all duration-200 hover:shadow-lg hover:shadow-[#C9A227]/5"
                  >
                    {/* Miniatura */}
                    <div
                      className="relative w-full aspect-video bg-muted cursor-pointer"
                      onClick={() => setWatchTraining(training)}
                    >
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={training.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#C9A227]/10 to-transparent">
                          <GraduationCap className="w-10 h-10 text-[#C9A227]/40" />
                        </div>
                      )}

                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="w-12 h-12 rounded-full bg-[#C9A227] flex items-center justify-center shadow-lg">
                          <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                        </div>
                      </div>

                      <div className="absolute top-2 left-2">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${info.color}`}
                        >
                          {info.icon}
                          {info.label}
                        </span>
                      </div>
                    </div>

                    {/* Conteúdo */}
                    <div className="p-4">
                      <h3
                        className="font-semibold text-foreground text-sm leading-snug cursor-pointer hover:text-[#C9A227] transition-colors"
                        onClick={() => setWatchTraining(training)}
                      >
                        {training.title}
                      </h3>

                      {training.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {training.description}
                        </p>
                      )}
                    </div>

                    {/* Ações administrativas */}
                    {canManage && (
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          type="button"
                          aria-label="Editar treinamento"
                          onClick={(event) => {
                            event.stopPropagation();
                            openEdit(training);
                          }}
                          className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-[#C9A227]/80 transition-colors"
                        >
                          <Pencil className="w-3 h-3 text-white" />
                        </button>

                        <button
                          type="button"
                          aria-label="Excluir treinamento"
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeleteId(training.id);
                          }}
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
          )}
        </>
      )}

      {/* Modal para assistir */}
      <Dialog
        open={watchTraining !== null}
        onOpenChange={(open) => {
          if (!open) {
            setWatchTraining(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {watchTraining && (
            <>
              {watchTraining.videoUrl ? (
                (() => {
                  const youtubeId = getYouTubeId(
                    watchTraining.videoUrl
                  );

                  return youtubeId ? (
                    <div className="aspect-video w-full">
                      <iframe
                        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                        title={watchTraining.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="aspect-video w-full">
                      <video
                        src={watchTraining.videoUrl}
                        controls
                        autoPlay
                        className="w-full h-full object-contain bg-black"
                      />
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
                    <h2 className="text-lg font-bold text-foreground">
                      {watchTraining.title}
                    </h2>

                    {watchTraining.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {watchTraining.description}
                      </p>
                    )}
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${audienceInfo(watchTraining.audience).color
                      }`}
                  >
                    {audienceInfo(watchTraining.audience).icon}
                    {audienceInfo(watchTraining.audience).label}
                  </span>
                </div>

                {watchTraining.videoUrl &&
                  !getYouTubeId(watchTraining.videoUrl) && (
                    <a
                      href={watchTraining.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#C9A227] hover:underline mt-2 inline-block"
                    >
                      Abrir link externo →
                    </a>
                  )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de criação e edição */}
      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          if (!open) {
            closeForm();
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editId !== null
                ? "Editar Treinamento"
                : "Novo Treinamento"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Título *
              </label>

              <Input
                value={form.title}
                onChange={(event) =>
                  setForm({
                    ...form,
                    title: event.target.value,
                  })
                }
                placeholder="Ex: Como usar o Checklist"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Descrição
              </label>

              <Textarea
                value={form.description}
                onChange={(event) =>
                  setForm({
                    ...form,
                    description: event.target.value,
                  })
                }
                placeholder="Breve descrição do conteúdo..."
                className="mt-1 resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                URL do vídeo
              </label>

              <Input
                value={form.videoUrl}
                onChange={(event) =>
                  setForm({
                    ...form,
                    videoUrl: event.target.value,
                  })
                }
                placeholder="https://youtube.com/watch?v=... ou link direto"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                URL da miniatura
              </label>

              <Input
                value={form.thumbnailUrl}
                onChange={(event) =>
                  setForm({
                    ...form,
                    thumbnailUrl: event.target.value,
                  })
                }
                placeholder="Opcional — o YouTube gera automaticamente"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Público
                </label>

                <Select
                  value={form.audience}
                  onValueChange={(value) =>
                    setForm({
                      ...form,
                      audience: value as
                        | "client"
                        | "marketer"
                        | "all",
                    })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="client">
                      Clientes
                    </SelectItem>
                    <SelectItem value="marketer">
                      Marqueteiros
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Pasta *
                </label>

                <Input
                  value={form.category}
                  list="training-folders"
                  onChange={(event) =>
                    setForm({
                      ...form,
                      category: event.target.value,
                    })
                  }
                  placeholder="Ex: Onboarding"
                  className="mt-1"
                />

                <datalist id="training-folders">
                  {categories.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Escreva o nome de uma nova pasta ou selecione uma pasta
              existente.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeForm}
              disabled={isSaving}
            >
              Cancelar
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={isSaving}
              className="bg-[#C9A227] hover:bg-[#b8911f] text-black font-semibold"
            >
              {isSaving
                ? "Salvando..."
                : editId !== null
                  ? "Salvar Alterações"
                  : "Criar Treinamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <Dialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteId(null);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir treinamento?</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Esta ação não pode ser desfeita. Se este for o último
            vídeo da pasta, a pasta também deixará de aparecer.
          </p>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
            >
              Cancelar
            </Button>

            <Button
              variant="destructive"
              onClick={() => {
                if (deleteId !== null) {
                  deleteMutation.mutate({ id: deleteId });
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending
                ? "Excluindo..."
                : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}