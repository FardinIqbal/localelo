# Light Mode Implementation Guide

## Status: Partially Complete

### Completed ✓
1. **Design System Updated** - Added light mode colors to DESIGN_SYSTEM.md
2. **Tailwind Configured** - Added dark mode support to application.css
3. **Theme Controller Created** - JavaScript controller for theme switching
4. **Theme Toggle UI** - Button component created
5. **Application Layout** - Updated with theme controller and light/dark classes
6. **Desktop Navigation** - Fully updated with light/dark support
7. **Mobile Navigation** - Partially updated (needs completion)
8. **Helper Methods** - Updated active_nav_class and nav_active_class

### In Progress 🔄
- **Mobile Navigation Menu** - Need to update all link styles
- **Bottom Navigation** - Needs light mode support

### Pending ⏳
- Dashboard components
- Organization pages
- Matches pages
- Forms and inputs
- Loading skeletons

---

## Quick Reference: Class Conversion Patterns

### Backgrounds
```
bg-slate-900        → bg-white dark:bg-slate-900
bg-slate-800        → bg-slate-50 dark:bg-slate-800
bg-slate-700        → bg-slate-100 dark:bg-slate-700
bg-slate-900/90     → bg-white/90 dark:bg-slate-900/90
bg-slate-800/80     → bg-white/80 dark:bg-slate-800/80
```

### Text Colors
```
text-white          → text-slate-900 dark:text-white
text-slate-300      → text-slate-600 dark:text-slate-300
text-slate-400      → text-slate-500 dark:text-slate-400
text-slate-500      → text-slate-400 dark:text-slate-500
```

### Borders
```
border-slate-700    → border-slate-200 dark:border-slate-700
border-white/10     → border-slate-200/60 dark:border-white/10
border-slate-600    → border-slate-300 dark:border-slate-600
```

### Hover States
```
hover:bg-slate-700/50       → hover:bg-slate-100 dark:hover:bg-slate-700/50
hover:text-white            → hover:text-slate-900 dark:hover:text-white
hover:border-purple-500/30  → (stays same - accent colors don't change)
```

---

## Files Needing Updates

### Navigation (Partially Done)
- [x] `app/views/shared/navigation/_desktop_nav.html.erb` - COMPLETE
- [ ] `app/views/shared/navigation/_mobile_nav_menu.html.erb` - IN PROGRESS
- [ ] `app/views/shared/navigation/_bottom_nav.html.erb` - PENDING
- [x] `app/helpers/application_helper.rb` - COMPLETE

### Dashboard (All Pending)
- [ ] `app/views/dashboard/show.html.erb`
- [ ] `app/views/dashboard/_performance_stats.html.erb`
- [ ] `app/views/dashboard/_quick_actions.html.erb`
- [ ] `app/views/dashboard/_my_organizations.html.erb`
- [ ] `app/views/dashboard/_welcome_header.html.erb`
- [ ] `app/views/dashboard/_recent_activity.html.erb`
- [ ] `app/views/dashboard/_leaderboard_spotlight.html.erb`

### Organizations (All Pending)
- [ ] `app/views/organizations/index.html.erb`
- [ ] `app/views/organizations/show.html.erb`
- [ ] `app/views/organizations/new.html.erb`
- [ ] `app/views/organizations/edit.html.erb`

### Matches (All Pending)
- [ ] `app/views/matches/index.html.erb`
- [ ] `app/views/matches/new.html.erb`
- [ ] `app/views/matches/show.html.erb`

### Leaderboards (All Pending)
- [ ] `app/views/leaderboards/index.html.erb`
- [ ] `app/views/leaderboards/show.html.erb`
- [ ] `app/views/leaderboards/_rankings.html.erb`

### System Components (All Pending)
- [ ] `app/views/shared/system/_loading_skeleton.html.erb`
- [ ] `app/views/shared/system/_flash_messages.html.erb`
- [ ] `app/views/shared/system/_toast_container.html.erb`

---

## Pattern Examples

