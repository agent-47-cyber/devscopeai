---
name: Graphite Luxury
colors:
  surface: '#111317'
  surface-dim: '#111317'
  surface-bright: '#37393e'
  surface-container-lowest: '#0c0e12'
  surface-container-low: '#1a1c20'
  surface-container: '#1e2024'
  surface-container-high: '#282a2e'
  surface-container-highest: '#333539'
  on-surface: '#e2e2e8'
  on-surface-variant: '#d1c5b6'
  inverse-surface: '#e2e2e8'
  inverse-on-surface: '#2f3035'
  outline: '#9a8f81'
  outline-variant: '#4e463a'
  surface-tint: '#e5c187'
  primary: '#f3ce93'
  on-primary: '#422c01'
  primary-container: '#d6b37a'
  on-primary-container: '#5d4516'
  inverse-primary: '#755a2a'
  secondary: '#c2c6d3'
  on-secondary: '#2c313a'
  secondary-container: '#424751'
  on-secondary-container: '#b1b5c1'
  tertiary: '#c3d4fc'
  on-tertiary: '#1f3050'
  tertiary-container: '#a7b8df'
  on-tertiary-container: '#38496a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdeaa'
  primary-fixed-dim: '#e5c187'
  on-primary-fixed: '#271900'
  on-primary-fixed-variant: '#5b4314'
  secondary-fixed: '#dee2ef'
  secondary-fixed-dim: '#c2c6d3'
  on-secondary-fixed: '#171c25'
  on-secondary-fixed-variant: '#424751'
  tertiary-fixed: '#d7e2ff'
  tertiary-fixed-dim: '#b5c7ee'
  on-tertiary-fixed: '#071b3a'
  on-tertiary-fixed-variant: '#364768'
  background: '#111317'
  on-background: '#e2e2e8'
  surface-variant: '#333539'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-sm:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  mono-data:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '450'
    lineHeight: '1.4'
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
  gutter: 24px
  sidebar-width: 260px
  max-content-width: 1200px
---

## Brand & Style
The design system is engineered for **Candidate Intelligence**, prioritizing precision, authority, and professional focus. It adopts a **Premium Minimalist** aesthetic, moving away from ephemeral "AI-style" trends in favor of a "software-first" architecture inspired by high-performance engineering tools and professional editorial design.

The emotional response should be one of **calm confidence and absolute clarity**. The interface acts as a quiet, sophisticated canvas for complex data, using a "Graphite" foundation to reduce cognitive load while employing a refined "Bronze" accent to denote high-value actions and intelligence insights.

Key visual principles:
- **Functional Sophistication:** Every element has a purpose; ornamentation is replaced by intentional spacing and structural integrity.
- **Monochromatic Depth:** Depth is achieved through a strict hierarchy of dark surfaces rather than traditional shadows.
- **Precision Engineering:** Sharp execution of borders, consistent 4px rhythms, and high-contrast typography.

## Colors
The palette is rooted in a **Deep Graphite** spectrum, creating a low-glare environment for prolonged professional use. 

- **The Graphite Core:** The background and surface colors use subtle shifts in value to create structural separation without relying on heavy lines.
- **The Bronze Accent:** Used sparingly for primary calls-to-action, active states, and "Intelligence" indicators. It represents premium value and human-centric insight.
- **Semantic Clarity:** Success, Warning, and Error colors are desaturated to maintain the professional "Graphite" mood while remaining distinct for rapid status recognition.

## Typography
The typography system utilizes **Inter** for its exceptional legibility and neutral, professional character. 

- **Confidence in Scale:** Large display headings are used for top-level navigation and candidate names to establish an immediate focal point.
- **Mono for Data:** **JetBrains Mono** is introduced for technical metadata, timestamps, and score percentages to emphasize the "Intelligence" and "Platform" nature of the product.
- **Hierarchy through Contrast:** Use `text-primary` for headlines, `text-secondary` for body, and `text-muted` for labels and secondary metadata.
- **Micro-labels:** Use the `label-caps` style for sidebar category headers and section dividers to create a rhythmic, structured layout.

## Layout & Spacing
This design system uses a **Fixed-Fluid Hybrid** layout. 

- **Navigation:** A fixed left sidebar (260px) serves as the primary anchor. 
- **Content Area:** Content follows a 12-column grid within a maximum width of 1200px. For data-heavy "Evidence" views, the layout can expand to a fluid 100% width to maximize horizontal scanning of tables.
- **Rhythm:** A 4px baseline grid ensures tight alignment. Use `lg` (24px) for most container padding and `xl` (40px) for vertical section breathing room.
- **Mobile:** On small screens, the sidebar collapses into a bottom navigation bar or a hidden drawer, and margins reduce from 24px to 16px.

## Elevation & Depth
Depth is created through **Tonal Layering** rather than traditional drop shadows.

1.  **Level 0 (Base):** `#0F1115` – The workspace floor.
2.  **Level 1 (Surface):** `#161A20` – Main content cards and sidebar.
3.  **Level 2 (Elevated):** `#1D222B` – Modals, dropdowns, and active state overlays.

**Borders:** Use a 1px solid border of `#2B313D` for all containers. This creates a crisp, architectural feel that defines space without adding visual weight.

**Shadows:** When necessary (e.g., for detached Modals), use a "Strict Shadow": `0 12px 32px -8px rgba(0, 0, 0, 0.5)`. Avoid soft, colored glows except for specific Bronze accent interactions.

## Shapes
The shape language is **Soft (0.25rem)**. 

This subtle rounding strikes a balance between the clinical feel of sharp corners and the overly casual nature of fully rounded UI. 
- **Small Elements (0.25rem):** Buttons, input fields, tags/chips.
- **Medium Elements (0.5rem):** Content cards, data tables, modally triggered surfaces.
- **Interactive States:** Avoid "Pill" shapes for buttons; maintain the 4px radius to preserve the professional, structured aesthetic.

## Components
- **Primary Buttons:** Solid Bronze (`#D6B37A`) with dark text (`#0F1115`). On hover, apply a subtle `0 0 12px rgba(214, 179, 122, 0.3)` micro-glow.
- **Secondary/Ghost Buttons:** Transparent background with `#2B313D` border and `#F6F7F9` text.
- **Data Tables:** Use a header with `label-caps` typography. Row separators are 1px `#2B313D`. Hover states on rows use the Surface-Elevated color (`#1D222B`).
- **Evidence Cards:** Use a Level 1 surface with a 1px border. Title in `headline-sm`. Metadata (source, timestamp) in `mono-data` with `text-muted` color.
- **Charts:** 
    - **Sparklines:** 1.5px stroke width in Success (`#6FAF8F`) or Bronze. No area fill.
    - **Bar Charts:** Flat color blocks (no gradients). Use `#2B313D` for the background track (empty state).
- **Input Fields:** Background is `#0F1115` with a `#2B313D` border. Focus state changes border to `#D6B37A`.
- **Micro-labels:** Used in the sidebar and above headers to provide context without taking up visual real estate.