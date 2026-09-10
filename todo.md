# FAREJO — TODO

## Design System & Estrutura Base
- [x] Configurar tipografia Rajdhani (Google Fonts)
- [x] Definir CSS variables: dourado #C9A227, preto, branco, dark mode
- [x] Configurar ThemeProvider com alternância claro/escuro
- [x] Header com faixa dourada animada (efeito brilho deslizante)
- [x] Estrutura de rotas e layout principal com 6 abas
- [x] Toasts com estilo FAREJO (fundo preto, borda dourada/vermelha)
- [x] Modais com backdrop blur
- [x] Responsividade completa (mobile/tablet/desktop)

## Banco de Dados (Schema)
- [x] Tabela tenants (id, name, created_at)
- [x] Tabela users com roles (admin/marketer/client) e campos de white-label
- [x] Tabela user_tenants (relação usuário ↔ tenant)
- [x] Tabela task_categories (id, tenant_id, title, icon, position)
- [x] Tabela tasks (id, category_id, tenant_id, name, status, priority, responsible)
- [x] Tabela dashboard_metrics (id, tenant_id, section, label, value_from, value_to, delta_text, growth_pct, order_idx)
- [x] Tabela campaigns (id, tenant_id, name, camp_type, start_date, end_date, tema, acoes, responsible)
- [x] Tabela user_settings (user_id, tenant_id, profile_name, header_color, accent_color, logo_url, banner_url)

## Autenticação & Roles
- [x] Login via OAuth (Manus OAuth — compatível com Google)
- [x] Middleware de role: admin / marketer / client
- [x] Isolamento multi-tenant por role
- [x] Logout limpa todo o estado local

## Dashboard (Aba 1)
- [x] Hero section com título, subtítulo e período editáveis (admin)
- [x] Badge shimmer dourado "Método Burst"
- [x] Cards de métricas agrupados por seção
- [x] Cada card: valor_from → valor_to, delta, % crescimento (badge verde)
- [x] Botão "Editar Dashboard" (somente admin)
- [x] Modo edição: adicionar/editar/remover cards e seções
- [x] Rodapé hero dourado

## Checklist (Aba 2)
- [x] Stats: Total / Urgentes / Em Andamento / Concluídas
- [x] Seletor de tenant (pills) para marketer com múltiplos clientes
- [x] Barra de adição de tarefa (nome, prioridade, categoria, responsável)
- [x] Detecção automática de categoria por palavras-chave
- [x] Visualização em Lista (agrupada por categoria)
- [x] Visualização em Kanban (colunas por status)
- [x] Filtros: prioridade, status, responsável
- [x] Ciclo de status: pendente → em andamento → concluída
- [x] Badges de prioridade (urgente/vermelho, semana/âmbar, proximas/cinza)
- [x] Gerenciador de categorias inline
- [x] Categorias padrão criadas no 1º login do tenant
- [x] Restrições por role (client: somente leitura)

## Campanhas (Aba 3)
- [x] Visualização Gantt (linha do tempo 12 meses)
- [x] Visualização Blocos (grid de cards)
- [x] Visualização Lista (detalhada)
- [x] Status automático: Planejada / Iminente / Em andamento / Encerrada
- [x] Cores por tipo de campanha
- [x] Catálogo de 40+ datas comemorativas pré-configuradas
- [x] Modal de campanha personalizada
- [ ] Alertas automáticos no Checklist (45, 15, 7 dias antes) — PENDENTE

## Funil do Cliente (Aba 4)
- [x] 6 etapas visuais em largura decrescente
- [x] Gradientes por etapa
- [x] Ícones SVG por etapa
- [x] Responsivo (100% largura no mobile)

## Configurações (Aba 5)
- [x] Card Identidade Visual: nome do perfil, cor do header, cor de destaque
- [x] Preview ao vivo das cores
- [x] URL de logo e banner com preview
- [x] Card Notificações WhatsApp (Twilio — campos para credenciais)
- [x] Sincronização em tempo real entre devices

## Admin (Aba 6 — somente admin)
- [x] Sub-aba Usuários: tabela, criar, editar role
- [x] Modal criar usuário: nome, email, role, tenants
- [x] Modal gerenciar acessos por usuário
- [x] Sub-aba Clientes: tabela de tenants, criar, remover

