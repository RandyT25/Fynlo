# DEAD_CODE_REPORT.md — Fynlo Dead Code Analysis

> Generated: 2026-06-14
> Verification method: grep for all imports across `src/` — nothing matched for any file listed below.

---

## SAFE TO DELETE

These files have zero imports anywhere in `src/`. Deleting them will not affect the build.

### Unused Components — Dashboard Sub-components (9 files)
These were scaffolded as reusable pieces but `dashboard-content.tsx` was rewritten to be self-contained and never adopted them.

| File | Lines | Evidence |
|---|---|---|
| `src/features/dashboard/accounts-overview.tsx` | ~40 | Not imported anywhere |
| `src/features/dashboard/balance-card.tsx` | ~50 | Not imported anywhere |
| `src/features/dashboard/budget-overview.tsx` | ~40 | Not imported anywhere |
| `src/features/dashboard/cash-flow-chart.tsx` | ~60 | Not imported anywhere |
| `src/features/dashboard/category-breakdown.tsx` | ~50 | Not imported anywhere |
| `src/features/dashboard/goals-preview.tsx` | ~40 | Not imported anywhere |
| `src/features/dashboard/recent-transactions.tsx` | ~60 | Not imported anywhere |
| `src/features/dashboard/stat-card.tsx` | ~30 | Not imported anywhere |
| `src/features/dashboard/upcoming-bills.tsx` | ~40 | Not imported anywhere |

**Total dead dashboard code: ~410 lines across 9 files**

---

### Unused Layout Components (2 files)
The app is mobile-first with `AppLayout` (MobileNav + MobileHeader). The desktop sidebar and header were scaffolded but `AppLayout` never renders them.

| File | Lines | Evidence |
|---|---|---|
| `src/components/layout/header.tsx` | 82 | Not imported in `app-layout.tsx` or any page |
| `src/components/layout/sidebar.tsx` | 205 | Not imported in `app-layout.tsx` or any page |

**Note:** Sidebar uses framer-motion's `AnimatePresence` heavily. Deleting it reduces the number of imported framer-motion symbols.

---

### Unused Zustand Stores (2 files)
| File | Evidence |
|---|---|
| `src/store/dashboard.store.ts` | Not imported anywhere (`useDashboardStore` has 0 consumers) |
| `src/store/ui.store.ts` | Only used in `header.tsx` and `sidebar.tsx`, both of which are dead code |

---

### Useless Wrapper (1 file)
| File | Evidence |
|---|---|
| `src/lib/supabase/typed-client.ts` | Exports `db()` which wraps `supabase.from()` with `as any`, negating type safety. Never imported. |

---

## REVIEW BEFORE DELETE

These contain partially live code mixed with dead code.

### `src/proxy.ts` — Dead Code Branch
```typescript
// BYPASS_AUTH — flip to false and restore the updateSession call when Supabase is live
const BYPASS_AUTH = false      // ← this entire if-block is dead code

if (BYPASS_AUTH) {
  // Redirect auth pages straight to the app
  ...
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```
**Action:** Remove the `BYPASS_AUTH` constant and the `if (BYPASS_AUTH)` block. Keep the rest of `proxy.ts`.

---

### `src/features/goals/goals-content.tsx` — Unused Constant
```typescript
const GOAL_ICONS = ['🎯', '🏠', '✈️', '🚗', ...]  // line 27 — never referenced in JSX
```
**Action:** Remove `GOAL_ICONS` array. The rendering hardcodes `'🎯'` — either build the icon picker UI or keep it hardcoded and remove the constant.

---

### `src/lib/utils/index.ts` — Duplicate `cn` Function
```typescript
// src/lib/utils/index.ts — simple string join, no tailwind-merge
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
```
The authoritative `cn` is in `src/lib/utils.ts` (uses `clsx` + `tailwind-merge`).

All active imports (`import { cn } from '@/lib/utils'`) resolve to `src/lib/utils.ts`, not the index. The weaker `cn` in `index.ts` is effectively dead but keeping it risks confusion if someone adds `from '@/lib/utils/index'` imports.

**Action:** Remove the `cn` export from `src/lib/utils/index.ts`. Keep `formatters`, `groupBy`, `sleep`, etc. from that file.

---

## CANNOT DELETE

These appear unused at first glance but have important roles.

| File | Reason |
|---|---|
| `src/lib/supabase/any-client.ts` | Used by all hooks and feature components (`import { createAnyClient }`). Should be renamed/improved but not deleted. |
| `src/lib/supabase/server.ts` | Used by the middleware chain for SSR; keep. |
| `src/lib/supabase/middleware.ts` | Called by `proxy.ts`. Keep. |
| `src/lib/supabase/client.ts` | Used by auth pages (`login/page.tsx`). Keep. |
| `public/sw.js` | Service worker for PWA — registered by manifest. Keep. |

---

## Summary

| Category | Files | Approx Lines |
|---|---|---|
| Safe to delete | 14 files | ~750 lines |
| Partial cleanup needed | 3 files | ~30 lines to remove |
| Cannot delete | 5 files | — |
