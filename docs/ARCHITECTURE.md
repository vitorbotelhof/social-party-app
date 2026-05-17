# ENTRE NÓS — ARCHITECTURE

## Core Philosophy

The platform is built as a modular multiplayer social engine.

Games are lightweight layers built on top of reusable realtime systems.

Architecture priorities:

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
2. Features/Games
3. UI Layer

---

# 1. Core Engines

Reusable multiplayer/social systems shared by all games.

Location:

* /engines

Core engines:

* RoomEngine
* VotingEngine
* PromptEngine
* HiddenRoleEngine
* TimerEngine
* RevealEngine
* ReactionEngine
* PresenceEngine

Rules:

* engines must be UI-agnostic
* engines must not contain game-specific logic
* engines must be reusable across multiple games

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

---

# Folder Structure

/app
/components
/ui
/screens
/features
/engines
/services
/hooks
/types
/constants
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

# Multiplayer Flow

Base multiplayer flow:

1. Create room
2. Join room
3. Sync players
4. Select game
5. Initialize game state
6. Run game phases
7. Synchronize realtime events
8. Reveal results
9. Restart or switch game

This flow must be reusable across all games.

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

# Navigation Architecture

Navigation should be:

* lightweight
* predictable
* multiplayer-aware

Main flows:

* onboarding
* home
* lobby
* room
* game
* results

---

# Prompt Architecture

Prompts are content infrastructure.

Prompts should support:

* categories
* difficulty
* spicy level
* localization
* tags
* moderation
* packs

Prompt system must be reusable across games.

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

Platform-first always.
