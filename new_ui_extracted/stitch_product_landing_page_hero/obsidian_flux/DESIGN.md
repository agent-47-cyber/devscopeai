---
name: Obsidian Flux
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
  on-surface-variant: '#e4beb1'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#303030'
  outline: '#ab897d'
  outline-variant: '#5b4137'
  surface-tint: '#ffb59a'
  primary: '#ffb59a'
  on-primary: '#5a1b00'
  primary-container: '#ff5c00'
  on-primary-container: '#521800'
  inverse-primary: '#a73a00'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#474746'
  on-secondary-container: '#b7b5b4'
  tertiary: '#ffb59a'
  on-tertiary: '#5b1b00'
  tertiary-container: '#fb6017'
  on-tertiary-container: '#521800'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbce'
  primary-fixed-dim: '#ffb59a'
  on-primary-fixed: '#370e00'
  on-primary-fixed-variant: '#802a00'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#ffdbcf'
  tertiary-fixed-dim: '#ffb59a'
  on-tertiary-fixed: '#380d00'
  on-tertiary-fixed-variant: '#802a00'
  background: '#131313'
  on-background: '#e2e2e2'
  surface-variant: '#353535'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 56px
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
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0em
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.1em
  mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.4'
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
  margin: 32px
  section-gap: 120px
  card-padding: 24px
---

## Brand & Style

The design system is engineered for high-performance developer environments where precision, speed, and technical authority are paramount. It targets senior engineers and enterprise architects who demand a "software-first" aesthetic that prioritizes content density and structural clarity over decorative flair.

The style is **Technical Minimalism with a Kinetic Edge**. It leans heavily into a "Lights Out" dark mode that minimizes eye strain during long coding sessions while using aggressive, high-contrast orange accents to denote action and status. The aesthetic draws from IDE interfaces and terminal emulators, utilizing sharp geometry, monochromatic surfaces, and subtle light-leak effects to create a sense of depth and focus. The emotional response is one of controlled power—a professional tool that feels as fast as the code it generates.

## Colors

The palette is anchored in absolute zero (#000000) to ensure perfect contrast and deep black levels on OLED displays. 

- **Core Surfaces**: The primary background is pure black. Secondary surfaces use "Charcoal" (#1A1A1A) and "Steel" (#262626) to create layered depth without relying on drop shadows.
- **Accents**: The "Flux Orange" (#FF5C00) is the signature interactive color, used sparingly for primary actions, progress indicators, and focal highlights.
- **Typography**: Text uses a hierarchy of "High-Contrast White" (#FFFFFF) for headings, "Muted Silver" (#A3A3A3) for body text, and "Deep Grey" (#525252) for secondary metadata.
- **Semantic Logic**: Status colors are saturated and vibrant to stand out against the dark canvas, ensuring critical errors or successful deployments are immediately visible.

## Typography

This design system utilizes **Geist** for its systematic, neutral, and highly legible character, bridging the gap between design and code. **JetBrains Mono** is employed for labels, badges, and technical data to reinforce the developer-centric nature of the platform.

Headings should be tightly tracked and bold, creating a heavy visual "anchor" for sections. Body text maintains generous line height for readability in documentation-heavy views. Small caps labels are used for category headers and status badges to provide clear typographic distinction from interactive body elements.

## Layout & Spacing

The layout philosophy follows a **Hybrid Density Model**. 
- **Macro-Layout**: High-level marketing or landing pages use a 12-column fluid grid with significant vertical "breathing room" (120px+) to emphasize premium quality and focus.
- **Micro-Layout**: Within dashboards and cards, spacing becomes dense and systematic, based on a 4px grid. This allows for complex data visualization and multi-panel interfaces typical of IDEs.

**Breakpoints:**
- **Mobile (<768px)**: 4 columns, 16px margins. Headlines scale down significantly.
- **Tablet (768px - 1200px)**: 8 columns, 24px margins. Cards reflow to 2-column stacks.
- **Desktop (>1200px)**: 12 columns, 32px+ margins. Max-width container at 1440px for readability.

## Elevation & Depth

This design system rejects traditional soft shadows in favor of **Tonal Layering** and **Luminous Accents**.

1.  **Surfaces**: Hierarchy is created by moving from #000000 (Base) to #1A1A1A (Cards) to #262626 (Overlays/Modals).
2.  **Borders**: A 1px solid border (#262626) is the primary method of separation. For interactive states, these borders can transition to #404040 or Flux Orange.
3.  **The "Orange Pulse"**: Focal points utilize a subtle background glow (radial gradient, 20% opacity Flux Orange, 150px blur) placed *behind* content to suggest energy and activity without cluttering the foreground.
4.  **Glassmorphism**: Used strictly for floating navigation bars or contextual menus, employing a backdrop blur of 12px and a 5% white tint.

## Shapes

The shape language is disciplined and "Soft-Industrial." Elements use a 0.25rem (4px) base radius to maintain a precise, technical feel while avoiding the harshness of absolute sharp corners.

- **Standard Elements**: 4px radius (Buttons, Input fields).
- **Cards/Containers**: 8px (0.5rem) radius for a slightly softer frame around high-density content.
- **Badges**: 2px or 0px for a more "terminal" or "printed" appearance.

## Components

- **Buttons**: Primary buttons are solid Flux Orange with black text (Geist Bold). Secondary buttons use a 1px border (#404040) with no fill. "Ghost" buttons for navigation use only text with a directional arrow (→) that shifts 4px on hover.
- **Status Badges**: Small, rectangular, often with a subtle #FFFFFF10 background. Text is JetBrains Mono, uppercase.
- **Cards**: Background #1A1A1A, 1px border #262626. On hover, the border brightens to #404040 and the primary icon (top-left) should subtly glow.
- **Input Fields**: Dark backgrounds (#0A0A0A) with a bottom-only border or a very subtle full stroke. Focus state is a 1px Flux Orange border.
- **Terminal Icons**: All icons should be stroke-based (1.5px weight), utilizing metaphors from CLI environments (e.g., `>_`, `{}`, `[]`).
- **Progress Bars**: Thin (2px or 4px) lines. Completed segments use a gradient from #E65100 to #FF5C00.