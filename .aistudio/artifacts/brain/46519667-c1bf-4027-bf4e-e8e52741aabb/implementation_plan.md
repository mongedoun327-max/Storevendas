# Ativação do Banco de Dados Local (IndexedDB com Dexie) no Masakula ERP & PDV

Ativação e unificação da camada de persistência de dados do sistema Masakula utilizando IndexedDB através do Dexie.js, permitindo que todos os cadastros, vendas do PDV, despesas, turnos de caixa e ordens de serviço sejam salvos localmente no navegador com autonomia total e pré-carregamento de dados de exemplo.

---

### Decisões Confirmadas e Revisão do Usuário

> [!IMPORTANT]
> As seguintes escolhas foram confirmadas pelo utilizador durante a fase de esclarecimento e governam esta arquitetura:

- **Mecanismo de Persistência Principal**: IndexedDB completo gerenciado via Dexie.js no navegador cliente, garantindo alta performance, suporte a transações ACID locais e armazenamento estruturado sem necessidade de servidores externos.
- **Inicialização de Dados**: Pré-carregamento automático de sementes (seed data) com catálogo de produtos, categorias, clientes, histórico de turnos e ordens de serviço demonstrativas caso o banco local esteja vazio no primeiro acesso.
- **Política de Nuvem e Rede**: 100% autônomo e offline. As operações não dependerão de conexões remotas do Supabase; todos os serviços do ERP e PDV lerão e gravarão diretamente nas tabelas locais do Dexie.

---

### 1. Visão Geral e Conceito Central

- **O que faz**: Transforma o Masakula ERP & PDV em uma aplicação local-first completa. Todos os módulos (Ponto de Venda, Gestão de Estoque, Movimentações de Caixa, Despesas, Relatórios Gerenciais e Ordens de Serviço) passam a salvar e consultar registros no IndexedDB de forma instantânea e persistente entre sessões.
- **Público-alvo**: Operadores de caixa, gerentes de estoque e proprietários de estabelecimentos comerciais em Angola que necessitam de um sistema ágil, sem travamentos por instabilidade de internet e em conformidade com operações em Kwanza (Kz).
- **Valor Agregado**:
  - Zero latência em operações de caixa e leitura de código de barras.
  - Segurança contra perda de dados quando a página é recarregada.
  - Ferramenta nativa para backup local (exportação e importação em JSON) e limpeza/re-semeadura de dados de teste.

---

### 2. Experiência do Usuário e Design Visual

- **Fluxo do Primeiro Acesso**:
  1. Ao abrir o aplicativo, o inicializador do banco verifica a existência de registros.
  2. Se for a primeira execução, o sistema semeia as categorias padrão angolanas, catálogo de produtos em Kz, metas e registros fiscais iniciais em menos de 100ms.
  3. Uma notificação discreta (`sonner` toast) informa: *"Banco de dados local ativado com sucesso"*.
- **Indicador de Banco Local e Diagnóstico**:
  - No cabeçalho/menu de configurações ou rodapé do PDV, inclusão de um selo de status claro: `"Banco Local: Ativo (IndexedDB)"`, exibindo contagem de produtos e vendas gravadas.
  - Painel de Gestão de Dados dentro das configurações permitindo:
    - Ver total de registros por tabela (Produtos, Vendas, Despesas, Turnos, Clientes).
    - Botão `"Fazer Backup dos Dados (JSON)"`.
    - Botão `"Restaurar Backup"`.
    - Botão `"Restaurar Dados Demonstrativos"`.
- **Linguagem Visual e Tema**:
  - Paleta base: Fundo escuro neutro (`#131313`), superfícies estruturais em grafite profundo (`#1C1C1E`), tipografia nítida (`Outfit` e `Poppins`) e acento característico em amarelo elétrico Masakula (`#E1FB15`).
  - Números financeiros e quantidades exibidos sempre com algarismos tabulares (`tabular-nums font-mono`).

---

### 3. Decisões de Produto e Trade-Offs

- **Unificação dos Bancos Dexie**:
  - *Decisão*: Atualmente existiam três esquemas fragmentados (`src/lib/db.ts`, `src/lib/db/offlineDb.ts`, `src/lib/db/posDatabase.ts`). Todos serão consolidados em uma única classe unificada `MasakulaLocalDatabase` (`src/lib/db/masakulaDb.ts`) com exportações retrocompatíveis.
  - *Por que*: Evita conflitos de nomes no IndexedDB, concorrência de bloqueio e perda de integridade entre o PDV e os relatórios do ERP.
