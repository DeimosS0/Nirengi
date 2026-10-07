---
name: NİRENGİ
description: Beyan değil, kanıt. Evidence-based matching infrastructure, drawn as a measurement bench.
colors:
  enclosure-grey: "#e2e4e8"
  panel-face: "#f3f4f6"
  recess-grey: "#d5d8dd"
  print-ink: "#13151a"
  print-ink-2: "#3a3e48"
  print-ink-3: "#5c616c"
  seam: "#c4c8cf"
  seam-strong: "#a5aab3"
  signal-orange: "#f99400"
  zemin-indigo: "#6451e7"
  zemin-purple: "#9b04da"
  zemin-cyan: "#00b4d8"
  level-s1-declared: "#5c616c"
  level-s2-machine: "#0078a0"
  level-s3-certified: "#5440d6"
  warn-amber: "#b06000"
  danger-red: "#c8283c"
  screen-glass: "#0d1015"
  screen-raised: "#161a21"
  screen-phosphor: "#dee4ec"
  screen-phosphor-3: "#768090"
  screen-seam: "#262d38"
  screen-s2: "#3cd2f0"
  screen-s3: "#aa9cff"
  screen-ch3: "#c45cff"
  screen-ch4: "#8c7cff"
typography:
  display:
    fontFamily: "Archivo Variable, ui-sans-serif, sans-serif"
    fontSize: "clamp(40px, 6vw, 86px)"
    fontWeight: 780
    lineHeight: 0.98
    letterSpacing: "-0.03em"
    fontVariation: "'wdth' 112"
  headline:
    fontFamily: "Archivo Variable, ui-sans-serif, sans-serif"
    fontSize: "clamp(32px, 4vw, 54px)"
    fontWeight: 780
    lineHeight: 0.98
    letterSpacing: "-0.03em"
    fontVariation: "'wdth' 112"
  title:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.375
  body:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
  body-lead:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15.5px"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.08em"
    fontVariation: "'wdth' 78"
  readout:
    fontFamily: "JetBrains Mono Variable, ui-monospace, Cascadia Mono, monospace"
    fontSize: "13px"
    fontWeight: 400
    fontFeature: "'tnum' 1"
rounded:
  hairline: "1px"
  chip: "3px"
  screen: "4px"
  key: "5px"
  panel: "6px"
  bezel: "8px"
  enclosure: "10px"
spacing:
  row-y: "12px"
  gutter: "16px"
  panel-pad: "20px"
  panel-pad-lg: "32px"
  section: "96px"
  section-lg: "128px"
components:
  button-primary:
    backgroundColor: "{colors.signal-orange}"
    textColor: "{colors.print-ink}"
    typography: "{typography.title}"
    rounded: "{rounded.key}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "#ffa21f"
    textColor: "{colors.print-ink}"
  button-ink:
    backgroundColor: "{colors.print-ink}"
    textColor: "{colors.enclosure-grey}"
    rounded: "{rounded.key}"
    padding: "10px 16px"
  button-line:
    backgroundColor: "{colors.panel-face}"
    textColor: "{colors.print-ink}"
    rounded: "{rounded.key}"
    padding: "10px 16px"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.print-ink-2}"
    rounded: "{rounded.key}"
    padding: "10px 12px"
  button-small:
    rounded: "{rounded.screen}"
    padding: "6px 12px"
  chip:
    backgroundColor: "{colors.enclosure-grey}"
    textColor: "{colors.print-ink-2}"
    rounded: "{rounded.chip}"
    padding: "2px 8px"
  field:
    backgroundColor: "{colors.panel-face}"
    textColor: "{colors.print-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.screen}"
    padding: "10px 12px"
  card:
    backgroundColor: "{colors.panel-face}"
    rounded: "{rounded.panel}"
  tab-on:
    backgroundColor: "{colors.panel-face}"
    textColor: "{colors.print-ink}"
    rounded: "{rounded.screen}"
    padding: "6px 12px"
  screen:
    backgroundColor: "{colors.screen-glass}"
    textColor: "{colors.screen-phosphor}"
    rounded: "{rounded.screen}"
    padding: "16px"
---

# Design System: NİRENGİ

## Overview

**Creative North Star: "The Measurement Bench"**

NİRENGİ is drawn as a piece of lab equipment, not a brochure. The page is a light instrument enclosure: cool grey panels with printed condensed-caps labels, seams instead of decorations, physical keys that travel a pixel when pressed. Wherever the engine computes something, the enclosure opens onto an inset dark screen with a real graticule, and the numbers on that screen are the numbers the engine produced a moment ago. The four match components are four channels in the Zemin360 colours, and that colour code is the spine of the whole system.

