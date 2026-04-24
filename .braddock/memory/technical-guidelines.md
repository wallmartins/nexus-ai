# Technical Guidelines

O sistema deve seguir uma arquitetura **AI-native**, com foco em **portfólio e demonstração técnica**, priorizando simplicidade, baixo custo e clareza arquitetural, sem abrir mão de boas práticas de engenharia.

---

## Estratégia de Linguagem

Todo o sistema deve ser desenvolvido em **TypeScript**:

- **Backend:** Node.js com NestJS
- **Frontend:** React / Next.js

O objetivo é manter consistência entre camadas e facilitar desenvolvimento e manutenção.

---

## Arquitetura

Adotar uma abordagem de **monólito modular orientado a IA**, com separação clara entre:

- API / Orchestration Layer
- AI Core (LLM, RAG, Agents, Memory)
- Data Layer
- Observability & Evaluation

A arquitetura deve ser **model-agnostic**, permitindo troca de provedores de LLM sem impacto nas demais camadas.

---

## Estratégia de Desenvolvimento (Local-First)

O sistema deve ser desenvolvido prioritariamente em ambiente local, utilizando:

- Backend local (Node.js)
- PostgreSQL local com pgvector
- Redis local (cache + filas)
- LLM local via Ollama

Objetivos:

- custo zero durante desenvolvimento
- alta velocidade de iteração
- controle total do ambiente

---

## Estratégia de LLM (Abordagem Híbrida)

- **Desenvolvimento:** utilizar modelos locais via Ollama
- **Validação e demonstração:** utilizar APIs externas (OpenAI, Anthropic ou equivalente)

O sistema deve implementar uma abstração (ex: `LLMProvider`) para:

- alternar entre modelos locais e cloud
- comparar resultados
- evitar lock-in

---

## RAG e Retrieval

Implementar pipeline completo de RAG com:

- ingestão de dados
- parsing e limpeza
- chunking estratégico (configurável)
- geração de embeddings
- armazenamento vetorial
- retrieval otimizado (top-k, MMR, etc.)

Tecnologia recomendada:

- PostgreSQL com pgvector (local-first)

A arquitetura deve permitir experimentação com diferentes estratégias.

---

## Agentes e Orquestração

Utilizar:

- LangGraph (preferencial)
- ou LangChain (uso controlado)

Responsabilidades dos agentes:

- decidir entre resposta direta ou uso de RAG
- executar fluxos multi-step
- integrar ferramentas (tool calling)

Evitar dependência excessiva de frameworks — lógica central deve ser controlada pela aplicação.

---

## Memória e Estado

Implementar:

- memória de sessão (curto prazo)
- persistência de contexto (quando necessário)

Tecnologias:

- Redis (sessão + cache)
- PostgreSQL (persistência)

---

## Observabilidade

Implementar logging estruturado contendo:

- prompts
- respostas
- latência
- uso de tokens
- erros/falhas

Objetivo:

- debugging
- entendimento do comportamento do sistema
- demonstração técnica (portfólio)

---

## Avaliação (Evaluation)

Implementar pipeline simples de avaliação com:

- dataset pequeno (20–50 perguntas)
- execução sob demanda (não contínua)
- comparação entre modelos (local vs API)

Métricas:

- relevância
- consistência
- grounding

---

## Filas e Processamento Assíncrono

Utilizar **Redis + BullMQ** para tarefas assíncronas:

- ingestão de documentos
- geração de embeddings
- execução de eval

Boas práticas:

- separar filas por responsabilidade
- configurar retry e backoff
- limitar concorrência

---

## Cache

Utilizar **Redis** para:

- cache de respostas
- session memory
- redução de custo com LLM

Organizar namespaces:

- `cache:*`
- `queue:*`
- `session:*`

---

## Deploy (Portfólio)

Priorizar deploy simples:

- Frontend: Vercel
- Backend: Render ou Railway

Banco de dados e Redis podem ser:

- locais durante desenvolvimento
- ou free-tier em cloud, se necessário

Evitar uso inicial de infraestrutura complexa (AWS, Kubernetes, etc.).

---

## Princípios Arquiteturais

- Simplicidade primeiro, escalabilidade depois
- Model-agnostic (LLMs intercambiáveis)
- Separação clara de responsabilidades
- Prompt como asset versionado
- Observability e evaluation desde o início
- Foco em demonstrar decisões técnicas e trade-offs
