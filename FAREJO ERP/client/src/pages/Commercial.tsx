import { useState, useMemo } from "react";
import { useApp } from "@/contexts/AppContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
);
const IconBulb = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/>
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14"/>
  </svg>
);
const IconHeart = ({ filled }: { filled?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
);
const IconComment = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
);
const IconSend = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────
interface Insight {
  id: number;
  tenantId: number;
  title: string;
  body: string | null;
  imageUrl: string | null;
  authorId: number | null;
  createdAt: Date;
}

interface InsightLike {
  id: number;
  insightId: number;
  userId: number;
  createdAt: Date;
}

interface InsightComment {
  id: number;
  insightId: number;
  userId: number;
  body: string;
  createdAt: Date;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function daysAgo(d: Date): string {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";
  return `${diff} dias atrás`;
}

function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ url, name, size = 32 }: { url?: string | null; name?: string | null; size?: number }) {
  const sz = `${size}px`;
  if (url) {
    return (
      <img
        src={url}
        alt={name ?? ""}
        style={{ width: sz, height: sz }}
        className="rounded-full object-cover shrink-0 border border-border"
      />
    );
  }
  return (
    <div
      style={{ width: sz, height: sz, fontSize: size < 28 ? "10px" : "12px" }}
      className="rounded-full bg-[#C9A227]/20 text-[#C9A227] font-bold flex items-center justify-center shrink-0 border border-[#C9A227]/30"
    >
      {initials(name)}
    </div>
  );
}

