# REFACTOR_PLAN.md — Fynlo Refactoring Plan

> Generated: 2026-06-14
> Each phase is designed to be independently executable and safe to deploy.

---

## Phase A — Critical Fixes (Do First)

These are correctness issues and performance regressions that affect users today.

### A-1: Fix N+1 Queries in Dashboard Cash Flow
- **File:** `src/hooks/use-dashboard.ts` — `getCashFlowData()`
- **Change:** Replace 6 sequential queries with 1 date-range query + JS grouping
- **Risk:** Low (pure logic change, same output)
- **Difficulty:** Easy
- **Impact:** ~1-2 seconds off dashboard load time

### A-2: Fix Silent DB Error Swallowing
- **File:** `src/hooks/use-dashboard.ts:41-56`
- **Change:** Destructure and check `error` from each query in the `Promise.all` result
- **Risk:** Low
- **Difficulty:** Easy
- **Impact:** Users see actual error messages instead of silent empty states

### A-3: Fix `as any` in Core Data Layer
- **File:** `src/lib/supabase/any-client.ts`
- **Change:** Replace `createBrowserClient(url, key) as any` with `createBrowserClient<Database>(url, key)` (type-safe). Rename to align with `client.ts`.
- **Risk:** Medium — this changes the type of the client returned; any code with incorrect field names will now show TS errors that need fixing
- **Difficulty:** Medium
- **Impact:** TypeScript now catches query bugs at compile time

### A-4: Replace `confirm()` with AlertDialog
- **Files:** `src/features/goals/goals-content.tsx:56`, `src/features/recurring/recurring-content.tsx:56`
- **Change:** Use the existing `AlertDialog` component from `src/components/ui/alert-dialog.tsx`
- **Risk:** Low
- **Difficulty:** Easy
- **Impact:** Better UX, works in PWA standalone mode, accessible

### A-5: Fix `<a href>` → `<Link>` in Dashboard
- **Files:** `src/features/dashboard/dashboard-content.tsx` (3 instances)
- **Change:** Replace `<a href="...">` with `<Link href="...">` from `next/link`
- **Risk:** Low
- **Difficulty:** Easy
- **Impact:** Client-side navigation, eliminates full page reloads on dashboard

---

## Phase B — Performance Improvements

### B-1: Implement Basic Data Caching
- **Approach:** Add TTL-based caching to dashboard and transactions hooks using the existing `useDashboardStore`
- **Files:** `src/hooks/use-dashboard.ts`, `src/store/dashboard.store.ts`
- **Change:** If `lastUpdated` is within 2 minutes, return cached data instead of re-fetching
- **Risk:** Low (opt-in, falls back to fresh fetch on error)
- **Difficulty:** Medium
- **Impact:** Eliminates loading spinners on page re-visits

### B-2: Extract Shared `useCategories()` Hook
- **New file:** `src/hooks/use-categories.ts`
- **Change:** Move category fetching to a single cached hook
- **Files affected:** `use-dashboard.ts`, `use-transactions.ts`, `analytics-content.tsx`, `budgets-content.tsx`
- **Risk:** Low
- **Difficulty:** Easy
- **Impact:** Reduces category DB queries from 4× per page load to 1× with caching

### B-3: Lazy-Initialize `buildTimezones()`
- **File:** `src/features/settings/settings-content.tsx`
- **Change:** Move `buildTimezones()` inside the component with lazy initialization (only runs when timezone sheet opens)
- **Risk:** Low
- **Difficulty:** Easy
- **Impact:** Faster settings page import, no blocking on first render

### B-4: Enable Font Preloading
- **File:** `src/app/layout.tsx`
- **Change:** Remove `preload: false` (or change to `preload: true`)
- **Risk:** Low (only affects initial load)
- **Difficulty:** Trivial
- **Impact:** Eliminates font flash on first load

---

## Phase C — Architecture Improvements

