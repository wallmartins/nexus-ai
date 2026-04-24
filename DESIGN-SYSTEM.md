# Nexus AI · Design System & Implementation Guide

> **Para uso por agentes de IA e desenvolvedores.**
> Este documento é a **fonte única de verdade** para implementação frontend do Nexus AI. Consulte-o em **toda** tarefa de UI para manter consistência visual e de interação.
>
> **Como usar:** antes de implementar qualquer tela ou componente, leia a seção `LEIA ISSO PRIMEIRO` e as seções aplicáveis. Nunca invente valores — sempre use tokens. Nunca crie componentes novos se um existente resolve.

---

## 📑 Índice

1. [LEIA ISSO PRIMEIRO — Regras inegociáveis](#leia-isso-primeiro)
2. [Identidade & Princípios](#identidade--princípios)
3. [Design Tokens](#design-tokens)
4. [Tipografia](#tipografia)
5. [Grid, Espaçamento & Layout](#grid-espaçamento--layout)
6. [Iconografia](#iconografia)
7. [Padrões de Tela (Patterns)](#padrões-de-tela)
8. [Estados, Interações & Motion](#estados-interações--motion)
9. [Mobile](#mobile)
10. [Acessibilidade](#acessibilidade)
11. [Voz & Copywriting](#voz--copywriting)
12. [Decisões Arquitetônicas (ADR)](#decisões-arquitetônicas)
13. [Checklist antes de entregar](#checklist-antes-de-entregar)

---

## LEIA ISSO PRIMEIRO

**Estas 10 regras valem para qualquer trabalho no Nexus. Quebrá-las exige justificativa explícita no PR.**

1. **Fundo é preto (`#000`) ou quase-preto** (`--surface-1: #111`). Nunca use branco como fundo em superfícies principais.
2. **Apenas uma cor de marca primária: lime `#C5F547`.** É usada para CTAs, states de "ativo/selecionado", destaque em métricas featured e indicadores de sucesso. **Nunca** use lime em grandes áreas (>30% do viewport).
3. **Roxo (`--purple-*`) é reservado para "AI/IA".** Orbs, gradientes de insight, estados de assistente. Não use roxo para UI genérica.
4. **Hierarquia tipográfica por peso, não por tamanho.** Títulos em peso 400 (regular) e destaques dentro do título em 600 (semibold). Nunca use peso 700+ em display.
5. **Instrument Serif (itálico) é uso raro e expressivo.** Apenas em palavras-chave dentro de títulos de cover/hero para humanizar. Nunca em UI funcional.
6. **Monospace (`--font-mono`) para qualquer dado técnico:** IDs, timestamps, paths, métricas numéricas em tabelas, código, correlation IDs, similaridades (0.89).
7. **Cantos arredondados generosos:** pills, nav items e badges são `9999px` (`--r-pill`). Botões primary/secondary e inputs são `14px` (`--r-md`). Cards são `20px` (`--r-lg`) ou `28px` (`--r-xl`). **Nunca** use `4px` ou `8px` em cards — fica anêmico.
8. **Ícones: apenas lucide-style line icons, stroke 1.75, 16px padrão.** Nunca misture estilos. Importe diretamente de `lucide-react`.
9. **Não invente cores.** Use tokens CSS. Se precisar de uma variação, use `oklch()` ou opacidade (`rgba(255,255,255,0.06)`) sobre um token existente.
10. **Emoji é proibido em UI funcional.** Só em copy de demo/marketing específico.

---

## Identidade & Princípios

**Nexus AI** é uma plataforma enterprise de RAG (Retrieval-Augmented Generation). O produto é técnico, auditável e orientado a operadores: engenheiros de ML, analistas, equipes de plataforma.

### Valores visuais

- **Grounded** (aterrado): dados reais, números concretos, fontes citadas. Nada flutuante, nada de ilustração abstrata.
- **Auditável**: tudo é rastreável — citations, correlation IDs, spans, timestamps visíveis.
- **Local-first**: prioriza Ollama/execução local. UI deve refletir isso: pills "Local · Ollama" são mais proeminentes que "Cloud".
- **Denso mas respirável**: muita informação por tela, mas com hierarquia clara via `padding: 24-32px` interno e `gap: 16-28px` entre cards.

### Referências (inspiração, não para copiar)

- Linear (densidade, mono para IDs)
- Vercel dashboard (cards escuros, borders sutis)
- Raycast (pills, keyboard-first)

### O que NÃO somos

- Não somos um produto de marketing colorido (nada de gradientes pastel)
- Não somos um chatbot genérico (a UI não é "chat primeiro")
- Não somos minimalistas zen (densidade é valor, não defeito)

---

## Design Tokens

**Todos os tokens vivem em `styles.css` como CSS custom properties.** Em código, use sempre `var(--token)`. Nunca hardcode hex.

### Surfaces (fundos)

| Token           | Valor     | Uso                                              |
| --------------- | --------- | ------------------------------------------------ |
| `--bg-canvas`   | `#000000` | Fundo raiz da aplicação, canvas atrás de tudo    |
| `--bg-elevated` | `#0A0A0A` | Superfície elevada rara (modal backdrop)         |
| `--surface-1`   | `#111111` | Cards padrão, sidebar, tabelas                   |
| `--surface-2`   | `#161616` | Card aninhado, linha ativa em lista, pill neutra |
| `--surface-3`   | `#1E1E1E` | Ícone fundo redondo, input, track de progress    |

**Regra de elevação:** nunca pule níveis. `canvas → surface-1 → surface-2 → surface-3`. Nunca coloque `surface-3` direto em `canvas`.

### Borders

| Token              | Valor                    | Uso                                             |
| ------------------ | ------------------------ | ----------------------------------------------- |
| `--border-subtle`  | `rgba(255,255,255,0.06)` | Cards, tabelas, divisores internos. **Padrão.** |
| `--border-default` | `rgba(255,255,255,0.10)` | Inputs, botões ghost, bordas de pílulas         |
| `--border-strong`  | `rgba(255,255,255,0.16)` | Estado focado, hover em input                   |

### Brand

| Token          | Valor     | Uso                                       |
| -------------- | --------- | ----------------------------------------- |
| `--lime-200`   | `#E0F99E` | Hover states de lime, accents raros       |
| `--lime-400`   | `#C5F547` | **Cor primária.** CTA, ativo, sucesso     |
| `--lime-500`   | `#B4E639` | Pressed state                             |
| `--purple-200` | `#D4C7FF` | Texto em fundos AI, labels em AI insights |
| `--purple-400` | `#A78BFA` | Acentos secundários de IA                 |
| `--purple-500` | `#8B5CF6` | Core de orb, badges AI                    |
| `--purple-700` | `#5B21B6` | Shadow de orb                             |
| `--purple-900` | `#2E1065` | Borda interna de orb                      |

### Texto

| Token              | Valor     | Uso                                                   |
| ------------------ | --------- | ----------------------------------------------------- |
| `--text-primary`   | `#FFFFFF` | Headings, valores numéricos primários, body principal |
| `--text-secondary` | `#C7C7C7` | Body secundário, descrições, labels de form           |
| `--text-muted`     | `#8A8A8A` | Captions, metadados, timestamps, placeholder          |
| `--text-disabled`  | `#555555` | Texto desabilitado (raro)                             |
| `--text-on-lime`   | `#0A0A0A` | **Sempre** use sobre `--lime-400`. Nunca `#000` puro. |

### Status

| Token              | Valor     | Uso                                              |
| ------------------ | --------- | ------------------------------------------------ |
| `--status-success` | `#C5F547` | Igual a lime-400. Check, pass, online            |
| `--status-warning` | `#F7B955` | Partial, processing, attention                   |
| `--status-danger`  | `#F47266` | Fail, error, offline                             |
| `--status-info`    | `#A78BFA` | Igual a purple-400. Info neutra relacionada a AI |

### Categóricas (para tiles de pipeline/tags)

`--cat-orange`, `--cat-purple`, `--cat-lime`, `--cat-yellow`, `--cat-blue`, `--cat-pink`.

**Regra:** use apenas para tiles/tags onde a cor codifica categoria (tipo de documento, tipo de step). Nunca para hierarquia de importância.

### Radii

| Token      | Valor    | Uso                                      |
| ---------- | -------- | ---------------------------------------- |
| `--r-xs`   | `6px`    | Selo de citation inline `[1]`, chip tiny |
| `--r-sm`   | `10px`   | Input, barra de progresso, tile pequeno  |
| `--r-md`   | `14px`   | Tile médio, phone navbar item            |
| `--r-lg`   | `20px`   | **Padrão para cards**                    |
| `--r-xl`   | `28px`   | Cards grandes, AI insight                |
| `--r-2xl`  | `36px`   | Hero cards raros                         |
| `--r-pill` | `9999px` | Pills, nav items, tags, badges           |
| `--r-md`   | `14px`   | Botões primary/secondary, inputs, tiles  |

### Shadows

Nexus **não usa shadow em cards**. A separação vem da combinação surface + border. Exceção:

- Orbs têm `box-shadow` próprio (definido em `.orb-core`)
- Modais/overlays usam `0 20px 80px rgba(0,0,0,0.4)`

---

## Tipografia

### Families

```css
--font-sans: "Geist", ui-sans-serif, system-ui, -apple-system, sans-serif;
--font-mono: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
/* Uso raro: Instrument Serif via Google Fonts — <em> em headings de cover */
```

> **Nota:** o sistema usa Geist (sans + mono) via pacote `geist` para Next.js. Fontes são carregadas via `geist/font/sans` e `geist/font/mono` para otimização automática de subsets e variáveis CSS.

### Escala (desktop)

| Uso                        | Tamanho | Peso                    | Letter-spacing   | Line-height |
| -------------------------- | ------- | ----------------------- | ---------------- | ----------- |
| Display / Hero H1          | 72px    | 400 (+600 em destaques) | -0.03em          | 1.0         |
| Page title H1              | 44px    | 400 (+600 em destaques) | -0.025em         | 1.05        |
| Section title H2           | 40px    | 400 (+600 em destaques) | -0.02em          | 1.1         |
| Card title / H3            | 20-24px | 500-600                 | -0.01em          | 1.2         |
| Large number (hero metric) | 56-72px | 500                     | -0.02em          | 1.0         |
| Regular metric             | 32-42px | 500                     | -0.02em          | 1.0         |
| Body                       | 14-15px | 400                     | 0                | 1.55        |
| Body small                 | 12-13px | 400-500                 | 0                | 1.5         |
| Caption / label            | 11-12px | 500                     | 0.005em          | 1.4         |
| Eyebrow (UPPERCASE)        | 11px    | 500                     | 0.05em uppercase | 1           |
| Code / Mono                | 11-13px | 400-500                 | 0                | 1.5         |

### Escala mobile

| Uso            | Tamanho        |
| -------------- | -------------- |
| Mobile H1      | 28px, peso 400 |
| Mobile body    | 14-15px        |
| Mobile caption | 11px           |

### Padrão de heading

Em títulos grandes, mistura de pesos para criar ritmo:

```jsx
<h1
  style={{
    fontSize: 44,
    fontWeight: 400,
    letterSpacing: "-0.025em",
    lineHeight: 1.05,
  }}
>
  Grounded answers from{" "}
  <span style={{ fontWeight: 600 }}>your knowledge base</span>.
</h1>
```

Em cover/hero, pode-se adicionar serif itálico em **uma palavra-chave**:

```jsx
<h1 style={{ fontSize: 72, fontWeight: 400 }}>
  Grounded answers from{" "}
  <em
    style={{
      fontFamily: "var(--font-serif)",
      fontStyle: "italic",
      color: "var(--lime-400)",
    }}
  >
    your
  </em>{" "}
  knowledge.
</h1>
```

### Quando usar mono

**Sempre** em:

- IDs (`corr_id a8f3c2b`, `session_id s_8f32d1`)
- Timestamps (`09:14:32`)
- Medidas técnicas numéricas em tabela (`0.89`, `2.3s`, `$0.15 / 1M`)
- Paths e URLs
- Código e payloads JSON
- Pesos de modelo (`llama3:8b`)

**Nunca** em: labels de UI, body text, buttons, navigation.

---

## Grid, Espaçamento & Layout

### Grid

- **Desktop artboard:** 1440px largura, altura variável por tela.
- **Padding de página:** `32px 40px 48px` (top/sides/bottom).
- **Gap entre seções principais:** `28px`.
- **Gap entre cards em grid:** `16-20px`.
- **Gap interno de cards:** `14-24px` dependendo da densidade.

### Escala de espaçamento (múltiplos de 4)

`4, 8, 12, 14, 16, 20, 22, 24, 28, 32, 40, 48, 56, 64, 80`

### Layouts canônicos

**Page layout** (Overview, Evals, Observability, Knowledge):

```
┌─ TopNav (h:80)
├─ Page header (Pill + Title + Actions, mb:28)
├─ Hero row (1-2 featured cards, mb:28)
├─ Content grid (2-3 cols, gap:20, mb:28)
└─ Deep dive (table ou list, full-width)
```

**Workspace layout** (Chat, Agents):

```
┌─ TopNav
├─ Sidebar esquerda (240-280px) | Content principal | Sidebar direita opcional (320-400px)
```

**Settings layout**:

```
┌─ TopNav
├─ Nav lateral (240px) | Conteúdo
```

### Containers

- Artboards nunca rolam. Se o conteúdo passa, aumente a altura do artboard.
- `.screen` tem `overflow: hidden`.

---

## Iconografia

### Fonte

Todos os ícones são **line icons estilo Lucide**, via `lucide-react`. Importe diretamente do pacote (ex: `import { MessageSquare } from 'lucide-react'`).

### Regras

- **Stroke:** 1.75px (padrão). Nunca fill-only exceto em casos específicos (play button, dot).
- **Tamanhos:** 12, 14, 16 (padrão), 18, 22.
- **Cor:** `currentColor` por padrão. Herda do texto ao redor.
- **Em ícones dentro de círculos de fundo:** usar `--surface-3` como fundo, ícone em `--text-secondary`.

### Ícones disponíveis

`chart, chat, agents, knowledge, eval, observe, settings, search, bell, arrow-up-right, arrow-right, arrow-left, plus, check, x, upload, doc, pdf, md, sparkle, mic, paperclip, filter, clock, zap, shield, cpu, database, flow, dot, play, pause, refresh, more, chevron-down, chevron-right, menu, home, layers, eye, copy, link, quote, trash, download`.

Se precisar de um ícone novo, verifique se já existe em `lucide-react` antes de criar um SVG customizado.

### Ícone em contexto

```jsx
<div
  style={{
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "var(--surface-3)",
    display: "grid",
    placeItems: "center",
  }}
>
  <Icon name="cpu" size={14} />
</div>
```

### Hierarquia

```
Icon, NexusLogo             (primitivos)
├─ Pill, Delta, Button, IconBtn   (átomos)
├─ Card, CatTile, MiniOrb, Orb   (átomos visuais)
├─ SectionIntro, MetricCard       (moléculas)
└─ TopNav                         (organismo)
```

### Pill

Uso: badges de status, filtros, tags pequenas.

```jsx
<Pill variant="primary" size="md" icon="check">
  Active
</Pill>
```

| Prop      | Valores                                                                         | Default   |
| --------- | ------------------------------------------------------------------------------- | --------- |
| `variant` | `default`, `primary`, `muted`, `accent`, `success`, `warning`, `danger`, `dark` | `default` |
| `size`    | `sm`, `md`, `lg`                                                                | `md`      |
| `icon`    | nome de ícone                                                                   | —         |

### Button

```jsx
<Button variant="primary" size="md" icon="play">Run evaluation</Button>
<Button variant="secondary" icon="download">Export CSV</Button>
<Button variant="ghost">Cancel</Button>
```

| Variant          | Uso                                  |
| ---------------- | ------------------------------------ |
| `primary` (lime) | Ação principal. **Uma por área.**    |
| `secondary`      | Ações neutras (export, filter)       |
| `ghost`          | Ações destrutivas ou terciárias      |
| `dark`           | Sobre fundo lime (inverte contraste) |

### IconBtn

Botão redondo só de ícone. Navegação, ações em toolbar.

```jsx
<IconBtn name="search" variant="default" size={40} />
<IconBtn name="arrow-right" variant="brand" size={40} />
```

Variants: `default, white, brand, ai, ghost`.

### Card

```jsx
<Card padding={24}>
  {/* conteúdo */}
</Card>

<Card variant="lime" padding={28}>
  {/* featured */}
</Card>
```

Variants: `default` (surface-1), `nested` (surface-2), `lime` (brand).

### MetricCard

Usado em dashboards (Overview, Observability).

```jsx
<MetricCard
  label="Grounding"
  value="94%"
  caption="this week · target ≥ 90%"
  delta="+3%"
  icon="shield"
  featured // usa lime bg
/>
```

### Delta

Chip de variação percentual.

```jsx
<Delta value="+14%" positive />
<Delta value="−0.4%" positive={false} />
```

### CatTile

Tile categórico com cor de fundo. Usado em listas de documentos, steps de pipeline.

```jsx
<CatTile color="orange" icon="doc" size={36} />
<CatTile color="purple" letter="N" size={44} />
```

Colors: `orange, purple, lime, yellow, blue, pink`.

### Orb / MiniOrb

Visual exclusivo para IA. Animado com pulse.

```jsx
<Orb size={140} />       {/* hero, centralizado */}
<MiniOrb size={28} />    {/* inline, ao lado de texto AI */}
```

**Nunca** use orb para indicar algo que não seja IA/assistente.

### TopNav

Navegação principal desktop. Logo esquerda, pill-nav central, actions direita.

```jsx
<TopNav active="Overview" />
```

Items disponíveis: `Overview, Chat, Knowledge, Agents, Evals, Observability`.

### SectionIntro

Bloco padrão de "pill + heading" no topo de cada seção/página.

```jsx
<SectionIntro label="Knowledge base">
  Upload, index, and <span style={{ fontWeight: 600 }}>search</span> your
  documents.
</SectionIntro>
```

### Citações inline (pattern, não componente)

Em respostas do agent, citations são chips numerados `[1]`, `[2]` em mono, fundo `--surface-3`, raio `var(--r-xs)`, cor `--purple-200`.

```jsx
<span
  style={{
    background: "var(--surface-3)",
    padding: "1px 5px",
    borderRadius: 3,
    fontSize: 10,
    color: "var(--purple-200)",
    fontFamily: "var(--font-mono)",
  }}
>
  [1]
</span>
```

### Highlight em texto (grounding)

Texto com suporte citado ganha `background: rgba(197, 245, 71, 0.15)`, `padding: 1px 5px`, `borderRadius: 3`, `color: #fff`, `fontWeight: 500`.

---

## Padrões de Tela

### 01 · Overview (Dashboard)

**Objetivo:** visão saúde do sistema em 10 segundos.

**Estrutura:**

1. TopNav
2. Header: Pill "Last 7 days" + H1 mistura de pesos + actions (Export, Run eval)
3. Hero row: 2 cards grandes lado a lado
   - **Featured metric** (lime bg): Grounding 94%, com `<MiniOrb>` e caption
   - **AI Insight** (ai-bg com stars): próxima ação sugerida
4. Grid 4 colunas de `<MetricCard>`: Queries, Latency p95, Hallucination, Cost
5. Pipeline row: tiles horizontais mostrando fluxo (Ingest → Retrieve → Rank → Generate → Evaluate)
6. Recent activity: tabela densa com timestamp, actor, event, status

**Nunca:** adicione um 4º card hero. Limite-se a 2.

### 02 · Chat · RAG Workspace

**Layout:** sidebar esquerda (histórico de conversas) + área principal + sidebar direita (citations panel).

- **Sidebar esquerda (280px):** "New conversation" button (primary), lista de threads com preview, timestamps em mono.
- **Thread principal:**
  - Mensagens do usuário: alinhadas à direita, bubble lime, `text-on-lime`, borderRadius `20px 20px 6px 20px`.
  - Mensagens do agent: alinhadas à esquerda, com `<MiniOrb>` à frente, texto em card `--surface-1`, metrics abaixo (grounding 0.92, latency 2.3s).
  - Citations inline (`[1]`, `[2]`) clicáveis abrem sidebar direita.
- **Sidebar direita (360px, retrátil):** chunks recuperados com sim score (`sim 0.89`), documento fonte, snippet.
- **Input:** fixo bottom, border-top `--border-subtle`, pill arredondada com mic + paperclip + send (brand).

### 03 · Knowledge / Upload

**Header:** "84 documents" pill, H1, actions (New collection, Upload).

**Hero:** drop zone grande, border dashed, icon upload em círculo lime translúcido. Texto "Drop PDF, MD, TXT" + "Max 10MB per file".

**Collections row:** pills horizontais scrolláveis (All, Contracts, Product, Engineering, HR).

**Document grid ou tabela:**

- Cada doc: `<CatTile>` com cor por tipo + nome em semi-bold + metadados mono + status pill.
- Status: `success` (green check), `warning` (processing, com spinner), `danger` (error).

**Details panel (drawer direito):** chunks do doc, configurações de embedding, reprocess button.

### 04 · Agents & Workflows

**Canvas-style:** nós conectados por linhas. Cada nó é um `<Card>` com header colorido (CatTile) + propriedades.

- **Node types:** Input, Retriever, Classifier, Tool call, LLM, Guardrail, Output.
- **Edges:** linhas SVG `stroke: var(--border-strong)`, sem curvas bruscas.
- **Sidebar direita:** configuração do nó selecionado.
- **Bottom bar:** Run, Save, Deploy (primary).

### 05 · Evaluations

**Hero:** comparação Local vs Cloud lado a lado (2 cards).

- Local card: `variant="lime"`, marcado "Winner".
- Cloud card: `ai-bg` com stars, "Baseline".
- Ambos: score grande, 3 sub-métricas (Relevance, Grounding, Consistency), latency + cost no rodapé.

**Tabela de breakdown:** cada linha = 1 pergunta. Colunas: `#`, Question, 3 barras de métrica (com `<Delta>`-like inline), Latency, Status pill.

**Barras de métrica:** altura 4px, fundo `--surface-3`, fill com cor baseada em score (`lime` ≥0.8, `warning` ≥0.6, `danger` <0.6), rótulo numérico mono ao lado.

### 06 · Observability

**Header:** Pill "Observability" + H1 + action "Last 24h" + Export logs.

**Metrics strip:** 5 `<MetricCard>` pequenos (`padding: 18`), compactos.

**Request explorer:** layout 2 colunas.

- **Esquerda (1.3fr):** tabela de traces, linha ativa com `border-left: 2px solid var(--lime-400)` e `background: var(--surface-2)`.
- **Direita (1fr):** detail panel com:
  - Span timeline: barras horizontais coloridas por categoria (`--cat-*`), largura proporcional ao tempo.
  - Payload: bloco `<pre>` com syntax highlighting por `<span>` colorido (keys em purple-200, strings em lime-400, numbers em warning).

### 07 · Settings

**Layout:** sidebar 240px + content.

- **Sidebar:** lista vertical, item ativo com `background: var(--surface-2)`.
- **Provider cards:** 3 colunas, card ativo com `border: 1.5px solid var(--lime-400)` + pill "Active".
- **Form fields:**
  - Slider customizado (thumb branco, track `--surface-3`, fill `--lime-400`, min/max labels mono)
  - Pill tabs (ex: Strategy, Top-k, MMR): grupo de pills dentro de container `--surface-2` com padding 3px.

---

## Estados, Interações & Motion

### Hover

- **Cards:** não mudam em hover (evitamos ruído).
- **Botões primary:** `background: var(--lime-500)` em hover (levemente mais escuro).
- **Botões secondary/ghost:** `border: var(--border-strong)`.
- **Linhas de lista:** `background: var(--surface-2)`.
- **IconBtn:** `background: var(--surface-3)`.

### Focus

- Inputs focados: `border: 1.5px solid var(--border-strong)`. Sem ring branco.
- Cards de seleção (ex: provider ativo em Settings): `border: 1.5px solid var(--lime-400)`.

### Active/Selected

- Nav pill ativo: `background: var(--lime-400)`, `color: var(--text-on-lime)`.
- Linha de tabela selecionada: `border-left: 2px solid var(--lime-400)` + `background: var(--surface-2)`.
- Tab ativo: mesmo pattern.

### Loading

- **Spinner:** usar ícone `refresh` com `animation: spin 1s linear infinite`.
- **Skeleton:** `background: var(--surface-2)` com shimmer gradient (implementar quando necessário; manter sutil).
- **Progress linear:** `<HatchedProgressBar pct={60} />`.

### Error / Empty

- **Error state:** pill `variant="danger"` + copy curto + ação de retry.
- **Empty state:** ilustração mínima (círculo + ícone), copy 1 linha, CTA primary.

### Motion

- **Transitions:** `transition: all 150ms cubic-bezier(0.2, 0.7, 0.3, 1)`.
- **Orb pulse:** 2.4s, definido em CSS.
- **Star twinkle:** 2.8s, delay aleatório.
- **Slide/fade de panels:** 220ms.

**Nunca:** animações > 400ms em UI funcional. Nenhum bounce/elastic.

---

## Mobile

### Princípios

- **Companion app**, não recriação completa.
- Mesma linguagem visual, densidade reduzida.
- Thumb-reachable: ações primárias no terço inferior.

### Estrutura

- **Status bar** simulada (iOS): 44px, horário + indicadores.
- **Top nav:** 60px, menu esquerda + título centro + action direita.
- **Content:** padding lateral 20px, gap 14-16px.
- **Bottom tab bar:** pill flutuante com 4 `<IconBtn>` 44x44, fundo `--surface-1`, border sutil, arredondado 9999px, `bottom: 12px`, `left/right: 12px`. Item ativo é `--lime-400`.

### Componentes adaptados

- `<MetricCard>` featured ganha mais espaço vertical no mobile.
- Listas substituem grids.
- Tabelas viram cards verticais.

### Telas incluídas no sistema

- Mobile Overview (dashboard comprimido)
- Mobile Chat (com input fixo, bottom)
- Mobile Knowledge (list + drop zone compacto)

---

## Acessibilidade

### Contraste

- `--text-primary` (#FFF) sobre `--bg-canvas` (#000): 21:1 ✓
- `--text-secondary` (#C7C7C7) sobre `--surface-1` (#111): 11.5:1 ✓
- `--text-muted` (#8A8A8A) sobre `--surface-1`: 5.3:1 ✓ (AA only)
- `--text-on-lime` (#0A0A0A) sobre `--lime-400` (#C5F547): 14.8:1 ✓

**Nunca** use `--text-muted` sobre `--surface-3` — contraste insuficiente.

### Tamanho de hit target

- Botões e nav: mínimo 40px altura.
- Mobile tab bar: 44x44.
- Links inline em tabelas: padding extra para somar 32px mínimo.

### Foco de teclado

- Todo elemento interativo precisa `:focus-visible` com `outline: 2px solid var(--lime-400)` e `outline-offset: 2px`.
- Modais: trap focus.

### Movimento

- Respeite `prefers-reduced-motion`: pulse do orb e twinkle de stars devem pausar.

### ARIA

- `<Pill>` com status informativo: `role="status"`.
- `<Orb>` decorativo: `aria-hidden="true"`.
- Tabelas densas: `<caption>` obrigatório.

---

## Voz & Copywriting

### Princípios

- **Preciso, técnico, honesto.** Nunca exagerado.
- **Dados > adjetivos.** "94% grounding" é melhor que "excellent grounding".
- **Termos corretos.** RAG, embedding, chunk, retriever, guardrail, grounding, hallucination, correlation ID, latency p95 são termos do produto — use-os.
- **Lowercase para labels técnicos.** `p50 latency`, `tokens in/out`.
- **Title case para headers de página.** "Enterprise Pricing Model".

### Microcopy

| Situação        | Bom ✓                                     | Ruim ✗                        |
| --------------- | ----------------------------------------- | ----------------------------- |
| Botão primary   | "Run evaluation", "Upload document"       | "Submit", "Go"                |
| Empty state     | "No documents yet. Drop files to ingest." | "Nothing here!"               |
| Error           | "Ingestion failed · timeout at chunk 14"  | "Oops! Something went wrong." |
| Success toast   | "Deployed · v23 live"                     | "Success!"                    |
| Loading         | "Retrieving 5 chunks…"                    | "Loading…"                    |
| Tooltip técnico | "p95 = 95th percentile latency"           | —                             |

### Proibições

- Nunca use "AI magic", "powered by AI", "intelligent".
- Nunca use emoji em UI funcional.
- Nunca use 2ª pessoa muito íntima ("Hey!", "Let's do this!"). Tom é de ferramenta profissional.

---

## Decisões Arquitetônicas

Registre aqui decisões de design com rationale. Fomatar: **ADR-NNN · Título · Status**.

### ADR-001 · Dark-first, sem light mode (aceita)

Nexus é usado em contextos de monitoramento (observability, evals). Light mode adicionaria superfície de manutenção 2x sem ROI validado. Revisitar se >30% dos usuários pedirem.

### ADR-002 · Uma cor primária (lime) em vez de palette expandida (aceita)

Lime isolado gera ancoragem visual forte: "lime = ação ou ativo". Expandir para múltiplos tons de marca dilui semântica. Roxo é reservado à categoria "AI".

### ADR-003 · Mono apenas para dado técnico (aceita)

Geist Mono (hoje JetBrains Mono no standalone) é tipograficamente próximo do sans, mas visualmente denuncia "isso é ID/número/código". Manter dogma: se não é técnico, não é mono.

### ADR-004 · Sem shadow em cards (aceita)

Elevação é comunicada por surface + border. Shadow em dark UI vira borrão cinza. Exceção: overlays de modal.

### ADR-005 · Citations sempre numeradas e inline (aceita)

Cada afirmação factual do agent tem `[N]` clicável que abre chunk fonte. Grounding é valor-núcleo do produto; UI reforça isso visualmente.

### ADR-006 · Artboards não rolam (aceita)

Cada tela é um documento inteiro com altura variável. Scroll interno cria "poços" de conteúdo invisível. Se a tela cresce, aumente a altura do artboard e deixe o viewport rolar externamente.

---

## Checklist antes de entregar

Antes de abrir PR ou marcar tarefa frontend como "pronta":

- [ ] Todos os valores de cor vêm de `var(--token)`? (Zero hex hardcoded em JSX/CSS)
- [ ] Toda família de fonte é `var(--font-sans)` ou `var(--font-mono)`?
- [ ] Toda tipografia segue a escala definida?
- [ ] Componentes primitivos são reutilizados (`<Pill>`, `<Button>`, `<Card>`)? Nenhum duplicado inline?
- [ ] Botão primary: **uma** ação principal por tela/área?
- [ ] Ícones são do set `<Icon>`? Stroke 1.75?
- [ ] Spacing em múltiplos de 4?
- [ ] Estados hover/focus/active implementados?
- [ ] Contraste WCAG AA mínimo (verificar tokens muted)?
- [ ] Sem emoji em UI funcional?
- [ ] Microcopy segue voz técnica?
- [ ] Mobile: bottom tab bar presente, ações thumb-reachable?
