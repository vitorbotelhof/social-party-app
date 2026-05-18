# ENTRE NÓS — DEVELOPMENT RULES

## Product Rules

* Mobile-first always
* Multiplayer-first always
* Emotion-first always
* Reusable systems only
* Platform-first mindset
* Optimize for replayability
* Optimize for social interaction density
* Optimize for low onboarding friction
* Prioritize real-world interaction over complex mechanics

---

## UI Rules

* Dark mode first — warm dark, not cold dark
* Premium UI only
* Cinematic aesthetic
* Emotional minimalism
* Rounded corners
* Warm atmospheric glow only (max opacity 0.20)
* Elegant spacing
* Smooth animations
* No visual clutter

Avoid:

* cold blue-purple surfaces (#1C1C2E style)
* gamer aesthetics
* cyberpunk neon
* AI startup color palettes (purple→pink gradients)
* childish visuals
* meme UI
* cartoon visuals
* aggressive neon
* generic startup UI
* tech dashboard feel

---

## Anti-Cyberpunk Rules

The app must NEVER feel like a tech product.

Never use:

* purple (#8B5CF6) as the primary brand color
* purple-to-pink horizontal gradients on CTAs
* cold blue-purple (#1C1C2E, #252538) on surfaces
* shadowOpacity above 0.22 on any glow effect
* pulsing neon borders (room codes, active states)
* 100% purple/lilac avatar palette

Always prefer:

* warm sépia dark backgrounds
* bordeaux / wine / amber accents
* near-monochromatic gradients
* warm tinted shadows
* editorial serif for high-impact moments

---

## Design Emotion Rules

Every visual decision must serve the emotional product.

Primary emotional references:

* poker — silêncio, tensão, blefe
* filme noir — luz baixa, sombra dramática
* bar sofisticado — madeira, âmbar, conversa
* fotografia analógica — calor, imperfeição, profundidade

Design checks:

* Does this color feel warm or cold?
* Does this gradient feel like a jazz bar or an AI startup?
* Does this glow feel atmospheric or gamer?
* Does this card make me want to enter that experience?

---

## UX Rules

* Minimize clicks
* Fast room creation
* Fast game start
* Instant understanding
* Fast first laugh
* Reduce friction everywhere
* Prioritize emotional pacing
* Keep interactions intuitive

UX hierarchy: emoção → intenção social → logística

Never expose multiplayer infrastructure before game selection.

---

## Engineering Rules

* TypeScript strict mode
* Modular architecture
* Reusable abstractions only
* Avoid duplicated logic
* Separate UI from game logic
* Separate engines from features
* Keep components small
* Prefer composition over complexity
* Prefer scalable systems over shortcuts

---

## Anti-Overengineering Rules

Never:

* create engines before repeated validated patterns
* abstract systems too early
* create enterprise-style multiplayer systems prematurely
* generalize speculative use cases
* build engines for games that don't exist yet

Prefer:

* incremental refactors
* explicit ownership
* lightweight abstractions
* architecture guided by real pain

---

## Multiplayer Rules

* Realtime-first architecture
* Handle reconnects gracefully
* Multiplayer-safe state management
* Avoid client desync
* Room persistence should be lightweight
* Build reusable multiplayer primitives

---

## Multiplayer Ownership Rules

Gameplay screens should own:

* multiplayer subscriptions
* presence lifecycle
* active sessions

Child screens should:

* avoid direct realtime listeners
* receive synchronized state via props
* remain transport-agnostic when possible

Avoid duplicated realtime listeners at any level.

---

## Product Navigation Rules

The user should always:

1. escolher um jogo primeiro
2. escolher a dinâmica social segundo
3. configurar a sessão terceiro

Never expose multiplayer infrastructure before game selection.

---

## AI Coding Rules

* Never implement isolated game logic if reusable abstractions are possible
* Never tightly couple systems
* Never overengineer early
* Never create large monolithic files
* Prefer small scoped tasks
* Prefer iterative implementation
* Always think in reusable engines — but only after validated need
* Always think emotion-first, infrastructure-second
* Never apply cold color palettes without checking emotional direction

---

## Code Organization Rules

Use this structure:

* /app
* /components
* /features
* /services
* /engines
* /hooks
* /types
* /docs

Games must live inside:

* /features/[game-name]

Reusable systems must live outside feature folders.

---

## Performance Rules

* Optimize renders
* Avoid unnecessary rerenders
* Keep realtime payloads small
* Avoid heavy animations during gameplay
* Optimize for mobile performance first

---

## Non-Negotiable Rule

This is NOT a casual party game app.
This is NOT a tech product.
This is NOT a gaming dashboard.

The product must always feel:

* premium
* social
* emotional
* cinematic
* human
* íntimo
* noturno
* sofisticado
