---
name: nirengi
description: Pafta, a survey map you draw yourself. One next step on the surface, the whole reasoning one tap below.
colors:
  ground: "#ffffff"
  ground-2: "#f7f7fa"
  ground-3: "#efeff5"
  ink: "#252338"
  ink-2: "#4b4a5c"
  ink-3: "#6a697e"
  ink-4: "#9695aa"
  seam: "#e5e5ed"
  seam-2: "#d0cfde"
  indigo: "#6451e7"
  indigo-lip: "#4a39c4"
  indigo-tint: "#eeebff"
  orange: "#f99400"
  orange-lip: "#d67800"
  orange-tint: "#fff2de"
  orange-ink: "#b85c00"
  cyan: "#00b4d8"
  cyan-lip: "#008cac"
  cyan-tint: "#def6fb"
  purple: "#9b04da"
  purple-lip: "#7600a8"
  purple-tint: "#f6e6fd"
  gold: "#ffc400"
  gold-lip: "#e0a000"
  gold-tint: "#fff6d6"
  gold-ink: "#a06a00"
  green: "#34c26b"
  green-lip: "#249c52"
  green-tint: "#e1f8ea"
  red: "#ff4b4b"
  red-lip: "#d63434"
  red-tint: "#ffe7e7"
  tier-zemin: "#c48448"
  tier-tepe: "#34c26b"
  tier-sirt: "#00b4d8"
  tier-doruk: "#9b04da"
  tier-zirve: "#6451e7"
typography:
  display:
    fontFamily: "Bricolage Grotesque Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(36px, 5.4vw, 64px)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Bricolage Grotesque Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Bricolage Grotesque Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "21px"
    fontWeight: 750
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  lead:
    fontFamily: "Bricolage Grotesque Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 450
    lineHeight: 1.625
  body:
    fontFamily: "Bricolage Grotesque Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 450
    lineHeight: 1.55
  caption:
    fontFamily: "Bricolage Grotesque Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 650
  label:
    fontFamily: "Bricolage Grotesque Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 700
  key:
    fontFamily: "Bricolage Grotesque Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    letterSpacing: "-0.005em"
  mono:
    fontFamily: "JetBrains Mono Variable, ui-monospace, Cascadia Mono, monospace"
    fontSize: "14px"
    fontWeight: 500
    fontFeature: "\"tnum\" 1"
rounded:
  tag: "8px"
  key-sm: "10px"
  key: "12px"
  field: "14px"
  panel: "16px"
  card: "18px"
  feature: "20px"
  sheet: "24px"
  pill: "9999px"
spacing:
  page-x-phone: "16px"
  page-x-tablet: "24px"
  page-x-desktop: "40px"
  card-pad: "20px"
  card-pad-tight: "16px"
  sidebar: "256px"
  rail: "340px"
  column-genc: "600px"
  shell-narrow: "1080px"
  shell-wide: "1240px"
  public-wrap: "1120px"
components:
  button-primary:
    backgroundColor: "{colors.indigo}"
    textColor: "{colors.ground}"
    typography: "{typography.key}"
    rounded: "{rounded.key}"
    padding: "0 20px"
    height: "48px"
  button-primary-sm:
    backgroundColor: "{colors.indigo}"
    textColor: "{colors.ground}"
    rounded: "{rounded.key-sm}"
    padding: "0 14px"
    height: "38px"
  button-primary-lg:
    backgroundColor: "{colors.indigo}"
    textColor: "{colors.ground}"
    rounded: "{rounded.key}"
    padding: "0 28px"
    height: "54px"
  button-line:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.indigo}"
    typography: "{typography.key}"
    rounded: "{rounded.key}"
    padding: "0 20px"
    height: "48px"
  button-line-hover:
    backgroundColor: "{colors.ground-2}"
  button-quiet:
    textColor: "{colors.indigo}"
    rounded: "{rounded.key}"
    padding: "0 20px"
  button-disabled:
    backgroundColor: "{colors.ground-3}"
    textColor: "{colors.ink-4}"
  card:
    backgroundColor: "{colors.ground}"
    rounded: "{rounded.card}"
    padding: "20px"
  card-press-hover:
    backgroundColor: "{colors.ground-2}"
  field:
    backgroundColor: "{colors.ground-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "12px 16px"
  field-focus:
    backgroundColor: "{colors.ground}"
  chip:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  pill-verified:
    backgroundColor: "{colors.cyan-tint}"
    textColor: "{colors.cyan-lip}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  pill-institution:
    backgroundColor: "{colors.indigo-tint}"
    textColor: "{colors.indigo}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  pill-declared:
    backgroundColor: "{colors.ground-3}"
    textColor: "{colors.ink-3}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  nav-item:
    textColor: "{colors.ink-3}"
    rounded: "{rounded.key}"
    padding: "8px 12px"
  nav-item-active:
    textColor: "{colors.indigo}"
    rounded: "{rounded.key}"
    padding: "8px 12px"
  segmented-active:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.indigo}"
    rounded: "{rounded.key-sm}"
    padding: "6px 14px"
  next-step-card:
    backgroundColor: "{colors.indigo}"
    textColor: "{colors.ground}"
    rounded: "{rounded.feature}"
    padding: "20px"
  niri-bubble:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.card}"
    padding: "12px 16px"
  sheet:
    backgroundColor: "{colors.ground}"
    rounded: "{rounded.sheet}"
    padding: "24px"