Density is that of a datasheet: rows, columns, readouts and units, with generous section spacing between instruments but tight, ruled spacing inside them. Display type is wide and heavy (Archivo stretched), labels are narrow and silk-screened (Archivo condensed), and figures are monospaced. Ornament is limited to what an instrument would actually carry: graticules, LEDs, channel colours, line weights that encode verification level.

The confirmed rejections from the brand owner: no AI-template look (gradient hero, feature-card grid, logo strip), no career-platform look, and no return to the earlier paper-and-ink "pafta" map aesthetic.

**Key Characteristics:**
- Light grey enclosure panels; dark inset screens for anything computed.
- Four fixed channel colours (CH1 orange, CH2 cyan, CH3 purple, CH4 indigo) carry the match components everywhere.
- Verification level is written as line weight and dash, not as a badge colour alone.
- Wide heavy display, condensed caps panel print, monospaced readouts.
- Square-ish corners (1 to 10px), seams and inset shadows rather than floating cards.

## Colors

A cool grey instrument body with four saturated Zemin360 channel colours, used as signal and never as decoration.

### Primary
- **Signal Orange** (`signal-orange`): the one fill colour for the primary key ("Kanıtını bağla") and CH1 Kanıt. On a dark screen it also marks the active mode label, the 90-day window and the signal path wire. Hover lifts to a brighter orange (#ffa21f).

### Secondary
- **Zemin Indigo** (`zemin-indigo`): CH4 Geçmiş, the logo tile, the focus ring, the text caret, the active nav underline (2px inset) and the accent word inside a display headline on light panels.
- **Zemin Cyan** (`zemin-cyan`): CH2 Bağlam and the text selection tint (35%).

### Tertiary
- **Zemin Purple** (`zemin-purple`): CH3 Kapasite only. On screens it lifts to `screen-ch3`.

### Verification levels and states
- **Declared Grey** (`level-s1-declared`): S1 beyan; always drawn dashed and thin.
- **Machine Cyan** (`level-s2-machine`): S2 makine doğrulaması and every pass state (a published canvas, an intact chain, a passing check). On screens it lifts to `screen-s2`.
- **Certified Violet** (`level-s3-certified`): S3 kurum tasdiki, approved milestones, the measured quantity column of the spec table, the feedback trace in the loop. On screens it lifts to `screen-s3`.
- **Warn Amber** (`warn-amber`) and **Danger Red** (`danger-red`): non-blocking warnings and blocking failures (locked publish, broken chain row).

### Neutral
- **Enclosure Grey** (`enclosure-grey`): page background.
- **Panel Face** (`panel-face`): raised panels, cards, keys, fields, nav.
- **Recess Grey** (`recess-grey`): table header strips, footnote strips, meter tracks, the bezel tray around a screen, hover fills of quiet keys.
- **Print Ink** (`print-ink`, `print-ink-2`, `print-ink-3`): primary text, secondary text, labels and units.
- **Seam** (`seam`, `seam-strong`): 1px rules between rows and around panels; the strong seam outlines enclosures, line keys and fields.
- **Screen Glass** (`screen-glass`, `screen-raised`, `screen-phosphor`, `screen-phosphor-3`, `screen-seam`): the inset screen palette. A `.screen` region re-skins every token inside it, so components work unchanged on glass.

A dark theme (`[data-theme="dark"]`) remaps the same roles; its values live in the sidecar.

### Named Rules
**The Four Channels Rule.** Orange, cyan, purple and indigo are CH1 to CH4, in that order, everywhere. Where they appear as data on a screen they mean a channel, and the four always appear together in that order.

**The Signal Key Rule.** Orange as a fill belongs to the primary key and to CH1 data. One primary key per panel; the alternative action is a line or ink key.

**The Pass Is Machine Cyan Rule.** A passing state uses the S2 machine colour, because passing a check is machine verification. Green is not part of the system.

## Typography

**Display Font:** Archivo Variable, expanded (width 112) (with ui-sans-serif)
**Body Font:** Archivo Variable, normal width (with ui-sans-serif, system-ui)
**Label/Mono Font:** Archivo Variable condensed (width 78) for panel print; JetBrains Mono Variable for readouts

**Character:** One variable family stretched three ways: a wide, heavy badge for statements, a plain body for reading, and a narrow silk-screened caps for labels. Monospace appears only where a machine wrote the value.

### Hierarchy
- **Display** (780, clamp(40px, 6vw, 86px), 0.98, -0.03em, balanced wrap): the hero statement only.
- **Headline** (780, clamp(32px, 4vw, 54px) to clamp(34px, 4.4vw, 60px), 0.98): one per landing section; app page titles use 44px, 56px from md.
- **Title** (700, 15.5 to 17px): panel titles, table problem names, candidate and need names.
- **Body** (400, 15px, 1.55): default. Leads run 15.5 to 17px at relaxed leading, capped at 34 to 62ch.
- **Label** (600, 11px, 0.08em, uppercase, width 78): panel print on table headers, definition terms, channel names, LED captions, enclosure nameplates.
- **Readout** (JetBrains Mono, tabular, 10 to 13px; up to 34px for a canvas score): scores, weights, blind codes, hashes, dates, routes, axis ticks.

### Named Rules
**The Panel Print Rule.** Condensed caps labels name a control, a column, a value or an enclosure; they sit on the thing they label. They are never a prefix stacked above a heading.

**The Readout Rule.** If the engine computed it or a machine identifies it, it is set in JetBrains Mono with tabular figures. Prose and headings never use the mono.

**The Accent Word Rule.** A display headline may set one phrase in an accent colour (indigo on panels, orange on screens) without italics; one per headline at most.

## Layout

A single 1240px container with 16px side padding (24px from 640px). Landing sections are separated by 96px (128px from 768px) and each section is one instrument: an enclosure panel (10px corners, strong seam) holding prose on the panel face and one or more inset screens sitting in an 8 to 12px bezel tray. Inside panels, spacing is ruled rather than airy: rows of 12 to 16px vertical padding separated by 1px seams, panel padding of 20px (32px from 768px).

The hero splits 0.8 / 1.2 at 1024px: statement, keys and a three-row definition list on the left; the live bench spanning both rows on the right. Tables become grids with fixed label columns (3.5rem number, 9rem route); on mobile they collapse to stacked rows and the signal path turns vertical with a left wire. Breakpoints follow Tailwind defaults (640, 768, 1024).

**The Fixed Regions Rule.** On an instrument, regions never move. Mode keys swap the contents of the screen; the screen, its header strip, its channel readout row and its front-panel keys keep their position and size.

## Elevation & Depth

Depth is physical, not atmospheric. Enclosures lift off the grey body with a long soft drop and a white top lip; screens sink into them with dark inner shadows; keys carry a darker lower lip and press 1px down. Cards inside the app barely lift (1px) and gain a short drop only on hover. Shadows are always cool black or ink, never coloured glows.

### Shadow Vocabulary
- **Enclosure lift** (`box-shadow: 0 1px 0 rgb(255 255 255 / 0.5) inset, 0 18px 40px -28px rgb(0 0 0 / 0.45)`): landing instrument panels.
- **Bezel tray** (`box-shadow: inset 0 1px 3px rgb(0 0 0 / 0.18)`): the recessed grey tray a screen sits in.
- **Screen recess** (`box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.6), inset 0 2px 8px rgb(0 0 0 / 0.5)`): every inset dark screen.
- **Key lip** (`box-shadow: inset 0 -2px 0 rgb(0 0 0 / 0.16), 0 1px 2px rgb(0 0 0 / 0.14)`), pressed (`inset 0 1px 2px rgb(0 0 0 / 0.2)` with translateY(1px)): all keys except quiet ones.
- **Card rest / hover** (`0 1px 2px rgb(var(--ink) / 0.06)` / `0 6px 16px -10px rgb(var(--ink) / 0.35)`): app cards.
- **Field well** (`inset 0 1px 2px rgb(var(--ink) / 0.08)`): text inputs.

### Named Rules
**The Enclosure and Screen Rule.** Light panels lift; screens sink. Nothing computed floats on a raised card; it is shown on glass inside the panel.

## Shapes

Square-ish and machined. Radii step with the size of the part: 1px for LEDs, meter tracks and bars; 3px chips; 4px screens, fields, small keys and tabs; 5px keys; 6px cards and data panels; 8px bezel trays and dialogs; 10px enclosures. Circles appear only where the object is round: avatars and the score dial. Borders are 1px seams; dashed borders mean "not yet verified" (blind avatars, selected bar outline, S1 lines, divider above a screen's caption).

**The Verification Weight Rule.** Line weight encodes verification level on every surface: S1 a thin dashed grey line, S2 a solid medium cyan line, S3 a heavy violet line (ratio roughly 1 : 2 : 4). A level glyph follows the same logic: dashed outline triangle, outline triangle with a dot, filled triangle.

## Components

### Buttons (keys)
Physical keys with a printed face.
- **Shape:** 5px corners (4px on small keys), 14px semibold at width 96.
- **Primary:** signal orange face, print-ink text, 10px 16px; landing keys enlarge to 12px 20px at 15px.
- **Hover / Focus:** face brightens; 2px indigo focus ring offset 2px; pressed keys travel 1px and the lip turns inward. Disabled at 40% opacity.
- **Ink:** print-ink face with enclosure-grey text; the secondary call to action and the active mode key.
- **Line:** panel-face key with a strong seam; hover darkens the seam. Used for channel keys, steppers and the alternative action.
- **Quiet:** no face, no lip; secondary text that fills recess grey on hover. Icons, theme toggle, dialog close.

### Channel keys and LEDs
A line key carrying a 7px square LED (1px corners), the CH number in mono, the channel name and its weight in mono. The LED is a 25% tint with a 60% outline when off and fills solid when the key is pressed (`aria-pressed`). The last live channel cannot be muted. LEDs also serve as status lamps in check lists and canvas reports, coloured S2 (pass), warn or danger.

### Chips
- **Style:** 3px corners, enclosure-grey fill, 1px seam, 12px semibold secondary text.
- **Level badge:** a chip variant in mono 11px, tinted 8 to 10% with a 35 to 40% border in the level colour, led by the level glyph.

### Cards / Containers
- **Corner Style:** 6px (cards and data panels), 10px (landing enclosures).
- **Background:** panel face; header and footnote strips in recess grey.
- **Shadow Strategy:** see Elevation; data panels on the landing carry no shadow, only a strong seam.
- **Border:** 1px seam; enclosures and data panels use the strong seam.
- **Internal Padding:** 12 to 16px rows; 20 to 32px panel bodies.

### Inputs / Fields
- **Style:** panel face, 1px strong seam, 4px corners, 10px 12px, 15px text, inset well shadow, indigo caret.
- **Focus:** border turns indigo with a 3px indigo ring at 20%.
- **Labels and hints:** 13px bold label above; 12.5px tertiary hint below.

### Navigation
Sticky 56px strip in panel face at 95% with a blur and a bottom seam. Wordmark in Archivo extra-bold with 0.04em tracking beside the indigo logo tile. Links are 14px semibold secondary ink; the active link turns print ink with a 2px indigo underline drawn inset at the strip's bottom edge. A segmented Kurum / Yetenek persona switch uses the tab treatment. Below 1024px links move into a "Menü" line key opening a 256px card.

### Tabs / Segmented switch
13px semibold keys at 4px corners; the selected segment becomes panel face with a strong-seam ring and a 1px drop.

### Signature: the Instrument Screen
A dark glass region (4px corners, screen recess shadow) with a header strip (mode label in orange panel print, context in secondary text, a cyan "motor canlı" LED), a plot area over a 10 x 4 graticule (7% white lines, 14% frame), and a channel readout row of five ruled cells (CH1 to CH4 values coloured by channel, then Σ skor). Stacked bars per candidate use channel colours bottom-up and animate their segments with a 700ms expo-out ease, staggered 60ms; ranking reorders with layout animation. A dashed seam separates the plot from its one-line caption.

### Measures
- **Meter:** 6px track in recess grey, 1px corners, fill in ink, S2, S3, signal or warn, scaled from the left over 600ms.
- **Score dial:** a 2.8px ring on a seam track, butt caps, coloured S3 at 75 and above, CH2 at 55 and above, tertiary ink below; the value counts up in mono over 900ms.
- **Status icon:** drawn Lucide marks (check, x, alert triangle, circle) at 14px with 2.4 stroke for pass, block, warn, pending. Never a Unicode glyph.

## Do's and Don'ts

### Do:
- **Do** show anything the engine computes on an inset screen with a graticule, using the screen palette.
- **Do** keep CH1 to CH4 in orange, cyan, purple, indigo order and use those colours only for channel data, the primary key and the documented accents.
- **Do** encode verification level as line weight and dash (S1 thin dashed grey, S2 solid cyan, S3 heavy violet), with colour as reinforcement.
- **Do** use S2 machine cyan for every pass state (published, chain intact, check passed).
- **Do** set scores, weights, codes, hashes, dates and routes in JetBrains Mono with tabular figures.
- **Do** attach condensed caps labels to the control, column or value they name.
- **Do** keep corners between 1px and 10px, stepping with the size of the part.
- **Do** label fictional organisations and people as demo data wherever they appear.

### Don't:
- **Don't** use Unicode glyphs (check marks, crosses, bullets, triangles) for status; use the drawn status icon.
- **Don't** stack an uppercase label or a numbered "01 ·" prefix above a heading as a kicker.
- **Don't** use green for status, decorative gradients or coloured glows; pass is S2 cyan and depth is black or ink shadow.
- **Don't** put the graticule on surfaces that do not measure anything.
- **Don't** float computed numbers on raised cards; screens sink, panels lift.
- **Don't** move instrument regions between modes; swap their contents.
- **Don't** use the SaaS arrangement of gradient hero, feature-card grid and logo strip, or a career-platform profile look.
- **Don't** return to the paper-and-ink map ("pafta") texture.
