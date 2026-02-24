# Aarta Kouture - Branding Guide

## Overview
This document details the branding implementation for **Aarta Kouture** boutique management system.

## Brand Identity

### Tenant Name
**Aarta Kouture**

### Designer
By Shruti Reddy

### Logo Design
Circular watercolor style logo with:
- Pink/Rose watercolor background
- Gold circular border
- Elegant serif typography
- Designer attribution

---

## Color Palette

### Primary Brand Colors

#### Pink (Main Brand Color)
- **Primary**: `#ec4899` - Soft Pink (from watercolor logo)
- **Usage**: Primary buttons, headers, main navigation, focus states
- **Palette**:
  - 50: `#fdf2f8`
  - 100: `#fce7f3`
  - 200: `#fbcfe8`
  - 300: `#f9a8d4`
  - 400: `#f472b6`
  - 500: `#ec4899` ← Main
  - 600: `#db2777`
  - 700: `#be185d`
  - 800: `#9f1239`
  - 900: `#831843`

### Secondary Brand Colors

#### Gold (Accent Color)
- **Secondary**: `#D4AF37` - Gold
- **Usage**: Secondary buttons, highlights, borders, special elements
- **Palette**:
  - 50: `#fffbeb`
  - 100: `#fef3c7`
  - 200: `#fde68a`
  - 300: `#fcd34d`
  - 400: `#fbbf24`
  - 500: `#D4AF37` ← Main
  - 600: `#BF9D30`
  - 700: `#A68929`
  - 800: `#8D7422`
  - 900: `#74601B`

### Accent Colors

#### Rose
- **Accent**: `#fb7185` - Rose Pink
- **Usage**: Active states, highlights, gradient combinations
- **Combines with**: Primary pink and gold for elegant gradients

---

## Typography

### Display Font
- **Font Family**: `'Playfair Display', serif`
- **Usage**: Logo, headers, brand elements
- **Weights**: 400 (Regular), 600 (SemiBold), 700 (Bold)

### Body Font
- **Font Family**: `'Segoe UI', 'Roboto', 'sans-serif'`
- **Usage**: Body text, UI elements, forms

---

## Logo Component

### Implementation
The logo is implemented as a React component with three variants, matching the circular watercolor design:

1. **Full Logo** (default)
   - Circular pink watercolor background with gold border
   - "AK" monogram inside circle
   - Brand name "Aarta Kouture" + Designer "By Shruti Reddy"
   - Used in: Sidebar (expanded), Login page

2. **Text Only**
   - Brand name "Aarta Kouture" without circle
   - Used in: Top header bar

3. **Icon Only**
   - Circular pink watercolor with "AK" monogram
   - Used in: Sidebar (collapsed)

### Logo Usage
```jsx
import Logo from './components/Logo';

// Full logo
<Logo size="lg" />

// Text only
<Logo variant="text" />

// Icon only
<Logo variant="icon" size="sm" />
```

### Size Options
- `sm` - Small (32px)
- `md` - Medium (48px) - Default
- `lg` - Large (64px)
- `xl` - Extra Large (96px)

---

## Branding Application

### Sticky Elements

#### 1. Top Header Bar
- **Position**: Sticky, always visible at top
- **Background**: White with subtle border
- **Elements**:
  - Logo (text variant)
  - User welcome message with name
  - Role badge (gold accent)
  - Profile link
  - Logout button

#### 2. Sidebar Navigation
- **Background**: Gradient from Pink to Deeper Pink
- **Logo Position**: Top of sidebar with watercolor circle design
- **Active State**: White overlay with gold left border
- **Hover State**: White overlay (10% opacity)

### Page Elements

#### Forms
- **Container**: White background with gold top border
- **Section Headers**: Pink text with gold bottom border
- **Input Focus**: Pink border with light pink shadow
- **Input Hover**: Gold border

#### Buttons
- **Primary**: Pink gradient (#ec4899 to #f472b6)
- **Secondary**: Gold gradient
- **Hover Effects**: Lift animation with shadow

#### Cards & Containers
- **Shadow**: Pink tint (rgba(236, 72, 153, 0.1))
- **Borders**: Gold accent where appropriate

### Background Gradients

#### Login Page
```css
background: linear-gradient(to-br, from-pink-100, via-pink-200, to-pink-100)
```
*Matches the watercolor aesthetic of the logo*

#### Main Application
```css
background: linear-gradient(to-br, from-gray-50, to-gray-100)
```

#### Sidebar
```css
background: linear-gradient(to-b, from-primary-500, to-primary-600)
```
*Pink gradient matching brand colors*

---

## Tailwind Configuration

### Custom Brand Colors
All brand colors are available in Tailwind using these classes:

```css
/* Pink (Primary) */
bg-brand-pink
text-brand-pink
border-brand-pink

/* Gold (Secondary) */
bg-brand-gold
text-brand-gold
border-brand-gold

/* Rose (Accent) */
bg-brand-rose
text-brand-rose
border-brand-rose

/* Full palette available */
bg-primary-500  // Pink
bg-secondary-500  // Gold
bg-accent-500  // Rose
```

---

## Component-Specific Branding

### Dashboard
- Stat cards with branded icons
- Charts use brand color palette

### Customer Page
- Form sections with gold accents
- Customer cards with pink headers

### Order Page
- Status badges use brand colors
- Timeline with gold connectors

### Profile Page
- Avatar background: Pink gradient (matching logo)
- Stats cards: Gold accents

### Access Control Page
- Role badges: Gold background
- Permission indicators: Pink

### Login Page
- Full brand experience matching logo design
- Circular logo with watercolor effect
- Credential cards with gold accents
- Pink watercolor gradient background (matching logo aesthetic)

---

## Scrollbar Customization

Custom scrollbar styling with brand colors:
- **Thumb**: Gold (#D4AF37)
- **Thumb Hover**: Pink (#ec4899)
- **Track**: Light gray (#f1f5f9)

---

## Implementation Files

### Configuration
- `client/src/config/branding.js` - Brand configuration object

### Components
- `client/src/components/Logo.js` - Logo component with variants

### Styling
- `client/tailwind.config.js` - Tailwind color extensions
- `client/src/index.css` - Global styles and utilities
- `client/src/App.css` - Component-specific styles

### Updated Components
- `client/src/components/Layout.js` - Sticky header with logo
- `client/src/pages/LoginPage.js` - Branded login experience

---

## Brand Consistency Checklist

✅ Logo appears on all screens (sticky header)
✅ Pink-Gold color scheme consistently applied
✅ Sidebar uses brand gradient background (pink)
✅ All buttons use brand colors
✅ Form elements have branded focus states
✅ Navigation active states use brand colors
✅ Role badges use gold accent
✅ Scrollbar uses brand colors
✅ Login page fully branded with watercolor logo aesthetic
✅ Typography follows brand guidelines
✅ Circular watercolor logo design implemented

---

## Future Enhancements

- [ ] Add custom brand illustrations matching watercolor style
- [ ] Implement dark mode with brand colors
- [ ] Add brand animations and transitions
- [ ] Create branded loading states
- [ ] Design custom icons matching brand style
- [ ] Add brand watermark to printed documents
- [ ] Create email templates with branding

---

*Last Updated: February 2026*
*Brand: Aarta Kouture*
*Designer: By Shruti Reddy*