---

# Design System: nirengi

<!-- Source of truth: src/styles/global.css. Tokens are RGB channels (light on
     :root, dark on [data-theme="dark"]) mapped to Tailwind colours in
     @theme inline. Hex values above are the light theme; dark values are in
     .impeccable/design.json → extensions.colorMeta.*.dark.
     Round 2 ("Pafta", 2026-10-08) replaced the round-1 "Pressable Road". -->

## Overview

**Creative North Star: "Pafta"**

A pafta is a survey map sheet. Nirengi means triangulation point: every verified piece of work is one more point on your map, and leagues are elevations from Zemin to Zirve. The world is a white ground cut by 2px seams, drawn with survey geometry: rounded triangle markers instead of circles and coins, faint contour lines on hero panels, a dashed trail that inks itself up to where you stand, ripple rings instead of bounces. Type is Bricolage Grotesque in sentence case. Keys sit on a 3px lip of their own hue and sink onto it when pressed. Every hue owns one concept.

The mechanics are a lesson app's (weekly goal, streak, league, quests, feedback bar, celebration). The geometry, type, icons, motion and structure are ours. Depth stays one tap below: reasoning, formulas and thresholds live behind "Neden?" in a sheet. Niri, the triangle surveyor, guides, reacts and celebrates, at most once per screen. The genç face (phone-first) gets the game layer; the kurum face (desk-first) keeps keys, cards, sheets, feedback and Niri as assistant, and drops XP, league and streak.

**Why Pafta.** Round 1 read as a Duolingo copy (rounded heavy type, uppercase chunky keys, a circle lesson path, flames and chests). Round 2 kept the mechanics and the simplicity and replaced everything you can see: geometry, type, iconography, motion and screen structure.

**Key Characteristics:**
- White ground, 2px seams, no hairlines, no blurred shadows on resting surfaces.
- The triangle is the primitive: logo, Niri, survey markers, week days, trail steps, confetti, rank medals, verification glyphs.
- Contour lines and dashed survey trails carry the map; the current point pings with ripple rings.
- Bricolage Grotesque Variable, sentence case everywhere, keys included.
- Keys and pressable cards carry a 3px same-hue lip and sink 3px on press.
- Seven palette roles, each bound to one concept, each with a lip and a tint.
- Every action answers with `feedback()`; milestones answer with `celebrate()`; Niri reacts to both.

## Colors

A full-palette system where hue is semantics: indigo acts, six other hues each name exactly one concept.

### Primary
- **Act Indigo** (`indigo`, `indigo-lip`, `indigo-tint`): primary keys, the next-step card, active nav (text and triangle pointer), links, "Neden?", focus rings (indigo at 55%), caret, wordmark, Niri's body, the Kurum onaylı level. On the kurum face it stands in for anything that would otherwise be orange.

### Secondary
- **Seri Orange** (`orange`, `orange-lip`, `orange-tint`, text `orange-ink`): the weekly streak only. The beacon icon, lit week-day triangles, today's dashed triangle, the Seri celebration tile. Genç face only.
- **Verified Cyan** (`cyan`, `cyan-lip`, `cyan-tint`): Doğrulandı. Level pill, verify keys, mid-range score rings (55 to 74), the ping ellipse under the Bugün marker icon.
- **League Purple** (`purple`, `purple-lip`, `purple-tint`): lig and topluluk. The climbed part of the league elevation profile, community actions.

