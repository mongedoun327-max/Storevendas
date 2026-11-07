# Sistema de Anexo e Captura de Fotos 100% Offline (IndexedDB + WebP)

Arquitetura e experiência de usuário para captura e anexo de fotografias sem depender de internet nem de servidores externos, cobrindo catálogo de produtos, equipamentos em Ordens de Serviço (O.S.) e comprovativos de despesas com compressão local WebP e persistência de alta capacidade via IndexedDB.

## Decisões Confirmadas & Resumo das Preferências

> [!IMPORTANT]
> **Decisões Alinhadas com o Utilizador:**
> 1. **Abrangência Total do Sistema**: Suporte a fotos em **Produtos do Catálogo**, **Ordens de Serviço (entrada e conclusão de equipamentos)** e **Comprovativos de Despesas (recibos e faturas)**.
> 2. **Modalidade Híbrida de Captura**: Captura direta e instantânea via **Câmara / Webcam do terminal** (`video stream` e `navigator.mediaDevices`) com fallback para arrastar e soltar (**Drag & Drop**) de ficheiros locais.
> 3. **Compressão Client-Side Inteligente**: Otimização automática em **Canvas HTML5 para formato WebP a 800px de resolução máxima**, reduzindo imagens de 4MB para ~40KB–70KB sem perda de nitidez legível em documentos fiscais e talões.
> 4. **Armazenamento de Alta Capacidade (IndexedDB)**: Gravação via Dexie/IndexedDB local em repositório dedicado `WorscoiPOS_MediaDB`, prevenindo estouro da cota de 5MB do `localStorage`.

---

## 1. Visão Geral & Conceito Operacional

### Como Funciona 100% Offline?
1. **Sem Dependência de Servidores**: Quando o operador anexa uma foto ou ativa a câmara, todo o processamento acontece dentro da memória do navegador local (CPU do computador ou tablet da loja).
2. **Compressão no Navegador (HTML5 Canvas)**: Antes de guardar, o navegador redimensiona a fotografia para 800px e gera um stream WebP ultracompacto.
3. **Persistência no IndexedDB**: Ao invés de sobrecarregar o `localStorage` (limitado a 5MB), os binários e miniaturas são armazenados no motor de base de dados interna do navegador (`IndexedDB`), que suporta centenas de megabytes e gigabytes localmente.
4. **Disponibilidade Imediata no PDV e Relatórios**: As fotos anexadas ficam disponíveis instantaneamente para pré-visualização, impressão de fichas técnicas de O.S., consulta de catálogo no caixa e exportação em cópias de segurança (.json).

---

## 2. Experiência do Utilizador & Design Visual

### Fluxos Principais
1. **Cadastro de Produto (PDV / Inventário)**:
   - Operador clica em "Adicionar Imagem" ou "Tirar Foto com a Câmara".
   - Abre um visor de câmara ao vivo com botão de disparo ou área de arrastar ficheiro.
   - Pré-visualização instantânea do produto já enquadrado e recortado para exibição rápida na grelha do caixa.
2. **Ordens de Serviço (Assistência Técnica)**:
   - Na abertura da O.S., o técnico tira até 3 fotos do equipamento (ex: ecrã quebrado, riscos de carcaça, número de série).
   - Na entrega/conclusão, tira foto do equipamento reparado e funcional.
   - As fotos aparecem na ficha detalhada da O.S. e podem ser incluídas na impressão térmica/A4 do termo de entrega.
3. **Registo de Despesas & Pagamentos**:
   - Ao lançar uma despesa (ex: compra de combustível ou material de escritório), o operador aciona a câmara e fotografa a fatura/recibo em papel.
   - O comprovativo fica indexado à despesa, permitindo auditoria visual rápida em qualquer momento.

### Estilo Visual & Componentes
- **Modal de Câmara e Disparo**: Design escuro utilitário, com enquadramento guia central, seletor de câmara frontal/traseira (para telemóveis/tablets) e botão de disparo ergonómico.
- **Galeria de Miniaturas Compacta**: Grade com rácio 1:1, botão de zoom/ampliação em tela cheia (lightbox) e botão de remoção rápida com confirmação.
- **Tipografia & Badges de Estado**: Uso de números tabulares (`font-mono tabular-nums`) para indicar o tamanho comprimido da imagem (ex: `64 KB · WebP`).

