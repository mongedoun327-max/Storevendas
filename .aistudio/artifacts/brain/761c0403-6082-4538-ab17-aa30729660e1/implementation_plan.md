# Plano de Implementação — Masakula ERP/PDV v2.0 (Norma Técnica e Governança Determinística)

Atualização abrangente de todas as telas e componentes do sistema Masakula de acordo com a **Especificação Técnica Avançada v2.0**, eliminando o excesso cromático ("carnaval de cores"), aninhamento recursivo (*card-in-card*), ícones decorativos e contradições de estados, consolidando uma arquitetura determinística de alto desempenho 100% offline.

---

## 1. Fundações, Design Tokens e Componentes Base

- **Tokens CSS em `:root` (`src/index.css` e tokens centrais):**
  - Implementar as variáveis de superfícies acromáticas (`--canvas: #fafafa`, `--surface: #ffffff`, `--surface-subtle: #f4f4f6`, `--ink: #111111`, `--line: #e8e8ea`, `--line-strong: #d1d1d6`, `--track: #ececee`, `--track-on-dark`).
  - Implementar o acento operacional exclusivo (`--accent: #e2ff14`) e semânticas de texto com alto contraste WCAG (`--success-text`, `--warning-text`, `--danger-text`, `--success-soft`, etc.).
  - Definir classes utilitárias de botões padronizados (`.btn--primary`, `.btn--accent`, `.btn--secondary`, `.btn--tertiary`, `.btn--danger`).
  - Definir `font-variant-numeric: tabular-nums` e suporte tipográfico monetário para Kwanzas (`Kz`).

- **Componentes Primitivos Determinísticos:**
  - `KpiCard`: estrutura atómica de 3 linhas (rótulo, valor principal e contexto factual) sem ícones, sem pílulas internas e com no máximo um único cartão escuro `.kpi--featured` (`--ink`) por tela.
  - `Badge`: badges estritamente semânticos (`neutral`, `priority-high`, `success`, `warning`, `danger`) sem pontos de semáforo coloridos (`•`) e sem ícones.
  - `ProgressBar`: barras sólidas em `--ink` sobre `--track` (ou `--accent` sobre `--track-on-dark`), truncadas rigidamente no intervalo `[0%, 100%]`.

---

## 2. Cabeçalho Global e Navegação Lateral (Sidebar)

- **Cabeçalho Global (`Header.tsx`):**
  - Eliminar o ícone de cifrão `$` e a caixa de botão em "Vendas hoje", exibindo texto plano `Vendas hoje` em `--text-secondary` e valor numérico em `--ink` `tabular-nums`.
  - Eliminar a competição de múltiplos botões pretos/limas de topo.
  - Rótulos e breadcrumb limpos em caixa normal.
- **Navegação Lateral (`Sidebar.tsx`):**
  - Eliminar badges circulares vermelhos/amarelos sobrepostos aos ícones da navegação.
  - Controlo de saída (`Logout`) neutro em `--text-secondary`, sem botão vermelho permanente.
  - Itens ativos com contraste limpo e sem distrações visuais.

---

## 3. Telas Operacionais Prioritárias

### A. Sessão e Controlo de Caixa (`CashSessionView.tsx`)
- **Barra de contexto de topo:**
  - Eliminar o quadrado verde com cadeado e o badge `• Caixa Aberto`. Exibir texto puro `Estado: Caixa aberta` em `--success-text` sem fundo.
  - Reestruturar os botões de topo: `Leitura X` (.btn--secondary), `Relatório Z` (.btn--secondary), `Registar sangria ou suprimento` (.btn--secondary) e `Fechar caixa` (.btn--primary em `--ink`).
- **Grelha de 4 KPIs:**
  - `Fundo inicial` (`--surface`), `Suprimentos` (`+ 35 000,00 Kz` em `--ink`), `Sangrias` (`- 10 000,00 Kz` em `--ink`), e `Saldo esperado em gaveta` (único `.kpi--featured` em `--ink` com rótulo neutro claro).
- **Tabela de Movimentações:**
  - Substituir cartões com quadrados verdes/rosas e setas diagonais por `.data-table` de alta densidade com valores em `--ink` e badges neutros para `Suprimento` e `Sangria`.

### B. Vendas e PDV (`PosView.tsx`)
- **Barra de topo e atalhos:**
  - Estado silencioso `Sincronizado` em texto simples; atalhos secundários (`Top mais vendidos`, `Em espera`, `Sangria/Suprimento`) em `.btn--secondary` compactos sem ícones coloridos.
