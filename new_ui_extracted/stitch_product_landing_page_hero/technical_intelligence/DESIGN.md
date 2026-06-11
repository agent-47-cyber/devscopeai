---
name: Technical Intelligence
colors:
  surface: '#101416'
  surface-dim: '#101416'
  surface-bright: '#363a3c'
  surface-container-lowest: '#0b0f11'
  surface-container-low: '#191c1e'
  surface-container: '#1d2022'
  surface-container-high: '#272a2d'
  surface-container-highest: '#323538'
  on-surface: '#e0e3e6'
  on-surface-variant: '#e0c0b1'
  inverse-surface: '#e0e3e6'
  inverse-on-surface: '#2d3133'
  outline: '#a78b7d'
  outline-variant: '#584237'
  surface-tint: '#ffb690'
  primary: '#ffb690'
  on-primary: '#552100'
  primary-container: '#f97316'
  on-primary-container: '#582200'
  inverse-primary: '#9d4300'
  secondary: '#c5c6cc'
  on-secondary: '#2e3135'
  secondary-container: '#44474c'
  on-secondary-container: '#b3b5ba'
  tertiary: '#93ccff'
  on-tertiary: '#003351'
  tertiary-container: '#00a2f4'
  on-tertiary-container: '#003554'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbca'
  primary-fixed-dim: '#ffb690'
  on-primary-fixed: '#341100'
  on-primary-fixed-variant: '#783200'
  secondary-fixed: '#e1e2e8'
  secondary-fixed-dim: '#c5c6cc'
  on-secondary-fixed: '#191c20'
  on-secondary-fixed-variant: '#44474c'
  tertiary-fixed: '#cde5ff'
  tertiary-fixed-dim: '#93ccff'
  on-tertiary-fixed: '#001d32'
  on-tertiary-fixed-variant: '#004b74'
  background: '#101416'
  on-background: '#e0e3e6'
  surface-variant: '#323538'
typography:
  headline-display:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
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
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.4'
  body-base:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.5'
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
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
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  container-max: 1280px
---

## Brand & Style
The design system is engineered for developers and technical decision-makers. It prioritizes utility, data density, and structural clarity over marketing-centric aesthetics. The visual language is deeply rooted in **Minimalism** and **Software-first functionalism**, drawing inspiration from precision tools like code editors and command-line interfaces.

The brand personality is authoritative, precise, and efficient. It avoids "fluff"—eliminating shadows, gradients, and decorative blurs in favor of rigid structural lines and intentional negative space. The goal is to evoke a sense of focused intelligence, where the interface stays out of the way of the work.

## Colors
The palette is a strictly controlled dark aesthetic designed for long-duration focus. 

- **Foundation:** The deep `#090B0F` background provides a high-contrast base for the lighter surface tiers.
- **Tiers:** Surfaces move from `#111418` to `#171B22` to indicate hierarchy, separated by sharp 1px `#252A33` borders.
- **Typography:** Primary text uses a near-white for maximum legibility. Secondary and Muted tones are used to create information hierarchy and de-emphasize metadata.
- **Accent:** Orange (`#F97316`) is the only chromatic element. It is used with extreme restraint—reserved only for active states, primary call-to-actions, or critical focus indicators.

## Typography
This design system utilizes **Geist** for its systematic, technical rhythm. It strikes a balance between editorial impact in headlines and high-density legibility in body text.

- **Headlines:** Large and confident. Use `headline-display` for hero sections with tight leading to maintain a cohesive block feel.
- **Body:** Set at `14px` and `13px` to facilitate high-density information architecture. Line height is kept generous enough to ensure readability in technical documentation.
- **Labels:** Monospaced fonts (JetBrains Mono) are utilized for metadata, tags, and code-adjacent labels to differentiate them from prose.

## Layout & Spacing
The system uses a **Fixed Grid** model for structured dashboards and a **Fluid** model for content-heavy views. 

- **Grid:** A 12-column grid is the standard for desktop.
- **Density:** Spacing is built on a 4px baseline unit. In application views, compact spacing is preferred (e.g., 8px between related inputs, 16px between cards).
- **Reflow:** On mobile, margins shrink to 16px, and multi-column layouts stack vertically. Complex data tables should implement horizontal scrolling with sticky headers/columns rather than reflowing into cards to maintain technical utility.

## Elevation & Depth
Depth is communicated through **Tonal Layering** and **1px Borders**. Shadows are entirely omitted.

1. **Floor:** `#090B0F` (Main background).
2. **Surface:** `#111418` (Cards, sidebars, secondary panels).
3. **Elevated:** `#171B22` (Modals, popovers, or active elements).

All surface changes must be reinforced by a `1px` border using the `#252A33` token. This creates a "blueprinted" look, where every element feels nested and architecturally sound. Interaction states (hover) should be signaled by subtle border color shifts to a slightly lighter grey or the primary orange.

## Shapes
Shapes are disciplined and "Soft-Square". A base roundedness of `4px` (Soft) is used for buttons, inputs, and cards. This provides just enough visual comfort without losing the technical, professional edge of a sharp-cornered UI. 

Large containers and modal overlays should not exceed `8px` (rounded-lg) radius.

## Components

### Buttons
- **Primary:** Background `#F97316`, Text `#090B0F`, Bold weight. No border.
- **Secondary:** Background transparent, Border 1px `#252A33`, Text `#F5F7FA`.
- **Ghost:** No background or border. Text `#9AA4B2`. Hover state turns text `#F5F7FA`.

### Input Fields
- Background `#090B0F`, Border 1px `#252A33`, Corner radius `4px`.
- Focus state: Border color changes to `#F97316`. No outer glow/shadow.

### Cards
- Background `#111418`, Border 1px `#252A33`. 
- Content within cards should use `label-mono` for headers to maintain the "software tool" aesthetic.

### Chips & Tags
- Small, monospaced text. Background `#171B22`, Border 1px `#252A33`. 
- For "Status" indicators, use a small 6px circular dot next to the label.

### Data Tables
- Header background `#111418`, Border-bottom 1px `#252A33`.
- Row hover: Background `#171B22`.
- Typography: `body-sm` for maximum data visibility.