## Realtime (WebSocket)
- [x] WebSocket server no Express
- [x] RealtimeProvider no frontend
- [x] Subscrição realtime: tasks
- [x] Subscrição realtime: task_categories
- [x] Subscrição realtime: dashboard_metrics
- [x] Subscrição realtime: campaigns
- [x] Subscrição realtime: user_settings
- [x] Indicador LIVE no header (verde/vermelho)

## Testes
- [x] Testes de autenticação (logout)
- [x] Testes de controle de acesso por role
- [x] Testes de procedures admin-only

## Pendentes para Próximas Iterações
- [x] Alertas automáticos no Checklist (45, 15, 7 dias antes das campanhas)
- [ ] Notificação WhatsApp automática diária às 8h (Twilio)
- [ ] Integração Google Business Profile
- [ ] Dashboard com métricas Meta Ads / Google Ads
- [ ] Integração Scanntech (dados de vendas reais)
- [ ] Exportação de relatórios para Google Sheets
- [ ] Rastreio de started_by e started_at nas tarefas
- [ ] Upload direto de logo/banner (sem URL externa)
- [ ] Configurações white-label por tenant (não por usuário)
- [ ] Drag-and-drop no Kanban para mover tarefas entre colunas

## Alertas Automáticos de Campanhas
- [x] Campo campaign_alerts_sent na tabela campaigns (JSON com marcos já disparados)
- [x] Função generateCampaignAlerts no db.ts (cria tasks de alerta por marco)
- [x] Procedure campaigns.syncAlerts no routers.ts
- [x] Trigger automático ao carregar Checklist (verifica e cria alertas pendentes)
- [x] Badge visual de alerta no card de tarefa (45d/15d/7d com cores distintas)
- [x] Categoria "Alertas de Campanha" criada automaticamente por tenant
- [x] Evitar duplicação: verificar se alerta já foi criado antes de inserir

## Melhorias v2 (Sprint 2)
- [x] Tela de login redesenhada com identidade FAREJO (logo, fundo animado, tagline)
- [x] Banner padrão do FAREJO hospedado e exibido como default
- [x] Banner global visível em todas as abas (Checklist, Campanhas, Funil, Dashboard)
- [x] Upload de banner nas Configurações (campo de arquivo + endpoint S3)
- [x] Personalização de cores funcional: cor do cabeçalho e cor de contraste aplicadas em tempo real
- [x] Renomear categoria (edição inline com Enter/Escape)
- [x] Central de notificações no header (sino + painel com alertas de tarefa/campanha/novidades)
- [x] Seletor de tamanho de fonte/ícones (Pequeno/Médio/Grande) nas Configurações

## Sprint 3 — Logo, Auth e Responsividade
- [x] Upload e integração do logo oficial FAREJO (PNG outline branco) no header e tela de login
- [x] Cadastro por email/senha (nome, email, senha, confirmação)
- [x] Login por email/senha (além do OAuth)
- [x] Backend: procedure de registro e login com JWT por email/senha
- [x] Responsividade mobile (375px): Dashboard, Checklist, Campanhas, Funil, Configurações, Admin
- [x] Responsividade tablet (768px): todas as abas
- [x] Correção de banner duplicado no Settings
- [x] Funil: largura das barras adaptada para mobile (sem overflow)

## Sprint 4 — Kanban Drag-and-Drop
- [x] Instalar @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
- [x] KanbanView com DnDContext: colunas como droppable, cards como draggable
- [x] Drag overlay visual (card fantasma com sombra e ring dourado durante o arraste)
- [x] Atualização de status ao soltar card em outra coluna (mutation + realtime)
- [x] Indicador visual de coluna ativa durante o arraste (ring dourado + fundo suave)
- [x] Zona de drop vazia com feedback "Solte aqui" quando coluna está ativa
- [x] Funciona em touch (mobile, delay 200ms) e mouse (desktop, distância 8px)

## Sprint 5 — Melhorias de UX e Funcionalidades

### Kanban
- [x] Botão "+" no rodapé de cada coluna para criar tarefa já com status da coluna
- [x] Tags visuais de prazo nos cards Kanban (45d/15d/7d) via AlertBadge
- [x] Barra de pesquisa e filtros no Kanban (por nome, prioridade, responsável)

