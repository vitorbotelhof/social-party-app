# ENTRE NÓS — DEVELOPMENT RULES

## Product Rules

* Mobile-first always
* Multiplayer-first always
* Reusable systems only
* Platform-first mindset
* Optimize for replayability
* Optimize for social interaction density
* Optimize for low onboarding friction
* Prioritize real-world interaction over complex mechanics

---

## UI Rules

* Dark mode first
* Premium UI only
* Cinematic aesthetic
* Minimalist interfaces
* Rounded corners
* Soft glow only
* Elegant spacing
* Smooth animations
* No visual clutter

Avoid:

* gamer aesthetics
* childish visuals
* meme UI
* cartoon visuals
* aggressive neon
* generic startup UI

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

## Multiplayer Rules

* Realtime-first architecture
* Handle reconnects gracefully
* Multiplayer-safe state management
* Avoid client desync
* Room persistence should be lightweight
* Build reusable multiplayer primitives

---

## AI Coding Rules

* Never implement isolated game logic if reusable abstractions are possible
* Never tightly couple systems
* Never overengineer early
* Never create large monolithic files
* Prefer small scoped tasks
* Prefer iterative implementation
* Always think in reusable engines
* Always optimize for scalability

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

The product must always feel:

* premium
* social
* modern
* emotional
* cinematic
* human

# Anti-Overengineering Rules

Never:
- create engines before repeated validated patterns
- abstract emotional systems too early
- create enterprise-style multiplayer systems prematurely
- generalize speculative use cases

Prefer:
- incremental refactors
- explicit ownership
- lightweight abstractions
- architecture guided by real pain

# Multiplayer Ownership Rules

Gameplay screens should own:
- multiplayer subscriptions
- presence lifecycle
- active sessions

Child screens should:
- avoid direct realtime listeners
- receive synchronized state via props

# Product Navigation Rules

The user should always:
1. choose a game first
2. choose social dynamics second
3. configure the session third

Never expose multiplayer infrastructure before game selection.