### Card Component Pattern
```erb
<!-- OLD (dark only) -->
<div class="bg-slate-800/80 backdrop-blur-xl rounded-xl border border-slate-700 p-6">
  <h2 class="text-white mb-4">Title</h2>
  <p class="text-slate-300">Content</p>
</div>

<!-- NEW (light + dark) -->
<div class="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl border border-slate-200 dark:border-slate-700 p-6">
  <h2 class="text-slate-900 dark:text-white mb-4">Title</h2>
  <p class="text-slate-600 dark:text-slate-300">Content</p>
</div>
```

### Input Component Pattern
```erb
<!-- OLD (dark only) -->
<input class="w-full px-4 py-3 bg-slate-900/70 border-2 border-slate-700 rounded-lg text-white" />

<!-- NEW (light + dark) -->
<input class="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900/70 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" />
```

### Button Pattern (Primary)
```erb
<!-- Gradient buttons stay the same (no dark mode variant needed) -->
<button class="bg-gradient-to-r from-purple-600 to-pink-500 text-white">
  Click me
</button>
```

### Button Pattern (Secondary)
```erb
<!-- OLD (dark only) -->
<button class="bg-slate-700/80 text-white border border-slate-600">
  Click me
</button>

<!-- NEW (light + dark) -->
<button class="bg-slate-100 dark:bg-slate-700/80 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600">
  Click me
</button>
```

---

## Systematic Update Process

For each file, follow this process:

1. **Read the file** to identify all color classes
2. **Replace backgrounds** using the pattern above
3. **Replace text colors** using the pattern above
4. **Replace borders** using the pattern above
5. **Update hover/focus states** using the pattern above
6. **Test** the file in both light and dark modes

---

## Testing Checklist

After updating all files:

- [ ] Theme toggle works in desktop nav
- [ ] Theme persists across page navigation
- [ ] Theme persists after page refresh (localStorage)
- [ ] All text is readable in light mode
- [ ] All text is readable in dark mode
- [ ] Borders are visible in both modes
- [ ] Hover states work in both modes
- [ ] Focus states work in both modes
- [ ] Gradients look good in both modes
- [ ] Icons are visible in both modes
- [ ] Mobile navigation works in both modes
- [ ] Bottom nav works in both modes
- [ ] All forms work in both modes
- [ ] All cards have proper contrast
- [ ] Loading skeletons work in both modes

---

## Current Implementation Status

**Theme Controller**: ✓ Complete
- Located at: `app/javascript/controllers/theme_controller.js`
- Functionality: Toggles `dark` class on `<html>` element
- Storage: Uses `localStorage` to persist choice
- Initialization: Loads saved theme on page load

**Theme Toggle Button**: ✓ Complete
- Located at: `app/views/shared/navigation/_theme_toggle.html.erb`
- Shows sun icon in dark mode
- Shows moon icon in light mode
- Positioned in desktop and mobile nav

**Application Layout**: ✓ Complete
- Body has both light and dark background classes
- Theme controller attached to body
- Properly configured for class-based dark mode

---

## Next Steps

To complete the implementation:

1. Finish updating mobile navigation menu (3-4 more links)
2. Update bottom navigation (5 links)
3. Batch update all dashboard components
4. Batch update all page views (organizations, matches, leaderboards)
5. Update form inputs and selects
6. Update loading skeletons
7. Test thoroughly in both modes

---

## Estimated Completion

- **Mobile Nav**: 5 minutes
- **Bottom Nav**: 5 minutes
- **Dashboard**: 15 minutes
- **Pages**: 30 minutes
- **Forms**: 10 minutes
- **Testing**: 15 minutes

**Total**: ~1.5 hours of systematic updates

---

## Notes

- Gradient colors (purple-pink) work in both modes - no changes needed
- Accent colors (purple-500, pink-500) work in both modes
- Only neutral colors (slate, white, gray) need dark: variants
- Red/green/yellow badges work in both modes with slight adjustments
- Loading skeletons need minimal updates (mostly backgrounds)