- **Substituição de Fallback do Supabase**:
  - *Decisão*: O `supabaseService.ts` e `productService.ts` deixarão de recorrer a arrays estáticos em memória e passarão a direcionar operações diretamente para o `masakulaDb`.
  - *Por que*: Cria persistência real: ao cadastrar um novo produto ou editar o preço na tela de estoque, ele reflete imediatamente no PDV e permanece salvo ao reiniciar a aplicação.
- **Backup e Exportação Nativa**:
  - *Decisão*: Adicionar rotinas utilitárias para download de dump completo em formato JSON e importação com validação de esquema.
  - *Por que*: Como o IndexedDB fica atrelado ao navegador do usuário, ter opção de exportar o backup previne perda caso o usuário limpe o cache do navegador.

---

### 4. Arquitetura Técnica e Estratégia de Dados

```
┌────────────────────────────────────────────────────────────────────────┐
│                          INTERFACE DO USUÁRIO                          │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌─────────┐ │
│   │   PDV Screen │   │ Estoque /    │   │ Finanças &   │   │ Ordens  │ │
│   │   (Vendas)   │   │ Categorias   │   │ Despesas     │   │ Serviço │ │
│   └───────┬──────┘   └──────┬───────┘   └──────┬───────┘   └────┬────┘ │
└───────────┼─────────────────┼──────────────────┼────────────────┼──────┘
            │                 │                  │                │
            ▼                 ▼                  ▼                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   CAMADA DE SERVIÇOS E REPOSITÓRIOS                    │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │  masakulaLocalService (CRUD de Produtos, Vendas, Turnos, OS)  │   │
│   └────────────────────────────────┬───────────────────────────────┘   │
└────────────────────────────────────┼───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│              BANCO DE DADOS LOCAL CONSOLIDADO (Dexie.js)               │
│                                                                        │
│   ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌──────────┐   │
│   │ products      │ │ categories    │ │ sales         │ │ shifts   │   │
│   │ (id, barcode, │ │ (id, name,    │ │ (id, total,   │ │ (id,     │   │
│   │  category)    │ │  colorHex)    │ │  items, date) │ │  status) │   │
│   └───────────────┘ └───────────────┘ └───────────────┘ └──────────┘   │
│   ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌──────────┐   │
│   │ expenses      │ │ cashMovements │ │ serviceOrders │ │ clients  │   │
│   │ (id, category,│ │ (id, shiftId, │ │ (id, code,    │ │ (id,     │   │
│   │  date)        │ │  type, date)  │ │  status)      │ │  name)   │   │
│   └───────────────┘ └───────────────┘ └───────────────┘ └──────────┘   │
│                                                                        │
│                    Armazenamento: Browser IndexedDB                    │
└────────────────────────────────────────────────────────────────────────┘
```

#### Esquema de Tabelas Dexie (`MasakulaLocalDatabase`):
- `products`: `"id, &barcode, name, category, sku, price, stock, deleted_at"`
- `categories`: `"id, &name, colorHex"`
- `sales`: `"id, client_sale_id, shift_id, payment_method, created_at, status"`
- `shifts`: `"id, status, opened_at, closed_at"`
- `cash_movements`: `"id, shift_id, type, created_at"`
- `expenses`: `"id, category, date, payment_method"`
- `service_orders`: `"id, code, client, status, created_at"`
- `clients`: `"id, name, phone, nif"`

#### Etapas de Implementação:
1. **Criação do Banco Unificado (`src/lib/db/masakulaDb.ts`)**:
   - Definição tipada de todas as coleções do ERP.
   - Semeador automático com tratamento de primeira carga (`seedInitialData`).
2. **Atualização da Camada de Serviços**:
   - Adaptação do `supabaseService.ts`, `productService.ts` e `useOfflineSync.ts` para consumirem o `masakulaDb`.
   - Adição de métodos de backup, restauração e redefinição de dados.
3. **Ponte de Compatibilidade com Código Existente**:
   - Manutenção de exportações compatíveis em `src/lib/db.ts` e `src/lib/db/offlineDb.ts` apontando para o banco unificado.
4. **Painel de Diagnóstico do Banco Local**:
   - Adicionar visão ou modal de gerenciamento de dados local nas configurações/menu principal.
5. **Verificação e Testes**:
   - Validação com `npm run lint` e `compile_applet`.
   - Teste prático de persistência de criação e exclusão de itens e vendas.
