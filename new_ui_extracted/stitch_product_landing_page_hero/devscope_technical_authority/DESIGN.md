---
name: DevScope Technical Authority
colors:
  surface: '#16130f'
  surface-dim: '#16130f'
  surface-bright: '#3c3934'
  surface-container-lowest: '#100e0a'
  surface-container-low: '#1e1b17'
  surface-container: '#221f1b'
  surface-container-high: '#2d2925'
  surface-container-highest: '#38342f'
  on-surface: '#e9e1da'
  on-surface-variant: '#d1c5b5'
  inverse-surface: '#e9e1da'
  inverse-on-surface: '#34302b'
  outline: '#9a8f81'
  outline-variant: '#4e463a'
  surface-tint: '#e6c184'
  primary: '#e6c184'
  on-primary: '#422c00'
  primary-container: '#c9a66b'
  on-primary-container: '#533b09'
  inverse-primary: '#765a26'
  secondary: '#67df70'
  on-secondary: '#00390d'
  secondary-container: '#27a640'
  on-secondary-container: '#00320a'
  tertiary: '#b3c7f0'
  on-tertiary: '#1c3051'
  tertiary-container: '#98acd3'
  on-tertiary-container: '#2c4061'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdea9'
  primary-fixed-dim: '#e6c184'
  on-primary-fixed: '#271900'
  on-primary-fixed-variant: '#5c4211'
  secondary-fixed: '#83fc89'
  secondary-fixed-dim: '#67df70'
  on-secondary-fixed: '#002105'
  on-secondary-fixed-variant: '#005317'
  tertiary-fixed: '#d6e3ff'
  tertiary-fixed-dim: '#b3c7ef'
  on-tertiary-fixed: '#031b3b'
  on-tertiary-fixed-variant: '#334769'
  background: '#16130f'
  on-background: '#e9e1da'
  surface-variant: '#38342f'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.02em
  code-md:
    fontFamily: jetbrainsMono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.5'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-max: 1280px
  gutter: 16px
---

## Brand & Style
The design system is engineered for elite software engineering environments, prioritizing information density, technical rigor, and a "software-first" aesthetic. It targets developers and technical leaders who require a high-performance workspace that feels authoritative yet understated.

The style is **Professional Minimalism**. It avoids visual noise like gradients, glows, or blurs, relying instead on a precise 1px border system and a tiered monochromatic surface architecture. The emotional response is one of "Technical Confidence"—where the UI recedes to let the data and code take center stage, punctuated only by a premium bronze accent that denotes high-value insights.

## Colors
The palette is rooted in a deep, low-fatigue dark mode. 
- **Core Tones:** The background (#0D1117) and tiered surfaces provide clear structural separation without needing elevation shadows.
- **The Accent:** The Gold/Bronze (#C9A66B) is used sparingly for primary actions, critical metrics, and "Enterprise" tier features, creating a sophisticated contrast against the cold grayscale UI.
- **Functional Colors:** Success, Warning, and Error colors follow industry standards but are calibrated for high legibility against the dark backgrounds.

## Typography
This design system utilizes a dual-font approach to balance editorial authority with functional utility.
- **Headlines:** Geist is used for its geometric precision. Large displays use tight tracking (-0.04em) to create a confident, "locked-in" look.
- **Body & Reports:** Inter provides maximum legibility for long-form data. For report bodies, use `body-lg` with 1.6 line height to ensure high readability during deep analysis.
- **Labels & UI:** Small UI elements use Geist with slightly increased letter spacing and medium weights to maintain clarity at high densities.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model. While the dashboard containers can expand, the content within adheres to a strict 8px/4px rhythmic grid to ensure alignment across complex data sets.

- **Desktop:** 12-column grid, 24px margins, 16px gutters.
- **Tablet:** 8-column grid, 16px margins, 16px gutters.
- **Mobile:** 4-column grid, 16px margins, 12px gutters.

The spacing philosophy emphasizes "Functional Grouping." Use `sm` (8px) to relate items and `lg` (24px) to separate distinct sections or cards.

## Elevation & Depth
In this design system, depth is communicated through **Tonal Layering** rather than shadows. 
- **Level 0 (Base):** #0D1117 — Reserved for the application background.
- **Level 1 (Surface):** #161B22 — Used for the primary content area, sidebars, and main panels.
- **Level 2 (In-lay):** #1F2630 — Used for secondary elements like input fields, code blocks, or nested cards.

All surfaces are separated by a consistent 1px border (#30363D). Hover states should be indicated by a subtle shift in background color or a 1px border color change to #8B949E, never by adding a shadow.

## Shapes
Shapes are disciplined and architectural. A base radius of **4px (Soft)** is applied to buttons, cards, and input fields. This small radius maintains a "hard" technical feel while preventing the UI from feeling sharp or aggressive. Larger components like modals should not exceed an 8px radius.

## Components
- **Buttons:** Primary buttons use the #C9A66B background with #0D1117 text. Secondary buttons are #1F2630 with a 1px border (#30363D). No gradients.
- **Insight Cards:** Use #161B22 background. Titles should use `headline-md`. Borders are mandatory. Use a small 4px vertical "accent strip" on the left edge to denote status (e.g., success green or error red).
- **High-Density Tables:** Rows have a 1px bottom border. Header background is #1F2630 with uppercase `label-md` text. Cell padding is tight (8px vertical).
- **Inputs:** Background #0D1117, border #30363D. On focus, the border changes to the #C9A66B accent. 
- **Status Chips:** Small, rectangular (2px radius). Use a subtle #1F2630 background and colored text/dot for status indicators.
- **Evidence Panels:** Specialized side-drawers for deep-dive metrics. Use `code-md` for raw data and #1F2630 for the panel background to differentiate from the primary surface.