### Tertiary
- **XP Gold** (`gold`, `gold-lip`, `gold-tint`, text `gold-ink`): XP only. The faceted gem icon, the Görevler folded-map icon, the "Kazanılan XP" tile.
- **Done Green** (`green`, `green-lip`, `green-tint`): tamam. Planted waypoints, good feedback, high score rings (75+), promotion zone, positive deltas in `green-lip`.
- **Problem Red** (`red`, `red-lip`, `red-tint`): hata and problem. Bad feedback, failed checks, demotion zone, a record changed after verification.
- **Tier colours** (`tier-zemin` to `tier-zirve`): the five elevations. Only the Lig ridge icon and tier markers use them.

### Neutral
- **Ground** (`ground`, `ground-2`, `ground-3`): page and card face; hover wash, field fill and waiting markers; disabled keys, bar tracks, locked markers.
- **Ink** (`ink`) headings and numbers that matter; **Ink 2** (`ink-2`) body; **Ink 3** (`ink-3`) captions, hints, inactive nav, demo-data notes; **Ink 4** (`ink-4`) icons, disabled key text and placeholders only.
- **Seam** (`seam`, `seam-2`): 2px borders; `seam-2` for contour lines, the undrawn dashed trail, waiting and locked marker lips.

### Named Rules
**The One Concept, One Hue Rule.** Indigo = act, orange = seri, cyan = doğrulandı, purple = lig/topluluk, gold = XP, green = tamam, red = problem. Never borrow a hue for its look.

**The Orange Stays Young Rule.** No kurum screen shows orange. A low fit score on the kurum side is indigo; kurum warnings are red or neutral ink.

**The Ink Tokens Rule.** `orange`, `gold` and their lips are fills, never text on a light ground; coloured text uses `orange-ink` / `gold-ink` (they re-point to the bright tones in dark mode). `ink-4` is never text a person must read; readable text bottoms out at `ink-3`.

## Typography

**Display Font:** Bricolage Grotesque Variable (optical sizing on; ui-sans-serif, system-ui fallback)
**Body Font:** Bricolage Grotesque Variable
**Label/Mono Font:** JetBrains Mono Variable for ids, hashes, codes and formulas

**Character:** One grotesque with optical sizing, carried by weight and tight negative tracking at the top of the ramp. Bricolage sets darker than a rounded face, so the Tailwind weight names are remapped a notch lighter: `font-semibold` 560, `font-bold` 620, `font-extrabold` 700, `font-black` 780.

### Hierarchy
- **Display** (`h-hero`; 800, clamp(36px, 5.4vw, 64px), 1, -0.035em): landing hero and 404 only.
- **Headline** (`h-page`; 800, 30px phone / 34px md+, 1.05, -0.03em): one page title per page.
- **Title** (`h-sec`; 750, 21px, 1.15, -0.02em): section headings, card titles, rail headings. Sheet titles are 20px `font-black`.
- **Lead** (`lead`; 450, 17px, relaxed, `ink-3`): the sentence under a page title.
- **Body** (450, 16px, 1.55, `ink-2`): running text; card copy is 14 to 15px `font-bold` in `ink-3`.
- **Caption** (`cap`; 650, 13px, `ink-3`): metadata, demo-data notes, map labels.
- **Label** (700, 15px, `ink`, sentence case): field labels. Hints 14px 450 `ink-3`.
- **Key** (700, 16px, -0.005em, sentence case): buttons; 14px small, 17px large. Nav items 16px, `font-semibold` inactive, `font-bold` active.
- **Numbers**: tabular figures (`num`) wherever a value can change; values count up over ~800ms.

### Named Rules
**The Sentence Case Rule.** Nothing is uppercase: not keys, not nav, not labels, not day names. A key's label is a short sentence ("Projeye git", "Bayrağı dik").

**The No Kicker Rule.** Nothing small sits above a heading. Headings stand alone; context goes in the lead below.

**The Plain Words Rule.** Address the reader as "sen". Use plain terms: netlik puanı, deneme projesi (short: proje), kayıt defteri, isimsiz inceleme, ihtiyaç kartı; levels are Beyan / Doğrulandı / Kurum onaylı (S1 to S3 only on /yontem). Never sandık, alev or şimşek. Demo data says it is fictional ("kurgusal").

## Layout

One shell (`App.astro`) renders both faces; `html[data-mode="genc|kurum"]` hides one with `.only-genc` / `.only-kurum` before any script runs.

