---
name: nirengi
description: Simple on the surface, deep one tap below. A white, rounded, pressable world where verified work meets institutional needs.
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
    fontFamily: "Nunito Variable, ui-rounded, SF Pro Rounded, system-ui, sans-serif"
    fontSize: "clamp(34px, 5vw, 56px)"
    fontWeight: 900
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Nunito Variable, ui-rounded, SF Pro Rounded, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Nunito Variable, ui-rounded, SF Pro Rounded, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 850
    lineHeight: 1.2
  lead:
    fontFamily: "Nunito Variable, ui-rounded, SF Pro Rounded, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.625
  body:
    fontFamily: "Nunito Variable, ui-rounded, SF Pro Rounded, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 550
    lineHeight: 1.55
  label:
    fontFamily: "Nunito Variable, ui-rounded, SF Pro Rounded, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 850
    letterSpacing: "0.07em"
  key:
    fontFamily: "Nunito Variable, ui-rounded, SF Pro Rounded, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 850
    letterSpacing: "0.06em"
  mono:
    fontFamily: "JetBrains Mono Variable, ui-monospace, Cascadia Mono, monospace"
    fontSize: "14px"
    fontWeight: 500
    fontFeature: "\"tnum\" 1"
rounded:
  field: "12px"
  key: "14px"
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
    rounded: "{rounded.field}"
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
    rounded: "{rounded.key}"
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
  nav-item-active:
    backgroundColor: "{colors.indigo-tint}"
    textColor: "{colors.indigo}"
    rounded: "{rounded.key}"
    padding: "8px 12px"
  nav-item:
    textColor: "{colors.ink-3}"
    rounded: "{rounded.key}"
    padding: "8px 12px"
  segmented-active:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.indigo}"
    rounded: "10px"
    padding: "6px 14px"
  next-step-card:
    backgroundColor: "{colors.indigo}"
    textColor: "{colors.ground}"
    rounded: "{rounded.feature}"
    padding: "20px"
  sheet:
    backgroundColor: "{colors.ground}"
    rounded: "{rounded.sheet}"
    padding: "24px"
---

# Design System: nirengi

<!-- Source of truth: src/styles/global.css. Tokens live there as RGB channels
     (light on :root, dark on [data-theme="dark"]) and are mapped to Tailwind
     colours in @theme inline. Hex values above are the light theme; the dark
     theme values are in .impeccable/design.json → extensions.colorMeta.*.dark. -->

## Overview

**Creative North Star: "The Pressable Road"**

nirengi shows one next step on the surface and keeps the whole reasoning one tap below. The world is a white ground cut by 2px soft seams, with keys and pressable cards that sit on a 4px darker lip and sink onto it when touched. Type is rounded Nunito at heavy weights (800 to 900 for anything that names something), and colour is never decoration: every hue in the palette owns one concept, so a glance at a colour already says what the number next to it means. Niri, a rounded indigo triangle with an orange survey point for a belly, is the only character and appears at most once per screen.

The interface grammar is a lesson app's: a week strip of flames, a winding road of round step nodes, a feedback bar that rises from the bottom after every action, and a full-screen celebration for moments that matter. Depth is in sheets, not on the page: explanations, formulas and edge cases live behind a "Neden?" trigger that opens a bottom sheet on phones and a centred panel on desktop. The same grammar serves two faces. The genç face (young builders, phone-first) gets the full game layer. The kurum face (institutions, desk-first) keeps the keys, cards, sheets and feedback but drops every XP, league and streak element.

The world refuses two things it replaced: the instrument-bench dashboard (grey enclosures, dense tables, measurement chrome) and the career-site card grid. Density stays low; a screen carries one primary action.

**Key Characteristics:**
- White ground, 2px seams in `seam`, no hairlines and no drop shadows on resting surfaces.
- Keys and pressable cards carry a 4px lip in a darker shade of their own face; pressing translates the face 4px down onto it.
- Seven palette roles, each bound to one concept, each with a lip and a tint.
- Nunito Variable throughout, 550 body, 850 to 900 headings and keys.
- Uppercase is reserved for keys (buttons, nav items, key-like text actions) and field/table labels.
- Every action answers with `feedback()`; milestones answer with `celebrate()`.
- Light and dark themes share one token set; dark is a re-pointed channel set, not a separate design.

