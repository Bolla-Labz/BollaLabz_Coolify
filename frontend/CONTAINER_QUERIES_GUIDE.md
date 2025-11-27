# Container Queries Implementation Guide
<!-- Last Modified: 2025-11-24 10:10 -->

## Overview

BollaLabz now uses **CSS Container Queries** via `@tailwindcss/container-queries` to make components responsive to their **container size** instead of viewport size. This enables true component reusability across different layout contexts.

## Why Container Queries?

### Before (Viewport Breakpoints)
```tsx
// Component breaks when placed in narrow sidebar
<div className="text-sm md:text-base lg:text-lg">
  {/* Responds to viewport, not container */}
</div>
```

### After (Container Queries)
```tsx
// Component adapts to its container
<div className="@container">
  <div className="text-sm @md:text-base @lg:text-lg">
    {/* Responds to parent container size */}
  </div>
</div>
```

## Installation

Already installed in this project:

```bash
npm install -D @tailwindcss/container-queries
```

## Configuration

**File:** `frontend/tailwind.config.ts`

```typescript
// Last Modified: 2025-11-24 10:01
import containerQueries from '@tailwindcss/container-queries'

export default {
  // ... other config
  plugins: [animate, containerQueries],
}
```

## Usage Patterns

### 1. Basic Container Setup

Wrap your component with `@container`:

```tsx
<div className="@container">
  {/* Child elements can use @sm:, @md:, @lg:, etc. */}
</div>
```

### 2. Container Query Breakpoints

Replace viewport breakpoints with container queries:

| Viewport | Container Query | Container Width |
|----------|----------------|-----------------|
| `sm:`    | `@sm:`         | > 24rem (384px) |
| `md:`    | `@md:`         | > 28rem (448px) |
| `lg:`    | `@lg:`         | > 32rem (512px) |
| `xl:`    | `@xl:`         | > 36rem (576px) |
| `2xl:`   | `@2xl:`        | > 42rem (672px) |

### 3. Named Containers (Advanced)

For nested layouts with multiple containers:

```tsx
<div className="@container/sidebar">
  <div className="@container/main">
    {/* Target specific containers */}
    <div className="text-sm @md/sidebar:text-base @lg/main:text-lg">
      Content
    </div>
  </div>
</div>
```

## Migrated Components

### ✅ StatsCard
**File:** `frontend/src/components/dashboard/StatsCard.tsx`

**Responsive Features:**
- Padding adapts to container: `@sm:p-4 @md:p-6`
- Icon size scales: `@sm:h-4 @sm:w-4 @md:h-5 @md:w-5`
- Text size adjusts: `@sm:text-xl @md:text-2xl @lg:text-3xl`
- Description hides in small containers: `@sm:hidden @md:block`

**Usage:**
```tsx
<div className="@container">
  <div className="grid gap-4 @md:grid-cols-2 @xl:grid-cols-4">
    <StatsCard {...props} />
  </div>
</div>
```

### ✅ ContactCard3D
**File:** `frontend/src/components/interactive/contacts/ContactCard3D.tsx`

**Responsive Features:**
- Avatar size: `@sm:w-12 @sm:h-12 @md:w-14 @md:h-14 @lg:w-16 @lg:h-16`
- Name text: `@sm:text-sm @md:text-base @lg:text-lg`
- Company info hides in small containers: `@sm:hidden @md:flex`

**Usage:**
```tsx
{/* Card is already a @container */}
<ContactCard3D contact={contact} />
```

### ✅ CostTracker
**File:** `frontend/src/components/dashboard/CostTracker.tsx`

**Responsive Features:**
- Padding scales: `@sm:p-4 @md:p-6`
- Total cost size: `@sm:text-2xl @md:text-3xl`
- "This month" label hides: `@sm:hidden @md:inline`
- Icon sizes adapt: `@sm:w-3 @sm:h-3 @md:w-4 @md:h-4`

**Usage:**
```tsx
{/* Component wraps itself with @container */}
<CostTracker />
```

### ✅ RelationshipHealth
**File:** `frontend/src/components/dashboard/RelationshipHealth.tsx`

**Responsive Features:**
- Health indicator sizes: `@sm:w-10 @sm:h-10 @md:w-12 @md:h-12`
- Font sizes scale: `@sm:text-xl @md:text-2xl`
- Contact avatars adapt: `@sm:w-8 @sm:h-8 @md:w-10 @md:h-10`
- "Last contact" text hides: `@sm:hidden @md:block`

