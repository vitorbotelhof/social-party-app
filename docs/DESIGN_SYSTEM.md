# ENTRE NÓS — DESIGN SYSTEM

## Design Philosophy

The product should feel:

* premium
* social
* cinematic
* emotional
* intimate
* human
* noturno
* misterioso
* sofisticado

The app is NOT:

* gamer UI
* neon cyberpunk
* AI startup
* web3 dashboard
* childish UI
* meme UI
* hyper-casual UI
* generic startup UI

The visual language should communicate:
"algo interessante acontece quando pessoas se reúnem."

---

## Emotional References

The visual design draws from:

* poker — tensão, silêncio, olhares
* filme noir — luz baixa, sombra dramática
* bar de jazz sofisticado — madeira escura, âmbar, conversa íntima
* jantar entre amigos — calor, cumplicidade, caos social
* fotografia analógica — imperfeição quente, grão, profundidade
* vinho tinto — riqueza, temperatura, sofisticação

These references inform every decision:
color temperature, shadow quality, typography weight, glow intensity.

---

# Visual Identity

Core aesthetic:

* dark mode first
* warm dark surfaces (not cold blue-black)
* cinematic lighting
* soft editorial depth
* elegant spacing
* atmospheric warmth — not tech glow
* emotional minimalism

Visual references (product quality, not aesthetic):

* Spotify — catalog browsing feel
* Netflix — cinematic card hierarchy
* Apple Music — premium audio atmosphere

Do NOT reference aesthetically:

* Discord (cold blue-purple)
* Twitch (neon gamer)
* Linear (tech startup purple)
* Vercel (AI gradient)

---

# Color System

## Primary Backgrounds

The backgrounds must feel warm.
No cold blue or blue-purple tones on surfaces.

Deep black (sépia):
#0C0A09

Charcoal (aquecido):
#111009

Elevated surface (madeira escura):
#1A1614

Surface elevated (couro escuro):
#221E1B

Border (quente):
#2D2520

---

## Primary Accent

The accent palette moves away from tech purple toward wine and amber.

Bordeaux (primário):
#9B2335

Wine dark (pressionado):
#7A1B29

Amber (acento):
#B85C2A

Gold sépia (destaque):
#8B6914

---

## Legacy Purple (uso restrito)

The purple palette is preserved for compatibility but must not dominate.

Use purple only for:
* avatar gradients
* subtle decorative elements

Never use purple for:
* primary buttons
* CTA elements
* surface colors
* borders

---

## Text Colors

Primary text:
#F0EAE0

Secondary text:
#9E9087

Muted text:
#6B5F55

---

## Semantic Colors

Success:
#22C55E

Warning:
#F59E0B

Error:
#EF4444

---

# Typography

## Primary Style

* modern sans-serif for UI, body, labels
* elegant serif for high-impact emotional moments only

Sans-serif references:
* Inter
* Satoshi
* Plus Jakarta Sans

Serif references (para momentos de impacto):
* Playfair Display
* Bodoni Moda

---

## Typography Rules

* Avoid heavy bold everywhere
* Prefer visual hierarchy through spacing
* Large breathing room
* Short readable text blocks
* Strong contrast between headings and body

Serif usage (Playfair Display or equivalent):
* game names on cards
* revealed words during gameplay
* round titles
* dramatic reveal moments

Sans-serif usage:
* all UI labels
* body text
* buttons
* navigation

---

# Typography Scale

Hero: 48px / weight 800 / tracking -1
Title Large: 36px / weight 700
Title: 28px / weight 700 / tracking -0.5
Subtitle Large: 24px / weight 600
Subtitle: 20px / weight 600
Body Major: 17px / weight 400
Body: 16px / weight 400
Body Minor: 15px / weight 400
Caption: 13px / weight 700 / tracking 1.5
Micro: 12px / weight 400

---

# Spacing System

Use spacious layouts.

Spacing feeling:

* breathable
* elegant
* premium
* uncluttered

Prefer:

* large paddings
* generous margins
* visual calm

Avoid:

* cramped layouts
* dense UI
* excessive information

---

# Corner Radius

Use soft rounded corners.

Standard radius:

* cards: 20-24
* buttons: 16-20
* modals: 28-32

Avoid sharp corners.

---

# Depth System

Depth should feel soft and cinematic.
Think candlelight, not LED panel.

Use:

* subtle shadows with warm tint
* layered warm surfaces
* soft gradients (near-monochromatic)

Avoid:

* hard shadows
* aggressive neumorphism
* excessive blur
* cold blue shadows

---

# Glow System

Glow must be atmospheric, not tech.

Rules:

* max shadowOpacity: 0.20
* max shadowRadius: 10
* shadow color must match warm accent (bordeaux, amber)

Never:

