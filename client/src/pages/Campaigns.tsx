import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "@/contexts/AppContext";
import { useRealtime } from "@/contexts/RealtimeContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MONTHS_FULL = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const TYPE_COLORS: Record<string, string> = {
  custom: "bg-[#C9A227] text-black",
  nacional: "bg-gray-700 text-white",
  saude: "bg-red-300 text-red-900",
  varejo: "bg-blue-300 text-blue-900",
  sazonal: "bg-green-300 text-green-900",
};
const TYPE_LABELS: Record<string, string> = {
  custom: "Personalizada", nacional: "Comemorativa", saude: "Saúde", varejo: "Varejo", sazonal: "Sazonal",
};

type Campaign = {
  id: number; tenantId: number; name: string;
  campType: "custom" | "nacional" | "saude" | "varejo" | "sazonal";
  startDate: Date | string; endDate: Date | string;
  tema: string | null; acoes: string | null; responsible: string | null;
  createdAt: Date; updatedAt: Date;
};

function getCampaignStatus(start: Date, end: Date): { label: string; color: string } {
  const now = new Date();
  const daysUntil = Math.ceil((start.getTime() - now.getTime()) / 86400000);
  if (end < now) return { label: "Encerrada", color: "bg-gray-500/15 text-gray-500" };
  if (start <= now && end >= now) return { label: "Em andamento", color: "bg-green-500/15 text-green-600" };
  if (daysUntil <= 15) return { label: "Iminente", color: "bg-amber-500/15 text-amber-600" };
  return { label: "Planejada", color: "bg-blue-500/15 text-blue-600" };
}

function toDate(d: Date | string): Date {
  if (d instanceof Date) return d;
  return new Date(d + "T00:00:00");
}

