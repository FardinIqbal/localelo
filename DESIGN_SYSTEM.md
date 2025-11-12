# LocalElo Design System

## Overview
This document defines the design system for LocalElo - a modern, fast, and user-friendly Elo rating platform. The design emphasizes clarity, speed, and aesthetic appeal with a dark theme and vibrant accent colors.

## Design Principles
1. **Speed**: Fast loading, smooth transitions, instant feedback
2. **Clarity**: Clear visual hierarchy, readable typography, obvious interactions
3. **Consistency**: Unified patterns across all components and pages
4. **Modern Aesthetic**: Clean lines, subtle animations, beautiful gradients
5. **Mobile-First**: Optimized for touch, responsive layouts, accessible

---

## Color System

### Base Colors (Backgrounds & Surfaces)
```
Background Primary:   bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950
Background Secondary: bg-slate-900
Surface Elevated:     bg-slate-800/80 backdrop-blur-xl
Surface Card:         bg-slate-800/70 backdrop-blur-sm
Surface Input:        bg-slate-900/70
```

### Text Colors
```
Text Primary:    text-white / text-slate-50
Text Secondary:  text-slate-300
Text Muted:      text-slate-400
Text Disabled:   text-slate-500
```

### Border Colors
```
Border Default:  border-slate-700
Border Subtle:   border-white/10
Border Focus:    border-purple-500
```

### Accent Colors
```
Primary Gradient:   from-purple-600 to-pink-500
Secondary Gradient: from-pink-500 to-indigo-500
Hover Gradient:     from-purple-500 to-pink-400

Success: text-green-400 / bg-green-500
Warning: text-yellow-400 / bg-yellow-500
Error:   text-red-400 / bg-red-500
Info:    text-blue-400 / bg-blue-500
```

### State Colors
```
Hover:   hover:bg-slate-700/50
Active:  active:scale-98
Focus:   focus:ring-2 focus:ring-purple-500/30
```

---

## Typography

### Font Families
```
Primary: font-['Inter']
Display: font-['Outfit'] (if needed for headings)
```

### Font Sizes
```
xs:   text-xs (0.75rem / 12px)
sm:   text-sm (0.875rem / 14px)
base: text-base (1rem / 16px)
lg:   text-lg (1.125rem / 18px)
xl:   text-xl (1.25rem / 20px)
2xl:  text-2xl (1.5rem / 24px)
3xl:  text-3xl (1.875rem / 30px)
4xl:  text-4xl (2.25rem / 36px)
```

### Font Weights
```
Regular:  font-normal (400)
Medium:   font-medium (500)
Semibold: font-semibold (600)
Bold:     font-bold (700)
```

### Line Heights
```
Tight:   leading-tight
Normal:  leading-normal
Relaxed: leading-relaxed
```

---

## Spacing System

### Padding Scale
```
xs:  p-2  (8px)
sm:  p-3  (12px)
md:  p-4  (16px)
lg:  p-6  (24px)
xl:  p-8  (32px)
```

### Gap Scale (for flex/grid)
```
xs:  gap-2  (8px)
sm:  gap-3  (12px)
md:  gap-4  (16px)
lg:  gap-6  (24px)
xl:  gap-8  (32px)
```

### Margin Scale
```
xs:  m-2  (8px)
sm:  m-3  (12px)
md:  m-4  (16px)
lg:  m-6  (24px)
xl:  m-8  (32px)
```

---

## Border Radius

```
sm:   rounded-md (6px)   - Small elements, badges
md:   rounded-lg (8px)   - Inputs, small cards
lg:   rounded-xl (12px)  - Cards, containers
full: rounded-full       - Buttons, avatars
```

---

## Shadows

```
sm:  shadow-sm              - Subtle elevation
md:  shadow-lg              - Cards, dropdowns
lg:  shadow-xl              - Modals, major elevation
glow: shadow-purple-500/20   - Accent glow effect
hover: shadow-purple-500/40  - Hover glow effect
```

---

## Component Patterns

### Cards
**Standard Card:**
```erb
class="bg-slate-800/80 backdrop-blur-xl rounded-xl border border-slate-700 p-6 transition-all duration-300"
```

**Stat Card:**
```erb
class="bg-slate-800/80 backdrop-blur-xl rounded-xl border border-slate-700 p-5 hover:border-purple-500/50 transition-all duration-300"
```

**Interactive Card (hover):**
```erb
class="bg-slate-800/80 backdrop-blur-xl rounded-xl border border-slate-700 p-6 hover:bg-slate-700/80 hover:shadow-lg hover:shadow-purple-500/10 transform hover:-translate-y-1 transition-all duration-300 cursor-pointer"
```

### Buttons

**Primary Button:**
```erb
class="inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium text-white bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transform hover:-translate-y-0.5 active:scale-98 transition-all duration-200"
```

**Secondary Button:**
```erb
class="inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium text-white bg-slate-700/80 hover:bg-slate-600/80 border border-slate-600 hover:border-slate-500 transition-all duration-200"
```

**Ghost Button:**
```erb
class="inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
```

**Icon Button:**
```erb
class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-700/80 text-white hover:bg-slate-600/80 border border-white/10 hover:border-white/20 transition-all duration-200 active:scale-95"
```

### Inputs & Forms

**Text Input:**
```erb
class="w-full px-4 py-3 bg-slate-900/70 border-2 border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
```

**Select Dropdown:**
```erb
class="w-full px-4 py-3 bg-slate-900/70 border-2 border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
```

