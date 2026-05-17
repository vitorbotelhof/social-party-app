# ENTRE NÓS — ROADMAP

## Current Goal

Transform Mr White into the foundation game for the platform.

The objective is NOT to build many games quickly.

The objective is:

* stabilize multiplayer architecture
* reduce technical debt
* validate reusable multiplayer foundations
* avoid premature abstractions
* make future games cheap to implement

---

# Current Phase

Foundation Multiplayer Consolidation

The project is currently focused on:

* multiplayer stability
* architectural boundaries
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

## Onda A — Safe Consolidation

Goal:
remove obvious duplication and dead code with minimal risk.

Tasks:

* extract duplicated normalizarEstadoPublico into shared module
* remove dead mocks
* preserve identical behavior
* avoid architecture changes
* avoid UX changes

Requirements:

* app must continue working fully
* Mr White must continue playable
* minimal code changes
* minimal risk

---

## Onda B — Multiplayer Boundaries

Goal:
clarify multiplayer ownership and responsibilities.

Tasks:

* isolate multiplayer state ownership
* reduce coupling between game logic and transport
* improve room lifecycle clarity
* improve deterministic phases

Requirements:

* avoid new engines
* avoid overengineering
* preserve current gameplay

---

## Onda C — Presence and Reconnect Stability

Goal:
improve realtime resilience.

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

## Future Waves (NOT NOW)

These are intentionally postponed:

* generic PromptEngine
* generic RevealEngine
* generic ReactionEngine
* plugin systems
* advanced GameRegistry
* complex abstractions

Rule:
only abstract after repeated validated patterns.

---

# Current Architectural Philosophy

The project should evolve through:

* small incremental refactors
* measured abstractions
* reusable foundations
* architecture guided by real pain

Never:

* refactor everything at once
* rebuild systems prematurely
* optimize imaginary problems

---

# Success Criteria

The foundation is considered successful when:

* new games become cheap to implement
* multiplayer remains stable
* gameplay logic stays predictable
* architecture stays modular
* duplication decreases naturally
* no large rewrites are needed