// ─── CATALOG DATA ─────────────────────────────────────────────────────────────
const CATALOG = [
  {
    group: "Datas Comemorativas Nacionais", type: "nacional" as const, items: [
      { name: "Ano Novo", mm: "01", dd: "01", duration: 1 },
      { name: "Carnaval", mm: "03", dd: "01", duration: 5 },
      { name: "Páscoa", mm: "04", dd: "13", duration: 7 },
      { name: "Dia do Trabalho", mm: "05", dd: "01", duration: 1 },
      { name: "Dia das Mães", mm: "05", dd: "05", duration: 14 },
      { name: "Dia dos Namorados", mm: "06", dd: "06", duration: 7 },
      { name: "Festa Junina", mm: "06", dd: "13", duration: 30 },
      { name: "Dia dos Pais", mm: "08", dd: "04", duration: 14 },
      { name: "Independência do Brasil", mm: "09", dd: "07", duration: 1 },
      { name: "Dia das Crianças", mm: "10", dd: "06", duration: 7 },
      { name: "Halloween", mm: "10", dd: "25", duration: 7 },
      { name: "Dia de Finados", mm: "11", dd: "01", duration: 1 },
      { name: "Proclamação da República", mm: "11", dd: "15", duration: 1 },
      { name: "Black Friday", mm: "11", dd: "21", duration: 7 },
      { name: "Cyber Monday", mm: "11", dd: "25", duration: 1 },
      { name: "Natal", mm: "12", dd: "15", duration: 10 },
      { name: "Réveillon", mm: "12", dd: "26", duration: 6 },
    ]
  },
  {
    group: "Varejo / Supermercado", type: "varejo" as const, items: [
      { name: "Dia do Consumidor", mm: "03", dd: "13", duration: 7 },
      { name: "Dia do Hot Dog", mm: "03", dd: "08", duration: 3 },
      { name: "Semana do Açougue", mm: "05", dd: "19", duration: 7 },
      { name: "Dia do Chocolate", mm: "07", dd: "07", duration: 3 },
      { name: "Dia da Pizza", mm: "07", dd: "10", duration: 3 },
      { name: "Semana do Frango", mm: "09", dd: "01", duration: 7 },
      { name: "Dia do Sorvete", mm: "09", dd: "23", duration: 3 },
      { name: "Semana da Padaria", mm: "10", dd: "13", duration: 7 },
      { name: "Dia do Pão de Queijo", mm: "08", dd: "17", duration: 3 },
      { name: "Semana da Bebida", mm: "04", dd: "07", duration: 7 },
      { name: "Dia do Hambúrguer", mm: "05", dd: "28", duration: 3 },
      { name: "Semana do Hortifruti", mm: "06", dd: "16", duration: 7 },
    ]
  },
  {
    group: "Saúde e Prevenção", type: "saude" as const, items: [
      { name: "Janeiro Branco", mm: "01", dd: "01", duration: 31 },
      { name: "Fevereiro Roxo", mm: "02", dd: "01", duration: 28 },
      { name: "Março Azul-Marinho", mm: "03", dd: "01", duration: 31 },
      { name: "Abril Verde", mm: "04", dd: "01", duration: 30 },
      { name: "Maio Amarelo", mm: "05", dd: "01", duration: 31 },
      { name: "Junho Violeta", mm: "06", dd: "01", duration: 30 },
      { name: "Setembro Amarelo", mm: "09", dd: "01", duration: 30 },
      { name: "Outubro Rosa", mm: "10", dd: "01", duration: 31 },
      { name: "Novembro Azul", mm: "11", dd: "01", duration: 30 },
      { name: "Dia Mundial da Saúde", mm: "04", dd: "07", duration: 1 },
    ]
  },
  {
    group: "Sazonalidades", type: "sazonal" as const, items: [
      { name: "Volta às Aulas", mm: "01", dd: "20", duration: 14 },
      { name: "Churrasco de Verão", mm: "01", dd: "01", duration: 30 },
      { name: "Liquidação de Verão", mm: "02", dd: "01", duration: 28 },
      { name: "Festa Junina Sazonal", mm: "06", dd: "01", duration: 30 },
      { name: "Churrasco de Inverno", mm: "07", dd: "01", duration: 31 },
      { name: "Liquidação de Inverno", mm: "07", dd: "15", duration: 14 },
      { name: "Semana da Primavera", mm: "09", dd: "22", duration: 7 },
      { name: "Semana do Fim de Ano", mm: "12", dd: "01", duration: 31 },
      { name: "Copa do Mundo", mm: "06", dd: "01", duration: 30 },
      { name: "Olimpíadas", mm: "07", dd: "25", duration: 17 },
      { name: "Aniversário da Cidade", mm: "01", dd: "25", duration: 7 },
    ]
  },
];

const IconPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
const IconEdit = () => (<svg
  width="13"
  height="13"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth="2"
  strokeLinecap="round"
  strokeLinejoin="round"
>
  <path d="M12 20h9" />
  <path d="M16.5 3.5a2.1 2.1 0 013 3L8 18l-4 1 1-4z" />
</svg>
);
const IconTrash = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></svg>;

const emptyCampaignForm = {
  name: "",
  campType: "custom" as Campaign["campType"],
  startDate: "",
  endDate: "",
  tema: "",
  acoes: "",
  responsible: "",
};

function toInputDate(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value.slice(0, 10);
}

function isCatalogCampaign(campaign: Campaign): boolean {
  return CATALOG.some(
    (group) =>
      group.type === campaign.campType &&
      group.items.some((item) => item.name === campaign.name)
  );
}