### C-1: Consolidate Auth Subscription into Provider
- **Files:** `src/components/layout/providers.tsx`, `src/hooks/use-auth.ts`
- **Change:** Move `onAuthStateChange` from `useAuth()` hook to `<AuthProvider>` in `providers.tsx`. Components call `useAuthStore()` directly.
- **Risk:** Medium — changes how auth state is initialized
- **Difficulty:** Medium
- **Impact:** Single subscription instead of N per page, eliminates race conditions on signout

### C-2: Remove Duplicate `cn` from utils/index.ts
- **File:** `src/lib/utils/index.ts`
- **Change:** Remove the weak `cn` implementation; keep formatters, `sleep`, `groupBy`, etc.
- **Risk:** Low (no active imports use this `cn`)
- **Difficulty:** Trivial
- **Impact:** Eliminates confusion, ensures all Tailwind class merging uses `tailwind-merge`

### C-3: Consolidate Supabase Client Strategy
- **Files:** `src/lib/supabase/any-client.ts`, `src/lib/supabase/client.ts`, `src/lib/supabase/typed-client.ts`
- **Change:** Remove `any-client.ts` and `typed-client.ts`. Update all hooks to use the typed `client.ts`.
- **Risk:** Medium — updating all imports; catch type errors that emerge
- **Difficulty:** Medium
- **Impact:** Full type safety on all DB queries

### C-4: Extract Duplicate `groupByDate` / `dateLabel`
- **Files:** `transactions-content.tsx`, `dashboard-content.tsx`
- **Change:** Move to `src/lib/utils/format.ts`
- **Risk:** Low
- **Difficulty:** Easy
- **Impact:** Single source of truth, easier to test

### C-5: Extract Duplicate Balance Calculation
- **Files:** `use-dashboard.ts`, `use-accounts.ts`
- **Change:** Move to `src/lib/utils/index.ts` as `calculateNetBalance(accounts)`
- **Risk:** Low
- **Difficulty:** Easy
- **Impact:** DRY, easier to test

---

## Phase D — Dead Code Cleanup

All changes in this phase are file deletions. No behavior changes.

### D-1: Delete 9 Unused Dashboard Sub-components
**Files to delete:**
- `src/features/dashboard/accounts-overview.tsx`
- `src/features/dashboard/balance-card.tsx`
- `src/features/dashboard/budget-overview.tsx`
- `src/features/dashboard/cash-flow-chart.tsx`
- `src/features/dashboard/category-breakdown.tsx`
- `src/features/dashboard/goals-preview.tsx`
- `src/features/dashboard/recent-transactions.tsx`
- `src/features/dashboard/stat-card.tsx`
- `src/features/dashboard/upcoming-bills.tsx`

### D-2: Delete Unused Layout Components
**Files to delete:**
- `src/components/layout/header.tsx`
- `src/components/layout/sidebar.tsx`

### D-3: Delete Unused Stores
**Files to delete:**
- `src/store/dashboard.store.ts`
- `src/store/ui.store.ts`

### D-4: Delete Dead Utility
**File to delete:**
- `src/lib/supabase/typed-client.ts`

### D-5: Clean Code Fragments
- `src/proxy.ts`: Remove `BYPASS_AUTH` constant + if-block
- `src/features/goals/goals-content.tsx`: Remove `GOAL_ICONS` constant
- `src/lib/utils/index.ts`: Remove the weak `cn` export
- Move `shadcn` from `dependencies` to `devDependencies`

---

## Execution Order

```
Phase A (safety) → Phase D (cleanup) → Phase B (performance) → Phase C (architecture)
```

Phase D should come early — less code = less to reason about in subsequent phases.

---

## Estimated Impact Table

| Phase | Changes | Risk | Time |
|---|---|---|---|
| A | 5 targeted fixes | Low-Medium | 2 hours |
| B | 4 performance improvements | Low | 3 hours |
| C | 5 architectural improvements | Medium | 4 hours |
| D | 14 file deletions + cleanups | Very Low | 1 hour |
