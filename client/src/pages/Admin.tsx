import React, { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

const IconPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconTrash = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>;
const IconEdit = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;

const ROLE_LABELS: Record<string, string> = { admin: "Admin", marketer: "Marketer", client: "Cliente" };
const ROLE_COLORS: Record<string, string> = {
  admin: "bg-[#C9A227]/20 text-[#C9A227]",
  marketer: "bg-blue-500/20 text-blue-400",
  client: "bg-gray-500/20 text-gray-400",
};

type Tenant = { id: number; name: string; createdAt: Date };
type User = { id: number; openId: string; name: string | null; email: string | null; role: string; loginMethod: string | null; createdAt: Date };

export default function Admin() {
  const { user, setActiveTab: setAppTab } = useApp();
  const [activeTab, setActiveTab] = useState<"users" | "tenants" | "metrics">("tenants");
  const [showUserModal, setShowUserModal] = useState(false);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<User | null>(null);
  const [newTenantName, setNewTenantName] = useState("");
  const [userForm, setUserForm] = useState({ name: "", email: "", role: "marketer" as "admin" | "marketer" | "client", tenantIds: [] as number[] });
  const [assignTenantIds, setAssignTenantIds] = useState<number[]>([]);

  const { data: users = [], refetch: refetchUsers } = trpc.users.list.useQuery();
  const { data: tenants = [], refetch: refetchTenants } = trpc.tenants.list.useQuery();
  const { data: accessStats } = trpc.users.accessStats.useQuery(undefined, { enabled: activeTab === "metrics" });

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradePlanInfo, setUpgradePlanInfo] = useState<{ current: string; limit: number } | null>(null);

  const createTenantMutation = trpc.tenants.create.useMutation({
    onSuccess: () => { toast.success("Cliente criado"); refetchTenants(); setShowTenantModal(false); setNewTenantName(""); },
    onError: (err) => {
      const msg = err.message ?? "";
      if (msg.startsWith("PLAN_LIMIT:")) {
        const parts = msg.split(":");
        setUpgradePlanInfo({ current: parts[1], limit: Number(parts[2]) });
        setShowUpgradeModal(true);
      } else {
        toast.error("Erro ao criar cliente");
      }
    },
  });
  const deleteTenantMutation = trpc.tenants.delete.useMutation({
    onSuccess: () => { toast.success("Cliente removido"); refetchTenants(); },
    onError: () => toast.error("Erro ao remover"),
  });
  const createUserMutation = trpc.users.create.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Usuário criado! Senha padrão: ${data?.defaultPassword ?? "Farejo@2025"}`,
        { duration: 8000, description: "O usuário deverá trocar a senha no primeiro acesso." }
      );
      refetchUsers();
      setShowUserModal(false);
      setUserForm({ name: "", email: "", role: "marketer", tenantIds: [] });
    },
    onError: () => toast.error("Erro ao criar usuário"),
  });
  const deleteUserMutation = trpc.users.delete.useMutation({
    onSuccess: () => { toast.success("Usuário removido"); refetchUsers(); },
    onError: () => toast.error("Erro ao remover"),
  });
  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => { toast.success("Perfil atualizado"); refetchUsers(); },
    onError: () => toast.error("Erro ao atualizar"),
  });
  const setTenantsMutation = trpc.users.setTenants.useMutation({
    onSuccess: () => { toast.success("Clientes atribuídos"); refetchUsers(); setShowAssignModal(null); },
    onError: () => toast.error("Erro ao atribuir"),
  });

  const { data: userTenants } = trpc.users.getUserTenants.useQuery(
    { userId: showAssignModal?.id ?? 0 },
    { enabled: !!showAssignModal }
  );
  const { data: allUserTenantMap } = trpc.users.allUserTenants.useQuery();

  const [confirmDeleteUser, setConfirmDeleteUser] = useState<User | null>(null);
  const [confirmDeleteTenant, setConfirmDeleteTenant] = useState<Tenant | null>(null);

  const openAssign = (u: User) => {
    setShowAssignModal(u);
    setAssignTenantIds(userTenants?.map((t: Tenant) => t.id) ?? []);
  };

  if (user?.role !== "admin") {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Acesso restrito a administradores.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold uppercase tracking-wider mb-6">Painel Admin</h1>

      {/* Tabs */}
      <div className="flex gap-1 border border-border rounded-lg overflow-hidden mb-6 w-fit">
        {(["tenants", "users", "metrics"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2 text-sm font-semibold transition-colors ${activeTab === tab ? "bg-[#C9A227] text-black" : "text-muted-foreground hover:text-foreground"}`}>
            {tab === "tenants" ? "Clientes" : tab === "users" ? "Usuários" : "Métricas"}
          </button>
        ))}
      </div>

      {/* TENANTS */}
      {activeTab === "tenants" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{(tenants as Tenant[]).length} cliente(s) cadastrado(s)</p>
            <Button className="bg-[#C9A227] text-black hover:bg-[#E8C84A] text-sm" onClick={() => setShowTenantModal(true)}>
              <IconPlus /> <span className="ml-1">Novo Cliente</span>
            </Button>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {(tenants as Tenant[]).length === 0 && (
              <div className="text-center py-12 text-muted-foreground">Nenhum cliente cadastrado.</div>
            )}
            <div className="divide-y divide-border">
              {(tenants as Tenant[]).map((t) => (
                <div key={t.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 group">
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">ID: {t.id} · Criado em {new Date(t.createdAt).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <button
                    onClick={() => setConfirmDeleteTenant(t)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <IconTrash />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* USERS */}
      {activeTab === "users" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{(users as User[]).length} usuário(s) cadastrado(s)</p>
            <Button className="bg-[#C9A227] text-black hover:bg-[#E8C84A] text-sm" onClick={() => setShowUserModal(true)}>
              <IconPlus /> <span className="ml-1">Novo Usuário</span>
            </Button>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {(users as User[]).length === 0 && (
              <div className="text-center py-12 text-muted-foreground">Nenhum usuário cadastrado.</div>
            )}
            <div className="divide-y divide-border">
              {(users as User[]).map((u) => (
                <div key={u.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-4 py-3 hover:bg-muted/20 group">
                  <div className="w-9 h-9 rounded-full bg-[#C9A227] text-black font-bold text-sm flex items-center justify-center flex-shrink-0">
                    {(u.name ?? u.email ?? "U")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{u.name ?? "Sem nome"}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email ?? u.openId}</p>
                    {/* Tags de tenants atribuídos */}
                    {allUserTenantMap && (allUserTenantMap as Record<number, { id: number; name: string }[]>)[u.id]?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(allUserTenantMap as Record<number, { id: number; name: string }[]>)[u.id].map((t) => (
                          <span key={t.id} className="text-xs px-1.5 py-0.5 rounded bg-[#C9A227]/10 text-[#C9A227] border border-[#C9A227]/20 font-medium">
                            {t.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Select value={u.role} onValueChange={(v) => updateRoleMutation.mutate({ userId: u.id, role: v as any })}>
                      <SelectTrigger className={`w-28 text-xs h-7 ${ROLE_COLORS[u.role]}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="marketer">Marketer</SelectItem>
                        <SelectItem value="client">Cliente</SelectItem>
                      </SelectContent>
                    </Select>
                    <button
                      onClick={() => openAssign(u)}
                      className="p-1.5 rounded border border-border text-muted-foreground hover:text-[#C9A227] hover:border-[#C9A227] transition-colors"
                      title="Atribuir clientes"
                    >
                      <IconEdit />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteUser(u)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <IconTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* METRICS */}
      {activeTab === "metrics" && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total de Usuários", value: accessStats?.totalUsers ?? "-", color: "text-[#C9A227]" },
              { label: "Ativos Hoje", value: accessStats?.activeToday ?? "-", color: "text-green-400" },
              { label: "Ativos (7 dias)", value: accessStats?.activeThisWeek ?? "-", color: "text-blue-400" },
              { label: "Ativos (30 dias)", value: accessStats?.activeThisMonth ?? "-", color: "text-purple-400" },
            ].map((card) => (
              <div key={card.label} className="bg-card border border-border rounded-xl p-4">
                <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Recent logins */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="bg-[#0B0F14] px-4 py-3">
              <h3 className="text-[#C9A227] font-bold text-sm uppercase tracking-widest">Acessos Recentes</h3>
            </div>
            <div className="divide-y divide-border">
              {!accessStats?.recentLogins?.length && (
                <div className="text-center py-10 text-muted-foreground text-sm">Nenhum acesso registrado ainda.</div>
              )}
              {accessStats?.recentLogins?.map((log) => (
                <div key={log.userId} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">{log.userName ?? "Usuário #" + log.userId}</p>
                    <p className="text-xs text-muted-foreground">{log.userEmail ?? ""}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.lastAccess).toLocaleString("pt-BR")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Tenant Modal */}
      <Dialog open={showTenantModal} onOpenChange={setShowTenantModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
          <Input placeholder="Nome do cliente" value={newTenantName} onChange={(e) => setNewTenantName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && newTenantName.trim() && createTenantMutation.mutate({ name: newTenantName.trim() })} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTenantModal(false)}>Cancelar</Button>
            <Button className="bg-[#C9A227] text-black" onClick={() => createTenantMutation.mutate({ name: newTenantName.trim() })} disabled={!newTenantName.trim()}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New User Modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Usuário</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
            <Input placeholder="E-mail" type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
            <Select value={userForm.role} onValueChange={(v) => setUserForm({ ...userForm, role: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="marketer">Marketer</SelectItem>
                <SelectItem value="client">Cliente</SelectItem>
              </SelectContent>
            </Select>
            <div>
              <p className="text-sm font-semibold mb-2">Clientes atribuídos</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {(tenants as Tenant[]).map((t) => (
                  <label key={t.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/30 cursor-pointer">
                    <Checkbox
                      checked={userForm.tenantIds.includes(t.id)}
                      onCheckedChange={(checked) => {
                        setUserForm({ ...userForm, tenantIds: checked ? [...userForm.tenantIds, t.id] : userForm.tenantIds.filter((id) => id !== t.id) });
                      }}
                    />
                    <span className="text-sm">{t.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-[#C9A227]/10 border border-[#C9A227]/30 px-3 py-2 text-xs text-[#C9A227] font-medium">
            🔑 Senha padrão: <strong>Farejo@2025</strong> — o usuário deverá trocar na primeira entrada.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserModal(false)}>Cancelar</Button>
            <Button className="bg-[#C9A227] text-black" onClick={() => createUserMutation.mutate(userForm)} disabled={!userForm.name || !userForm.email || createUserMutation.isPending}>
              {createUserMutation.isPending ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete User Modal */}
      <Dialog open={!!confirmDeleteUser} onOpenChange={(o) => !o && setConfirmDeleteUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar exclusão de usuário</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir o usuário <strong className="text-foreground">{confirmDeleteUser?.name ?? confirmDeleteUser?.email}</strong>? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteUser(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => {
              if (confirmDeleteUser) deleteUserMutation.mutate({ userId: confirmDeleteUser.id });
              setConfirmDeleteUser(null);
            }}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Tenant Modal */}
      <Dialog open={!!confirmDeleteTenant} onOpenChange={(o) => !o && setConfirmDeleteTenant(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar exclusão de cliente</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir o cliente <strong className="text-foreground">{confirmDeleteTenant?.name}</strong>? Todos os dados associados (tarefas, métricas, campanhas) serão removidos permanentemente.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteTenant(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => {
              if (confirmDeleteTenant) deleteTenantMutation.mutate({ id: confirmDeleteTenant.id });
              setConfirmDeleteTenant(null);
            }}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Tenants Modal */}
      <Dialog open={!!showAssignModal} onOpenChange={() => setShowAssignModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Atribuir Clientes — {showAssignModal?.name}</DialogTitle></DialogHeader>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {(tenants as Tenant[]).map((t) => (
              <label key={t.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/30 cursor-pointer">
                <Checkbox
                  checked={assignTenantIds.includes(t.id)}
                  onCheckedChange={(checked) => {
                    setAssignTenantIds(checked ? [...assignTenantIds, t.id] : assignTenantIds.filter((id) => id !== t.id));
                  }}
                />
                <span className="text-sm">{t.name}</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignModal(null)}>Cancelar</Button>
            <Button className="bg-[#C9A227] text-black" onClick={() => setTenantsMutation.mutate({ userId: showAssignModal!.id, tenantIds: assignTenantIds })}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Upgrade Plan Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#C9A227]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              Limite de lojas atingido
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-muted-foreground">
              Seu plano atual <strong className="text-foreground capitalize">{upgradePlanInfo?.current === "boi" ? "🐂 BOI" : upgradePlanInfo?.current === "leao" ? "🦁 LEÃO" : "🦅 ÁGUIA"}</strong> permite até <strong>{upgradePlanInfo?.limit} {upgradePlanInfo?.limit === 1 ? "loja" : "lojas"}</strong>.
            </p>
            <p className="text-sm text-muted-foreground">Para adicionar mais lojas, faça upgrade do seu plano FAREJO.</p>
            <div className="bg-[#C9A227]/10 border border-[#C9A227]/30 rounded-xl p-4">
              <p className="text-sm font-semibold text-[#C9A227] mb-1">Próximos planos disponíveis:</p>
              {upgradePlanInfo?.current === "boi" && <p className="text-xs text-muted-foreground">🦁 <strong>LEÃO</strong> — até 5 lojas — R$ 797/mês</p>}
              {(upgradePlanInfo?.current === "boi" || upgradePlanInfo?.current === "leao") && <p className="text-xs text-muted-foreground mt-1">🦅 <strong>ÁGUIA</strong> — até 20 lojas — R$ 1.997/mês</p>}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowUpgradeModal(false)}>Fechar</Button>
            <Button className="bg-[#C9A227] text-black" onClick={() => { setShowUpgradeModal(false); setAppTab("planos"); }}>Ver Planos</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