export default function Campaigns() {
  const { user, activeTenantId } = useApp();
  const { subscribe, broadcast } = useRealtime();
  const isReadOnly = user?.role === "client";
  const [view, setView] = useState<"gantt" | "blocks" | "list">("gantt");
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<"catalog" | "custom">("catalog");
  const [selectedCatalog, setSelectedCatalog] = useState<Set<string>>(new Set());
  const [customForm, setCustomForm] = useState(emptyCampaignForm);

  const [editingCampaign, setEditingCampaign] =
    useState<Campaign | null>(null);

  const [editForm, setEditForm] = useState(emptyCampaignForm);

  const [confirmDeleteCampaign, setConfirmDeleteCampaign] =
    useState<Campaign | null>(null); const year = new Date().getFullYear();

  const { data: campaigns = [], refetch } = trpc.campaigns.list.useQuery(
    { tenantId: activeTenantId! }, { enabled: !!activeTenantId }
  );

  const registeredCatalog = useMemo(() => {
    const catalogKeys = new Set(
      CATALOG.flatMap((group) =>
        group.items.map((item) => `${group.type}_${item.name}`)
      )
    );

    return new Set(
      (campaigns as Campaign[])
        .map((campaign) => `${campaign.campType}_${campaign.name}`)
        .filter((key) => catalogKeys.has(key))
    );
  }, [campaigns]);


  const syncAlertsMutation = trpc.campaigns.syncAlerts.useMutation({
    onSuccess: (data) => {
      if (data.created > 0) {
        broadcast({ type: "tasks", tenantId: activeTenantId!, action: "created" });
      }
    },
  });

  const createBulkMutation = trpc.campaigns.createBulk.useMutation({
    onSuccess: () => {
      toast.success("Campanhas adicionadas");
      refetch();
      setShowModal(false);
      setSelectedCatalog(new Set());
      broadcast({ type: "campaigns", tenantId: activeTenantId!, action: "created" });
      // Trigger alert generation for newly added campaigns
      if (activeTenantId) syncAlertsMutation.mutate({ tenantId: activeTenantId });
    },
    onError: () => toast.error("Erro ao criar campanhas"),
  });
  const createMutation = trpc.campaigns.create.useMutation({
    onSuccess: () => {
      toast.success("Campanha criada");
      refetch();
      setShowModal(false);
      broadcast({ type: "campaigns", tenantId: activeTenantId!, action: "created" });
      // Trigger alert generation for the new campaign
      if (activeTenantId) syncAlertsMutation.mutate({ tenantId: activeTenantId });
    },
    onError: () => toast.error("Erro ao criar campanha"),
  });
  const updateMutation = trpc.campaigns.update.useMutation({
    onSuccess: () => {
      toast.success("Campanha atualizada");
      refetch();
      setEditingCampaign(null);

      broadcast({
        type: "campaigns",
        tenantId: activeTenantId!,
        action: "updated",
      });

      if (activeTenantId) {
        syncAlertsMutation.mutate({
          tenantId: activeTenantId,
        });
      }
    },

    onError: () => {
      toast.error("Erro ao atualizar campanha");
    },
  });
  const deleteMutation = trpc.campaigns.delete.useMutation({
    onSuccess: () => { toast.success("Campanha removida"); refetch(); broadcast({ type: "campaigns", tenantId: activeTenantId!, action: "deleted" }); },
    onError: () => toast.error("Erro ao remover"),
  });

  useEffect(() => {
    if (!activeTenantId) return;
    return subscribe((event) => {
      if (event.type === "campaigns" && event.tenantId === activeTenantId) refetch();
    });
  }, [activeTenantId, subscribe, refetch]);

  const handleAddCatalog = () => {
    const items: any[] = [];
    CATALOG.forEach((group) => {
      group.items.forEach((item) => {
        const key = `${group.type}_${item.name}`;
        if (selectedCatalog.has(key)) {
          const start = `${year}-${item.mm}-${item.dd}`;
          const end = new Date(new Date(start + "T00:00:00").getTime() + (item.duration - 1) * 86400000);
          const endStr = end.toISOString().slice(0, 10);
          items.push({ name: item.name, campType: group.type, startDate: start, endDate: endStr });
        }
      });
    });
    if (items.length === 0) return;
    createBulkMutation.mutate({ tenantId: activeTenantId!, campaigns: items });
  };

  const handleAddCustom = () => {
    if (!customForm.name || !customForm.startDate || !customForm.endDate) return;
    createMutation.mutate({ tenantId: activeTenantId!, ...customForm });
  };

  const handleOpenEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);

    setEditForm({
      name: campaign.name,
      campType: campaign.campType,
      startDate: toInputDate(campaign.startDate),
      endDate: toInputDate(campaign.endDate),
      tema: campaign.tema ?? "",
      acoes: campaign.acoes ?? "",
      responsible: campaign.responsible ?? "",
    });
  };

  const handleUpdateCampaign = () => {
    if (
      !editingCampaign ||
      !editForm.name ||
      !editForm.startDate ||
      !editForm.endDate
    ) {
      return;
    }

    if (editForm.endDate < editForm.startDate) {
      toast.error("A data final não pode ser anterior à data inicial");
      return;
    }

    updateMutation.mutate({
      id: editingCampaign.id,
      tenantId: editingCampaign.tenantId,
      name: editForm.name,
      campType: editForm.campType,
      startDate: editForm.startDate,
      endDate: editForm.endDate,
      tema: editForm.tema,
      acoes: editForm.acoes,
      responsible: editForm.responsible,
    });
  };

  if (!activeTenantId) return <div className="flex items-center justify-center h-64 text-muted-foreground">Selecione um cliente.</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold uppercase tracking-wider">Campanhas {year}</h1>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex gap-1 border border-border rounded-lg overflow-hidden">
            {(["gantt", "blocks", "list"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 text-xs font-semibold transition-colors ${view === v ? "bg-[#C9A227] text-black" : "text-muted-foreground hover:text-foreground"}`}>
                {v === "gantt" ? "Gantt" : v === "blocks" ? "Blocos" : "Lista"}
              </button>
            ))}
          </div>
          {!isReadOnly && (
            <Button className="bg-[#C9A227] text-black hover:bg-[#E8C84A] text-sm" onClick={() => setShowModal(true)}>
              <IconPlus /> <span className="ml-1">Cadastrar</span>
            </Button>
          )}
        </div>
      </div>

      {/* Views */}
      {view === "gantt" && (
        <GanttView
          campaigns={campaigns as Campaign[]}
          year={year}
          isReadOnly={isReadOnly}
          onEdit={handleOpenEdit}
          onDelete={(id) => {
            const campaign = (campaigns as Campaign[]).find(
              (item) => item.id === id
            );

            if (campaign) {
              setConfirmDeleteCampaign(campaign);
            }
          }}
        />
      )}

      {view === "blocks" && (
        <BlocksView
          campaigns={campaigns as Campaign[]}
          isReadOnly={isReadOnly}
          onEdit={handleOpenEdit}
          onDelete={(id) => {
            const campaign = (campaigns as Campaign[]).find(
              (item) => item.id === id
            );

            if (campaign) {
              setConfirmDeleteCampaign(campaign);
            }
          }}
        />
      )}

      {view === "list" && (
        <ListView
          campaigns={campaigns as Campaign[]}
          isReadOnly={isReadOnly}
          onEdit={handleOpenEdit}
          onDelete={(id) => {
            const campaign = (campaigns as Campaign[]).find(
              (item) => item.id === id
            );

            if (campaign) {
              setConfirmDeleteCampaign(campaign);
            }
          }}
        />
      )}
      {/* Add Campaign Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Cadastrar Campanha</DialogTitle></DialogHeader>
          {/* Tabs */}
          <div className="flex gap-1 border border-border rounded-lg overflow-hidden mb-4">
            <button onClick={() => setModalTab("catalog")} className={`flex-1 py-2 text-sm font-semibold transition-colors ${modalTab === "catalog" ? "bg-[#C9A227] text-black" : "text-muted-foreground hover:text-foreground"}`}>
              Catálogo ({registeredCatalog.size + selectedCatalog.size} selecionadas)
            </button>
            <button onClick={() => setModalTab("custom")} className={`flex-1 py-2 text-sm font-semibold transition-colors ${modalTab === "custom" ? "bg-[#C9A227] text-black" : "text-muted-foreground hover:text-foreground"}`}>
              Personalizada
            </button>
          </div>

          {modalTab === "catalog" ? (
            <div className="space-y-4">
              {CATALOG.map((group) => (
                <div key={group.group}>
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-2 text-muted-foreground">{group.group}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {group.items.map((item) => {
                      const key = `${group.type}_${item.name}`;
                      const isRegistered = registeredCatalog.has(key);
                      return (
                        <label key={key} className="flex items-center gap-2 p-2 rounded-lg border border-border hover:border-[#C9A227]/50 cursor-pointer transition-colors">
                          <Checkbox
                            checked={isRegistered || selectedCatalog.has(key)}
                            disabled={isRegistered}
                            onCheckedChange={(checked) => {
                              if (isRegistered) return;

                              const next = new Set(selectedCatalog);
                              checked ? next.add(key) : next.delete(key);
                              setSelectedCatalog(next);
                            }}
                          />
                          <span className="text-sm">{item.name}</span>
                          <span className={`ml-auto text-xs px-1.5 py-0.5 rounded font-semibold ${TYPE_COLORS[group.type]}`}>{MONTHS[parseInt(item.mm) - 1]}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
                <Button className="bg-[#C9A227] text-black" onClick={handleAddCatalog} disabled={selectedCatalog.size === 0}>
                  Adicionar {selectedCatalog.size > 0 ? `(${selectedCatalog.size})` : ""}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-3">
              <Input placeholder="Nome da campanha" value={customForm.name} onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })} />
              <Select value={customForm.campType} onValueChange={(v) => setCustomForm({ ...customForm, campType: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold mb-1 block">Data Início</label><Input type="date" value={customForm.startDate} onChange={(e) => setCustomForm({ ...customForm, startDate: e.target.value })} /></div>
                <div><label className="text-xs font-semibold mb-1 block">Data Fim</label><Input type="date" value={customForm.endDate} onChange={(e) => setCustomForm({ ...customForm, endDate: e.target.value })} /></div>
              </div>
              <Input placeholder="Tema" value={customForm.tema} onChange={(e) => setCustomForm({ ...customForm, tema: e.target.value })} />
              <Input placeholder="Ações" value={customForm.acoes} onChange={(e) => setCustomForm({ ...customForm, acoes: e.target.value })} />
              <Input placeholder="Responsável" value={customForm.responsible} onChange={(e) => setCustomForm({ ...customForm, responsible: e.target.value })} />
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
                <Button className="bg-[#C9A227] text-black" onClick={handleAddCustom} disabled={!customForm.name || !customForm.startDate || !customForm.endDate}>
                  Criar Campanha
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!editingCampaign}
        onOpenChange={(open) => {
          if (!open) {
            setEditingCampaign(null);
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar Campanha</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              placeholder="Nome da campanha"
              value={editForm.name}
              disabled={
                !!editingCampaign &&
                isCatalogCampaign(editingCampaign)
              }
              onChange={(event) =>
                setEditForm({
                  ...editForm,
                  name: event.target.value,
                })
              }
            />

            <Select
              value={editForm.campType}
              disabled={
                !!editingCampaign &&
                isCatalogCampaign(editingCampaign)
              }
              onValueChange={(value) =>
                setEditForm({
                  ...editForm,
                  campType: value as Campaign["campType"],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {editingCampaign &&
              isCatalogCampaign(editingCampaign) && (
                <p className="text-xs text-muted-foreground">
                  Nome e tipo são mantidos pelo catálogo. Os demais
                  dados podem ser alterados.
                </p>
              )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold mb-1 block">
                  Data Início
                </label>

                <Input
                  type="date"
                  value={editForm.startDate}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      startDate: event.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block">
                  Data Fim
                </label>

                <Input
                  type="date"
                  value={editForm.endDate}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      endDate: event.target.value,
                    })
                  }
                />
              </div>
            </div>

            <Input
              placeholder="Tema"
              value={editForm.tema}
              onChange={(event) =>
                setEditForm({
                  ...editForm,
                  tema: event.target.value,
                })
              }
            />

            <Input
              placeholder="Ações"
              value={editForm.acoes}
              onChange={(event) =>
                setEditForm({
                  ...editForm,
                  acoes: event.target.value,
                })
              }
            />

            <Input
              placeholder="Responsável"
              value={editForm.responsible}
              onChange={(event) =>
                setEditForm({
                  ...editForm,
                  responsible: event.target.value,
                })
              }
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingCampaign(null)}
            >
              Cancelar
            </Button>

            <Button
              className="bg-[#C9A227] text-black"
              onClick={handleUpdateCampaign}
              disabled={
                updateMutation.isPending ||
                !editForm.name ||
                !editForm.startDate ||
                !editForm.endDate
              }
            >
              {updateMutation.isPending
                ? "Salvando..."
                : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Confirm Delete Campaign Modal */}
      <Dialog open={!!confirmDeleteCampaign} onOpenChange={(o) => !o && setConfirmDeleteCampaign(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir a campanha <strong className="text-foreground">"{confirmDeleteCampaign?.name}"</strong>? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteCampaign(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => {
              if (confirmDeleteCampaign) deleteMutation.mutate({ id: confirmDeleteCampaign.id, tenantId: confirmDeleteCampaign.tenantId });
              setConfirmDeleteCampaign(null);
            }}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── GANTT VIEW ───────────────────────────────────────────────────────────────
// ─── GANTT VIEW ───────────────────────────────────────────────────────────────
function GanttView({
  campaigns,
  year,
  isReadOnly,
  onEdit,
  onDelete,
}: {
  campaigns: Campaign[];
  year: number;
  isReadOnly: boolean;
  onEdit: (campaign: Campaign) => void;
  onDelete: (id: number) => void;
}) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const daysInYear = 365;

  const getDayOfYear = (date: Date) => {
    const start = new Date(year, 0, 0);
    const difference = date.getTime() - start.getTime();

    return Math.floor(difference / 86400000);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div
            className="grid border-b border-border"
            style={{
              gridTemplateColumns: "200px repeat(12, 1fr)",
            }}
          >
            <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase">
              Campanha
            </div>

            {MONTHS.map((month, index) => (
              <div
                key={month}
                className={`px-1 py-2 text-xs font-bold text-center border-l border-border ${index === currentMonth
                  ? "bg-[#C9A227]/10 text-[#C9A227]"
                  : "text-muted-foreground"
                  }`}
              >
                {month}
              </div>
            ))}
          </div>

          {campaigns.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Nenhuma campanha cadastrada.
            </div>
          )}

          {campaigns.map((campaign) => {
            const start = toDate(campaign.startDate);
            const end = toDate(campaign.endDate);

            if (
              start.getFullYear() !== year &&
              end.getFullYear() !== year
            ) {
              return null;
            }

            const startDay = Math.max(
              1,
              getDayOfYear(start)
            );

            const endDay = Math.min(
              daysInYear,
              getDayOfYear(end)
            );

            const leftPercentage =
              ((startDay - 1) / daysInYear) * 100;

            const widthPercentage = Math.max(
              0.5,
              ((endDay - startDay + 1) / daysInYear) * 100
            );

            return (
              <div
                key={campaign.id}
                className="grid border-b border-border hover:bg-muted/20 group"
                style={{
                  gridTemplateColumns: "200px 1fr",
                }}
              >
                <div className="px-3 py-2 flex items-center gap-2 border-r border-border">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${TYPE_COLORS[campaign.campType].split(" ")[0]
                      }`}
                  />

                  <span className="text-xs font-medium truncate">
                    {campaign.name}
                  </span>

                  {!isReadOnly && (
                    <div className="opacity-0 group-hover:opacity-100 ml-auto flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => onEdit(campaign)}
                        className="text-muted-foreground hover:text-[#C9A227]"
                        title="Editar campanha"
                      >
                        <IconEdit />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(campaign.id)}
                        className="text-muted-foreground hover:text-destructive"
                        title="Excluir campanha"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative py-2 px-1">
                  <div
                    className={`absolute top-1.5 bottom-1.5 rounded-full flex items-center px-2 text-xs font-semibold truncate ${TYPE_COLORS[campaign.campType]
                      }`}
                    style={{
                      left: `${leftPercentage}%`,
                      width: `${widthPercentage}%`,
                      minWidth: "4px",
                    }}
                    title={campaign.name}
                  >
                    {widthPercentage > 5 && campaign.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── BLOCKS VIEW ──────────────────────────────────────────────────────────────
// ─── BLOCKS VIEW ──────────────────────────────────────────────────────────────
function BlocksView({
  campaigns,
  isReadOnly,
  onEdit,
  onDelete,
}: {
  campaigns: Campaign[];
  isReadOnly: boolean;
  onEdit: (campaign: Campaign) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {campaigns.length === 0 && (
        <div className="col-span-3 text-center py-12 text-muted-foreground">
          Nenhuma campanha cadastrada.
        </div>
      )}

      {campaigns.map((campaign) => {
        const start = toDate(campaign.startDate);
        const end = toDate(campaign.endDate);
        const status = getCampaignStatus(start, end);

        return (
          <div
            key={campaign.id}
            className="bg-card border border-border rounded-xl overflow-hidden group hover:shadow-md transition-shadow"
          >
            <div
              className={`h-2 ${TYPE_COLORS[campaign.campType].split(" ")[0]
                }`}
            />

            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-sm leading-snug">
                  {campaign.name}
                </h3>

                {!isReadOnly && (
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => onEdit(campaign)}
                      className="text-muted-foreground hover:text-[#C9A227]"
                      title="Editar campanha"
                    >
                      <IconEdit />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(campaign.id)}
                      className="text-muted-foreground hover:text-destructive"
                      title="Excluir campanha"
                    >
                      <IconTrash />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${TYPE_COLORS[campaign.campType]
                    }`}
                >
                  {TYPE_LABELS[campaign.campType]}
                </span>

                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${status.color}`}
                >
                  {status.label}
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                {start.toLocaleDateString("pt-BR")} —{" "}
                {end.toLocaleDateString("pt-BR")}
              </p>

              {campaign.tema && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {campaign.tema}
                </p>
              )}

              {campaign.responsible && (
                <p className="text-xs text-muted-foreground mt-1">
                  Responsável: {campaign.responsible}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── LIST VIEW ────────────────────────────────────────────────────────────────
// ─── LIST VIEW ────────────────────────────────────────────────────────────────
function ListView({
  campaigns,
  isReadOnly,
  onEdit,
  onDelete,
}: {
  campaigns: Campaign[];
  isReadOnly: boolean;
  onEdit: (campaign: Campaign) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {campaigns.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma campanha cadastrada.
        </div>
      )}

      <div className="divide-y divide-border">
        {campaigns.map((campaign) => {
          const start = toDate(campaign.startDate);
          const end = toDate(campaign.endDate);
          const status = getCampaignStatus(start, end);

          return (
            <div
              key={campaign.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 group"
            >
              <div
                className={`w-3 h-3 rounded-full flex-shrink-0 ${TYPE_COLORS[campaign.campType].split(" ")[0]
                  }`}
              />

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {campaign.name}
                </p>

                <p className="text-xs text-muted-foreground">
                  {start.toLocaleDateString("pt-BR")} —{" "}
                  {end.toLocaleDateString("pt-BR")}
                </p>

                {campaign.tema && (
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {campaign.tema}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold hidden sm:block ${TYPE_COLORS[campaign.campType]
                    }`}
                >
                  {TYPE_LABELS[campaign.campType]}
                </span>

                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${status.color}`}
                >
                  {status.label}
                </span>

                {campaign.responsible && (
                  <span className="text-xs text-muted-foreground hidden md:block">
                    {campaign.responsible}
                  </span>
                )}

                {!isReadOnly && (
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(campaign)}
                      className="text-muted-foreground hover:text-[#C9A227]"
                      title="Editar campanha"
                    >
                      <IconEdit />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(campaign.id)}
                      className="text-muted-foreground hover:text-destructive"
                      title="Excluir campanha"
                    >
                      <IconTrash />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
