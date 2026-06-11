---
name: Obsidian Amber
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1b1b'
  surface-container: '#1f1f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#ddc1ae'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#303030'
  outline: '#a48c7a'
  outline-variant: '#564334'
  surface-tint: '#ffb77d'
  primary: '#ffb77d'
  on-primary: '#4d2600'
  primary-container: '#ff8c00'
  on-primary-container: '#623200'
  inverse-primary: '#904d00'
  secondary: '#c7c6c6'
  on-secondary: '#303031'
  secondary-container: '#464747'
  on-secondary-container: '#b6b5b5'
  tertiary: '#85cfff'
  on-tertiary: '#00344c'
  tertiary-container: '#00b5fc'
  on-tertiary-container: '#004360'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdcc3'
  primary-fixed-dim: '#ffb77d'
  on-primary-fixed: '#2f1500'
  on-primary-fixed-variant: '#6e3900'
  secondary-fixed: '#e3e2e2'
  secondary-fixed-dim: '#c7c6c6'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#464747'
  tertiary-fixed: '#c7e7ff'
  tertiary-fixed-dim: '#85cfff'
  on-tertiary-fixed: '#001e2e'
  on-tertiary-fixed-variant: '#004c6c'
  background: '#131313'
  on-background: '#e2e2e2'
  surface-variant: '#353535'
  surface-deep: '#0A0A0A'
  surface-muted: '#171717'
  border-subtle: '#262626'
  vivid-amber: '#F97316'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
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
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '600'
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
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  container-max: 1440px
---

## Brand & Style

The design system is engineered for deep focus and high-performance computing environments. It targets developers and technical professionals who require a UI that recedes into the background, allowing the content—code and logic—to take center stage.

The aesthetic follows a **High-Contrast Dark Minimalism** approach. It utilizes an "Obsidian" foundation (true blacks and deep charcoals) punctuated by "Amber" (vivid orange) accents to signify action and intelligence. The style is precise, technical, and efficient, drawing inspiration from modern IDEs and developer tools. It prioritizes clarity through generous negative space and a strict hierarchy of information, ensuring a low-friction user experience during extended periods of use.

## Colors

The palette is optimized for OLED displays and reduced eye strain. 

- **Primary:** The signature Amber (#FF8C00/F97316) is used sparingly for primary actions, success states, and critical highlights.
- **Surface Strategy:** The background is absolute black (#000000). Secondary surfaces use a stepped charcoal scale (#0A0A0A to #171717) to create functional depth without relying on heavy shadows.
- **Typography Colors:** Primary text is Pure White (#FFFFFF) for maximum legibility. Secondary text uses a neutral gray (#737373) to de-emphasize metadata and non-interactive labels. 
- **Accents:** Vivid Amber is reserved for focus states and "AI-active" indicators, creating a "glowing" effect against the dark backdrop.

## Typography

This design system utilizes a dual-font strategy to balance approachability with technical precision.

- **Inter** is the primary typeface for all UI elements, navigation, and prose. It provides exceptional legibility at small sizes and a modern, neutral tone.
- **JetBrains Mono** is utilized for code blocks, terminal outputs, and system-level labels (e.g., status badges, file paths). This reinforces the developer-centric nature of the product.

All typography should adhere to a strict vertical rhythm. Large headlines use tighter tracking (letter-spacing) to appear more cohesive, while small mono-spaced labels use expanded tracking for better scannability.

## Layout & Spacing

The layout is built on a **4px base unit** and a **12-column fluid grid** for desktop environments.

- **Desktop:** 12 columns, 24px gutters, 32px side margins. Content is typically centered with a maximum width of 1440px to prevent excessive line lengths.
- **Tablet:** 8 columns, 16px gutters, 24px margins.
- **Mobile:** 4 columns, 16px gutters, 16px margins. 

Spacing between components should follow a geometric progression (4, 8, 16, 24, 32, 48, 64). Use generous internal padding within code blocks and chat containers to ensure code snippet readability.

## Elevation & Depth

In a true-black environment, depth is communicated through **Tonal Layering** and **Subtle Outlines** rather than traditional drop shadows.

- **Level 0 (Background):** #000000. Used for the main app canvas.
- **Level 1 (Surfaces):** #0A0A0A. Used for sidebars and persistent navigation.
- **Level 2 (Cards/Overlays):** #171717. Used for floating elements, modals, and input fields.
- **Interactions:** Elements at Level 1 or 2 should feature a 1px solid border (#262626) to define their edges against the black background.

When an element requires focus, use a 1px solid border of the Primary Amber color or a very subtle outer glow (0px 0px 8px rgba(255, 140, 0, 0.2)).

## Shapes

The shape language is "Soft-Technical." Elements use a **0.25rem (4px)** base radius to appear modern and refined without feeling overly "bubbly" or organic. 

- **Small Components:** Buttons, inputs, and chips use the base 4px radius.
- **Large Components:** Modals and containers use the `rounded-lg` (8px) radius.
- **Exceptions:** Search bars and specific action pills may use a full pill shape (999px) to differentiate them from static content containers.

## Components

- **Buttons:** 
  - *Primary:* Solid Amber (#FF8C00) with Black text. 
  - *Secondary:* Transparent with a #262626 border and White text.
  - *Ghost:* No border/background, Gray (#737373) text that turns White on hover.
- **Input Fields:** Background #0A0A0A, 1px border #262626. On focus, the border shifts to Amber.
- **Chips/Badges:** Use JetBrains Mono. Small, rectangular with subtle 2px radius and #171717 background.
- **Code Blocks:** Use a dedicated #0A0A0A background. Syntax highlighting should prioritize high contrast against the dark surface, utilizing the Amber accent for key functions/variables.
- **Lists:** Clean, borderless rows with 1px #262626 separators. Hover states should lighten the background slightly to #171717.
- **Cards:** No shadows. Defined by a #171717 surface and a 1px #262626 border.