- **Desktop (lg, 1024px+):** fixed 256px sidebar with a 2px right seam: Mark plus 28px indigo wordmark, five nav items with 32px icons, and at the foot the Genç/Kurum switch plus quiet Tema and Demo turu keys. Content offset 256px, padded 40px.
- **Phone (<1024px):** 64px sticky header with the wordmark and a Menü key only (popover card: switch, Yöntem, Tema, Demo turu). Fixed bottom tab bar: five 58px tabs, 26px icon over an 11px label, labels always shown. Content pads 16px (24px from sm) and 128px at the bottom.
- **Content width:** narrow 1080px for genç, wide 1240px for kurum. Genç pages centre a 600px column.
- **Right rail (xl, 1280px+):** 340px, 48px gap. On genç it is one "Bu haftan" card (league, week, this week's route) divided by 2px seams; `omit` drops what the page already shows. Hidden below xl, so it is never the only path to anything.
- **Rhythm:** card padding 16 to 20px; 12px between list cards; 20px between stacked blocks; 40px before a major section.
- **Flows** (Kanıt bağla): a 560px column, a quiet "Geri" at the top, NiriSays per step, and the primary key in flow after the content. No X, no lesson progress chrome, no pinned footer.

## Elevation & Depth

Flat surfaces, physical controls. Resting cards are flat behind 2px seams. Elevation means "you can press this": a solid, unblurred lip of the element's own darker shade. Floating layers use a scrim (`ink` at 40 to 45%) or 95% ground with a light blur; only true floats (phone menu, coach card) get a blurred shadow.

### Shadow Vocabulary
- **Key lip** (`box-shadow: 0 3px 0 rgb(var(--key-lip))`): every key; `:active` translates 3px and the lip collapses.
- **Card lip** (`box-shadow: 0 3px 0 rgb(var(--line))`): `card-press`; same press travel.
- **Feature lip** (`box-shadow: 0 4px 0 rgb(var(--indigo-lip))`): the pressable next-step card; tap sinks it 4px.
- **Selected option** (`box-shadow: 0 4px 0 rgb(var(--indigo) / 0.5)`): a chosen `card-press` option, with indigo border and `indigo-tint` face.
- **Marker lip**: triangle markers draw their own lip, the same triangle offset 7% in `<tone>-lip` (`seam-2` when locked or waiting).
- **Segment lift** (`box-shadow: 0 2px 0 rgb(var(--line-2))`): the selected segment.
- **Field focus** (`box-shadow: 0 0 0 4px rgb(var(--indigo) / 0.14)`): with an indigo border.
- **Float** (`box-shadow: 0 12px 32px -12px rgb(0 0 0 / 0.25)`; coach card `0 14px 36px -14px rgb(0 0 0 / 0.4)`): phone menu and Niri's coach card only.

### Named Rules
**The Lip Means Press Rule.** A lip appears only on something that responds to a press, and pressing must sink it. A static section or card never carries a lip.

## Shapes

The triangle is the system's silhouette. One path (`M50 9 91 82H9Z`, 14-unit round join) draws every marker: filled on its own lip with a white highlight stroke (done, current), `ground-3` (locked), `ground-2` with a dashed `seam-2` outline (waiting), outline (missed) or dashed (today, paused) in dense rows. Circles survive only in score rings, bars, avatars and the feedback mark.

Corners scale with the element: 8px label backings on maps, 10px small keys and segments, 12px keys and nav items, 14px fields and the segmented track, 16px inset panels and tiles, 18px cards and bubbles, 20px the indigo feature card, 24px sheets, full round for chips, pills and bars. Borders are always 2px; dashed means "not yet" (undrawn trail, today's open day, waiting marker, Beyan glyph).

## Components

### Buttons
Keys with a short, firm press.
- **Shape:** 12px (10px small).
- **Primary:** indigo face, white 16px 700 sentence-case label, 48px tall, 20px side padding, 3px `indigo-lip` lip. Small 38px / 14px, large 54px / 17px, block full width.
- **Tone keys:** orange, cyan, green, red, purple change face and lip only, and only when the action is that concept.
- **Line:** white face, 2px seam, seam lip, indigo text; hover `ground-2`. **Ink** is the same with `ink-2` text.
- **Quiet:** no face, no lip, indigo text, indigo 8% wash on hover, no travel. Utilities, close, "Geri".
- **Hover / Focus:** hover brightness 1.06; focus 3px indigo/55 outline, 2px offset. Disabled: `ground-3` face, `seam-2` lip, `ink-4` text.

### Chips and Pills
- **Chip:** white, 2px seam, full round, 13px 600 `ink-2`; filters and the goal chip.
- **Pill:** borderless tint with the tone's lip or base text, 13px 650. Level pills carry the triangle glyph: Beyan (dashed, `ground-3`/`ink-3`), Doğrulandı (outline with dot, `cyan-tint`/`cyan-lip`), Kurum onaylı (filled with white dot, `indigo-tint`/indigo).

### Cards / Containers
- **Corner Style:** 18px. **Border:** 2px `seam`. **Background:** `ground`; inset panels `ground-2` or a tone tint at 16px.
- **Shadow Strategy:** flat at rest; `card-press` carries the card lip and sinks.
- **Internal Padding:** 16 to 20px.

### Inputs / Fields
- **Style:** `ground-2` fill, 2px seam, 14px radius, 12px 16px padding, 16px 500 text, `ink-4` placeholder, indigo caret.
- **Focus:** indigo border, `ground` fill, 4px indigo/14 ring.

### Navigation
- **Sidebar:** 16px items with 32px two-tone icons, 12px radius, no fill. Active: indigo bold text plus a small filled indigo triangle pointer outside the left edge. Inactive: `ink-3` semibold, `ground-2` hover.
- **Phone tab bar:** five equal tabs, icon over an 11px extrabold label; active tab is indigo with a downward triangle pointer on the bar's top seam.
- **Faces:** genç = Bugün, Görevler, Lig, Topluluk, Profil. kurum = Ana sayfa, İhtiyaçlar, Keşfet, Projeler, Yöntem.
- **Segmented control:** `ground-2` track, 2px seam, 4px inset; the selected segment is white, 10px, indigo text, segment lift.

### Icons
Authored two-tone SVGs on a 32px grid; each concept owns its colour. Seri is a lit survey beacon (orange triangle, gold lamp and rays; `flame-live` breathes it). XP is a faceted gold gem. Lig is a ridge in the tier colour with a summit flag. Bugün is an indigo marker over cyan ping rings. Görevler is a folded gold map with a dashed route and an indigo flag. Utility glyphs (chevrons, close, check) come from lucide at stroke 3. Status is always a drawn mark, never a Unicode glyph or emoji.

### Survey primitives (signature)
- **Contours:** faint wobbled topographic rings filling a `relative overflow-hidden` hero panel; `seam-2` at ~50% on ground, white at ~16% on indigo, a tone at ~13% on tinted heroes. Every fourth ring is heavier.
- **Tri:** the survey marker with its lip; content centred on the triangle's centroid.
- **Trail:** markers on a dashed `seam-2` line (4px, dash 2/12) that inks itself in the lead tone up to the current marker over ~0.9s. Titles sit on 8px `ground` backings; an optional caption carries status (PilotDetail uses it for each aşama's state).
- **ClimbMap ("Paftan"):** steps climb a contour map bottom-up in switchbacks; zones are dashed isolines in their tone with a "title n/m" label; the last step sits on the summit. The current point carries "Buradasın · sıradaki adım".
- **Ripple rings:** the current point pings with two staggered `ping-soft` rings in its tone (35% and 25%). This is the only "you are here" signal.
- **SurveyFlag:** indigo pole, orange cloth; drops in, settles, the cloth ripples. Planted on finished waypoints and beside Niri in celebrations.

### Screen patterns
- **Bugün:** NiriSays greeting (typing) → week card with WeekDots (seven 40px triangles: lit orange with a check, today dashed orange, past outline, future `ground-2`) → the indigo next-step card on white contours with an inner white key → "Paftan" ClimbMap in a card.
- **Görevler:** an indigo hero on contours with a Ridge and a SurveyFlag, then this week's route as waypoints: grey marker until done, lit with "Bayrağı dik" when ready, filled green with a flag once planted.
- **Lig:** the five tiers as points on one elevation profile; the climbed part fills `purple` at 14% with a purple line; standings with tier TriMarks and green/red zone dividers.
- **Assistant (both faces):** first visit Welcome (kurum 4 cards; genç 5 cards, each with Niri in a different mood: wave, point, think, cheer, happy), then once-per-page Coach spotlight tours whose Niri mood follows the step (point for "here", think for explanations, cheer for rewards), then one persistent "Niri'ye sor" key opening page help, "Bu sayfayı bana göster", the Sözlük and "Jüri için demo turu". Keys: `nirengi:asistan:welcome`, `nirengi:asistan:genc:welcome`, `nirengi:asistan:tour:<route>`.
- **Landing (/):** Niri narrates the story. From 1280px one sticky narrator in a left column changes mood and re-types its bubble per section (`data-narrate`, text in `index.astro` `say`); below that, each section opens with an inline NiriSays. The hero summit Niri hides while the narrator is visible.

### Feedback, celebration and sheets
- **`feedback({tone, title, text?, xp?, streak?, action?})`:** a compact floating toast (2px seam, radius 18, soft float shadow, no lip), bottom-centre of the content on desktop, above the tab bar on phones. A 52px mini Niri reacts (good happy, good with xp/streak cheer, bad sad with a small shake, info talk); the tone is a drawn triangle mark next to the title, never a coloured slab. `xp` adds a counting gold gem chip, `streak` a beacon chip. A thin tone line shrinks over 4.2s (5.6s with chips), pauses on hover/focus; X or swipe down dismisses; at most two stack. Marked `.feedback-dock` while visible so floating keys lift by its real height.
- **`celebrate({title, sub?, xp?, streak?, cta?, href?})`:** full screen on 95% ground; four rounded-triangle rings spread once behind Niri (cheer, 150px), 32 triangle confetti in palette tones, a SurveyFlag drops in, a 30 to 36px title, optional XP (gold, gem) and Seri (orange, beacon) tiles, one large primary key ("Devam et"). Kurum omits `xp` and `streak`.
- **Sheet / Why:** "Neden?" is a sentence-case indigo 13px trigger; the sheet is a bottom sheet (24px top corners, max 85dvh) on phones and a 512px centred panel from sm.
- **EmptyState:** a card with Niri (think, 96px), an 18px title and the next step as an action.

### Niri
The triangle surveyor, pure SVG. Moods: idle, happy, cheer, think, wave, sad, point, talk, sleep. NiriSays sets Niri beside an 18px-radius, 2px-seam bubble with a rotated-square tail; on every new message Niri hops and the bubble grows from its tail; with `typing` the text types in (max 600ms) while Niri talks. Niri reacts to `feedback()`: good = happy plus a hop, bad = sad, info = looks up. Pupils follow the cursor on fine pointers. Under reduced motion every mood shows its finished static pose, and rings, flag and dust stop.

## Do's and Don'ts

### Do:
- **Do** give every key and pressable card its 3px same-hue lip and make `:active` sink 3px onto it.
- **Do** draw progress, markers and "you are here" with the triangle, the dashed trail and ripple rings.
- **Do** put Contours behind hero panels only (the next-step card, page heroes), never behind body text.
- **Do** write every label in sentence case and address the reader as "sen".
- **Do** answer every action with `feedback()` and milestones with `celebrate()`.
- **Do** put explanations, formulas and thresholds behind "Neden?" in a Sheet.
- **Do** read every number from the engine (`src/lib/engine/progress.ts`) and explain it on /yontem.
- **Do** label fictional demo data where it appears (13px bold `ink-3`).
- **Do** keep the kurum face on the same grammar with Niri as assistant and no XP, league or streak.
- **Do** keep reduced motion working: CSS animation zeroed, `MotionGlobalConfig.skipAnimations`, no confetti or rings, count-ups jump, Niri static.

### Don't:
- **Don't** use more than one Niri on a screen.
- **Don't** use orange on any kurum screen.
- **Don't** set `orange`, `gold` or their lips as text on a light ground, or use `ink-4` for readable text.
- **Don't** put a lip on a static section or card.
- **Don't** use blurred shadows on resting surfaces or 1px hairlines.
- **Don't** use a Unicode glyph or emoji as an icon or status mark.
- **Don't** show S1 / S2 / S3 outside /yontem.

### Do not regress (round 1 patterns that are gone):
- **Don't** bring back the circle lesson path; steps are triangle markers on a trail or the climb map.
- **Don't** bring back the full-width bottom answer bar; acknowledgements are the floating toast.
- **Don't** use a reward chest; quests are waypoints you plant a flag on.
- **Don't** set uppercase keys, nav or labels.
- **Don't** pin a lesson footer (X plus a fixed Devam bar) on flows; the key sits in flow.
- **Don't** put a counter strip (league, streak, XP) in the phone header; it carries the wordmark only.
- **Don't** use pin bubbles or bobbing callouts over the current step; it gets ripple rings and a plain caption below.
- **Don't** use flame, chest or lightning imagery; Seri is a beacon, XP is a gem.
