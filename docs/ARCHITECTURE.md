# ENTRE NÓS — ARCHITECTURE

## Core Philosophy

The platform is built as a modular social multiplayer engine.

Games evolve gradually from lightweight implementations into reusable multiplayer primitives.

Avoid premature abstractions.
Only consolidate systems after repeated validated patterns.

Architecture priorities:

* social experience first
* multiplayer-first
* realtime-first
* reusable abstractions
* modular systems
* low coupling
* scalability
* mobile performance

---

# High Level Architecture

The app is divided into 3 layers:

1. Core Engines
2. Features / Games
3. UI Layer

---

# 1. Core Engines

Reusable multiplayer/social systems shared by all games.

Location:

* /engines

Core engines:

* RoomEngine
* VotingEngine
* TimerEngine
* PresenceEngine

Rules:

* engines must be UI-agnostic
* engines must not contain game-specific logic
* engines must be reusable across multiple games

---

# Current Foundation Systems

The platform is currently consolidating (Onda B completed):

* room lifecycle
* multiplayer state ownership
* player presence
* deterministic phases
* realtime synchronization
* game registry
* lightweight game orchestration

The platform intentionally avoids premature engine abstraction.

NOT abstracted yet (intentionally):

* PromptEngine
* RevealEngine
* ReactionEngine

These will only be extracted after repeated validated usage.

---

# 2. Features / Games

Each game is implemented as a lightweight feature layer.

Location:

* /features/[game-name]

Each game should only contain:

* rules
* flows
* prompts
* game-specific UI
* game configuration

Games should consume engines instead of rebuilding systems.

Example:
Mr White uses:

* RoomEngine
* VotingEngine
* HiddenRoleEngine
* TimerEngine

---

# 3. UI Layer

Responsible only for rendering and interaction.

Location:

* /components
* /screens
* /ui

UI should never contain:

* multiplayer logic
* realtime logic
* game state management
* business rules

The UI layer is the emotional layer.
Its job is to translate game state into feeling.

---

# Folder Structure

/app
/components
/ui
/features
/engines
/services
/hooks
/types
/assets
/docs

---

# Realtime Architecture

Architecture is realtime-first.

Core principles:

* server-authoritative game state
* lightweight payloads
* predictable synchronization
* reconnect-safe
* multiplayer-safe state transitions

Realtime responsibilities:

* room sync
* player presence
* voting synchronization
* turn synchronization
* timer synchronization
* reactions
* reveals

---

# Realtime Philosophy

Realtime systems should evolve incrementally.

Avoid:

* speculative abstractions
* enterprise-style engine systems
* generalized multiplayer frameworks too early

Prefer:

* incremental consolidation
* measured refactors
* architecture guided by real pain

---

# Multiplayer Ownership Philosophy

Ownership must remain explicit.

Current ownership:

GameScreen owns:

* active multiplayer session
* player presence
* gameplay subscriptions
* realtime listeners

Sub-screens should:

* receive props
* remain transport-agnostic
* avoid direct realtime subscriptions

Avoid duplicated realtime listeners.

---

# State Management

Separate:

* local UI state
* multiplayer state
* persistent state

Rules:

* avoid global state overuse
* isolate realtime state
* keep game state predictable
* prefer explicit state transitions

---

# Game Architecture

Games should follow this structure:

/features/[game-name]

* config
* rules
* prompts
* hooks
* components
* phases
* screens

Avoid:

* duplicated multiplayer logic
* duplicated voting logic
* duplicated timer logic

---

# Navigation Architecture

Navigation should be:

* lightweight
* predictable
* multiplayer-aware
* emotion-first

Main flows:

* home (game catalog)
* game detail
* social dynamic selection
* session configuration
* lobby
* game
* results

Navigation follows social intent:

Game Selection
↓
Social Dynamic Selection
↓
Session Configuration
↓
Gameplay

The app must not expose multiplayer infrastructure early in the flow.

---

# Services Layer

Location:

* /services

Responsibilities:

* API communication
* realtime providers
* persistence
* analytics
* auth
* storage

Never place business logic inside services.

---

# Hooks Layer

Location:

* /hooks

Hooks should:

* encapsulate reusable logic
* simplify UI components
* isolate state orchestration

Avoid:

* giant hooks
* business-heavy hooks
* tightly coupled hooks

---

# Types Layer

Location:

* /types

Centralized shared types:

* Player
* Room
* GameSession
* Vote
* Prompt
* Timer
* Reveal
* GamePhase

Avoid duplicated type definitions.

---

# Scalability Philosophy

Always build:

* reusable systems
* multiplayer primitives
* scalable abstractions

Never build:

* isolated game implementations
* tightly coupled flows
* temporary hacks that break scalability
* engines for games that don't exist yet

Platform-first always.
Emotion-first always.