### Permissões
- [x] Perfil client pode criar e renomear suas próprias categorias (canManageCategories = true para todos)
- [x] Somente admin gerencia usuários e acessos (adminProcedure no backend)

### Painel Admin
- [x] Métricas de acesso: total de usuários, ativos hoje/7d/30d
- [x] Tabela de últimos acessos por usuário (access_logs)
- [x] Aba "Métricas" no Painel Admin

### Notificações Diárias
- [x] 16 mensagens rotativas com linguagem de consultor de marketing (8 manhã + 8 tarde)
- [x] Lógica de disparo: 7h e 13h30 (verificação por intervalo de 1 min no frontend)
- [x] Controle de deduplicidade por localStorage (1x por dia por horário)

### Botão Flutuante de Suporte
- [x] Ícone fixo canto inferior direito (FAB dourado com ícone de headset)
- [x] Ao clicar: expande com 3 opções (WhatsApp recomendado, ligação, videoconferência)
- [x] Mensagem informativa sobre tempo de resposta
- [x] Animação slide-in-from-bottom suave

## Sprint 6 — Recorrência, Ordenação, Suporte e UX
- [x] Schema: coluna `recurrence` (esporádica/diária) na tabela tasks
- [x] Schema: coluna `image_url` na tabela tasks
- [x] Backend: procedure tasks.create e tasks.update aceitam recurrence e image_url
- [ ] Backend: job de renovação diária de tarefas recorrentes (reset status pendente às 00h) — PENDENTE
- [x] Checklist: campo "Recorrência" no formulário de criação/edição (Esporádica / Diária)
- [x] Checklist: badge visual de recorrência nos cards (ícone de ciclo + "Diária")
- [x] Checklist: ordenação por Responsável, Prioridade ou Status (botão Sort)
- [x] SupportButton: WhatsApp configurado (19 99753-7883, mensagem "Olá, eu preciso de suporte.")
- [x] Modal de confirmação antes de excluir categoria
- [x] Modal de confirmação antes de excluir usuário (Admin)
- [x] Modal de confirmação antes de excluir tenant (Admin)
- [x] Modal de confirmação antes de excluir campanha
- [x] Modal de confirmação antes de excluir tarefa
- [x] Admin: tags de tenants atendidos por cada usuário na lista de usuários
- [x] Tarefas: upload de imagem (S3) ao criar/editar tarefa
- [x] Tarefas: exibição de thumbnail da imagem no card da tarefa (lista e Kanban)

## Sprint 7 — Melhorias de UX
- [x] Checklist: barra de progresso visual no topo (% concluídas, gradiente dourado → verde ao completar tudo)
- [x] Checklist: animação de confetes dourados ao atingir 100% de progresso (canvas-confetti)

## Sprint 8 — Estratégias, Depoimentos, Senha Padrão e Notificação Permanente

### Aba Estratégias (Gamificação)
- [x] Schema: tabela `strategies` (id, tenant_id, title, description, points, icon, is_default, order_idx)
- [x] Schema: tabela `strategy_completions` (id, strategy_id, tenant_id, completed_by, completed_at)
- [x] Backend: procedures strategies.list, strategies.complete, strategies.uncomplete
- [x] Seed: 7 estratégias padrão inseridas automaticamente por tenant
- [x] Frontend: nova aba "Estratégias" no menu principal (7ª aba)
- [x] Frontend: grid de cards com título, ícone, pontos e status (concluída/pendente)
- [x] Frontend: modal de detalhes ao clicar no card (descrição completa + botão concluir)
- [x] Frontend: animação de confetes + toast ao concluir uma estratégia
- [x] Frontend: placar de pontos total do tenant no topo da aba

### Acervo de Depoimentos
- [x] Schema: tabela `testimonials` (id, tenant_id, title, description, file_url, file_type, uploaded_by, created_at)
- [x] Backend: procedures testimonials.list, testimonials.create, testimonials.delete
- [x] Frontend: seção "Acervo de Depoimentos" dentro da aba Estratégias
- [x] Frontend: upload de imagem/vídeo via S3, exibição em grid de cards

