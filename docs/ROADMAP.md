# ENTRE NÓS — ROADMAP

## Current Goal

Consolidar o Mr White como jogo fundação da plataforma e evoluir o produto de
"app de jogos de festa" para "plataforma premium de experiência social".

The objective is NOT to build many games quickly.

The objective is:

* estabilizar a arquitetura multiplayer
* reduzir débito técnico
* validar fundações multiplayer reutilizáveis
* evitar abstrações prematuras
* tornar futuros jogos baratos de implementar
* elevar a qualidade emocional do produto

---

## Product Direction

The platform is evolving from:
"app de Mr White"

into:
"plataforma premium de experiência social"

This means:

* o catálogo de jogos é a estrutura primária de navegação
* a identidade visual deve comunicar sofisticação social noturna
* a experiência emocional precede a infraestrutura técnica
* cada jogo é uma experiência social, não um modo de jogo

---

## Current Phase

**Consolidação Multiplayer + Elevação do Produto**

The project is currently focused on:

* multiplayer stability (Onda C)
* design system emotional alignment
* warm-dark visual direction
* anti-cyberpunk visual corrections
* reusable foundations
* incremental refactors
* deterministic game state
* realtime consistency

Avoid:

* creating many engines early
* creating many games early
* speculative abstractions
* overengineering

---

# Consolidation Waves

## Onda A — Concluída ✓

Goal:
remover duplicação óbvia e código morto com risco mínimo.

Completed:

* extracted duplicated normalizarEstadoPublico into shared module
* removed dead mocks
* consolidated normalization layer

Result:
* reduced duplicated multiplayer state logic
* improved foundation consistency

---

## Onda B — Concluída ✓

Goal:
clarificar ownership e responsabilidades multiplayer.

Completed:

* centralized player subscriptions in GameScreen
* centralized active session ownership
* centralized multiplayer presence ownership
* decoupled jogoLocal.ts from Mr White
* connected local gameplay to game registry

Result:

* explicit multiplayer ownership
* reduced realtime listener duplication
* clearer gameplay lifecycle
* improved future multi-game scalability

---

## Onda C — Em Progresso

Goal:
melhorar resiliência realtime e estabilidade de presença.

Tasks:

* reconnect handling
* presence synchronization
* inactive player handling
* multiplayer stability improvements

Requirements:

* lightweight implementation
* minimal abstractions
* mobile-first performance

---

## Onda D — Design Emocional (Próxima)

Goal:
alinhar a identidade visual à direção premium social noturna.

Tasks:

* migrar superfícies de azul-frio para sépia-quente
* substituir paleta primária roxo→pink por bordeaux/âmbar
* reduzir intensidade do glow (max 0.20 opacity)
* introduzir serif editorial (Playfair Display) em momentos de alto impacto
* revisar paleta de avatares para tons humanos e terrosos
* revisar room code display (tipográfico, não tiles com borda neon)

Requirements:

* incremental — não redesign completo
* preservar UX atual
* apenas refinamento emocional

---

## Future Waves (NOT NOW)

Intencionalmente adiado:

* generic PromptEngine
* generic RevealEngine
* generic ReactionEngine
* plugin systems
* advanced GameRegistry
* complex abstractions
* social graph
* user profiles

Rule:
only abstract after repeated validated patterns.

---

# Architectural Philosophy

The project should evolve through:

* small incremental refactors
* measured abstractions
* reusable foundations
* architecture guided by real pain

Never:

* refactor everything at once
* rebuild systems prematurely
* optimize imaginary problems
* build engines for future games that don't exist yet

---

# Success Criteria

The foundation is considered successful when:

* new games become cheap to implement
* multiplayer remains stable
* gameplay logic stays predictable
* architecture stays modular
* duplication decreases naturally
* no large rewrites are needed
* the product feels premium and emotionally coherent

---

# Future Game Priorities (NOT NOW)

When the foundation is stable:

1. Most Likely To — votação social, vulnerabilidade
2. Eu Nunca — revelação, caos social
3. Quem na Sala — tensão social de grupo

Each game validates a different social mechanic.
Each game reuses the same multiplayer foundation.
