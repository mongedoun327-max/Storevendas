# Masakula ERP/PDV — Implementação da Arquitetura de Engenharia v2.0

Implementação integral da especificação de arquitetura determinística Masakula v2.0, erradicando a saturação cromática e o aninhamento visual, e consolidando a governança de tokens CSS, hierarquia de ações única, atalhos de teclado F2–F9 e operação de alta densidade no mercado angolano (Kz).

## Decisões Confirmadas e Escopo Aprovado

> [!IMPORTANT]
> Decisões operacionais confirmadas pelo utilizador na Fase 1:
> - **Escopo de Aplicação:** Todos os módulos essenciais simultaneamente — Cabeçalho Global (Topbar), Sessão e Controlo de Caixa, Vendas e PDV, Ordens de Serviço (OS) e Metas e Desempenho.
> - **Operação de Balcão e Periféricos:** Interceção global determinística de leitor de código de barras (HID Keyboard Wedge com buffer de tempo reduzido) e mapa de atalhos rápidos `F2`–`F9` e `Escape`.
> - **Governança de Design Tokens:** Implementação do ficheiro estrito `tokens.css` com as 15 Leis de Ferro e componentes fechados em TypeScript com restrição `never` contra injeções visuais arbitrárias.

---

## 1. Visão Geral e Conceito Central

- **O que faz:** Transforma o ecossistema Masakula ERP/PDV num instrumento financeiro e operacional de precisão milimétrica, baseado na filosofia de design por subtração, maximização do rácio data-ink, eliminação de emojis, pseudo-ícones e do carnaval cromático.
- **Público-alvo:** Operadores de caixa em turnos contínuos de 8–12h, técnicos de bancada e gerentes comerciais que necessitam de ausência total de fadiga visual, leitura numérica imediata sem truncamento e acionamento sem fricção.
- **Valor Chave:** Clareza operacional absoluta: 95%+ da interface em estrato acromático neutro, no máximo 1 KPI escuro (`--ink`) por ecrã, no máximo 1 botão primário por contexto de decisão, e representação monetária canónica em Kwanzas (`2 268 500,00 Kz`).

---

## 2. Experiência do Utilizador e Arquitetura Visual

### A. Estrato Cromático e Tokens v2.0 (Regra 95 / 3 / 2)
- **Estrato Acromático (95%+):** `--canvas` (`#fafafa`), `--surface` (`#ffffff`), `--ink` (`#111111`), `--line` (`#e8e8ea`), `--track` (`#ececee`), `--text-secondary` (`#5f5f66`).
- **Acento Funcional (3% ou menos):** `--accent` (`#e2ff14`) reservado exclusivamente ao botão de fecho transacional do PDV (`Cobrar F9`) e barra de progresso única sobre superfície escura.
- **Semânticas de Exceção (2% ou menos):** `--success-text` (`#0b7a54`), `--warning-text` (`#a34a08`), `--danger-text` (`#c8002f`) para estados limites de domínio (stock em rutura, offline, urgência).

### B. Matriz de Módulos Operacionais

1. **Cabeçalho Global (Topbar):**
   - Eliminação do ícone `$`, caixa de botão e indicadores concorrentes.
   - Par chave-valor tipográfico: `Vendas hoje` em `--text-secondary` + `2 268 500,00 Kz` em `--ink` peso `600` (`tabular-nums`).
   - Remoção da competição visual entre "Abrir PDV" e "Instalar App".

2. **Sessão e Controlo de Caixa:**
   - Barra de contexto com estado em texto silencioso (`Estado: Caixa aberta`), sem cadeados coloridos ou semáforos.
   - 4 KPIs contábeis de gaveta com valores numéricos rigorosamente em `--ink` (sem verde em suprimentos ou vermelho em sangrias); único KPI escuro em `Saldo esperado em gaveta`.
   - `Fechar caixa` como o único botão `.btn--primary` (`--ink`); `Leitura X`, `Relatório Z` e `Registar movimento` em `.btn--secondary`.
   - Histórico em tabela tabular de alta densidade (`.data-table`) sem quadrados coloridos nem setas.