### Senha Padrão para Novos Usuários
- [x] Backend: ao criar usuário no Admin, senha padrão = `Farejo@2025` (hash bcrypt)
- [x] Schema: coluna `must_change_password` (boolean) na tabela users
- [x] Frontend: modal de troca de senha obrigatória na 1ª entrada (se must_change_password = true)

### Notificação Permanente
- [x] Frontend: mensagem fixa sempre presente no painel de notificações (sino), não expira

## Sprint 9 — UX e Dashboard
- [ ] Escala de texto: 3 tamanhos (Médio, Grande, Muito Grande) — o atual "grande" vira "médio"
- [ ] Menu lateral retrátil (sidebar) substituindo o menu superior
- [ ] Configurações: ocultar banner/logo/demais configs para role user/marketer; mostrar só nome, senha, cor, tamanho de texto e WhatsApp
- [ ] Banner exibido em todas as abas inclusive mobile (sem exceção)
- [ ] Logo FAREJO ~4x maior no desktop; remover escrita "Farejo" redundante do dashboard
- [ ] Dashboard: remover "Análise de Performance", "Editar Hero", "Editar Dashboard"
- [ ] Dashboard: cards de métricas externas (Instagram seguidores/engajamento, Google avaliações, App downloads)

## Sprint 10 — Métricas, Header e UX
- [ ] Dashboard: modal de conexão nos cards fixos (Instagram handle, Google Place ID, App store URL)
- [ ] Dashboard: métricas customizadas com botões editar, excluir e reordenar (↑↓) sempre visíveis
- [ ] Header: mover botão hambúrguer para a esquerda (ao lado do logo)
- [ ] Header: remover ícones de abas do mobile nav (ficam só no sidebar)
- [ ] Header: mover botão de tema claro/escuro para aba Configurações
- [ ] Header: logo maior (4-5x) no desktop
- [ ] Notificações: bolinha vermelha permanente (badge) mesmo após visualizar
- [ ] Dashboard: padding-bottom no final da página (safe area)

## Sprint 11 — Logo Personalizável, Treinamentos e UX
- [ ] Logo personalizável por tenant: upload no Admin, salvo no banco (campo logoUrl na tabela tenants)
- [ ] Logo visível no header mobile (estava mostrando só quadrado dourado)
- [ ] Logo visível no sidebar overlay com tamanho correto
- [ ] Ajuste de tamanho do logo nas Configurações de Admin (slider de escala)
- [ ] Botão dark/light mode no dropdown do avatar de perfil
- [ ] Aba Treinamentos: schema (tabela trainings com category: "client" | "marketer"), backend e frontend
- [ ] Treinamentos: clientes veem apenas categoria "cliente"; admins/marqueteiros veem tudo
- [ ] Imagem da equipe no final da página de Configurações (upload S3)

## Sprint 12 — Checklist Melhorado + Feed de Insights
- [ ] Schema: coluna `link` (text, nullable) na tabela tasks
- [ ] Schema: coluna `recurring_days` (text, nullable — JSON array "0-6") na tabela tasks
- [ ] Schema: tabela `insights` (id, tenant_id, title, body, image_url, author_id, created_at)
- [ ] Backend: tasks.create e tasks.update aceitam link e recurringDays
- [ ] Backend: procedures insights.list, insights.create, insights.delete
- [ ] Checklist: campo "Link" no modal de criação/edição de tarefa
- [ ] Checklist: seletor de dias da semana (Seg/Ter/Qua/Qui/Sex/Sáb/Dom) quando recorrência = Semanal
- [ ] Checklist: ícone de link no TaskRow quando a tarefa tem link
- [ ] Dashboard: seção "Insights de Marketing" estilo feed (imagem + título + texto)
- [ ] Dashboard: 3 insights padrão pré-cadastrados (Curva A, Vencimento, Produção Própria)
- [ ] Dashboard: botão "Nova Publicação" para criar insight com upload de imagem (S3)
- [ ] Dashboard: botão de excluir insight (admin/marketer)

## Sprint 13 — Seed, Comercial e Indicadores
- [x] Seed: checklist pré-formatado para novos tenants (categorias + tarefas padrão)
- [x] Seed: 3 insights padrão para novos tenants (Curva A, Vencimento, Produção Própria)
- [x] Nova aba "Comercial" no menu com feed de Insights de Marketing
- [x] Remover seção de Insights do Dashboard
- [x] Indicadores digitais: adicionar Facebook, LinkedIn, Anúncios Ativos, WhatsApp
- [ ] Corrigir busca de dados públicos do Instagram (proxy CORS) — APIs requerem OAuth, dados simulados exibidos com badge

