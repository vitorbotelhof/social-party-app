# MR WHITE — FEATURE PACKET

## Game Identity

Mr White is a realtime social deduction game focused on:

* suspicion
* tension
* bluffing
* group discussion
* social reading
* hidden information

Core emotional loop:
“Someone does not belong here.”

The game should feel:

* tense
* cinematic
* social
* psychologically engaging
* emotionally reactive

Avoid:

* childish tone
* meme aesthetics
* noisy UI

---

# Core Gameplay

Most players receive the same secret word.

One player becomes:

* Mr White

Mr White does not know the word.

Players take turns giving clues related to the secret word.

The group must:

* identify suspicious players
* vote
* eliminate players
* discover Mr White

If Mr White gets eliminated:
they have one final chance to guess the secret word.

If they guess correctly:
they win.

---

# Core Emotional Dynamics

The gameplay should maximize:

* suspicion
* hesitation
* bluffing
* overthinking
* group accusations
* social pressure
* reveal tension

Key moments:

* clue delivery
* awkward pauses
* suspicious clues
* voting reveals
* final word guess

---

# Engines Used

Mr White consumes:

* RoomEngine
* PresenceEngine
* HiddenRoleEngine
* VotingEngine
* TimerEngine
* RevealEngine
* ReactionEngine

Mr White should NOT implement custom multiplayer infrastructure.

---

# Multiplayer Structure

Recommended players:

* 4 to 10

Room requirements:

* realtime synchronization
* reconnect-safe
* synchronized turns
* synchronized voting

Host responsibilities:

* start game
* restart game
* select word pack

---

# Game Lifecycle

## 1. Lobby Phase

Players join room.

Players can:

* change nickname
* ready/unready
* react
* chat lightly

Host starts match.

---

## 2. Initialization Phase

System:

* selects secret word
* distributes hidden roles
* assigns Mr White
* synchronizes game state

Players privately receive:

* word
  OR
* Mr White role

---

## 3. Clue Phase

Players take turns giving clues.

Rules:

* clues must relate to the word
* clues cannot directly reveal the word
* one clue per turn
* all players participate

System requirements:

* synchronized turns
* timer support
* player highlighting
* speaking order visualization

---

## 4. Discussion Phase

Open group discussion.

Players debate:

* suspicious clues
* strange behavior
* hesitation
* inconsistencies

This phase should feel socially alive.

Support:

* reactions
* lightweight interactions
* player emphasis

---

## 5. Voting Phase

Players vote simultaneously.

Voting types:

* anonymous
* synchronized reveal

Requirements:

* prevent double voting
* handle disconnected players
* show voting progress

Reveal should feel cinematic.

---

## 6. Elimination Phase

Eliminated player is revealed.

Possible outcomes:

* innocent player eliminated
* Mr White eliminated

Use:

* suspense pacing
* reveal animations
* emotional timing

---

## 7. Final Guess Phase

If Mr White is eliminated:
they can attempt to guess the word.

This is a high tension cinematic moment.

UI priorities:

* isolation
* suspense
* dramatic pacing

Possible outcomes:

* correct guess → Mr White wins
* incorrect guess → group wins

---

## 8. Results Phase

Show:

* winner
* secret word
* player roles
* reactions

Allow:

* rematch
* game switch
* replay

---

# Game Phases

Phase order:

1. lobby
2. initialization
3. clue
4. discussion
5. voting
6. elimination
7. final_guess
8. results

Each phase should:

* have explicit state
* support timers
* support realtime sync
* support reconnect safety

---

# Turn System

The clue phase is turn-based.

Requirements:

* deterministic turn order
* active player highlighting
* synchronized timers
* reconnect-safe turns

Players cannot skip silently.

---

# Voting Rules

Voting must support:

* simultaneous submission
* locked vote after confirmation
* realtime progress tracking
* synchronized reveal

Avoid:

* sequential voting
* ambiguous results

---

# Reveal Philosophy

Reveals are emotionally important.

Reveals should feel:

* cinematic
* suspenseful
* emotionally paced

Use:

* delays
* animations
* focus states
* glow emphasis

Avoid:

* instant abrupt reveals

---

# UI Philosophy

The game should feel:

* dark
* intimate
* tense
* premium
* socially alive

Important UI moments:

* player cards
* speaking turns
* suspicion emphasis
* vote reveals
* final guess screen

Avoid:

* cluttered UI
* childish deduction visuals
* aggressive gamer visuals

---

# Prompt / Word System

Words should support:

* categories
* difficulty
* localization
* safe/spicy modes

Examples:

* food
* movies
* internet culture
* relationships
* professions

---

# Edge Cases

Must handle:

* player disconnect during vote
* reconnect during turn
* host disconnect
* empty votes
* tie votes
* inactive players

---

# Scalability

Mr White should act as:

* foundation for future deduction games
* reusable hidden-role template
* voting architecture validation

Future games using same systems:

* Spyfall
* Mafia
* Werewolf
* Hidden Killer

---

# Non-Negotiable Rule

The experience should always feel:

* socially tense
* emotionally reactive
* premium
* cinematic
* multiplayer-first
