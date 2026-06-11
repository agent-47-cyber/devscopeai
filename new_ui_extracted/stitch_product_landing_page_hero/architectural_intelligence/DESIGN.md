---
name: Architectural Intelligence
colors:
  surface: '#111418'
  surface-dim: '#111318'
  surface-bright: '#37393e'
  surface-container-lowest: '#0c0e12'
  surface-container-low: '#1a1c20'
  surface-container: '#1e2024'
  surface-container-high: '#282a2e'
  surface-container-highest: '#333539'
  on-surface: '#e2e2e8'
  on-surface-variant: '#e0c0b1'
  inverse-surface: '#e2e2e8'
  inverse-on-surface: '#2f3035'
  outline: '#a78b7d'
  outline-variant: '#584237'
  surface-tint: '#ffb690'
  primary: '#ffb690'
  on-primary: '#552100'
  primary-container: '#f97316'
  on-primary-container: '#582200'
  inverse-primary: '#9d4300'
  secondary: '#c6c6c7'
  on-secondary: '#2f3131'
  secondary-container: '#454747'
  on-secondary-container: '#b4b5b5'
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
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#cde5ff'
  tertiary-fixed-dim: '#93ccff'
  on-tertiary-fixed: '#001d32'
  on-tertiary-fixed-variant: '#004b74'
  background: '#090B0F'
  on-background: '#e2e2e8'
  surface-variant: '#333539'
  surface-elevated: '#171B22'
  border: '#252A33'
  text-primary: '#F1F2F4'
  text-secondary: '#9BA3AF'
  text-muted: '#606A7B'
typography:
  headline-xl:
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
    letterSpacing: -0.01em
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
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
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
  margin-desktop: 48px
  margin-mobile: 16px
  max-width: 1440px
---

## Brand & Style
This design system is built on the principles of structural discipline and information density, tailored for the high-stakes environment of candidate intelligence. It prioritizes utility and clarity, drawing inspiration from high-end developer tooling and engineering documentation. 

The aesthetic is **Modern Minimalist with a Technical edge**. It rejects superficial trends like glassmorphism and glows in favor of raw structural integrity. Visual interest is generated through precise typographic hierarchies, rhythmic spacing, and a strict adherence to a modular grid. The experience should feel like a precision instrument: authoritative, permanent, and highly efficient.

## Colors
The palette is deeply anchored in a dark, monochromatic spectrum to reduce visual noise and facilitate long periods of deep work. 

- **Primary (#F97316):** A high-visibility technical orange used exclusively for critical calls to action, focus states, and meaningful status changes. It must be used sparingly to maintain its signaling power.
- **Surface Tiers:** Background and surface colors are strictly mapped to architectural layers. Higher "elevation" corresponds to slightly lighter hex values.
- **Functional Grays:** A range of low-saturation neutrals provides the hierarchy for text and borders, ensuring that the interface remains readable without being jarring.

## Typography
Typography is the primary driver of the UI's personality. We use **Geist** for its clean, geometric clarity and professional weight distribution. **JetBrains Mono** is introduced as a supporting face for labels, metadata, and data-heavy tables to reinforce the platform's "Candidate Intelligence" DNA.

Headlines should be bold and confident, utilizing tight letter spacing to feel "locked in." Body copy prioritizes legibility with generous line heights. Data points and technical identifiers always utilize the monospaced font to differentiate dynamic content from structural labels.

## Layout & Spacing
The system employs a **Fixed Grid** philosophy for desktop to maintain editorial control over information density, transitioning to a fluid model for mobile.

- **Grid:** A 12-column grid with 24px gutters.
- **Rhythm:** All vertical and horizontal spacing must be multiples of 4px.
- **Reading Widths:** Content-heavy sections (like candidate bios or interview notes) should be capped at a maximum width of 680px to ensure optimal reading comfort.
- **Technical Patterns:** Backgrounds may utilize a subtle 24px dot-grid or fine line-grid pattern in the `border` color at 10-15% opacity to provide a sense of scale and precision.

## Elevation & Depth
Depth is communicated through **Tonal Layers** and **Low-Contrast Outlines**. 

- **No Shadows:** Shadows are excluded to maintain a flat, technical aesthetic. 
- **Layering:** Hierarchy is achieved by moving from the darkest `#090B0F` (Base) to `#111418` (Card/Surface) to `#171B22` (Active/Hover/Modal). 
- **Borders:** Every container must have a 1px border using the `#252A33` color. This provides the structural "wireframe" look essential to the brand.
- **Separators:** Use thin, solid lines to divide content sections within a single surface tier.

## Shapes
The shape language is conservative and architectural. We use a **Soft (4px)** radius for standard UI components like buttons and inputs to prevent the interface from feeling sharp or aggressive, while maintaining a serious tone. 

- **Containers:** Large surfaces like cards or modals use the `rounded-lg` (8px) setting.
- **Interactive Elements:** Buttons and small tags use the `rounded` (4px) setting.
- **Icons:** Should be stroke-based (1.5px or 2px) with minimal rounding to match the typography.

## Components

### Buttons
- **Primary:** Solid `#F97316` with black text. No gradients. High-contrast focus state.
- **Secondary:** Transparent background with `#252A33` border and white text.
- **Ghost:** No border, `#9BA3AF` text, shifts to `#171B22` background on hover.

### Input Fields
Inputs are dark-filled containers (`#111418`) with a 1px border. On focus, the border changes to the Primary Accent color. Labels should always sit above the input in the monospaced font.

### Cards & Modules
Cards use the `#111418` surface. They should never have shadows; instead, they rely on the `#252A33` border for definition. Grouped content within cards should be separated by 1px horizontal rules.

### Chips & Tags
Technical metadata tags should use the monospaced font. They are styled with a subtle background and a slightly lighter border to denote "system-generated" data.

### Lists & Data Tables
Tables are the heart of the platform. Use a "no-border" approach for the outer container but include horizontal separators between rows. Headers are always in the monospaced label style for maximum data clarity.