---
name: Zest & Zinc Dark
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#bccbb9'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#869585'
  outline-variant: '#3d4a3d'
  surface-tint: '#4ae176'
  primary: '#4be277'
  on-primary: '#003915'
  primary-container: '#22c55e'
  on-primary-container: '#004b1e'
  inverse-primary: '#006e2f'
  secondary: '#ffb690'
  on-secondary: '#552100'
  secondary-container: '#ec6a06'
  on-secondary-container: '#4a1c00'
  tertiary: '#8bcfff'
  on-tertiary: '#00344d'
  tertiary-container: '#36b6fb'
  on-tertiary-container: '#004564'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6bff8f'
  primary-fixed-dim: '#4ae176'
  on-primary-fixed: '#002109'
  on-primary-fixed-variant: '#005321'
  secondary-fixed: '#ffdbca'
  secondary-fixed-dim: '#ffb690'
  on-secondary-fixed: '#341100'
  on-secondary-fixed-variant: '#783200'
  tertiary-fixed: '#c9e6ff'
  tertiary-fixed-dim: '#89ceff'
  on-tertiary-fixed: '#001e2f'
  on-tertiary-fixed-variant: '#004c6e'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  h1:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  h3:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  gutter: 24px
  margin: 32px
---

## Brand & Style

This design system is a high-performance, dark-mode evolution of a vibrant identity. It merges a "Modern Corporate" foundation with "High-Contrast" energy, creating an environment that feels tech-focused, premium, and authoritative. 

The brand personality is energetic yet disciplined. It leverages deep, nocturnal surfaces to make vibrant accents appear luminous, simulating a high-end software terminal or a premium fintech dashboard. The goal is to evoke a sense of precision and modern sophistication through clean lines, ample negative space, and aggressive contrast between the charcoal backgrounds and the neon-adjacent primary colors.

## Colors

The palette is built on a foundation of "Deep Slate" and "Charcoal" to provide a rich, multi-dimensional dark experience. 

- **Primary Green (#22C55E):** Used for primary actions, success states, and key brand moments. It must maintain a high "glow" factor against dark backgrounds.
- **Accent Orange (#F97316):** Used for secondary highlights, warnings, or interactive elements that require immediate visual distinction.
- **Neutral Palette:** Utilizes a scale of Slate grays. Backgrounds use the darkest tones (#0F172A), while cards and elevated surfaces use lighter variants (#1E293B) to create depth without relying on heavy shadows.
- **Text:** Primary text is off-white (#F8FAFC) to reduce eye strain while maintaining maximum legibility.

## Typography

This design system utilizes **Plus Jakarta Sans** across all levels to maintain a welcoming yet modern feel. 

Headlines are set with tight letter-spacing and heavy weights (Bold/ExtraBold) to feel impactful and "tech-forward." Body text favors a slightly more generous line height to ensure readability against the dark background. Labels and utility text use semi-bold or bold weights to ensure they don't get lost in the interface's high-contrast environment.

## Layout & Spacing

The design system employs a **12-column fluid grid** for web layouts and a **4-column grid** for mobile. The spacing rhythm is based on a strict **4px baseline**, ensuring mathematical harmony across all components.

Layouts should prioritize generous internal padding within containers to reinforce the "premium" feel. Use the 'lg' (24px) unit for gutters to provide elements with sufficient breathing room, preventing the dark interface from feeling cramped or cluttered.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** rather than traditional shadows. 

1.  **Base (Level 0):** The primary background color (#0F172A).
2.  **Surface (Level 1):** Raised elements like cards or navigation bars use #1E293B.
3.  **Overlay (Level 2):** Modals, menus, and tooltips use #334155.

To add a "tech" edge, use subtle **1px inner borders** (strokes) on elevated elements using a low-opacity white (10% opacity). This creates a "glint" effect that defines edges more effectively than shadows in a dark environment. If shadows are used for extreme elevation (e.g., floating modals), they should be large, very soft, and tinted with the base background color to remain natural.

## Shapes

In alignment with the **ROUND_EIGHT** specification, the system uses a consistent **8px (0.5rem)** corner radius for standard components like buttons and input fields. 

Larger containers such as cards or modals should scale to **16px (1rem)**, while specialized UI elements like tags or "pills" may use a fully rounded (32px+) radius to provide visual variety. This moderate roundedness balances the "soft/welcoming" nature of the typography with the "sharp/precise" nature of the tech-focused color palette.

## Components

- **Buttons:** Primary buttons are solid Primary Green (#22C55E) with dark text for maximum contrast. Secondary buttons use a ghost style with a 2px stroke of the primary color or a subtle Slate fill.
- **Inputs:** Fields use a Slate-800 background with an 8px radius. The active state is signaled by a 2px Primary Green border and a subtle outer glow.
- **Chips/Tags:** These should be semi-transparent, using a 15% opacity version of the primary or secondary color to allow the background texture to peek through.
- **Cards:** Cards are the workhorse of the system. They feature the 8px radius, a Level 1 surface color, and a subtle 1px border.
- **Interactive States:** Hover states should involve a slight increase in brightness (luminance) rather than a change in hue. For example, a button may move from Slate-800 to Slate-700 on hover.
- **Data Visualization:** Use the primary green and accent orange as the core data colors, supplemented by the tertiary blue for complex charts.