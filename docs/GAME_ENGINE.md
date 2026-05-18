# ENTRE NÓS — GAME ENGINE

## Core Philosophy

Games are lightweight orchestration layers built on top of reusable social multiplayer engines.

The platform should behave as a modular social interaction engine, not as isolated games.

Core priorities:

* multiplayer-first
* realtime-first
* reusable primitives
* predictable game flow
* low coupling
* scalable orchestration

---

# Core Engine Structure

Location:

* /engines

Each engine must:

* be reusable
* be UI-agnostic
* support realtime synchronization
* support multiplayer scenarios
* avoid game-specific logic

---

# Core Engines

## RoomEngine

Responsibilities:

* room lifecycle
* player join/leave
* room state
* room permissions
* host management
* reconnect handling

Must support:

* lightweight rooms
* realtime presence
* game switching
* persistent room session

---

## PresenceEngine

Responsibilities:

* online status
* player readiness
* connection state
* activity heartbeat

Must support:

* reconnect-safe presence
* multiplayer synchronization
* lightweight updates

---

## VotingEngine

Responsibilities:

* anonymous voting
* public voting
* simultaneous voting
* vote tallying
* vote reveals

Must support:

* multiple vote types
* configurable rules
* reusable voting flows

Used by:

* Mr White
* Most Likely To
* Quem na Sala
* Mafia-style games


---

## HiddenRoleEngine

Responsibilities:

* secret role distribution
* private role visibility
* hidden information management
* role validation

Must support:

* asymmetric information
* private state
* reveal logic

Used by:

* Mr White
* Spyfall
* Mafia
* Werewolf

---

## TimerEngine

Responsibilities:

* synchronized timers
* countdowns
* turn timers
* phase timers

Must support:

* realtime synchronization
* pause/resume
* reconnect-safe timers


---

# Game Lifecycle

All games should follow a predictable lifecycle.

Base lifecycle:

1. Lobby
2. Game Initialization
3. Role/Prompt Distribution
4. Active Phases
5. Voting/Reactions
6. Reveal Phase
7. Results
8. Restart or Game Switch

This lifecycle should remain reusable across games.

---

# Game Phases

Games are phase-driven.

Each phase should:

* have explicit state
* have entry/exit conditions
* support realtime synchronization
* support timer orchestration

Examples:

* discussion
* voting
* reveal
* prompt
* action
* elimination

---

# Shared Multiplayer Primitives

Core reusable primitives:

* Player
* Room
* GameSession
* GamePhase
* Vote
* Prompt
* Reaction
* Reveal
* Timer

All games should compose these primitives instead of redefining them.

---

# State Management Philosophy

Separate:

* engine state
* feature state
* UI state

Rules:

* engines own multiplayer state
* UI reacts to engine state
* avoid duplicated state
* avoid implicit state transitions

---

# Realtime Philosophy

Realtime synchronization is core infrastructure.

Priorities:

* deterministic state
* predictable synchronization
* lightweight payloads
* reconnect safety
* multiplayer consistency

Avoid:

* client-authoritative state
* hidden implicit transitions
* unsynchronized animations

---

# Extensibility Philosophy

New games should primarily require:

* configuration
* prompts
* flows
* phase orchestration

NOT:

* rebuilding multiplayer systems
* rebuilding voting
* rebuilding prompts
* rebuilding timers

---

# Engine Boundaries

Engines must NOT:

* render UI
* contain styling
* depend on screens
* depend on specific games

Games must NOT:

* implement multiplayer primitives
* duplicate voting systems
* duplicate timers
* duplicate presence logic

---

# Long-Term Vision

The platform should evolve into:

* a reusable social multiplayer framework
* a scalable party game platform
* a realtime social interaction engine

Platform-first always.

--- 

# Current Foundation Philosophy

The project is currently validating multiplayer foundations through Mr White.

The goal is not maximum abstraction.

The goal is:
- stable multiplayer ownership
- reconnect-safe lifecycle
- predictable realtime synchronization
- reusable multiplayer boundaries

Only abstract systems after repeated validated usage.

---

# Current Validated Foundations

The following systems are currently validated:

- game registry
- multiplayer ownership boundaries
- centralized gameplay subscriptions
- gameplay presence ownership
- deterministic session ownership

The following systems are intentionally NOT abstracted yet:

- prompts
- reveals
- reactions
- advanced voting flows

---

# Ownership Rules

Gameplay screens own:
- realtime subscriptions
- active session lifecycle
- multiplayer presence

Sub-screens should:
- remain stateless when possible
- receive synchronized state via props
- avoid transport coupling