---
name: DevScope Design System
colors:
  surface: '#fcf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fcf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f4'
  surface-container: '#f0edee'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e5e2e3'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45464c'
  inverse-surface: '#303031'
  inverse-on-surface: '#f3f0f1'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#575e70'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#141b2b'
  on-primary-container: '#7d8497'
  inverse-primary: '#c0c6db'
  secondary: '#585f6c'
  on-secondary: '#ffffff'
  secondary-container: '#dce2f3'
  on-secondary-container: '#5e6572'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#261906'
  on-tertiary-container: '#968065'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce2f7'
  primary-fixed-dim: '#c0c6db'
  on-primary-fixed: '#141b2b'
  on-primary-fixed-variant: '#404758'
  secondary-fixed: '#dce2f3'
  secondary-fixed-dim: '#c0c7d6'
  on-secondary-fixed: '#151c27'
  on-secondary-fixed-variant: '#404754'
  tertiary-fixed: '#f9debf'
  tertiary-fixed-dim: '#dcc2a4'
  on-tertiary-fixed: '#261906'
  on-tertiary-fixed-variant: '#55442d'
  background: '#fcf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e5e2e3'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-code:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 0.25rem
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
  xl: 2.5rem
  gutter: 1rem
  margin: 2rem
---

## Brand & Style
The brand personality is authoritative yet quiet, prioritizing utility and intellectual clarity over visual flair. It is designed for high-performance recruiting and engineering teams who require a "tool" rather than a "toy." 

The design style is **Modern Minimalist** with a focus on **Structural Clarity**. It draws inspiration from the utility of GitHub and the refined editorial spacing of Apple. The aesthetic avoids all ephemeral trends (gradients, glows, vibrant saturation) in favor of a "paper-and-ink" digital philosophy. Success is measured by how quickly a user can parse complex candidate data without cognitive friction.

## Colors
The palette is strictly monochromatic and functional. 
- **Background & Surface:** We use a subtle off-white (`#FAFAF8`) for the base canvas to reduce eye strain, while active surfaces and cards use pure white (`#FFFFFF`) to create a natural "lift" without relying on heavy shadows.
- **Accents:** Color is reserved exclusively for state and utility. There are no decorative accents. The "Primary" action color is the same deep slate as the text, ensuring the interface feels grounded and intentional.
- **Borders:** A warm stone-gray is used to define boundaries. These should be thin (1px) and used to create a clear information architecture.

## Typography
The system uses a pairing of **Geist** for structural elements (headings, labels, UI controls) and **Inter** for long-form content and candidate data. 

Hierarchy is established through weight and scale rather than color. Large display titles use a tighter letter-spacing to appear more "designed" and authoritative. Labels should be used sparingly for metadata (e.g., candidate tags, timestamps) and are rendered in a slightly tracking-heavy uppercase Geist to distinguish them from body content.

## Layout & Spacing
This design system utilizes a **Fixed Grid** on desktop and a **Fluid Grid** on mobile. 
- **Desktop:** A 12-column system with a max-width of 1440px. Content should be centered with generous 2.5rem (xl) outer margins.
- **Information Density:** For data-heavy views (Candidate Pipelines), use the "sm" (8px) and "md" (16px) spacing units to keep elements compact but legible. 
- **White Space:** Use white space as a separator instead of lines wherever possible. For instance, group related candidate attributes with 1rem spacing and separate major sections with 2.5rem.

## Elevation & Depth
Depth is created through **Tonal Layering** and **Subtle Outlines**. 
- **Layer 0 (Background):** #FAFAF8.
- **Layer 1 (Card/Surface):** #FFFFFF with a 1px #E7E5E4 border.
- **Shadows:** Use only one shadow style—an extremely soft, diffused ambient shadow (0px 1px 3px rgba(0,0,0,0.05))—to indicate that a surface is interactive or floating (e.g., a dropdown or a modal).
- **Interactivity:** Elements should not "pop" off the screen. Instead, use subtle background color shifts (e.g., changing from #FFFFFF to #F5F5F4 on hover) to indicate interactivity.

## Shapes
The shape language is **Soft (0.25rem)**. This provides a professional, "tooled" feel that is more approachable than sharp corners but more serious than highly rounded "bubbly" designs. 
- Buttons and Input fields: 4px radius.
- Cards and Modals: 8px (rounded-lg).
- Profile Avatars: Should be circular to contrast against the predominantly rectangular grid.

## Components
- **Buttons:** 
  - *Primary:* Solid #111827 with white text. No gradient.
  - *Secondary:* White background, 1px #E7E5E4 border, #111827 text.
- **Inputs:** Use a 1px border. On focus, the border color changes to #111827. No glow or outer shadow on focus—just a clean, crisp stroke change.
- **Chips/Badges:** Small, 12px Geist labels with #F5F5F4 backgrounds. For "Status" badges (e.g., Hired, Rejected), use a tiny 6px colored dot next to the text rather than coloring the whole badge background.
- **Candidate Cards:** High-density layouts. Name in Headline-MD, role in Secondary Text (Body-SM). Use horizontal rules sparingly; prefer vertical spacing to separate groups of information.
- **Data Tables:** No vertical lines. Use subtle horizontal dividers (#E7E5E4). Header row should use Label-MD typography.