---
name: Obsidian Amber
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
  on-surface-variant: '#d4c5ab'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#9c8f78'
  outline-variant: '#504532'
  surface-tint: '#fbbc00'
  primary: '#ffe2ab'
  on-primary: '#402d00'
  primary-container: '#ffbf00'
  on-primary-container: '#6d5000'
  inverse-primary: '#795900'
  secondary: '#c8c6c5'
  on-secondary: '#303030'
  secondary-container: '#474746'
  on-secondary-container: '#b7b5b4'
  tertiary: '#b4efff'
  on-tertiary: '#003640'
  tertiary-container: '#04dcff'
  on-tertiary-container: '#005d6d'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdfa0'
  primary-fixed-dim: '#fbbc00'
  on-primary-fixed: '#261a00'
  on-primary-fixed-variant: '#5c4300'
  secondary-fixed: '#e4e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#aaedff'
  tertiary-fixed-dim: '#00d9fc'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5c'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 42px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  unit-1: 4px
  unit-2: 8px
  unit-4: 16px
  unit-6: 24px
  unit-8: 32px
  unit-12: 48px
  unit-16: 64px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
---

## Brand & Style

The design system is centered on a high-end, "obsidian" aesthetic, targeting a sophisticated audience in the finance, luxury, or high-tech sectors. The brand personality is authoritative yet enigmatic, prioritizing focus through extreme dark-mode reductionism. 

The design style is a hybrid of **Minimalism** and **Glassmorphism**, using deep blacks and translucent overlays to create a sense of infinite depth. By utilizing a near-black foundation with a singular, glowing amber accent, the UI evokes a sense of prestige and technical precision. The emotional response is one of calm, focused control.

## Colors

The palette is anchored by a near-black `#050505` background, creating a canvas where content feels illuminated rather than just displayed. 

- **Primary:** A deep, sophisticated amber (`#FFBF00`). This is used sparingly for critical actions, indicators, and brand moments to ensure it retains its visual impact without overwhelming the dark environment.
- **Surface Strategy:** Layers are defined by subtle increases in lightness rather than traditional shadows. Each elevation step uses a slightly lighter shade of grey/black to create a "stacked" effect.
- **Typography:** High-contrast white is reserved for headings, while body text uses a slightly muted grey to reduce eye strain in low-light environments.

## Typography

This design system utilizes a trio of modern sans-serifs to maintain a technical, crisp feel. **Hanken Grotesk** provides a sharp, contemporary edge for headlines. **Inter** handles body copy with its industry-leading legibility, and **Geist** is used for labels and technical data to reinforce the "developer-grade" precision of the interface.

On mobile devices, display sizes scale down aggressively to prevent text wrapping issues, while body text maintains its size to ensure accessibility. Letter spacing is tightened on large headlines for a more "locked-in" editorial look, while labels utilize increased tracking for clarity at small sizes.

## Layout & Spacing

The layout follows a **fluid grid** logic within a maximum container width of 1280px. A strict 4px baseline grid governs all spatial relationships, ensuring a rhythmic, systematic feel.

- **Desktop:** 12-column grid with 24px gutters.
- **Tablet:** 8-column grid with 20px gutters.
- **Mobile:** 4-column grid with 16px margins.

Whitespace is used as a structural element. In this dark aesthetic, generous padding around components prevents the "crushed" feeling often found in dark mode designs. Negative space should be treated as "active" space, guiding the eye toward the amber-accented focal points.

## Elevation & Depth

In this design system, depth is communicated through **Tonal Layers** and **Subtle Outlines**. Traditional shadows are largely avoided, as they are invisible against the `#050505` background.

1. **Layering:** Components "lift" off the page by becoming lighter in color. The higher the elevation, the lighter the surface hex code.
2. **Outlines:** To define boundaries between very dark surfaces, a 1px "inner-glow" or low-opacity border (`rgba(255, 255, 255, 0.08)`) is used.
3. **Glassmorphism:** Overlays (like navigation bars or modals) use a `background-blur` effect with a semi-transparent dark tint. This maintains context while providing a premium, tactile feel.

## Shapes

The shape language is **Soft** and architectural. We avoid the playfulness of fully rounded "pill" shapes in favor of precise, subtle radii.

- **Standard Elements:** 0.25rem (4px) corner radius for buttons, inputs, and small widgets.
- **Containers:** 0.75rem (12px) for cards and modals to provide a distinct, framed appearance against the background.
- **Icons:** Should follow the same sharp/soft balance—geometric lines with minimal rounding at terminals.

## Components

- **Buttons:** Primary buttons are solid Amber (`#FFBF00`) with near-black text. Secondary buttons use a dark-grey surface with a subtle white border. Ghost buttons are text-only with the Amber color.
- **Inputs:** Fields are dark (`#0A0A0A`) with a 1px border that glows Amber only when focused. Placeholder text should be muted (`#52525B`).
- **Cards:** Cards do not have shadows. They are defined by a slightly lighter surface (`#121212`) and a very thin, low-contrast border.
- **Chips/Tags:** Used for categorization, these should be dark with Amber text, or transparent with an Amber border.
- **Lists:** List items are separated by subtle 1px dividers (`#1A1A1A`). Hover states should trigger a slight background lightening to `#1A1A1A`.
- **Status Indicators:** While Amber is the primary accent, semantic colors (Success Green, Error Red) should be used in desaturated "neon" tones to fit the obsidian aesthetic without clashing.