3. **Vendas e PDV:**
   - Barra superior com relógio em texto secundário e indicador `Sincronizado` discreto sem poluição verde.
   - Atalhos operacionais neutros em `.btn--secondary` (`32px`), sem chamas ou moedas decorativas.
   - Catálogo de produtos com quantidades normais em texto secundário (`120 un`), reservando destaque apenas para stock crítico ou rutura (`0 un`).
   - Painel do Talão com título `Talão de venda`, identificador neutro de cliente, estado vazio sem ilustrações gigantes, desconto e total em `--ink`, e botão `Cobrar (F9)` de 48px com estado desativado neutro.

4. **Ordens de Serviço (OS):**
   - 5 KPIs padronizados sobre `--surface` com títulos em caixa normal sem reticências (`...`); único KPI escuro em `Valor em carteira`.
   - Chips de filtro neutros sem pontos de semáforo.
   - Cartões de OS com arquitetura plana de 4 zonas, sem sub-caixas cinzentas, sem bordas superiores coloridas e sem avatares pretos.
   - Vinculação estrita à Máquina de Estados Finita (FSM): correção da `OS-2026-0140` para `Pronta para entrega (90%)` e ação `Registar entrega ao cliente`.
   - Botões de avanço de etapa dentro dos cartões em `.btn--secondary` neutro.

5. **Metas e Desempenho:**
   - Painel escuro principal 100% liso, sem manchas/pinceladas cinzentas de fundo e sem duplicação de gráfico circular e barra.
   - Barra única de progresso horizontal em `--accent` sobre pista translúcida.
   - KPIs secundários em fundo branco `--surface`, com métrica explícita e auditável para o destaque do dia.
   - Cartões individuais de meta sem sub-caixas cinzentas aninhadas, com barras de progresso sólidas em `--ink`.

---

## 3. Decisões Técnicas de Produto e Trade-offs

- **Decisão 1: tokens.css e Blindagem em TypeScript (`never` types)**
  - *Abordagem:* Criação de `src/tokens.css` com todas as CSS Custom Properties oficiais e componentes base fechados (`Badge`, `KpiCard`, `ProgressBar`) que rejeitam props decorativas em tempo de compilação.
  - *Porquê:* Previne regressão estética por qualquer alteração futura e assegura conformidade estrita com o design system.

- **Decisão 2: Formatação Monetária Aritmética Inteira (`formatKwanzaFromCents`)**
  - *Abordagem:* Todos os cálculos monetários mantidos em cêntimos inteiros com exibição em Kwanzas formatados (`2 268 500,00 Kz` com espaços e vírgula).
  - *Porquê:* Elimina erros de arredondamento e preserva a soberania monetária de Angola.

- **Decisão 3: Interceção de Teclado e Scanner HID no PDV**
  - *Abordagem:* Hook global no PDV que deteta rajadas de teclas (< 25ms) e atalhos de função (`F2` foco busca, `F4` cliente, `F6` desconto, `F8` espera, `F9` cobrar, `Escape` fechar/limpar).
  - *Porquê:* Viabiliza operação rápida e contínua sem necessidade de toque constante no mouse.

---