- **Pesquisa e Catálogo de Artigos:**
  - Campo de pesquisa limpo com ícone de lupa único; indicador discreto de leitor USB/Bluetooth.
  - Cartões de produto com contadores de stock em texto simples neutro (`120 un`), aplicando `--warning-text` apenas para stock crítico e `--danger-text` para rutura; remoção do ícone de código de barras repetido em cada produto.
- **Painel do Talão de Venda:**
  - Cabeçalho limpo `Talão de venda`; estado vazio `Talão vazio` sem ilustrações gigantes de carrinho.
  - Desconto em `--ink` com sinal negativo (sem etiqueta rosa); Total a pagar em `--ink` com destaque tipográfico (sem pintar a verde).
  - Botão `Cobrar (F9)` em `.btn--accent` quando houver itens, ou desativado neutro sem ícones verdes.
  - Integração contínua com leitor de código de barras (códigos de fábrica) e maquininha térmica de talões.

### C. Ordens de Serviço (`ServiceOrdersView.tsx` e `WorkOrdersView.tsx`)
- **KPIs de topo:**
  - 5 cartões padronizados em `--surface`, com apenas `Valor em carteira` como `.kpi--featured` (`--ink`). Sem fundos coloridos, barras internas ou truncamento de títulos.
- **Barra de filtros:**
  - Chips neutros `.filter-chip` sem pontos de semáforo.
- **Cartões de Ordem de Serviço (Arquitetura de 4 Zonas, $D_{\max} \le 1$):**
  - Remoção de bordas superiores coloridas e de caixas cinzentas aninhadas em "Sintoma/Defeito".
  - Remoção de avatares pretos e de micro-ícones (telefone, WhatsApp, calendário).
  - Barra de progresso sólida em `--ink` sobre `--track`.
  - Botão de ação do cartão em `.btn--secondary` (sem setas tipográficas `->`).
  - Coerência da Máquina de Estados: resolver `OS-2026-0140` como `Pronta para entrega` (90%) com ação `Registar entrega`, sem exibir "Concluída" prematuramente.

### D. Metas e Desempenho (`GoalsView.tsx`)
- **Painel Principal Escuro (Meta Geral):**
  - Superfície `--ink` 100% lisa (remover mancha/pincelada cinzenta de fundo).
  - Eliminar o gráfico circular duplicado; manter barra horizontal única em `--accent` sobre `--track-on-dark`.
  - Escalar principal em `--text-display` com `tabular-nums`.
- **3 KPIs Secundários:**
  - Fundo branco `--surface` sem quadrados com troféus ou moedas.
- **Cartões de Metas Individuais:**
  - Eliminar sub-caixas cinzentas aninhadas; exibir barras de progresso sólidas em `--ink` sobre `--track`.

---

## 4. Telas Complementares

- **Gestão de Produtos (`ProductsView.tsx` & `StockModal.tsx`):**
  - Garantir que nenhum código de barras arbitrário seja gerado; utilizar exclusivamente o leitor ou digitação do código de barras de fábrica da embalagem.
  - Ajustar visualização de tabela e grelha para conformidade com a paleta neutra e tipografia tabular.
- **Gestão de Despesas (`ExpensesView.tsx`):**
  - Normalização tabular, remoção de pílulas coloridas artificiais em fornecedores e valores em `--ink`.
- **Clientes (`CustomersView.tsx`):**
  - Tabela limpa de clientes e NIF com ações terciárias de alta densidade.
- **Dashboard / Painel Geral (`DashboardView.tsx`):**
  - Alinhamento de KPIs e gráficos de séries analíticas com traços sólidos sem áreas de gradiente.
- **Tempo de Atendimento (`AttendanceStatsView.tsx`):**
  - Métricas horárias e rankings com tipografia tabular neutra.

---

## 5. Garantia Offline e Verificação de Compilação

- **100% Offline:**
  - Preservar e validar todo o fluxo de leitura local (IndexedDB / Dexie / localStorage) para catálogo, carrinho, vendas, sessões de caixa e movimentos sem dependência de internet.
  - PWA manifest e Service Worker devidamente configurados com aviso de offline não intrusivo.
- **Testes e Build:**
  - Execução de `compile_applet` e `lint_applet` para assegurar ausência total de regressões ou erros de TypeScript.