// ─── InsightCard ──────────────────────────────────────────────────────────────
function InsightCard({
  insight,
  currentUserId,
  isAdmin,
  likes,
  comments,
  avatarMap,
  onDelete,
}: {
  insight: Insight;
  currentUserId: number;
  isAdmin: boolean;
  likes: InsightLike[];
  comments: InsightComment[];
  avatarMap: Map<number, { name: string | null; avatarUrl: string | null }>;
  onDelete: (i: Insight) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const utils = trpc.useUtils();
  const myLike = likes.find((l) => l.userId === currentUserId);

  const toggleLike = trpc.insights.toggleLike.useMutation({
    onMutate: async () => {
      await utils.insights.likes.cancel({ tenantId: insight.tenantId });
      const prev = utils.insights.likes.getData({ tenantId: insight.tenantId });
      utils.insights.likes.setData({ tenantId: insight.tenantId }, (old) => {
        if (!old) return old;
        if (myLike) return old.filter((l) => l.id !== myLike.id);
        return [...old, { id: -Date.now(), insightId: insight.id, userId: currentUserId, createdAt: new Date() }];
      });
      return { prev };
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.prev) utils.insights.likes.setData({ tenantId: insight.tenantId }, ctx.prev);
    },
    onSettled: () => utils.insights.likes.invalidate({ tenantId: insight.tenantId }),
  });

  const addComment = trpc.insights.addComment.useMutation({
    onSuccess: () => {
      setCommentText("");
      utils.insights.comments.invalidate({ tenantId: insight.tenantId });
    },
    onError: () => toast.error("Erro ao comentar"),
  });

  const deleteComment = trpc.insights.deleteComment.useMutation({
    onSuccess: () => utils.insights.comments.invalidate({ tenantId: insight.tenantId }),
  });

  const handleSendComment = () => {
    const text = commentText.trim();
    if (!text) return;
    addComment.mutate({ insightId: insight.id, body: text });
  };

  const authorInfo = insight.authorId ? avatarMap.get(insight.authorId) : null;

  return (
    <article className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-[#C9A227]/40 transition-all duration-200 hover:shadow-md">
      {insight.imageUrl && (
        <img src={insight.imageUrl} alt={insight.title} className="w-full h-52 object-cover" />
      )}
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 mb-3">
            <Avatar url={authorInfo?.avatarUrl} name={authorInfo?.name} size={34} />
            <div>
              <p className="text-xs font-semibold text-foreground leading-tight">{authorInfo?.name ?? "Equipe Farejo"}</p>
              <p className="text-[10px] text-muted-foreground">{daysAgo(insight.createdAt)}</p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => onDelete(insight)}
              className="opacity-0 group-hover:opacity-100 p-2 rounded-lg border border-border hover:border-destructive text-muted-foreground hover:text-destructive transition-all shrink-0"
              title="Remover insight"
            >
              <IconTrash />
            </button>
          )}
        </div>

        {/* Badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#C9A227] uppercase tracking-widest bg-[#C9A227]/10 px-2 py-0.5 rounded-full">
            <IconBulb />
            Insight
          </span>
        </div>

        {/* Title & Body */}
        <h3 className="font-bold text-foreground text-lg leading-snug">{insight.title}</h3>
        {insight.body && (
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed whitespace-pre-line">{insight.body}</p>
        )}

        {/* Actions row */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
          <button
            onClick={() => toggleLike.mutate({ insightId: insight.id })}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${myLike ? "text-red-500" : "text-muted-foreground hover:text-red-400"}`}
          >
            <IconHeart filled={!!myLike} />
            <span>{likes.length}</span>
          </button>
          <button
            onClick={() => setShowComments((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <IconComment />
            <span>{comments.length}</span>
          </button>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="mt-4 space-y-3">
            {comments.map((c) => {
              const cInfo = avatarMap.get(c.userId);
              return (
                <div key={c.id} className="flex items-start gap-2 group/comment">
                  <Avatar url={cInfo?.avatarUrl} name={cInfo?.name} size={26} />
                  <div className="flex-1 bg-muted/40 rounded-xl px-3 py-2">
                    <p className="text-[11px] font-semibold text-foreground mb-0.5">{cInfo?.name ?? "Usuário"}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{c.body}</p>
                  </div>
                  {c.userId === currentUserId && (
                    <button
                      onClick={() => deleteComment.mutate({ id: c.id })}
                      className="opacity-0 group-hover/comment:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                      title="Remover comentário"
                    >
                      <IconTrash />
                    </button>
                  )}
                </div>
              );
            })}
            {/* Comment input */}
            <div className="flex items-center gap-2 mt-2">
              <Avatar url={avatarMap.get(currentUserId)?.avatarUrl} name={avatarMap.get(currentUserId)?.name} size={26} />
              <div className="flex-1 flex items-center gap-2 bg-muted/40 rounded-xl px-3 py-1.5 border border-border focus-within:border-[#C9A227]/50 transition-colors">
                <input
                  className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                  placeholder="Escreva um comentário..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendComment()}
                />
                <button
                  onClick={handleSendComment}
                  disabled={!commentText.trim() || addComment.isPending}
                  className="text-[#C9A227] hover:text-[#E8C84A] disabled:opacity-30 transition-colors"
                >
                  <IconSend />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Commercial() {
  const { user, activeTenantId } = useApp();
  const isAdmin = user?.role === "admin";

  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Insight | null>(null);
  const [form, setForm] = useState({ title: "", body: "", imageFile: null as File | null });
  const [uploading, setUploading] = useState(false);

  const { data: insights = [], refetch } = trpc.insights.list.useQuery(
    { tenantId: activeTenantId! },
    { enabled: !!activeTenantId }
  );

  const { data: allLikes = [] } = trpc.insights.likes.useQuery(
    { tenantId: activeTenantId! },
    { enabled: !!activeTenantId }
  );

  const { data: allComments = [] } = trpc.insights.comments.useQuery(
    { tenantId: activeTenantId! },
    { enabled: !!activeTenantId }
  );

  // Collect all unique user IDs from insights + comments
  const userIds = useMemo(() => {
    const ids = new Set<number>();
    (insights as Insight[]).forEach((i) => { if (i.authorId) ids.add(i.authorId); });
    (allComments as InsightComment[]).forEach((c) => ids.add(c.userId));
    (allLikes as InsightLike[]).forEach((l) => ids.add(l.userId));
    if (user?.id) ids.add(user.id);
    return Array.from(ids);
  }, [insights, allComments, allLikes, user?.id]);

  const { data: avatarRows = [] } = trpc.profile.avatars.useQuery(
    { userIds },
    { enabled: userIds.length > 0 }
  );

  const avatarMap = useMemo(() => {
    const map = new Map<number, { name: string | null; avatarUrl: string | null }>();
    (avatarRows as { id: number; name: string | null; avatarUrl: string | null }[]).forEach((r) => map.set(r.id, r));
    return map;
  }, [avatarRows]);

  const createMutation = trpc.insights.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowAddModal(false);
      setForm({ title: "", body: "", imageFile: null });
      toast.success("Insight publicado!");
    },
    onError: () => toast.error("Erro ao publicar insight"),
  });

  const deleteMutation = trpc.insights.delete.useMutation({
    onSuccess: () => {
      refetch();
      setConfirmDelete(null);
      toast.success("Insight removido");
    },
    onError: () => toast.error("Erro ao remover"),
  });

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const data = await res.json() as { url: string };
      return data.url;
    } catch {
      toast.error("Erro ao fazer upload da imagem");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handlePublish = async () => {
    if (!form.title.trim()) return;
    let imageUrl: string | undefined;
    if (form.imageFile) {
      const url = await uploadImage(form.imageFile);
      if (url) imageUrl = url;
    }
    createMutation.mutate({
      tenantId: activeTenantId!,
      title: form.title.trim(),
      body: form.body.trim() || undefined,
      imageUrl,
    });
  };

  // ─── No tenant selected ───────────────────────────────────────────────────
  if (!activeTenantId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="text-4xl font-bold tracking-[0.3em] text-[#C9A227] logo-pulse mb-6">FAREJO</div>
        <p className="text-muted-foreground text-sm text-center">
          {user?.role === "admin"
            ? "Selecione um cliente para visualizar os insights."
            : "Nenhum cliente atribuído ao seu perfil."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* ─── Page Header ──────────────────────────────────────────────────── */}
      <div className="bg-[#0B0F14] dark:bg-[#060809] text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="badge-shimmer text-xs font-bold tracking-widest uppercase">
                  Feed Comercial
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white">Insights de Marketing</h1>
              <p className="text-white/50 text-sm mt-0.5">
                Publicações do time comercial para orientar as ações de marketing
              </p>
            </div>
            {isAdmin && (
              <Button
                className="bg-[#C9A227] text-black hover:bg-[#E8C84A] font-bold text-xs shrink-0"
                onClick={() => setShowAddModal(true)}
              >
                <IconPlus /> <span className="ml-1">Novo Insight</span>
              </Button>
            )}
          </div>
        </div>
        <div className="border-t border-[#C9A227]/20 py-2 text-center">
          <p className="text-[#C9A227] text-xs font-bold tracking-[0.2em] uppercase">
            INTELIGÊNCIA · ESTRATÉGIA · RESULTADO
          </p>
        </div>
      </div>

      {/* ─── Feed Content ─────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
        {(insights as Insight[]).length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-xl p-14 text-center text-muted-foreground">
            <div className="flex justify-center mb-3 text-[#C9A227]/40">
              <IconBulb />
            </div>
            <p className="font-semibold text-base">Nenhum insight publicado ainda</p>
            <p className="text-sm mt-1">
              {isAdmin
                ? "Clique em \"Novo Insight\" para publicar o primeiro insight para o time."
                : "O time comercial publicará insights aqui para orientar as ações de marketing."}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {(insights as Insight[]).map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                currentUserId={user!.id}
                isAdmin={isAdmin}
                likes={(allLikes as InsightLike[]).filter((l) => l.insightId === insight.id)}
                comments={(allComments as InsightComment[]).filter((c) => c.insightId === insight.id)}
                avatarMap={avatarMap}
                onDelete={setConfirmDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── Add Insight Modal ─────────────────────────────────────────────── */}
      <Dialog
        open={showAddModal}
        onOpenChange={(o) => {
          if (!o) { setShowAddModal(false); setForm({ title: "", body: "", imageFile: null }); }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Insight de Marketing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Título *</label>
              <Input
                placeholder="Ex: Divulgar ofertas da curva A"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Descrição</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none outline-none focus:ring-1 focus:ring-[#C9A227] min-h-[100px]"
                placeholder="Detalhe o insight para o time de marketing..."
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Imagem (opcional)</label>
              {form.imageFile ? (
                <div className="flex items-center gap-3">
                  <img
                    src={URL.createObjectURL(form.imageFile)}
                    alt="Preview"
                    className="h-20 w-32 object-cover rounded-lg border border-border"
                  />
                  <button
                    onClick={() => setForm({ ...form, imageFile: null })}
                    className="text-xs text-destructive hover:underline"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-border rounded-lg cursor-pointer hover:border-[#C9A227]/50 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                  <IconPlus />
                  <span>Adicionar imagem</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setForm({ ...form, imageFile: e.target.files?.[0] ?? null })}
                  />
                </label>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancelar</Button>
            <Button
              className="bg-[#C9A227] text-black hover:bg-[#E8C84A]"
              disabled={!form.title.trim() || uploading || createMutation.isPending}
              onClick={handlePublish}
            >
              {uploading || createMutation.isPending ? "Publicando..." : "Publicar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirm Modal ──────────────────────────────────────────── */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Insight</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja remover <strong>"{confirmDelete?.title}"</strong>?
            Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => confirmDelete && deleteMutation.mutate({ id: confirmDelete.id, tenantId: activeTenantId! })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Removendo..." : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
