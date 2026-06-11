---
name: Obsidian Intelligence
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#d8c3ad'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#a08e7a'
  outline-variant: '#534434'
  surface-tint: '#ffb95f'
  primary: '#ffc174'
  on-primary: '#472a00'
  primary-container: '#f59e0b'
  on-primary-container: '#613b00'
  inverse-primary: '#855300'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffbcb7'
  on-tertiary: '#68000a'
  tertiary-container: '#ff938c'
  on-tertiary-container: '#8d0012'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffddb8'
  primary-fixed-dim: '#ffb95f'
  on-primary-fixed: '#2a1700'
  on-primary-fixed-variant: '#653e00'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ad'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930013'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  title-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.4'
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.6'
  data-lg:
    fontFamily: Hanken Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.1em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-padding: 2rem
  gutter: 1.5rem
  card-gap: 1rem
  section-margin: 3rem
  sidebar-width: 240px
---

## Brand & Style

This design system embodies a "High-Intelligence Noir" aesthetic—a sophisticated, dark-mode environment designed for deep technical analysis and recruitment intelligence. It prioritizes data density and professional authority through a mix of **Modern Corporate** and **Technical Brutalism**.

The brand personality is clinical, precise, and elite. It avoids typical "friendly" SaaS tropes in favor of a high-stakes, dossier-like atmosphere. Key characteristics include:
- **Atmospheric Depth:** A foundation of true blacks and deep charcoals.
- **Urgent Precision:** High-contrast amber accents signal "intelligence" and "action."
- **Data Command:** A heavy reliance on structured grids, monospaced-adjacent data points, and clear status indicators to convey technical validity.

## Colors

The palette is strictly functional, utilizing high-contrast accents against an abyssal background to guide the eye toward critical data "verdicts."

- **Primary (Amber):** Used for highlights, active navigation states, primary buttons, and progress indicators. It represents "intelligence" and discovery.
- **Success (Emerald):** Reserved for "Validated" statuses and positive signal indicators.
- **Alert (Rose/Red):** Used for "Risk Markers" and "No Evidence" flags.
- **Neutrals:** The background is a true black (`#000000` or `#0A0A0A`). Surfaces use a slight lift to deep charcoals to create separation without losing the dark-room feel.

## Typography

The typographic system balances professional readability with a technical edge. 

- **Hanken Grotesk** is used for impactful headers and large data points (like the Match Index), providing a modern, sharp geometric feel.
- **Inter** handles the heavy lifting for body copy and descriptions, ensuring legibility in dense report summaries.
- **JetBrains Mono** (or a similar technical mono) is utilized for metadata, "Confidence" IDs, and table headers to reinforce the intelligence/developer-centric nature of the platform.
- **Hierarchy Rule:** Use all-caps with generous letter spacing for section headers (e.g., "TECHNOLOGY EVIDENCE LOGS") to create a dossier-style structure.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model. The sidebar remains fixed at a narrow width to maximize the "Command Center" feel, while the main content area utilizes a multi-column grid that reflows based on data importance.

- **Grid Strategy:** A 12-column system is used for the main dashboard. Cards typically span 4 columns (for metrics) or 8-12 columns (for long-form intelligence summaries).
- **Density:** The design favors "Information Density" over excessive whitespace. Gutters are kept tight (1.5rem) to maintain a cohesive, "single-pane-of-glass" view.
- **Sidebars:** Navigation utilizes thin, vertical borders rather than background color shifts to indicate the menu area, keeping the focus on the central data.

## Elevation & Depth

This system avoids soft shadows in favor of **Tonal Layering** and **Subtle Outlines**. Depth is communicated through structural containment:

- **Base Layer:** Pure black (`#000000`) for the application background.
- **Surface Layer:** Deep charcoal (`#111111`) for primary cards and content modules.
- **Structural Borders:** 1px solid borders (`#262626`) are used to define every card and table row. 
- **Active State:** Instead of elevation, active elements use a "rim-light" effect—a thin amber border or a subtle 5% amber overlay to indicate focus.
- **Glass Effects:** Use sparingly only on top-level modals or "floating" export menus, with a high blur (20px) and low opacity (10%).

## Shapes

The shape language is "Soft-Technical." Elements use minimal rounding to maintain a serious, architectural feel without the harshness of true 90-degree corners.

- **Primary Radius:** 4px (Soft) for all cards, input fields, and status badges.
- **Large Components:** Containers and main dashboard wrappers may use up to 8px.
- **Interactive Elements:** Buttons and tags follow the 4px rule to appear "cut" rather than "molded."

## Components

### Buttons & Inputs
- **Primary Button:** Solid Amber (`#F59E0B`) with black text. No gradients.
- **Secondary/Outline:** 1px Amber border with transparent background and amber text.
- **Search Inputs:** Darkened background (`#050505`) with a 1px border. Use monospaced font for placeholder text.

### Data Cards
- **The "Match Index" Card:** Features a large display number (Amber) next to a progress track. The card header is always in `label-caps`.
- **The "Evidence Log" Table:** A high-density list with alternating row colors or subtle 1px dividers. Skill names are bolded; "Verdicts" are contained in high-contrast status chips.

### Status Chips
- **Validated:** Emerald green background with a low-opacity tint, emerald text.
- **Surface Level:** Neutral gray background, white text.
- **No Evidence:** Deep red tint, bright red text.
- All chips use `label-caps` and are strictly rectangular with 2px rounding.

### Indicators
- **Dashed Lines:** Use dashed vertical/horizontal lines (Amber, 20% opacity) for "Analysis" sections or to connect related technical evidence points.