## Colors

A full-palette system where hue is semantics: indigo acts, and six other hues each name exactly one concept.

### Primary
- **Act Indigo** (`indigo`, lip `indigo-lip`, tint `indigo-tint`): the colour of doing. Primary keys, the next-step card, active nav items and segmented selections, links, "Neden?" triggers, focus rings (indigo at 55%), selection, caret, the wordmark and Niri's body. Also the colour of the top verification level, Kurum onaylı (filled triangle glyph on `indigo-tint`). On the kurum face it is the default tone for anything that would otherwise be orange.

### Secondary
- **Streak Orange** (`orange`, `orange-lip`, `orange-tint`, text `orange-ink`): the weekly seri first. Flames, the week strip's lit days and today's dashed ring, the weekly progress bar while the goal is unmet, the streak tile in a celebration. On the genç face it is also the warm accent for the Soru post kind and gentle "try again" notices. Never on the kurum face.
- **Verified Cyan** (`cyan`, `cyan-lip`, `cyan-tint`): Doğrulandı, the machine-verified level. The level pill (`cyan-tint` with `cyan-lip` text), the outlined-with-dot glyph, mid-range score rings (55 to 74).
- **League Purple** (`purple`, `purple-lip`, `purple-tint`): league and community. Community actions (Destekle), league chrome, the summit unit of the road.

### Tertiary
- **XP Gold** (`gold`, `gold-lip`, `gold-tint`): XP only. The Bolt icon, quest progress bars, the "Kazanılan XP" celebration tile. Gold is a fill colour; where XP needs text it uses `gold-ink`.
- **Done Green** (`green`, `green-lip`, `green-tint`): tamam. Completed goals and milestones, good feedback, high score rings (75+), positive deltas (`+9` in `green-lip`), league promotion zone.
- **Problem Red** (`red`, `red-lip`, `red-tint`): hata and problem signals. Bad feedback, failed checks, the demotion zone, a record that changed after verification.
- **League tiers** (`tier-zemin` → `tier-zirve`): the five league shields climb ground to summit (Zemin, Tepe, Sırt, Doruk, Zirve). Only the Shield icon and tier markers use them.

### Neutral
- **Ground** (`ground`, `ground-2`, `ground-3`): page and card face; hover wash and field fill; disabled keys, bar tracks, locked road nodes and skeletons.
- **Ink** (`ink`): headings, strong text, numbers that matter.
- **Ink 2** (`ink-2`): body text (the `body` default).
- **Ink 3** (`ink-3`): secondary text, hints, captions, inactive nav, demo-data notes.
- **Ink 4** (`ink-4`): icons, disabled key text and placeholders. Never text a person must read.
- **Seam** (`seam`, `seam-2`): the 2px borders of every card, field, chip and bar; `seam-2` for the lip under locked or neutral elements and for scrollbars.

### Named Rules
**The One Concept, One Hue Rule.** Indigo = act/primary, orange = youth streak, cyan = Doğrulandı, purple = league/community, gold = XP, green = done, red = error/problem. Never borrow a hue for its look; a cyan button means "verify", a green bar means "finished".

**The Orange Stays Young Rule.** Orange belongs to the genç face. No kurum screen shows orange: a low fit score on the kurum side renders in indigo ("a low fit is not a streak warning", `matchbits.tsx`), and status warnings there use red or neutral ink.

**The Ink-4 Is Not Text Rule.** `ink-4` is for icons, disabled states and placeholders. Readable text bottoms out at `ink-3`.

**The Lip Is The Same Hue Rule.** Every coloured face sits on its own `-lip` shade. Neutral faces (white keys, cards) sit on `seam`. Never put a black or grey offset under a coloured key.

## Typography

**Display Font:** Nunito Variable (with ui-rounded, SF Pro Rounded, system-ui)
**Body Font:** Nunito Variable (same stack)
**Label/Mono Font:** JetBrains Mono Variable (with ui-monospace, Cascadia Mono) for ids, hashes and formulas on /yontem, pilot and public card pages

**Character:** One rounded family carried by weight, not by pairing. Body runs heavier than usual (550) so text holds up next to 900-weight headings; anything that names something is 800 or above.

