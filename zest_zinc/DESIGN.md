---
name: Zest & Zinc
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#3d4a3d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#6d7b6c'
  outline-variant: '#bccbb9'
  surface-tint: '#006e2f'
  primary: '#006e2f'
  on-primary: '#ffffff'
  primary-container: '#22c55e'
  on-primary-container: '#004b1e'
  inverse-primary: '#4ae176'
  secondary: '#9d4300'
  on-secondary: '#ffffff'
  secondary-container: '#fd761a'
  on-secondary-container: '#5c2400'
  tertiary: '#735c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#cfa800'
  on-tertiary-container: '#4f3e00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#6bff8f'
  primary-fixed-dim: '#4ae176'
  on-primary-fixed: '#002109'
  on-primary-fixed-variant: '#005321'
  secondary-fixed: '#ffdbca'
  secondary-fixed-dim: '#ffb690'
  on-secondary-fixed: '#341100'
  on-secondary-fixed-variant: '#783200'
  tertiary-fixed: '#ffe083'
  tertiary-fixed-dim: '#eec200'
  on-tertiary-fixed: '#231b00'
  on-tertiary-fixed-variant: '#574500'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-bold:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 16px
  margin: 20px
---

## Brand & Style

This design system is built for a generation that views cooking as an act of self-expression and wellness rather than a chore. The brand personality is encouraging, energetic, and slightly irreverent, breaking down the intimidation factor of "haute cuisine" into bite-sized, achievable wins. 

The visual style is **Soft Neo-brutalism**. It takes the high-contrast, structured elements of brutalism—such as defined borders and bold typography—and softens them with rounded corners, a vibrant palette, and generous whitespace. This creates a UI that feels structured and reliable for following recipes, yet playful enough to feel like a lifestyle app rather than a utility tool. The emotional response is one of "calculated confidence": the user feels guided by a clear system that doesn't take itself too seriously.

## Colors

The palette is rooted in the "Fresh & Fire" concept. The **Primary Green** represents freshness, herbs, and organic growth, used for success states and primary actions. The **Secondary Orange** stimulates appetite and signals heat/cooking, used for interactive elements and highlights. 

A **Tertiary Yellow** provides an additional spark for rewards and "beginner tips." The background remains a very clean **Neutral Slate-White** to ensure the colorful food photography remains the hero. Unlike traditional minimalist systems, this system uses a dark, low-opacity charcoal for borders rather than light grays, giving the "Neo-brutalest" structure its definition.

## Typography

This design system utilizes **Plus Jakarta Sans** across all levels to maintain a cohesive, friendly, and optimistic tone. The "roundedness" of the glyphs mirrors the physical shapes of ingredients and kitchenware.

Hierarchy is established through extreme weight contrast. Display and Headline levels use "ExtraBold" weights with tighter letter spacing to create a punchy, editorial feel. Body text is kept at a comfortable "Medium" or "Regular" weight with increased line height to ensure recipes are easily readable even when a phone is sitting on a distant countertop. Labels are often set in uppercase with slight tracking to provide a technical, "organized kitchen" aesthetic.

## Layout & Spacing

The system follows a **Fluid Grid** model with an 8px base unit. For mobile experiences, a 4-column grid is used, while desktop scaling moves to a 12-column grid. 

The spacing philosophy emphasizes "Active Breathing Room." Instead of tight grouping, elements are given generous margins to prevent the UI from feeling cluttered—a critical factor for users who might be stressed while cooking. Layouts are card-based, with vertical stacking being the primary rhythm for recipe steps and horizontal scrolling used for "Ingredient Lists" or "Related Recipes" to maximize screen real estate.

## Elevation & Depth

Depth is achieved through a combination of **Bold Borders** and **Offset Shadows**, characteristic of the neo-brutalism style. 

1.  **The Base Layer:** Most surfaces are flat, using the neutral background color.
2.  **The Interactive Layer:** Cards and buttons utilize a 2px solid border (`#1E293B`).
3.  **The Shadow Model:** Instead of blurry, realistic shadows, the design system uses "Hard-Soft" shadows. These are slightly offset (e.g., 4px down, 4px right) with a low blur radius (8px) and a color-tinted opacity (e.g., 10% of the primary or secondary color). This makes the elements feel like they are physically "popping" off the page without the weight of traditional brutalism.
4.  **The Floating Layer:** Floating Action Buttons (FABs) for "Start Cooking" use a more pronounced 8px offset to signal their primary importance.

## Shapes

The shape language is consistently **Rounded**. Every container, from small input fields to large recipe cards, uses a 0.5rem (8px) minimum radius. This prevents the "harshness" often associated with brutalist designs.

Buttons and high-priority chips use **Max-Rounded (Pill)** shapes to invite touch and signal interactivity. Images of food should always feature rounded corners (1rem/16px) to maintain the soft, organic feel of the brand. This balance of hard borders and soft corners defines the "modern" aspect of the system.

## Components

### Buttons
Primary buttons are large (min-height 56px), pill-shaped, and filled with the Primary Green. They feature the 2px border and the 4px offset shadow. Text is bold and centered. Secondary buttons use the same shape but with a white fill and an Orange border/text.

### Recipe Cards
Cards are the primary content vehicle. They feature a top-aligned image with a 16px radius, followed by a title in Headline-MD. The card itself has a 2px border and a subtle Green-tinted shadow.

### Chips & Tags
Tags for difficulty (e.g., "Easy") or time (e.g., "15 min") are pill-shaped with a light tint of the primary color and no border. This distinguishes them from interactive buttons.

### Progress Indicators
For recipe steps, use a thick, horizontal bar-style progress indicator. The active segment should be Secondary Orange, while the remaining segments are a light Gray-Green, mimicking a "cooking timer" aesthetic.

### Input Fields
Inputs use a white background, 2px border, and 12px roundedness. On focus, the border color changes to Primary Green, and the shadow offset increases slightly to give a tactile feedback of "depth."

### The "Chef's Note" Callout
A specialized component for beginners. This is a card with a dashed border and a Secondary Orange background at 10% opacity, used to highlight essential tips or ingredient substitutions.