**Usage:**
```tsx
{/* Component wraps itself with @container */}
<RelationshipHealth />
```

### ✅ Dashboard Layout
**File:** `frontend/src/pages/Dashboard.tsx`

**Changes:**
- Stats grid wrapped with `@container`
- Uses container queries for grid columns: `@md:grid-cols-2 @xl:grid-cols-4`

## Best Practices

### 1. Always Use @container Wrapper
```tsx
// ✅ Good
<div className="@container">
  <div className="@md:text-lg">Content</div>
</div>

// ❌ Bad - won't work without @container
<div>
  <div className="@md:text-lg">Content</div>
</div>
```

### 2. Combine with Regular Breakpoints
```tsx
// Use viewport breakpoints for layout
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Use container queries inside components */}
  <div className="@container">
    <StatsCard {...props} />
  </div>
</div>
```

### 3. Progressive Enhancement
```tsx
// Start with mobile-first, enhance with container queries
<div className="text-sm @md:text-base @lg:text-lg">
  {/* Defaults to text-sm, grows with container */}
</div>
```

### 4. Hide/Show Content Based on Container
```tsx
// Show summary in small containers, full details in large
<div className="@container">
  <p className="@sm:block @md:hidden">Summary</p>
  <div className="@sm:hidden @md:block">Full Details</div>
</div>
```

## Testing Container Queries

### 1. Dev Server
```bash
cd frontend
npm run dev
```

Open http://localhost:5173/dashboard

### 2. Manual Testing Checklist
- [ ] Open Dashboard page
- [ ] Resize browser window from 320px to 1920px
- [ ] Verify StatsCard adapts smoothly
- [ ] Check sidebar components (CostTracker, RelationshipHealth)
- [ ] Test in different layout contexts (full-width vs. sidebar)

### 3. DevTools Inspection
1. Right-click component → Inspect
2. Find element with `@container` class
3. Manually change parent width in DevTools
4. Verify child elements respond to container size, not viewport

## Migration Checklist

To migrate a new component to container queries:

- [ ] Read component file to understand current breakpoints
- [ ] Add `@container` to component wrapper or parent
- [ ] Replace viewport breakpoints (`sm:`, `md:`, etc.) with container queries (`@sm:`, `@md:`, etc.)
- [ ] Update timestamp in file header
- [ ] Test in different container sizes
- [ ] Build frontend: `npm run build:no-typecheck`
- [ ] Verify no visual regressions

## Common Patterns

### Grid Layouts
```tsx
<div className="@container">
  <div className="grid gap-4 @sm:grid-cols-1 @md:grid-cols-2 @lg:grid-cols-3">
    {items.map(item => <Card key={item.id} {...item} />)}
  </div>
</div>
```

### Responsive Padding
```tsx
<div className="@container @sm:p-3 @md:p-4 @lg:p-6">
  {/* Padding grows with container */}
</div>
```

### Font Scaling
```tsx
<h2 className="@sm:text-base @md:text-lg @lg:text-xl @xl:text-2xl">
  Adaptive Heading
</h2>
```

### Icon Sizes
```tsx
<Icon className="@sm:w-4 @sm:h-4 @md:w-5 @md:h-5 @lg:w-6 @lg:h-6" />
```

## Troubleshooting

### Issue: Container queries not working
**Solution:** Ensure parent has `@container` class

### Issue: Content not responsive
**Solution:** Check Tailwind config has `containerQueries` plugin

### Issue: Build fails with container query syntax
**Solution:** Verify `@tailwindcss/container-queries` is installed

### Issue: Container too narrow/wide
**Solution:** Adjust container breakpoint values or use named containers

## Resources

- [Tailwind Container Queries Docs](https://tailwindcss.com/docs/plugins#container-queries)
- [CSS Container Queries MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Container_Queries)
- [Can I Use Container Queries](https://caniuse.com/css-container-queries)

## Browser Support

Container queries are supported in:
- ✅ Chrome/Edge 105+
- ✅ Firefox 110+
- ✅ Safari 16+
- ✅ Opera 91+

All modern browsers support container queries as of 2023.

## Next Steps

Future components to migrate:
- QuickActions component
- ActivityFeed component
- Navigation components
- Form components
- Modal/Dialog components

## Maintenance

When creating new components:
1. Use container queries by default
2. Add `@container` to component wrapper
3. Use `@sm:`, `@md:`, etc. for internal responsiveness
4. Test in multiple container sizes before merging
5. Update this guide with new patterns discovered
