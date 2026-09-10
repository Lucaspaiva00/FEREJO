import React, { useState, useRef } from "react";
import { useApp } from "@/contexts/AppContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type Testimonial = {
  id: number;
  tenantId: number;
  title: string;
  description: string | null;
  fileUrl: string;
  fileType: "image" | "video";
  uploadedBy: number;
  createdAt: Date;
};

async function uploadFile(file: File): Promise<string> {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: {
      "Content-Type": file.type,
      "x-content-type": file.type,
      "x-filename": `testimonial_${Date.now()}.${file.name.split(".").pop()}`,
    },
    body: file,
  });
  if (!res.ok) throw new Error("Falha no upload do arquivo");
  const data = await res.json();
  return data.url as string;
}

export default function Testimonials() {
  const { activeTenantId } = useApp();
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: testimonials = [], refetch } = trpc.testimonials.list.useQuery(
    { tenantId: activeTenantId! },
    { enabled: !!activeTenantId }
  );

  const createMutation = trpc.testimonials.create.useMutation({
    onSuccess: () => {
      refetch();
      setAddOpen(false);
      setTitle("");
      setDescription("");
      setFile(null);
      setPreview(null);
      toast.success("Depoimento adicionado!");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.testimonials.delete.useMutation({
    onSuccess: () => {
      refetch();
      setDeleteId(null);
      toast.success("Depoimento removido.");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !file || !activeTenantId) return;
    setUploading(true);
    try {
      const fileUrl = await uploadFile(file);
      const fileType = file.type.startsWith("video") ? "video" : "image";
      await createMutation.mutateAsync({ tenantId: activeTenantId, title, description: description || undefined, fileUrl, fileType });
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao fazer upload");
    } finally {
      setUploading(false);
    }
  };

  const typed = testimonials as Testimonial[];

  return (
    <div className="mt-10">
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#C9A227]">
              <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
              <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
            </svg>
            Acervo de Depoimentos
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Biblioteca de depoimentos de clientes para reforçar posicionamento e quebrar objeções.</p>
        </div>
        <Button
          size="sm"
          className="bg-[#C9A227] hover:bg-[#B8911E] text-black font-bold"
          onClick={() => setAddOpen(true)}
        >
          + Adicionar
        </Button>
      </div>

      {/* Grid */}
      {typed.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl py-12 text-center text-muted-foreground">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 opacity-40">
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
          </svg>
          <p className="text-sm">Nenhum depoimento cadastrado ainda.</p>
          <p className="text-xs mt-1">Clique em "+ Adicionar" para subir o primeiro depoimento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {typed.map((t) => (
            <div key={t.id} className="group relative bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              {/* Media preview */}
              <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                {t.fileType === "video" ? (
                  <video src={t.fileUrl} className="w-full h-full object-cover" controls />
                ) : (
                  <img src={t.fileUrl} alt={t.title} className="w-full h-full object-cover" />
                )}
              </div>
              {/* Info */}
              <div className="p-3">
                <p className="font-bold text-sm text-foreground truncate">{t.title}</p>
                {t.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.description}</p>}
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${t.fileType === "video" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" : "bg-[#C9A227]/10 text-[#C9A227]"}`}>
                    {t.fileType === "video" ? "Vídeo" : "Imagem"}
                  </span>
                  <button
                    onClick={() => setDeleteId(t.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    title="Remover"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Depoimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Título *</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: João Silva — Cliente Satisfeito" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descrição (opcional)</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Contexto ou trecho do depoimento" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Arquivo (imagem ou vídeo) *</label>
              <div
                className="mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-[#C9A227]/60 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {preview ? (
                  file?.type.startsWith("video") ? (
                    <video src={preview} className="max-h-32 mx-auto rounded" />
                  ) : (
                    <img src={preview} alt="preview" className="max-h-32 mx-auto rounded object-contain" />
                  )
                ) : (
                  <div className="text-muted-foreground">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <p className="text-xs">Clique para selecionar imagem ou vídeo</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">Máx. 50 MB</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <Button
              size="sm"
              className="bg-[#C9A227] hover:bg-[#B8911E] text-black font-bold"
              onClick={handleSubmit}
              disabled={!title.trim() || !file || uploading || createMutation.isPending}
            >
              {uploading ? "Enviando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Remover Depoimento</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja remover este depoimento? Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId, tenantId: activeTenantId! })}
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
