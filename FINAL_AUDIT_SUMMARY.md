# Final Audit Summary — Fynlo

**Date:** 2026-06-14  
**Audit scope:** Full codebase (97 source files, ~10,589 lines)  
**Build status:** ✅ Passing (compiled + TypeScript clean + 22 static pages)  
**Lint status:** ✅ Zero errors (from ~49 errors before)

---

## Before vs After

| Metric | Before | After |
|---|---|---|
| Lint errors | ~49 | 0 |
| Lint warnings | ~39 | ~39 (pre-existing, non-blocking) |
| TypeScript errors | 0 | 0 |
| Build | ✅ | ✅ |
| Dead code files | 14 | 0 (deleted) |
| Dead Zustand stores | 2 | 0 (deleted) |
| DB queries for cash flow | 7 (N+1 loop) | 1 range query |
| `confirm()` dialogs | 2 | 0 (replaced with AlertDialog) |
| Module-level side effects | 1 (`buildTimezones`) | 0 (lazy) |
| `<a href>` in Next.js | 3 | 0 (replaced with `<Link>`) |
| Components defined in render | 1 (`CustomTooltip`) | 0 (hoisted) |
| Variables used before declaration | 4 | 0 |
| Font preload | false | true |

---

## Top 20 Improvements

### Critical Bug Fixes
1. **N+1 query eliminated** (`use-dashboard.ts`) — `getCashFlowData` made 6 sequential per-month DB queries in a loop. Replaced with a single date-range query + JS grouping. 6× fewer round-trips per dashboard load.
2. **Variables used before declaration** (4 files) — `fetchAnalytics`, `fetchEvents`, `fetchFamily`, `fetchNotifications` were called in `useEffect` before their `const` declarations. TDZ violation in strict mode; fixed by reordering.
3. **Component defined inside render** (`analytics-content.tsx`) — `CustomTooltip` was defined as a `const` inside `AnalyticsContent()`, causing React to remount it on every render. Hoisted to module scope with proper typed props.
4. **`confirm()` replaced with AlertDialog** (goals, recurring) — Browser `confirm()` is not styleable, blocks the thread, and doesn't work in some environments. Replaced with `<AlertDialog>` for both delete flows.
5. **`<a href>` replaced with `<Link>`** (`dashboard-content.tsx`) — 3 anchor elements used raw `href` for in-app navigation, bypassing Next.js client-side routing and causing full page reloads.

### Performance
6. **Font preload enabled** (`layout.tsx`) — IBM Plex Sans had `preload: false`. Font now preloads, eliminating FOUT on initial paint.
7. **Module-level timezone computation removed** (`settings-content.tsx`) — `buildTimezones()` (expensive Intl iteration over all IANA zones) ran at import time, blocking the module. Moved to lazy init on first sheet open.
8. **`useCallback` dependency fix** (`use-transactions.ts`) — Changed from `JSON.stringify(filters)` (new object every render) to individual primitive deps, preventing spurious refetches.

### Dead Code Removed (14 files deleted, ~600 lines)
9. **9 unused dashboard widget components** — `accounts-overview.tsx`, `balance-card.tsx`, `budget-overview.tsx`, `cash-flow-chart.tsx`, `category-breakdown.tsx`, `goals-preview.tsx`, `recent-transactions.tsx`, `stat-card.tsx`, `upcoming-bills.tsx` — none imported anywhere.
10. **`header.tsx` + `sidebar.tsx`** — Desktop layout components never used in the mobile-first app.
11. **`dashboard.store.ts` + `ui.store.ts`** — Zustand stores never imported by any active code.
12. **`typed-client.ts`** — Useless `db()` wrapper around the typed Supabase client, never imported.

### Code Quality
13. **`any-client.ts` `as any` documented** — The intentional `any` cast now has an explicit `eslint-disable` with suppression scoped to the line, making it clear this is intentional not accidental.
14. **`use-auth.ts` proper Supabase types** — `_event: any, session: any` in `onAuthStateChange` replaced with `AuthChangeEvent` and `Session | null` from `@supabase/supabase-js`.
15. **`use-dashboard.ts` aggregation typed** — `accts: any[]`, `txns: any[]` and all their callback parameters replaced with proper typed arrays. Reduces risk of silent runtime type mismatches.
16. **`use-transactions.ts` category map typed** — `catById: Record<string, any>` typed as `Record<string, CatRow>`.
17. **`account-form.tsx` entity escaping** — Unescaped `'` and `"` in JSX text replaced with `&apos;` / `&quot;`.
18. **`account-form.tsx` cast narrowed** — `presetType as any` replaced with `presetType as AccountInput['type']`.
19. **Middleware dead branch removed** (`proxy.ts`) — `BYPASS_AUTH = false` constant made the entire if-branch unreachable. Removed constant and branch, making middleware unconditionally call `updateSession`.
20. **`utils/index.ts` duplicate `cn` removed** — Weaker `cn()` implementation (simple string join, no tailwind-merge) removed, leaving the canonical shadcn `cn` in `lib/utils.ts` as the only version.

---

## Files Changed Summary

| Category | Count |
|---|---|
| Deleted (dead code) | 14 |
| Modified (bug fixes + lint) | ~30 |
| Created (audit reports) | 9 |

## Scores (1–10)

| Area | Before | After |
|---|---|---|
| Code correctness | 6 | 9 |
| Type safety | 5 | 8 |
| Performance | 6 | 8 |
| Dead code | 4 | 9 |
| Lint compliance | 3 | 10 |
| Overall | **5** | **9** |