## Sprint 14 — Tarefas Padrão, Login, Redes Sociais e Perfil
- [x] Seed: tarefas padrão pré-montadas em cada categoria do checklist (novos e atuais tenants)
- [x] Diagnóstico: login por email/senha funciona corretamente (sem bugs de código)
- [x] Cards de redes sociais: status "Conectado" após URL salva (badge visual)
- [x] Aba Comercial: botão de curtir nos cards de insights (com contagem e estado visual)
- [x] Aba Comercial: seção de comentários nos cards de insights (criar/excluir)
- [x] Usuário: campo de foto de perfil (upload S3 via clique no avatar da sidebar)
- [x] Checklist: avatar do responsável (foto de perfil) na bolinha do responsável

## Sprint 16 — Relógio Premium e Aba Agenda
- [x] Redesenhar relógio do Dashboard com visual sofisticado (glassmorphism, tipografia premium)
- [x] Aba Agenda: schema e backend (meetings, invites, tipo operacional/estratégico)
- [x] Aba Agenda: página completa com calendário, modal de agendamento e confirmação de presença
- [x] Adicionar rota e navegação para a aba Agenda no AppLayout

## Sprint 17 — Notificações WhatsApp Completas

- [x] Schema: tabela whatsapp_prefs (userId, tenantId, phone, enabled, notifNovaTarefa, notifReuniao, notifResumoDiario, resumoHorario)
- [x] Backend: helper twilio.ts para envio de mensagens WhatsApp via Twilio
- [x] Backend: procedures whatsapp.getPrefs, whatsapp.savePrefs, whatsapp.testSend
- [x] Backend: disparar WhatsApp ao criar tarefa (se notifNovaTarefa ativo)
- [x] Backend: disparar WhatsApp ao criar reunião (se notifReuniao ativo)
- [x] Frontend: painel "Notificações WhatsApp" na página de Ajustes com telefone, toggles e horário
- [x] Frontend: botão "Enviar mensagem de teste"
- [x] Heartbeat: job de resumo diário que respeita o horário configurado por usuário
- [x] Heartbeat: job de lembrete de reunião 30 min antes

## Sprint 18 — Redesign UX/UI Moderno

- [x] Redesenhar AppLayout: sidebar escura premium, logo, nav com ícones, seletor de cliente no topbar
- [x] Redesenhar topbar: seletor de clientes como pills, indicador LIVE, sino de notificações, avatar
- [x] Redesenhar Home/Dashboard: banner hero impactante, saudação com data, KPI cards com ícones coloridos
- [x] Home: seção Desempenho por Canal com barras de progresso e ícones de redes sociais
- [x] Home: seção Tarefas Pendentes com responsável e prazo
- [x] Home: seção Atividades Recentes com ícones e timestamps
- [x] Home: seção Acesso Rápido com botões de ação
- [x] Atualizar index.css: tipografia Inter/Sora, tokens de cor dark premium, animações suaves
- [x] Verificar TypeScript e salvar checkpoint

## Sprint 19 — Correções Mobile e Planos

- [x] Checklist: corrigir layout mobile — badges não devem sobrepor o título da tarefa
- [x] Agenda: corrigir modal mobile — campo de data não deve invadir campo de horário
- [x] AppLayout: garantir que o botão de recolher sidebar funciona no desktop
- [x] Criar página de Planos de Contratação do FAREJO (Starter, Pro, Enterprise)
- [x] Adicionar rota /planos e link de acesso na sidebar ou topbar

## Sprint 20 — Planos FAREJO + Z-API WhatsApp

- [x] Migrar WhatsApp de Twilio para Z-API (zapi.ts helper)
- [x] Schema: campo plan (boi/leao/aguia) na tabela tenants, migrar banco
- [x] Criar tela de Planos com BOI/LEÃO/ÁGUIA, preços e features
- [x] Regra de limite de lojas por plano com modal de upgrade
- [x] Adicionar aba Planos na navegação