**Checkbox/Radio:**
```erb
class="w-5 h-5 bg-slate-900/70 border-2 border-slate-700 rounded text-purple-600 focus:ring-2 focus:ring-purple-500/20 transition-all"
```

**Label:**
```erb
class="block text-sm font-semibold text-slate-300 mb-2"
```

### Navigation

**Desktop Nav Link:**
```erb
class="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
```

**Desktop Nav Link (Active):**
```erb
class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-slate-700/70 border border-slate-600"
```

**Bottom Nav Link:**
```erb
class="flex flex-col items-center justify-center w-full py-2 text-slate-400 hover:text-white transition-all duration-200"
```

**Bottom Nav Link (Active):**
```erb
class="flex flex-col items-center justify-center w-full py-2 text-purple-400"
```

### Badges

**Default Badge:**
```erb
class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-700/80 text-slate-300 border border-slate-600"
```

**Success Badge:**
```erb
class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/30"
```

**Warning Badge:**
```erb
class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/30"
```

**Error Badge:**
```erb
class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/30"
```

### Loading States

**Skeleton (text line):**
```erb
class="h-4 bg-slate-700/50 rounded animate-pulse"
```

**Skeleton (card):**
```erb
class="bg-slate-800/50 rounded-xl border border-slate-700 p-6 animate-pulse"
```

**Spinner:**
```erb
<div class="inline-block w-6 h-6 border-3 border-slate-600 border-t-purple-500 rounded-full animate-spin"></div>
```

---

## Animation & Transitions

### Standard Transitions
```
Fast:    transition-all duration-150
Normal:  transition-all duration-200
Smooth:  transition-all duration-300
Slow:    transition-all duration-500
```

### Common Animations
```
Fade In:        opacity-0 -> opacity-100
Slide Up:       translate-y-4 -> translate-y-0
Scale:          scale-95 -> scale-100
Hover Lift:     hover:-translate-y-1
Active Press:   active:scale-98
Pulse:          animate-pulse
Spin:           animate-spin
```

### Easing Functions
```
Ease Out:  ease-out    (default for most transitions)
Ease In:   ease-in     (for exits)
Ease:      ease-in-out (for complex animations)
```

---

## Layout Patterns

### Container
```erb
class="container mx-auto px-4"
```

### Max Width Content
```erb
class="max-w-7xl mx-auto"
```

### Card Grid (Responsive)
```erb
class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
```

### Flex Row (Responsive)
```erb
class="flex flex-col md:flex-row gap-4"
```

### Section Spacing
```erb
class="space-y-8"  (vertical spacing between major sections)
```

---

## Responsive Breakpoints

```
Mobile:    < 768px   (default, no prefix)
Tablet:    >= 768px  (md:)
Desktop:   >= 1024px (lg:)
Wide:      >= 1280px (xl:)
```

### Mobile-First Design Rules
1. Design for mobile first, enhance for larger screens
2. Bottom nav on mobile, desktop nav on larger screens
3. Stack cards vertically on mobile, grid on larger screens
4. Touch targets minimum 44x44px on mobile
5. Reduce padding/spacing on mobile for content density

---

## Accessibility

### Focus States
All interactive elements must have visible focus states:
```
focus:outline-none focus:ring-2 focus:ring-purple-500/30
```

### Color Contrast
- Text on dark background: minimum 4.5:1 ratio
- Primary text: white/slate-50 on slate-900 (19.33:1)
- Secondary text: slate-300 on slate-900 (12.63:1)

### Touch Targets
Minimum size for interactive elements on mobile: 44x44px

### Semantic HTML
- Use proper heading hierarchy (h1 -> h2 -> h3)
- Use `<button>` for actions, `<a>` for navigation
- Include aria-labels for icon-only buttons
- Include sr-only text for screen readers

---

## Icon Usage

### Icon Library
Font Awesome (included via CDN)

### Icon Sizing
```
xs:  text-xs   (12px)
sm:  text-sm   (14px)
md:  text-base (16px)
lg:  text-lg   (18px)
xl:  text-xl   (20px)
```

### Icon Spacing
Icons should have spacing from adjacent text:
```
Left icon:  mr-2 (8px)
Right icon: ml-2 (8px)
```

---

## Implementation Guidelines

### CSS Classes Order (for readability)
1. Display & Position (flex, grid, absolute, relative)
2. Box Model (w-, h-, p-, m-)
3. Typography (text-, font-, leading-)
4. Colors (bg-, text-, border-)
5. Visual Effects (shadow-, rounded-, backdrop-)
6. Transitions & Animations (transition-, hover:, focus:)
7. Responsive (md:, lg:)

### Performance Best Practices
1. Use backdrop-blur sparingly (expensive operation)
2. Prefer transform over position changes for animations
3. Use will-change for complex animations
4. Lazy load images and heavy components
5. Use Turbo for navigation (no full page reloads)

### Consistency Checklist
- [ ] All cards use consistent bg-slate-800/80 backdrop-blur-xl
- [ ] All buttons use consistent gradient and hover states
- [ ] All inputs use consistent border and focus states
- [ ] All spacing uses the defined scale (2, 3, 4, 6, 8)
- [ ] All border radius uses defined values (md, lg, xl, full)
- [ ] All transitions use consistent durations (150, 200, 300)
- [ ] All text uses defined hierarchy and colors
- [ ] All interactive elements have hover and focus states