## 4. Arquitetura Técnica e Diagrama de Componentes

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   APPLIGHT SHELL                                       │
│  ┌───────────────────────┐  ┌───────────────────────────────────────────────────────┐  │
│  │    Sidebar Neutra     │  │                      Topbar                           │  │
│  │  • Sem badges pill    │  │  • Breadcrumb / H1                                    │  │
│  │  • Ativo em --ink     │  │  • Vendas hoje: 2 268 500,00 Kz (texto plano)         │  │
│  │  • Sair em neutro     │  │  • Ação primária contextual única                     │  │
│  └───────────────────────┘  └───────────────────────────────────────────────────────┘  │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                 VIEWPORT ATIVO                                   │  │
│  │                                                                                  │  │
│  │  ┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────┐  │  │
│  │  │    Sessão de Caixa     │  │     Vendas e PDV       │  │ Ordens de Serviço  │  │  │
│  │  │  • Barra silenciosa    │  │  • Atalhos neutros     │  │ • 5 KPIs sem corte │  │  │
│  │  │  • 4 KPIs (1 featured) │  │  • Leitor USB wedge    │  │ • Blueprint 4 zonas│  │  │
│  │  │  • Tabela analítica    │  │  • Catálogo limpo      │  │ • FSM Determinística│ │  │
│  │  │  • Fechar: .btn--primary│ │  • Talão: Cobrar F9    │  │ • Ações secundárias│  │  │
│  │  └────────────────────────┘  └────────────────────────┘  └────────────────────┘  │  │
│  │                                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                           Metas e Desempenho                               │  │  │
│  │  │  • Painel escuro liso (sem pinceladas) com barra sólida --accent           │  │  │
│  │  │  • 3 KPIs brancos com métricas auditáveis (sem troféus ou setas)           │  │  │
│  │  │  • Desaninhamento completo dos cartões individuais de meta                 │  │  │
│  │  └────────────────────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                           DESIGN TOKENS & DOMÍNIO                                │  │
│  │  • src/tokens.css (Base 95% acromática, 3% accent, 2% semântica de alerta)        │  │
│  │  • src/utils/formatters.ts (formatKwanzaFromCents com espacamento e Kz)           │  │
│  │  • src/components/ui/deterministic/ (Badge, KpiCard, ProgressBar blindados)      │  │
│  │  • FSM de Ordens de Serviço (Tabela estrita de estados e transições)             │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Sequência Detalhada de Execução

1. **Fase 1: Fundação de Tokens e Componentes Fechados**
   - Criar `src/tokens.css` com todas as variáveis canónicas e reset de regras.
   - Atualizar `src/index.css` para importar `tokens.css` e impor a tipografia e `tabular-nums`.
   - Adicionar helper `formatKwanzaFromCents` em `src/utils/formatters.ts`.
   - Criar componentes TypeScript fechados (`Badge`, `KpiCard`, `ProgressBar`, `SERVICE_ORDER_FSM`).

2. **Fase 2: Refatoração do Cabeçalho e Navegação Global**
   - Limpar o Topbar (`src/components/layout/Header.tsx`): rótulo e valor de vendas em texto direto sem `$`, sem botões concorrentes.
   - Refatorar a Sidebar (`src/components/layout/Sidebar.tsx`): remoção de badges coloridos e estilização neutra do logout.

3. **Fase 3: Refatoração da Sessão de Caixa**
   - Atualizar a barra de contexto com `Estado: Caixa aberta` em texto discreto.
   - Padronizar os 4 KPIs com `Saldo esperado em gaveta` como único `.kpi--featured` e números estritamente em `--ink`.
   - Implementar tabela tabular de movimentos com badges neutros e botão primário exclusivo `Fechar caixa`.

4. **Fase 4: Refatoração de Vendas e PDV**
   - Integrar atalhos de teclado `F2`–`F9` e captura rápida de leitor USB.
   - Limpar cabeçalho do PDV (estado de sincronização e relógio).
   - Eliminar selos verdes em lote nos produtos com stock normal.
   - Ajustar painel do talão (sem ícone gigante de carrinho, sem etiqueta rosa, total em `--ink`, botão `Cobrar F9` com acento funcional apenas quando ativo).

5. **Fase 5: Refatoração de Ordens de Serviço e FSM**
   - Padronizar os 5 KPIs no topo sem truncamento (`Concluídas e entregues`, `Valor em carteira`).
   - Aplicar a Máquina de Estados Finita e o layout de 4 zonas sem sub-caixas cinzentas.
   - Corrigir a `OS-2026-0140` e converter botões dos cartões para `.btn--secondary`.

6. **Fase 6: Refatoração de Metas e Desempenho**
   - Limpar o painel escuro da Meta Geral (fundo liso, barra horizontal sólida sem gradientes, sem gráfico circular redundante).
   - Desaninhar os cartões individuais de metas e expurgar ícones decorativos dos KPIs secundários.

7. **Fase 7: Validação e Auditoria**
   - Executar compilação estrita TypeScript (`tsc --noEmit`).
   - Testar o build de produção (`npm run build`).
   - Verificar ausência de erros e integridade funcional de todos os fluxos.