---

## 3. Decisões Técnicas & Compromissos de Arquitetura

### Decisão 1: IndexedDB vs. Base64 no LocalStorage
- **Abordagem Escolhida**: Repositório dedicado IndexedDB (`localMediaStorage`) com tabela indexada por chave (`entityType`, `entityId`, `blob`, `dataUrl`, `createdAt`).
- **Motivo**: O `localStorage` tem limite estrito de 5MB por domínio. Guardar 10 fotos em Base64 causaria erro crítico de cota esgotada (`QuotaExceededError`). O IndexedDB tem capacidade de gigabytes no disco local.

### Decisão 2: Compressão Automática Canvas WebP a 800px
- **Abordagem Escolhida**: Resolução máxima de 800px na maior aresta com compressão WebP com qualidade 0.82.
- **Motivo**: Garante nitidez suficiente para ler letras miúdas de faturas e números de série, ao mesmo tempo que mantém cada imagem abaixo de 80KB, permitindo armazenar milhares de fotos sem desacelerar a máquina.

### Decisão 3: Integração no Backup Geral do Sistema
- **Abordagem Escolhida**: Na aba *Banco Local & Backup*, a ferramenta de exportação incluirá ou dará a opção de incluir os anexos de imagens compactadas no arquivo de backup `.json` da empresa.

---

## 4. Arquitetura Técnica & Estratégia de Dados

### Diagrama de Fluxo e Componentes Offline

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DISPOSITIVO DO CLIENTE                          │
│                                                                        │
│   ┌───────────────────────────┐      ┌─────────────────────────────┐   │
│   │   Câmara Local / Webcam   │  ou  │  Ficheiro do Disco (Upload) │   │
│   │ (navigator.mediaDevices)  │      │     (Drag & Drop / Input)   │   │
│   └─────────────┬─────────────┘      └──────────────┬──────────────┘   │
│                 │                                   │                  │
│                 ▼                                   ▼                  │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │            Módulo de Processamento Local (Canvas 2D)           │   │
│   │  • Redimensionamento proporcional (Max 800px)                  │   │
│   │  • Conversão para WebP de alta eficiência (40KB - 70KB)        │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   │                                    │
│                                   ▼                                    │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                 IndexedDB (WorscoiPOS_MediaDB)                 │   │
│   │  Armazenamento persistente de alta capacidade em disco local   │   │
│   │  (Produtos, Ordens de Serviço, Comprovativos de Despesas)      │   │
│   └───────────────┬────────────────────────────────┬───────────────┘   │
│                   │                                │                   │
│                   ▼                                ▼                   │
│   ┌───────────────────────────────┐  ┌─────────────────────────────┐   │
│   │     Catálogo PDV / Grelha     │  │  Ficha de O.S. & Despesas   │   │
│   │   Exibição instantânea cache  │  │  Auditoria e Comprovativos  │   │
│   └───────────────────────────────┘  └─────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### Componentes a Implementar / Atualizar:
1. `src/utils/localMediaStorage.ts`:
   - Gestor central IndexedDB para guardar, ler, listar e apagar fotos locais vinculadas a `productId`, `orderId` e `expenseId`.
2. `src/components/ui/OfflineCameraModal.tsx`:
   - Componente reutilizável para captura direta pela câmara comutável e recorte rápido.
3. `src/components/ui/OfflinePhotoAttachment.tsx`:
   - Zona de dropzone com suporte duplo (upload de arquivo ou acionamento de câmara), galeria de pré-visualização, indicador de tamanho em KB e lightbox de ampliação.
4. `src/components/views/ServiceOrdersView.tsx`:
   - Integração de anexo de fotografias de avaria de entrada e confirmação de reparo.
5. `src/components/views/ExpensesView.tsx`:
   - Campo para fotografar/anexar o recibo da despesa na criação e visualização na tabela.
6. `src/components/views/ProductsView.tsx` & `ProductFormModal.tsx`:
   - Suporte à captura direta pela webcam para cadastro ágil de novos artigos no estoque.