### Hierarchy
- **Display** (900, clamp(34px, 5vw, 56px), 1.05, -0.025em): landing hero and 404 only.
- **Headline** (900, 28px phone / 32px md+, 1.1, -0.02em): page titles via the page head; one per page.
- **Title** (850, 20px, 1.2): section headings, sheet and modal titles (sheets use 900).
- **Lead** (600, 17px, relaxed, `ink-3`): the sentence under a page title.
- **Body** (550, 16px, 1.55, `ink-2`): running text; card copy is commonly 14 to 15px at 700 in `ink-3`.
- **Label** (850, 13px, 0.07em, uppercase, `ink-3`): field and table labels and filter group names only.
- **Key** (850, 15px, 0.06em, uppercase): buttons and nav items; 13px on small keys, 16px on large.
- **Numbers**: tabular figures (`num`) wherever a value can change; values count up from the previous value over ~800ms.

### Named Rules
**The No Kicker Rule.** Nothing small and uppercase sits above a heading. Uppercase lives on keys and on field/table labels; headings stand alone in sentence case.

**The Sentence-Case Depth Rule.** The "Neden?" trigger is sentence case, indigo, 13px at 800, never a key. Depth is offered, not shouted.

**The Plain Names Rule.** Verification levels are written Beyan / Doğrulandı / Kurum onaylı everywhere. The S1 to S3 codes appear only on /yontem.

## Layout

Two shells. **App** (`App.astro`) renders both faces and lets `html[data-mode="genc|kurum"]` hide one with `.only-genc` / `.only-kurum`, so the right navigation exists before any script runs.

- **Desktop (lg, 1024px+):** a fixed 256px sidebar with a 2px right seam: wordmark (28px, 900, indigo), five nav items, and at the bottom the Genç/Kurum segmented switch, theme and demo-tour quiet keys. Content is offset 256px, padded 40px sides, 40px top.
- **Phone (<1024px):** a 64px sticky top bar (mark, the genç stat row of league/streak/XP, a "Menü" key opening a card popover) and a fixed bottom tab bar of five labelled tabs (58px tall, 26px icons, 11px labels, active tab in indigo tint with an indigo/35 border). Content pads 16px (24px from sm) and 128px bottom so the tab bar never covers it.
- **Content width:** `narrow` 1080px for the genç face, `wide` 1240px for kurum work. Genç pages centre an inner 600px column.
- **Right rail (xl, 1280px+):** optional 340px column, 48px gap; on the genç face it carries league, streak and weekly quests. It is hidden below xl, so nothing in the rail may be the only path to an action.
- **Public** (`Layout.astro`): 64px sticky top bar with wordmark and quiet keys, centred 1120px wrap, footer. Sections reveal once on scroll with a 2.5s failsafe.
- **Rhythm:** card padding 16 to 20px, 12px between list cards, 20px between stacked blocks, 40 to 48px between sections. The feedback bar clears the sidebar on desktop (272px left padding).

## Elevation & Depth

Flat surfaces, physical controls. Resting cards are flat and separated by 2px seams; elevation means "you can press this", expressed as a solid, unblurred lip of the element's own darker shade directly below it. Layers that float above the page (sheets, modals, celebration) use a scrim (`ink` at 40%) or a near-opaque ground (95% with a light blur) rather than shadows.

### Shadow Vocabulary
- **Key lip** (`box-shadow: 0 4px 0 rgb(var(--key-lip))`): every key. On `:active` the face translates 4px down and the lip collapses to 0.
- **Card lip** (`box-shadow: 0 4px 0 rgb(var(--line))`): pressable cards; same press behaviour.
- **Feature lip** (`box-shadow: 0 5px 0 rgb(var(--indigo-lip))`): the next-step card; unit banners use 4px in their tone's lip.
- **Node lip** (`box-shadow: 0 6px 0 rgb(var(--<tone>-lip))`): 72px road nodes; the current node adds an 8px halo of its tone at 18%.
- **Segment lift** (`box-shadow: 0 2px 0 rgb(var(--line-2))`): the selected segment in a segmented control.
- **Field focus** (`box-shadow: 0 0 0 4px rgb(var(--indigo) / 0.14)`): fields, with the border turning indigo.
- **Popover float** (`box-shadow: 0 12px 32px -12px rgb(0 0 0 / 0.25)`): the phone menu and the demo-tour panel; the only blurred shadows in the system.

