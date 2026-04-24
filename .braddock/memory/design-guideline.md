# Design Guideline — Nexus AI

> **Referência visual:** [Learning Sync | AI Education SaaS](https://www.behance.net/gallery/245893195/Learning-Sync-AI-Education-SaaS-UIUX-Case-Study) por Dhaval Agrawal + Fractal Labs + Gulshan Ali.
> **Escopo:** linguagem visual, tokens, componentes, padrões de layout e mapeamento semântico do design de referência para o domínio chamada Nexus AI (RAG + Agents + Observability).
>
> Este documento é a **fonte de verdade visual**. Decisões técnicas (stack, arquitetura) continuam em `.braddock/memory/technical-guidelines.md`.

---

## 1. Filosofia de Design

### 1.1 Essência

O Learning Sync opera sobre três eixos visuais que precisam ser preservados na tradução:

1. **Dark-first, alto contraste.** Fundo quase puro preto, acentos saturados. Não há modo claro — a interface é nativamente noturna. Isso transmite foco técnico e é coerente com o posicionamento de "ferramenta de trabalho séria".
2. **Dualidade cromática de propósito.** _Lime_ sinaliza ação, progresso positivo e estado ativo. _Purple/Lilac_ sinaliza inteligência, cálculo, insight da IA. Nenhuma cor é decorativa — cada uma carrega significado.
3. **Design-tool aesthetic.** Elementos de Figma (bounding boxes com handles, bezier curves dashed, pen tool) aparecem como ornamento de seção. Isso sinaliza "produto feito por gente que pensa em design" e é um diferencial de credibilidade para audiência técnica.

### 1.2 Tradução para Nexus AI

| Conceito no Learning Sync   | Equivalente neste produto                        |
| --------------------------- | ------------------------------------------------ |
| Skill Mastery               | Retrieval Confidence / Grounding Score           |
| Focus Score                 | Hallucination Rate (invertido) / Answer Fidelity |
| Modules Completed           | Documents Ingested / Chunks Embedded             |
| Projects Completed          | Queries Resolved Successfully                    |
| Learning Plan (timeline)    | Agent Run Timeline / Pipeline Steps              |
| Skill Development (donut)   | Structured vs. Unstructured Data Split           |
| AI Insight (card com orb)   | Observability Panel (cost, latency, quality)     |
| AI Mentor (chat)            | Chat RAG Interface / Agent Workspace             |
| Recommended next topics     | Citation Sources / Retrieved Chunks              |
| Continue learning           | Recent Conversations / Resume Session            |
| Streak / days without break | Eval Pipeline Uptime / Health Streak             |
| Current path progress       | Knowledge Base Coverage                          |

### 1.3 Princípios de execução

- **Grounding visual é literal.** Toda resposta de IA mostra, ao lado, a citação e o chunk recuperado — o chat nunca flutua sozinho. Isso é fiel ao posicionamento anti-alucinação do produto.
- **Percentuais > números absolutos.** O design de referência usa `%` em quase todos os cards principais (62%, 72%, 78%). Adote o mesmo viés: mostre `Grounding: 94%` antes de "94 de 100 chunks relevantes".
- **Delta chips em tudo.** Qualquer métrica temporal vem com um chip `+5%` ou `-2%` ao lado. Pequeno detalhe, alta legibilidade.
- **Hachura diagonal como pattern de dados "em processo".** Skeleton loading, placeholders de charts e bars secundárias usam stripes diagonais — nunca blocos sólidos opacos.

---

## 2. Fundações

### 2.1 Paleta

Valores extraídos por inspeção das telas do case. Aproximações em hex abaixo — ajuste fino pode ser feito depois via sampling de screenshots locais.

#### Cores base (surfaces)

| Token            | Valor                    | Uso                                                         |
| ---------------- | ------------------------ | ----------------------------------------------------------- |
| `bg.canvas`      | `#000000`                | Background da página. Preto puro.                           |
| `bg.elevated`    | `#0A0A0A`                | Hero regions, áreas que precisam separação sutil do canvas. |
| `surface.1`      | `#111111`                | Cards padrão.                                               |
| `surface.2`      | `#161616`                | Cards aninhados / inner cards sobre `surface.1`.            |
| `surface.3`      | `#1E1E1E`                | Hover state de cards / popovers / dropdowns.                |
| `border.subtle`  | `rgba(255,255,255,0.06)` | Bordas de cards. Quase invisível.                           |
| `border.default` | `rgba(255,255,255,0.10)` | Separadores, dividers.                                      |
| `border.strong`  | `rgba(255,255,255,0.16)` | Foco de teclado, estados selecionados.                      |

#### Cores de marca (accents)

| Token              | Valor     | Uso                                                              |
| ------------------ | --------- | ---------------------------------------------------------------- |
| `brand.lime.50`    | `#F4FCDB` | Texto sobre surfaces verdes escuros (raro).                      |
| `brand.lime.200`   | `#E0F99E` | Glow / soft outlines.                                            |
| `brand.lime.400`   | `#C5F547` | **Primary.** CTA, logo, metric cards positivos, active nav.      |
| `brand.lime.500`   | `#B4E639` | Hover do primary.                                                |
| `brand.lime.600`   | `#8FBF1F` | Pressed.                                                         |
| `brand.purple.200` | `#D4C7FF` | Badges "Advanced", text on purple surfaces.                      |
| `brand.purple.400` | `#A78BFA` | **Secondary.** AI indicators, charts secundários, orb highlight. |
| `brand.purple.500` | `#8B5CF6` | Orb principal, gradient stops.                                   |
| `brand.purple.700` | `#5B21B6` | AI Insight card background deep layer.                           |
| `brand.purple.900` | `#2E1065` | Gradient deep shadow.                                            |

#### Texto

| Token            | Valor     | Uso                                              |
| ---------------- | --------- | ------------------------------------------------ |
| `text.primary`   | `#FFFFFF` | Títulos, números grandes.                        |
| `text.secondary` | `#C7C7C7` | Body text.                                       |
| `text.muted`     | `#8A8A8A` | Labels secundários, subtítulos.                  |
| `text.disabled`  | `#555555` | Disabled states.                                 |
| `text.on-lime`   | `#0A0A0A` | Texto sobre superfícies lime. **Sempre escuro.** |
| `text.on-purple` | `#FFFFFF` | Texto sobre surfaces roxas saturadas.            |

#### Semântica (data/status)

O design de referência não usa amarelo/vermelho no dashboard principal — status é codificado por lime (bom) e muted gray (neutro). Mas sua vertical precisa de mais nuances (erro, alerta, custo alto):

| Token            | Valor     | Uso                                             |
| ---------------- | --------- | ----------------------------------------------- |
| `status.success` | `#C5F547` | = brand.lime.400. Grounding alto, eval pass.    |
| `status.warning` | `#F7B955` | Latência elevada, custo em alerta.              |
| `status.danger`  | `#F47266` | Hallucination detected, eval fail, error state. |
| `status.info`    | `#A78BFA` | = brand.purple.400. Info neutra da IA.          |

#### Categóricas (design process / data viz)

Usado no case para colorir os passos do design process (Research/Define/Ideation/Design) — tiles coloridos com o mesmo monograma. Aplicamos o mesmo esquema para categorizar fontes de dados ou tipos de agente:

| Token        | Valor     | Semântica sugerida      |
| ------------ | --------- | ----------------------- |
| `cat.orange` | `#F97316` | Ingestion / Research    |
| `cat.purple` | `#8B5CF6` | Embedding / Define      |
| `cat.lime`   | `#C5F547` | Retrieval / Ideation    |
| `cat.yellow` | `#FACC15` | Orchestration / Design  |
| `cat.blue`   | `#3B82F6` | Evaluation / Validation |
| `cat.pink`   | `#EC4899` | Guardrails / Safety     |

### 2.2 Tipografia

**Família única: [Geist](https://vercel.com/font)** (confirmada visualmente no case — spread `Aa` + palavra "Geist" em uma das slides).

```ts
// tokens/typography.ts
export const fonts = {
  sans: "'Geist', ui-sans-serif, system-ui, -apple-system, sans-serif",
  mono: "'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace",
} as const;

export const weights = {
  regular: 400,
  medium: 500,
  semibold: 600,
} as const;
```

Pesos usados no case: **Regular, Medium, Semibold**. Evite Bold/Black — a escala já tem contraste suficiente entre tamanhos.

#### Escala (baseada em telas do case em 1440+ px)

| Role          | Size             | Line height | Weight | Tracking |
| ------------- | ---------------- | ----------- | ------ | -------- |
| `display.xl`  | 88px / 5.5rem    | 0.95        | 400    | −0.03em  |
| `display.lg`  | 72px / 4.5rem    | 1.0         | 400    | −0.025em |
| `display.md`  | 56px / 3.5rem    | 1.05        | 400    | −0.02em  |
| `heading.lg`  | 40px / 2.5rem    | 1.1         | 500    | −0.015em |
| `heading.md`  | 32px / 2rem      | 1.15        | 500    | −0.01em  |
| `heading.sm`  | 24px / 1.5rem    | 1.2         | 500    | −0.005em |
| `metric.hero` | 56px / 3.5rem    | 1.0         | 500    | −0.02em  |
| `metric.card` | 40px / 2.5rem    | 1.0         | 500    | −0.015em |
| `body.lg`     | 18px / 1.125rem  | 1.5         | 400    | 0        |
| `body.md`     | 15px / 0.9375rem | 1.55        | 400    | 0        |
| `body.sm`     | 13px / 0.8125rem | 1.5         | 400    | 0        |
| `label.md`    | 14px / 0.875rem  | 1.3         | 500    | 0        |
| `label.sm`    | 12px / 0.75rem   | 1.3         | 500    | 0.01em   |
| `caption`     | 11px / 0.6875rem | 1.3         | 400    | 0.02em   |

#### Padrão de ênfase em headlines

Headlines do case misturam peso (Regular + Semibold) em **uma mesma linha**:

> Designing a smarter learning **experience**
> Learning without progress **visibility**

Este é o padrão canônico de título grande. Use-o para:

- Hero do produto → `"Answers you can **trust**"`
- Seções de marketing → `"Grounded by **real documents**"`
- Títulos de relatórios → `"Last 7 days of **agent runs**"`

A palavra semibold é sempre a carregadora de significado (o conceito-chave da frase).

### 2.3 Espaçamento

Escala em base 4px, progressão não-linear:

```ts
export const space = {
  0: "0",
  0.5: "2px",
  1: "4px",
  1.5: "6px",
  2: "8px",
  2.5: "10px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
  24: "96px",
  32: "128px",
} as const;
```

Padrões observados no case:

- **Padding interno de cards:** 20–24px (use `space.5` ou `space.6`).
- **Gap entre cards no grid:** 16–24px.
- **Gap entre seções:** 96–128px (respiro generoso, um dos segredos da estética).
- **Padding de pills/badges:** horizontal 16–20px, vertical 8–10px.

### 2.4 Border radius

```ts
export const radius = {
  none: "0",
  xs: "6px", // pequenos chips internos, tooltips
  sm: "10px", // botões médios, inputs inline
  md: "14px", // ícones em containers, tiles pequenos
  lg: "20px", // cards padrão
  xl: "28px", // cards grandes, hero panels
  "2xl": "36px", // cards featured (hero)
  pill: "9999px", // pills, badges, nav items
} as const;
```

Evite radius abaixo de 6px — o sistema inteiro trabalha com cantos suaves. **Nunca** use `radius.none` exceto em elementos de código/terminal.

### 2.5 Elevação / sombras

O design é predominantemente flat. Profundidade vem por **gradação de superfície** (surface.1 → surface.2 → surface.3) e não por box-shadow. Sombras aparecem apenas em dois casos:

```ts
export const shadow = {
  none: "none",
  // Cards elevados "flutuando" sobre uma foto/gradient (ex: streak card sobre hero purple)
  float:
    "0 24px 48px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.05)",
  // Glow de elementos com brand color (CTA em estado hover, orb de AI)
  glowLime: "0 0 40px rgba(197, 245, 71, 0.35)",
  glowPurple: "0 0 60px rgba(139, 92, 246, 0.45)",
} as const;
```

### 2.6 Motion

Observações do vídeo do case: transições são sutis, easing suave, sem grande teatralidade. Durações curtas.

```ts
export const motion = {
  duration: {
    instant: "80ms", // hover fills, icon swaps
    fast: "150ms", // button states, pill transitions
    base: "220ms", // card hovers, dropdowns
    slow: "380ms", // modais, sheet entries
    deliberate: "640ms", // grandes mudanças de layout, page transitions
  },
  easing: {
    standard: "cubic-bezier(0.2, 0, 0, 1)", // default
    emphasized: "cubic-bezier(0.05, 0.7, 0.1, 1)", // entradas com impacto
    decelerate: "cubic-bezier(0, 0, 0, 1)", // elementos chegando na tela
  },
} as const;
```

**Motions distintivos a implementar:**

- **Orb AI pulse:** scale 1.0 → 1.04 → 1.0 em 2.4s, infinite, acompanhado de glow purple que varia de opacidade 0.3 → 0.6.
- **Stars particle:** pequenos pontos brancos em posições fixas ao redor do orb, cada um com opacity oscillating em fases desencontradas (shimmer effect).
- **Progress bar fill:** preenchimento das barrinhas verticais em sequência (stagger de 30ms cada), easing `emphasized`.
- **Metric counter:** números de KPIs contam de 0 até o valor final no mount (ex: 0 → 72%) em ~800ms.

### 2.7 Grid & breakpoints

```ts
export const breakpoints = {
  xs: "480px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1440px", // dashboard "canonical" width
  "3xl": "1920px",
} as const;
```

Dashboard do case é desenhado para **≥1440px**. Grid de 12 colunas com gutter 24px. Abaixo de 1024px, faça collapse para 2 colunas; abaixo de 768px, 1 coluna com cards empilhados.

---

## 3. Componentes

### 3.1 Pill / Badge

Elemento onipresente. Três variantes principais:

```tsx
// Variants
type PillVariant =
  | "default" // bg: surface.2, text: text.primary
  | "primary" // bg: brand.lime.400, text: text.on-lime
  | "muted" // bg: surface.1 com border, text: text.muted
  | "accent" // bg: purple.900 tint, text: purple.200 (ex: "Advanced")
  | "section"; // pill de section label — default + padding maior
```

Anatomia:

- Altura fixa: 32px (sm), 40px (md), 48px (lg)
- Padding horizontal: 16–20px
- Radius: `pill` (9999px)
- Font: `label.md` (14/500)
- Ícone opcional à esquerda, gap 8px

**Uso semântico aqui:**

- `primary` em: "Connected", "Active", "Ingestion complete"
- `accent` em: "Advanced", "Beta", "Experimental agent"
- `section` em: sempre antes de título grande de seção (ver §4.3)

### 3.2 Button

```tsx
type ButtonVariant =
  | "primary" // lime bg, black text — CTA principal
  | "secondary" // surface.2, white text, subtle border
  | "ghost" // transparente, white text
  | "icon" // circular, 40px, igual aos "circle icons" do case
  | "destructive"; // danger color
```

**Detalhes de execução:**

- Primary tem peso semibold, letter-spacing -0.01em.
- Icon button: círculo sólido de 40×40, ícone line 20px centralizado. Variantes de bg: `surface.2` (default), `white` (emphasis), `brand.lime.400` (CTA icon).
- **Never** use outline button. O design do case não tem borderless buttons — sempre fill ou ghost.

### 3.3 Card

Unidade estrutural central. Três níveis:

#### 3.3.1 Metric Card (KPI)

```
┌──────────────────────────┐
│  [icon] Label        ↗   │   ← header: label + nav/expand button
│                          │
│  72%        [+5% chip]   │   ← hero metric + delta chip
│  this week               │   ← context caption
└──────────────────────────┘
```

- Bg: `surface.1` (ou `brand.lime.400` para destaque — chamado "Featured Metric")
- Radius: `lg`
- Padding: `space.5` (20px) a `space.6` (24px)
- Ícone do label: 16px dentro de circle 28px (surface.2 se em featured, surface.3 se em default)
- Delta chip: pill pequeno com cor semântica (lime para positivo, não use vermelho para negativo — use muted gray)

**Uso neste produto:**

- Grounding Score (featured, lime bg)
- Hallucination Rate (default)
- Queries Resolved
- Avg Cost per Query
- P95 Latency
- Eval Pass Rate

#### 3.3.2 Chart Card

```
┌────────────────────────────┐
│  Title           [filter▾] │
│                            │
│     [chart body here]      │
│                            │
│  • legend A  • legend B    │
└────────────────────────────┘
```

- Filter dropdown no top-right (padrão do case: "Last 7 days ▾") — bg white sólido, texto dark, pill small.
- Legenda sempre em baixo, inline, com dots circulares coloridos (8px) + label.

#### 3.3.3 Featured AI Card

O grande destaque visual do produto. Card com background gradient purple + star particles + hatched bars.

```
┌──────────────────────────────────────┐
│  AI Insight         [Last 7 days ▾]  │
│                                      │
│  78%    Overall Score                │
│  ★ ·  star particles  · ★            │
│  ┌────┐  ┌────┐  ┌────┐              │
│  │////│  │ +  │  │////│  ← striped + solid purple bars
│  └────┘  └────┘  └────┘              │
│  Focus   Skill    Weekly             │
│                                      │
│  [🟣] You're making strong progress  │
│       in Machine Learning Fund...    │
└──────────────────────────────────────┘
```

Implementação do background:

```css
background:
  radial-gradient(
    ellipse at top,
    rgba(139, 92, 246, 0.55) 0%,
    rgba(91, 33, 182, 0.25) 40%,
    rgba(17, 17, 17, 1) 80%
  ),
  #111111;
```

Star particles: SVG ou HTML absolute-positioned, 12–18 pontos brancos de 2–4px com `box-shadow: 0 0 4px white` e opacity variando entre 0.3 e 0.8.

Hatched bar pattern:

```css
.striped-bar {
  background-image: repeating-linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.12),
    rgba(255, 255, 255, 0.12) 2px,
    transparent 2px,
    transparent 6px
  );
  background-color: rgba(139, 92, 246, 0.25);
  border-radius: 12px;
}
```

**Uso neste produto:** este é o componente da Observability Panel. Exibe cost, latency, quality de forma dramática e reforça o posicionamento "AI com controle".

### 3.4 Donut Chart

Presente em várias telas (Skill Development 28/72, Current path 62%).

Especs:

- Stroke width: 16px em charts grandes, 10px em charts pequenos
- Inner radius / outer radius ratio: ~0.72
- Cores: 2 segmentos no máximo — lime (primário) + purple (secundário)
- Center text: percentual em `metric.card` weight medium
- Labels externos: posicionados nos quadrantes com dots coloridos e `label.sm`

**No produto:**

- Structured vs Unstructured data
- Agent success vs fallback
- Cached vs Fresh retrievals

Biblioteca recomendada: Recharts (já no ecossistema React que você usa) ou D3 para customização fina do glow e segment separators.

### 3.5 Timeline Widget (Learning Plan → Agent Run)

Horizontal timeline com hora markers no topo e event card destacado em lime.

```
  07:00am    08:00am    [09:00am]    10:00am    11:00am
─────────────────────────────▼────────────────────────
                      ┌──────────┐
                      │ 09:00am  │  ← event pin verde
                      └──────────┘
  [card dim]          [card highlight]     [card dim]
  Retrieval           AI Ethics & Safety   Embedding step
  07:40am             09:00am              10:24am
```

Aplicações:

- Exibição de **um run de agente** com steps sequenciados
- Histórico de pipeline runs
- Roadmap de ingestion jobs

Event em highlight: pill lime com hora em black text.

### 3.6 Streak Card

Tamanho pequeno (compacto, ~280×100px). Aparece flutuando sobre outros elementos ou no topo de seção.

```
┌─────────────────────────────┐
│  5 days without break   ⚡  │
│  18/30 modules              │
│  ○ ○ ● ● ● ● ○              │
│  S M T W T F S              │
└─────────────────────────────┘
```

- Dias completos: circle 24px lime bg com check ícone black
- Dias incompletos: circle 24px surface.2 com letra do dia
- Uso aqui: **Eval pipeline uptime** — "23 days without regression", ou **Ingestion health** — "7 days of clean runs".

### 3.7 Orb AI (chat hero)

Elemento icônico. Sphere gradiente roxa com particle stars ao redor, posicionada acima da saudação da IA.

Implementação (SVG + CSS, sem WebGL):

```html
<div class="orb-container">
  <div class="orb-glow" />
  <div class="orb-core" />
  <div class="orb-stars">
    <!-- 12-18 spans absolute positioned -->
  </div>
</div>
```

```css
.orb-core {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 35% 30%,
    #d4c7ff 0%,
    #8b5cf6 30%,
    #5b21b6 60%,
    #2e1065 100%
  );
  filter: blur(0.5px);
  animation: orb-pulse 2.4s ease-in-out infinite;
}

.orb-glow {
  position: absolute;
  inset: -40%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(139, 92, 246, 0.35) 0%,
    transparent 60%
  );
  animation: orb-pulse 2.4s ease-in-out infinite reverse;
}

@keyframes orb-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.04);
    opacity: 1;
  }
}
```

Stars: 12–18 `<span>` absolute com posições randomizadas no mount, tamanho 2–4px, background white, box-shadow glow, cada um com `animation-delay` diferente para efeito shimmer.

**Uso no produto:** tela de chat RAG. Representa a presença do agente ativo. Quando a IA está "pensando" (streaming), pulse fica mais rápido (1.2s). Quando idle, pulse lento (2.4s).

### 3.8 Chat Input (AI Mentor)

```
┌─────────────────────────────────────────────────────┐
│  Ask your agent anything about your knowledge...    │
│                                                     │
│  🎙  🎤                                       [▸]   │
└─────────────────────────────────────────────────────┘
```

- Bg: `surface.2`
- Radius: `xl` (28px) — bem arredondado
- Padding: 16px horizontal, 14px vertical
- Placeholder: `text.muted`
- Ícones à esquerda: attach + mic, em circles de 32px
- Send button à direita: circle 40px, bg `brand.lime.400`, ícone arrow-right black

Estado com streaming: placeholder muda para "Agent is thinking..." com shimmer effect.

### 3.9 Quick Actions (chips abaixo do chat)

Grid 4 cards horizontais abaixo da saudação da IA:

```
┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
│  [icon]   │ │  [icon]   │ │  [icon]   │ │  [icon]   │
│ Recommend │ │ Help me   │ │ Explain   │ │ Create    │
│ next step │ │ revise    │ │ concept   │ │ quiz      │
└───────────┘ └───────────┘ └───────────┘ └───────────┘
```

- Bg: `surface.2`
- Border: 1px `border.subtle`
- Radius: `md`
- Ícone circular colorido (um dos categorical colors) no topo
- Text `body.md`
- Hover: bg → `surface.3`, border → `border.default`

**No produto:** "Explain last agent failure", "Summarize this document", "Show retrieval sources for last answer", "Generate eval cases".

### 3.10 Navigation (Top Bar)

Pattern do case: logo à esquerda, centered pill nav, right controls.

```
[LS Learning Sync]    [ Dashboard  Paths  AI  Insights ]    [🔍] [🔔] [avatar ▾]
```

- Pill nav container: `surface.1` com radius `pill`, padding 4px interno
- Item ativo: `brand.lime.400` bg com black text, radius `pill`
- Item inativo: transparent, text secondary, ícone line 16px à esquerda do label
- Hover item inativo: `surface.3`

Para dashboards de IA, os itens principais sugeridos:
`Overview` · `Chat` · `Agents` · `Knowledge` · `Evals` · `Observability`

### 3.11 Citation / Source Card

**Componente que não existe no case** mas é crítico para o produto. Inspire-se no card "Recommended next topics":

```
┌─────────────────────────────────────────────┐
│ [thumb]  Machine Learning Basics  [Advanced]│
│          ⏱ 2h 30m  ·  📄 03 modules         │
│          On progress              30% ━━━━━ │
└─────────────────────────────────────────────┘
```

Traduza para citation source:

```
┌─────────────────────────────────────────────┐
│ [📄]  design-guidelines.md  [doc] [v2]      │
│       Last updated 2d ago · Chunk 14/28     │
│       Similarity 0.89  ━━━━━━━━━━━━━━━━━━━━ │
└─────────────────────────────────────────────┘
```

- Thumbnail: ícone do tipo de fonte (doc/web/db) dentro de tile colorido 40×40
- Título: nome do documento em `label.md`
- Meta: last updated + chunk index
- Similarity score: mini bar horizontal preenchida em lime

### 3.12 Icon System

**Padrão:** ícones line-style em `lucide-react` (coerente com seu stack). Sempre dentro de containers circulares quando standalone.

Tamanhos padrão:

- Inline (em texto, em botões com label): 16px
- Container small: circle 28px, ícone 14px
- Container medium: circle 40px, ícone 20px (padrão para nav e quick actions)
- Container large: circle 56px, ícone 28px

Variantes de fill do container:

- Default: `surface.2` bg, `text.secondary` ícone
- Active: `white` bg, `text.on-lime` (black) ícone
- Brand: `brand.lime.400` bg, black ícone
- AI: `brand.purple.500` bg, white ícone

---

## 4. Padrões de Layout

### 4.1 Dashboard Grid

Base 12 colunas, gap 24px. Padrão do case para dashboard principal:

```
╔═══════════════════════════════════════════════════════════╗
║  [ metric lime (featured) 4col ] [ chart card 4col ] [AI 4]║
║  [ metric 2col ][ metric 2col ] [...continua chart......] ║
║                                                            ║
║  [ timeline card 6col ]  [ continue list card 6col ]      ║
╚═══════════════════════════════════════════════════════════╝
```

Regra: **um featured metric (lime) por fold** + 2-3 secondary metrics + 1 AI card dominante.

### 4.2 Hero / Product Vision

```
LARGE DISPLAY HEADING em weight misto
sub-description em body.lg, max-width 640px, text.secondary
[ Pill row: tag1 · tag2 · tag3 ]
                    ↓
         [ product mockup centrado ]
```

Tags-pills abaixo do hero (padrão do case: "Learning Sync · 2026 · A.I. Education · UI/UX Case Study") — use no seu produto para: versão, stack, vertical, release status.

### 4.3 Section Intro

```
[ pill "Design process" ]
       ↓
LARGE HEADING com ênfase semibold
       ↓
(optional) bounding-box ornamental roxo ao redor do título
       ↓
body text em grid 2 colunas (opcional)
```

Implementação do bounding box Figma-style:

```css
.section-heading-figma {
  position: relative;
  display: inline-block;
  padding: 24px 48px;
}
.section-heading-figma::before,
.section-heading-figma::after {
  content: "";
  position: absolute;
  width: 12px;
  height: 12px;
  background: var(--purple-500);
  border-radius: 2px;
  box-shadow: 0 0 0 3px var(--bg-canvas);
}
.section-heading-figma::before {
  top: -6px;
  left: -6px;
}
.section-heading-figma::after {
  bottom: -6px;
  right: -6px;
}
/* mais dois handles via spans adicionais, ou pseudo elementos em child */
```

Acompanhado de border dashed 1px ao redor:

```css
outline: 1px dashed rgba(167, 139, 250, 0.4);
outline-offset: 0;
```

### 4.4 Design Process / Pipeline Timeline

Pattern de cards em zigzag com linhas verticais conectando. Original do case:

```
[■ orange tile] Research
│
    [■ purple tile] Define
    │
        [■ lime tile] Ideation
        │
            [■ yellow tile] Design
```

**Aplicação aqui:** documentar o pipeline RAG visualmente:

```
[■ orange]  Ingestion     Load docs, metadata extraction
│
    [■ purple]  Chunking    Strategy: semantic, 512 tokens
    │
        [■ lime]  Embedding   Model: text-embedding-3-small
        │
            [■ yellow]  Retrieval  Hybrid BM25 + vector
            │
                [■ blue]  Generation Guardrails, typed outputs
```

- Tile: 64×64, radius `md`, cor categórica, logo/ícone do produto centralizado
- Card: bg `surface.1`, radius `lg`, padding 16px 20px
- Linha conectora: 2px solid `border.default`, altura controlada pelo gap do flex

### 4.5 Seções Marketing (Problem/Solution)

Padrão:

1. Pill `[ Problem and solution ]`
2. Heading grande "Learning without progress **visibility**"
3. **Lado esquerdo:** card verde lime grande com texto black. Pill preta "Solution" no topo. Texto com destaque bold em partes-chave.
4. **Lado direito:** descrição do problema em parágrafo, texto secondary, sem card.

**Regra visual importante:** a solução é **sempre** o elemento visualmente dominante (card grande colorido). O problema é texto puro, mais discreto. Isso reforça hierarquia emocional "problem → solution".

---

## 5. Assets Visuais Distintivos

Estes são os elementos que dão identidade ao produto. Implementá-los é o que separa um "dashboard dark genérico" do estilo Learning Sync.

### 5.1 Logo / Monograma

Um monograma de 2 letras em tiles coloridos. No case é "LS" (Learning Sync). Para seu produto:

- Defina uma sigla de 1–2 letras. Exemplos se o produto for "BraddockAI" → "B" ou "BA".
- Formato: glifo geométrico, sans-serif, construído com retângulos (não curvas). Weight muito bold.
- Container: rounded square (não circle) em `radius.md` a `radius.lg`.
- Tamanhos canônicos: 24, 40, 80px (como mostrado no case).

### 5.2 Star Particles

Pattern decorativo para indicar "AI presence" / computação.

SVG template:

```html
<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <g fill="white">
    <!-- 12-18 stars, positions vary -->
    <circle cx="40" cy="30" r="1.5" opacity="0.6">
      <animate
        attributeName="opacity"
        values="0.3;1;0.3"
        dur="3s"
        repeatCount="indefinite"
        begin="0s"
      />
    </circle>
    <circle cx="120" cy="80" r="2" opacity="0.8">
      <animate
        attributeName="opacity"
        values="0.4;1;0.4"
        dur="2.5s"
        repeatCount="indefinite"
        begin="0.8s"
      />
    </circle>
    <!-- ... -->
  </g>
</svg>
```

Usar apenas em superfícies escuras (nunca sobre lime). Densidade: 1 star a cada ~40×40px de área.

### 5.3 Hatched Diagonal Pattern

Background pattern para bars secundárias ou skeleton states.

```css
.hatched {
  background-image: repeating-linear-gradient(
    135deg,
    currentColor 0px,
    currentColor 1.5px,
    transparent 1.5px,
    transparent 6px
  );
  opacity: 0.35;
}
```

Aplica `color: white` para light hatching sobre dark, ou cor específica. Nunca ultrapasse opacity 0.4 — é um elemento suporte, não protagonista.

### 5.4 Figma-Inspired Ornaments

Nas seções de storytelling / marketing:

- **Bounding box roxo com handles** ao redor de headings (ver §4.3)
- **Pen tool SVG** apontando para elementos
- **Dashed bezier curves** conectando ideias

Use com moderação — no máximo 1 por seção, preferencialmente 1–2 vezes no produto inteiro. Tratam-se de ornamentos, não de padrões de UI funcional.

---

## 6. Acessibilidade

Dark mode + cores saturadas exigem cuidado extra:

### 6.1 Contraste

- `text.primary (#FFFFFF)` sobre `bg.canvas (#000000)` → **21:1** ✅ AAA
- `text.secondary (#C7C7C7)` sobre `bg.canvas` → **14.2:1** ✅ AAA
- `text.muted (#8A8A8A)` sobre `bg.canvas` → **5.9:1** ✅ AA normal (não usar para texto < 14px)
- `text.on-lime (#0A0A0A)` sobre `brand.lime.400 (#C5F547)` → **14.8:1** ✅ AAA
- **`brand.lime.400` sobre `bg.canvas`** → **14.3:1** ✅ AAA (fundo texto ok)
- `brand.purple.400 (#A78BFA)` sobre `bg.canvas` → **9.1:1** ✅ AAA

**Atenção:** `brand.lime.400` sobre `surface.3 (#1E1E1E)` passa, mas evite lime como texto sobre surfaces médio-claros — ruído visual.

### 6.2 Foco de teclado

```css
:focus-visible {
  outline: 2px solid var(--brand-lime-400);
  outline-offset: 2px;
  border-radius: inherit;
}
```

Nunca remova outline sem substituir. O lime contrasta forte o suficiente em qualquer surface.

### 6.3 Motion

Respeitar `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  .orb-core,
  .orb-glow,
  .streak-fill {
    animation: none;
  }
  .metric-counter {
    transition: none;
  }
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

A pulse do orb e o counter animation são efeitos "ooh" — não são funcionais. Desative por completo em reduced motion.

### 6.4 Semântica de cores

**Nunca use só cor para transmitir status.** Se "success" é lime e "error" é red, acompanhe sempre com ícone (check vs x) e label textual.

---

## 7. Implementação técnica

### 7.1 Arquivo de tokens (TypeScript)

Dado seu design token system existente, recomendo estrutura em módulos:

```
src/design-tokens/
├── primitives/
│   ├── colors.ts        // hex values only, no semantics
│   ├── space.ts
│   ├── typography.ts
│   ├── radius.ts
│   └── motion.ts
├── semantic/
│   ├── surface.ts       // bg.canvas, surface.1, etc.
│   ├── text.ts
│   ├── action.ts        // button colors, link colors
│   ├── status.ts
│   └── data-viz.ts      // chart colors
├── components/
│   ├── card.ts
│   ├── button.ts
│   └── ... (per-component tokens)
└── index.ts
```

Cada semantic token consome primitives:

```ts
// semantic/surface.ts
import { colors } from "../primitives/colors";

export const surface = {
  canvas: colors.black,
  elevated: colors.neutral[950],
  1: colors.neutral[900],
  2: colors.neutral[850],
  3: colors.neutral[800],
} as const;
```

### 7.2 Tailwind v4 integration

Use `@theme` no CSS para expor os tokens:

```css
@theme {
  --color-bg-canvas: #000;
  --color-surface-1: #111;
  --color-surface-2: #161616;

  --color-brand-lime: #c5f547;
  --color-brand-purple: #8b5cf6;

  --radius-lg: 20px;
  --radius-xl: 28px;

  --font-sans: "Geist", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, monospace;
}
```

### 7.3 Font loading

Use `next/font` (se Next.js) ou self-hosted para Geist:

```ts
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

// Expor como CSS variable
<html className={`${GeistSans.variable} ${GeistMono.variable}`}>
```

Package: `geist` (Vercel oficial, MIT).

### 7.4 Charts

- **Recharts** para donut, bar, line padrão — estilize com nossos tokens.
- **Visx** se precisar de algo mais custom (star particles animados em canvas, orbs WebGL).
- Não use Chart.js — DOM-heavy e menos flexível para a estética desejada.

### 7.5 Ícones

- `lucide-react` como set principal (line style, MIT, tree-shakeable).
- Para ícones de AI/domínio específico não cobertos por Lucide, criar componentes SVG próprios em `src/components/icons/ai/`.

### 7.6 Estrutura de componentes (sugestão)

```
src/components/
├── primitives/          // elementos atômicos
│   ├── Pill.tsx
│   ├── Button.tsx
│   ├── Card.tsx
│   └── IconButton.tsx
├── data-display/
│   ├── MetricCard.tsx
│   ├── FeaturedMetricCard.tsx
│   ├── AIInsightCard.tsx       // o card purple com orb + stars + hatched
│   ├── DonutChart.tsx
│   ├── StripedBar.tsx
│   ├── CitationCard.tsx
│   └── StreakCard.tsx
├── ai/
│   ├── Orb.tsx                 // com pulse + glow
│   ├── StarField.tsx
│   ├── ChatInput.tsx
│   ├── QuickActions.tsx
│   └── AgentTimeline.tsx
├── layout/
│   ├── TopNav.tsx
│   ├── SectionIntro.tsx
│   ├── FigmaBoundingBox.tsx    // decorator ornamental
│   └── PipelineSteps.tsx       // os cards zigzag
└── marketing/
    ├── HeroProductVision.tsx
    └── ProblemSolutionBlock.tsx
```

---

## 8. Checklist de entrega visual

Antes de considerar qualquer tela "pronta", valide:

- [ ] Background é `bg.canvas` (#000), não cinza escuro genérico
- [ ] Geist está carregada e aplicada (não há fallback visível)
- [ ] Existe ao menos **1 featured metric card lime** por tela principal
- [ ] AI panels têm orb OU glow purple OU star particles (ao menos 1 dos 3)
- [ ] Section headings seguem pattern "pill label → large heading com mix de weights"
- [ ] Pills usam `radius.pill`, nunca radius intermediário
- [ ] Ícones standalone estão dentro de containers circulares
- [ ] Delta chips (+X%) acompanham métricas temporais
- [ ] Spacing entre seções ≥ `space.20` (80px)
- [ ] Nenhuma borda pura branca ou cinza forte — sempre `border.subtle` ou `border.default`
- [ ] Focus outline visível em todos elementos interativos
- [ ] Reduced motion desliga animações não-essenciais

---

## 9. Referência rápida — mapping completo

| Tela Learning Sync            | Equivalente no Nexus AI                                       |
| ----------------------------- | ------------------------------------------------------------- |
| Dashboard overview            | Overview (Grounding, Hallucination, Cost, Latency, Eval pass) |
| Skill Development donut       | Data Sources breakdown (structured vs unstructured)           |
| AI Insight card               | Observability Panel                                           |
| Learning Plan timeline        | Agent Run Timeline                                            |
| Time spent in learning        | Compute time / Token consumption graph                        |
| Continue learning list        | Recent conversations / resumable sessions                     |
| Learning Path screen          | Agent Workflows catalog                                       |
| Current path progress donut   | Knowledge Base Coverage                                       |
| Recommended next topics       | Suggested queries / related documents                         |
| AI Mentor (chat)              | RAG Chat workspace                                            |
| Achievements list             | Eval suite passes / quality milestones                        |
| Streak "5 days without break" | Eval Pipeline Health Streak                                   |
| AI Ethics module card         | Guardrails policies management                                |
| Prompt Engineering module     | Prompt templates / structured outputs library                 |

---

## 10. Sequência de implementação recomendada

Se começando do zero:

1. **Tokens + Geist + dark theme base** (1 dia)
2. **Primitivos**: Pill, Button, Card, IconButton (1 dia)
3. **TopNav + layout shell dashboard** (0.5 dia)
4. **MetricCard + FeaturedMetricCard + DonutChart** (1 dia)
5. **AIInsightCard** (orb + stars + hatched bars) (1.5 dia — é o componente signature)
6. **ChatInput + QuickActions + Orb full** (1 dia)
7. **AgentTimeline + CitationCard** (1 dia)
8. **SectionIntro + FigmaBoundingBox + marketing blocks** (0.5 dia)
9. **Montagem de telas reais consumindo tudo** (≥ 2 dias)

Total estimado para paridade visual com o case: **~9 dias de frontend sênior**, assumindo stack React + Tailwind v4 + Recharts + Lucide.

## 11. Protótipo

Use o arquivo nexus-rag.html ".braddock/memory/nexus-rag.html" como fonte de verdade para todo o design da UI.