* purple neon glow on buttons
* shadowOpacity above 0.25
* gamer-style luminous borders
* pulsing neon borders on room codes

Glow is used to create:

* intimidade atmosférica
* foco emocional
* presença quente

---

# Gradients

Gradients must feel near-monochromatic.
Not chromatic arcs.

Primary button gradient:
['#9B2335', '#7A1B29'] — bordeaux profundo

Accent gradient:
['#6B3A1F', '#B85C2A'] — âmbar carvão

Card overlay gradient:
['rgba(12,10,9,0)', 'rgba(12,10,9,0.6)', 'rgba(12,10,9,0.96)']

Avoid:

* purple → pink horizontal gradients
* multi-color arcs
* rainbow-style gradients
* tech startup gradient style

---

# Motion Language

Animations should feel:

* smooth
* soft
* cinematic
* organic

Animation priorities:

* fluid transitions
* emotional pacing
* responsive interactions
* polished microinteractions

Avoid:

* chaotic motion
* hyperactive UI
* exaggerated bounces
* excessive spring bounciness

Glow press states:
* scale: 0.97–0.98 only
* no layout shift on press

---

# Component Philosophy

Components should feel:

* tactile
* warm
* elegant
* lightweight

Prefer:

* clean cards with warm surfaces
* layered warm depth
* near-monochromatic gradients
* subtle warm transparency

Avoid:

* excessive borders
* cold-tinted surfaces
* visual clutter
* blue-purple surface tones

---

# Buttons

Buttons should:

* feel premium
* have strong hierarchy
* feel touch-friendly
* use warm depth

Primary buttons:

* bordeaux gradient
* warm subtle shadow (opacity max 0.20)
* large tap area

Avoid:

* tiny buttons
* flat boring CTAs
* hyper saturated purple buttons
* gamer glow on buttons

---

# Cards

Cards are the foundation of the UI.

Cards should:

* feel elevated with warm surfaces
* create focus
* separate emotional contexts
* provoke curiosity — not just categorize

Game cards specifically:
* must create emotional anticipation
* must insinuate social tension
* must make the player want to enter that experience
* not just display genre + player count

Use:

* warm dark surfaces (#1A1614, #221E1B)
* subtle warm gradients
* layered depth

---

# Modal Philosophy

Modals should feel:

* immersive
* cinematic
* focused

Use:

* warm blurred backgrounds
* centered content
* emotional emphasis

---

# Lobby and Multiplayer Feel

Multiplayer spaces should feel:

* alive
* social
* realtime
* emotionally charged

The room code must NOT feel like a game lobby HUD.
It should feel like a secret invitation.

Use:

* typography-first room codes (not tile grids with neon borders)
* warm subtle presence indicators
* soft activity animations

The room should feel like:
"pessoas se reunindo em torno de algo que vai acontecer."

---

# Emotional UI Priorities

Optimize visual experience for:

* antecipação
* tensão social
* revelação
* cumplicidade
* caos controlado

UI should amplify emotional pacing.
Every screen transition is a beat in the social drama.

---

# Avatar System

Avatar palette must feel human, not digital product.

Mix:

* warm wine tones
* earthy amber tones
* deep forest greens
* night blue
* warm terracotta

Avoid:

* 100% purple/lilac/pink palette
* crypto/NFT avatar feel
* all-same-family colors

---

# Accessibility Rules

* maintain readable contrast
* avoid tiny touch targets
* prioritize readability in dark mode
* support fast comprehension

---

# Consistency Rules

All screens must feel:

* cohesive
* premium
* cinematic
* emotionally connected

Never allow:

* random styles
* inconsistent spacing
* mixed aesthetics
* generic components
* cold surfaces mixed with warm surfaces

---

# Non-Negotiable Rules

Every screen must feel like:
"uma experiência social premium acontecendo à noite."

The app must NEVER feel like:
* a tech product
* a gaming dashboard
* an AI startup
* a web3 app
* a neon cyberpunk interface

The palette must NEVER include:
* cold blue-purple surfaces
* gamer neon accents
* purple-to-pink tech gradients as primary CTAs

---

# Navigation Feeling

The app should feel like:
- descobrindo experiências sociais
- escolhendo o que vai acontecer entre as pessoas
- entrando em uma noite

NOT:
- configuring multiplayer infrastructure
- selecting game modes
- entering a lobby

# Home Experience

The home screen should behave like:
- um catálogo emocional de experiências sociais
- uma vitrine cinematográfica
- uma antecipação do que vai acontecer

Games are the primary product entities.

# Game Cards

Game cards should communicate:
- tensão emocional
- energia social
- o que vai acontecer entre as pessoas
- atmosfera — não categoria

Cards should feel like movie posters, not app thumbnails.
They should provoke: "quero viver isso."