### Named Rules
**The Lip Means Press Rule.** A lip appears only on something that responds to a press, and pressing must sink it. A static card never carries a lip.

## Shapes

Soft, generous rounding everywhere, scaled to the element: 12px for small keys and menu rows, 14px for keys, fields and nav items, 16px for inset panels and celebration tiles, 18px for cards, 20px for the next-step card, 24px for sheets and modals, full round for chips, pills, bars, avatars, week dots and road nodes. Borders are always 2px; dashed 2px means "not yet" (today's unlit day, a hidden identity, the Beyan glyph). The recurring silhouette is the triangle: the logo mark, Niri, and the verification glyph (dashed outline = Beyan, outline with dot = Doğrulandı, filled with white dot = Kurum onaylı).

## Components

### Buttons
Tactile keys that sink when pressed.
- **Shape:** gently rounded (14px; 12px on small).
- **Primary:** indigo face, white 15px 850 uppercase text at 0.06em, 48px tall, 20px side padding, 4px indigo-lip lip. Sizes: small 38px / 13px, large 54px / 16px, block full-width.
- **Tone keys:** orange, cyan, green, red, purple variants change only the face and lip, and only when the action is that concept (cyan to verify, green to approve, red to dispute or delete, orange only for streak actions on the genç face).
- **Line (secondary):** white face, 2px seam border, seam lip, indigo text; hover washes to `ground-2`. **Ink** is the same with `ink-2` text for neutral actions.
- **Quiet:** no face, no lip, indigo text, indigo 8% wash on hover, no press travel. Used for nav utilities and close buttons.
- **Hover / Focus:** hover brightens the face slightly (brightness 1.06); focus is a 3px indigo/55 outline offset 2px. Disabled keys go `ground-3` on a `seam-2` lip with `ink-4` text.

### Chips and Pills
- **Chip:** white, 2px seam, full round, 13px at 750 in `ink-2`; used for interactive filters and the goal chip ("Hedef: haftada 3 gün"), which tints indigo on hover.
- **Pill:** borderless, tinted background with the tone's lip or base text, 13px at 850. Level pills carry the triangle glyph: Beyan on `ground-3`/`ink-3`, Doğrulandı on `cyan-tint`/`cyan-lip`, Kurum onaylı on `indigo-tint`/indigo.

### Cards / Containers
- **Corner Style:** 18px.
- **Background:** `ground`; inset panels inside cards use `ground-2` at 16px.
- **Shadow Strategy:** flat at rest; pressable cards (`card-press`) carry the card lip and sink on press; hover washes to `ground-2`.
- **Border:** 2px `seam`. A highlighted card (the kurum "Sırada ne var" card, a selected option) uses an indigo border at reduced opacity with an indigo-tint lip.
- **Internal Padding:** 16 to 20px.

### Inputs / Fields
- **Style:** `ground-2` fill, 2px seam, 14px radius, 12px by 16px padding, 16px text at 650, placeholder in `ink-4`, indigo caret.
- **Focus:** border turns indigo, fill turns `ground`, 4px indigo/14 ring.
- **Labels:** the field label is 15px at 850 in `ink` (sentence case); hints are 14px at 600 in `ink-3`. Filter groups use the uppercase label style.

### Navigation
- **Desktop sidebar items:** 15px 800 uppercase at 0.05em, 32px two-tone icon, 14px radius, 2px border. Active: indigo tint fill, indigo/35 border, indigo text; inactive: `ink-3`, transparent border, `ground-2` hover.
- **Phone tab bar:** five equal tabs, icon over an 11px sentence-case label, same active treatment. Labels are always shown.
- **Faces:** genç = Bugün, Görevler, Lig, Topluluk, Profil. kurum = Ana sayfa, İhtiyaçlar, Keşfet, Projeler, Yöntem.
- **Segmented control:** `ground-2` track with 2px seam and 4px inset; the selected segment is a white 10px-radius chip with indigo text on a 2px `seam-2` lift.

### Feedback Bar and Celebration (global moments)
Mounted once per page by the layout (`Overlays`); screens trigger them by event and never own the overlay.
- **`feedback({tone, title, text?})`:** a full-width bar that springs up from the bottom for 3.4s. Tone good = green, bad = red, info = indigo; the bar is the tone's tint with a 2px tone/40 top border, a 44px round mark that pops in, a 20px 900 title and a 15px 700 line, both in the tone's lip.
- **`celebrate({title, sub?, xp?, streak?, cta?, href?})`:** full screen on a 95% ground with a light blur, a 28-piece confetti burst in the palette, Niri cheering at 150px, a 30 to 36px 900 title, optional XP (gold) and Seri (orange) tiles, and one large primary key ("Devam et" by default) that focuses on open and follows `href` if given. On the kurum face omit `xp` and `streak`.

### Sheet ("Neden?")
The depth layer. `<Why title>` renders the sentence-case indigo "Neden?" trigger; `<Sheet>` is a bottom sheet (24px top corners, max 85dvh) on phones and a centred 512px panel from sm, spring-in, Escape and scrim close. Formulas, thresholds and reasoning go here, never inline on the surface.

### The Road (signature)
Units are full-width tone banners (18px radius, 4px lip, 21px 900 white title, a white/20 progress pill). Steps are 72px round nodes in the unit's tone, offset on a sine path, with a white check (done), a white star plus 8px halo and a bobbing "Sıradaki" callout (current), or `ground-3` with a lock (locked). Tapping any node opens its Sheet.

### Week Strip and Bars (signature)
Seven 40px round day dots under 12px uppercase day keys: lit days are orange-tint with an orange border and a flame, today is a dashed orange ring, the rest are `ground-2`. Progress bars are thick full-round tracks in `ground-3` (16px default, 10px for meters) with a white/30 highlight stripe; score rings count up and tone by value (green 75+, cyan 55 to 74, indigo below; the kurum side already does this through `matchbits.tsx`).

### Niri
The triangle mascot, pure SVG, moods idle, happy, cheer, think, wave. It blinks and bobs (both stop under reduced motion). Appears in the greeting with a speech bubble, in empty states (96px), in the celebration, in the landing hero and on /yontem and 404.

### Icons
Authored two-tone 32px-grid SVG icons where each concept owns its colour (Flame = orange/gold, Bolt = gold/gold-lip, Shield = tier colour). Utility glyphs (chevrons, close, check, status marks) come from lucide at stroke 3. Status is always a drawn mark, never a Unicode glyph.

## Do's and Don'ts

### Do:
- **Do** give every key and pressable card its 4px same-hue lip and make `:active` translate 4px onto it.
- **Do** answer every user action with `feedback()`; use `celebrate({title, sub, xp?, streak?, cta?, href?})` for verification, finished quests, approved milestones and other milestones.
- **Do** put explanations, formulas and thresholds behind `<Why>` / `<Sheet>` ("Neden?"), sentence case, indigo, 800.
- **Do** read every number from the engine (`src/lib/engine/progress.ts`: `XP`, `TIERS`, `PROMOTE` 5, `DEMOTE` 3; canvas publish gate 70 in `canvas.ts`) and explain it on /yontem. Never hard-code a figure in a screen.
- **Do** label fictional demo data where it appears ("Kurumlar ve kişiler kurgusal demo verisidir.", 13px 700 `ink-3`).
- **Do** use one Niri per screen, at most.
- **Do** keep the kurum face on the same grammar (keys, cards, sheets, feedback, plain level names) with no XP, league or streak elements.
- **Do** respect reduced motion: the global rule zeroes CSS animation, and the kit sets `MotionGlobalConfig.skipAnimations` and skips confetti and count-ups.
- **Do** keep both themes working by using tokens only; dark mode re-points the same channel names.

### Don't:
- **Don't** use orange on any kurum screen; disputes and problems are red, honesty labels ("Örnek veri") are neutral.
- **Don't** use `ink-4` for text a person must read.
- **Don't** put a kicker or eyebrow label above a heading; uppercase is for keys and field/table labels.
- **Don't** show S1 / S2 / S3 outside /yontem; say Beyan, Doğrulandı, Kurum onaylı.
- **Don't** set `gold`, `orange` or their `-lip` shades as text on a light ground (about 2.3–3.2:1); coloured text uses `orange-ink` / `gold-ink` (4.6:1, they re-point to the bright tones in dark mode).
- **Don't** use blurred drop shadows on resting surfaces, hairline (1px) borders, or a lip on something that cannot be pressed.
- **Don't** use a Unicode glyph or emoji as an icon or status mark.
- **Don't** add a second accent for decoration; every hue already has a job.
