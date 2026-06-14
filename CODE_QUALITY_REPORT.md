# CODE_QUALITY_REPORT.md — Fynlo Code Quality Review

> Generated: 2026-06-14

---

## CQ-001 — Duplicated `groupByDate` / `dateLabel` Functions (MEDIUM)

**Files:**
- `src/features/dashboard/dashboard-content.tsx:19-28, 30-35`
- `src/features/transactions/transactions-content.tsx:22-31, 33-38`

Identical logic for grouping transactions by date and formatting date labels is copy-pasted between these two files. The only difference is the label format (dashboard uses `"EEEE, MMMM d"` while transactions uses `"EEE, MMM d"`).

**Fix:** Extract to `src/lib/utils/format.ts` as `groupTransactionsByDate(txns)` and `formatDateGroupLabel(date, format?)`.

---

## CQ-002 — Duplicated Balance Calculation Logic (MEDIUM)

**Files:**
- `src/hooks/use-dashboard.ts:66-69`
- `src/hooks/use-accounts.ts:36-40`

Both hooks compute total balance with identical logic:
```typescript
if (a.type === 'credit_card' || a.type === 'loan') return sum - Math.abs(a.balance)
return sum + a.balance
```

**Fix:** Extract to `src/lib/utils/index.ts` as `calculateNetBalance(accounts: Account[]): number`.

---

## CQ-003 — Duplicated Categories Fetch (MEDIUM)

**Files:**
- `src/hooks/use-dashboard.ts:55` — fetches categories
- `src/hooks/use-transactions.ts:46` — fetches categories again
- `src/features/analytics/analytics-content.tsx:72` — fetches categories again
- `src/features/budgets/budgets-content.tsx:52` — fetches categories again

Categories are system/user-defined reference data that changes rarely. They're fetched fresh from the database in 4 separate places on every load. This creates redundant network roundtrips.

**Fix:** Create a `useCategories()` hook that fetches once and caches in a Zustand store or `useMemo`. For now, even moving the fetch to a shared hook reduces duplication.

---

## CQ-004 — Two `cn` Implementations (HIGH)

**Files:**
- `src/lib/utils.ts` — uses `clsx` + `tailwind-merge` (correct, used by all active imports)
- `src/lib/utils/index.ts` — simple string join (no conflict resolution)

If a developer imports `cn` from `@/lib/utils/index` instead of `@/lib/utils`, they'll get a weaker implementation that doesn't resolve Tailwind class conflicts (e.g., `bg-red-500 bg-blue-500` would result in both classes instead of the last one winning).

**Fix:** Remove the `cn` export from `src/lib/utils/index.ts`.

---

## CQ-005 — `useAuth` Hook Creates Multiple Subscriptions (MEDIUM)

**File:** `src/hooks/use-auth.ts`

`useAuth()` is called in: `dashboard-content.tsx`, `transactions-content.tsx`, `settings-content.tsx`, `more-content.tsx`. Each call creates a separate `onAuthStateChange` subscription. When a user navigates between pages, subscriptions accumulate (though they're cleaned up on unmount via `subscription.unsubscribe()`).

The real issue: `supabase.auth.signOut()` in the hook triggers multiple parallel `onAuthStateChange` callbacks firing simultaneously across all mounted components — all racing to call `reset()`, `setUser(null)`, and `router.push('/login')`.

**Fix:** Move auth state management to a single `AuthProvider` in `src/components/layout/providers.tsx`. Components call `useAuthStore()` directly rather than `useAuth()`.

---

## CQ-006 — BudgetForm and GoalForm Defined Inside Page-Level Files (LOW)

**Files:**
- `src/features/budgets/budgets-content.tsx` — 399 lines, contains `BudgetsContent` + `BudgetForm`
- `src/features/goals/goals-content.tsx` — 382 lines, contains `GoalsContent` + `GoalForm`
- `src/features/recurring/recurring-content.tsx` — long, contains `RecurringContent` + inline form

Each file is a content component + a form component. The forms are not reusable if another page wants them (e.g., adding a budget from the dashboard page).

This is acceptable in a small app, but worth splitting when the feature grows.

**Recommendation (low priority):** Extract `BudgetForm` → `src/features/budgets/budget-form.tsx`, same for GoalForm.

---

## CQ-007 — `any` Types in Core Data Layer (HIGH)

**File:** `src/lib/supabase/any-client.ts`
```typescript
return createBrowserClient(url, key) as any
```

The `any-client.ts` module intentionally strips all types from the Supabase client. This means every query made through it loses autocomplete and type-checking. The typed `client.ts` exists but isn't used by hooks — they all import from `any-client.ts`.

**Fix:** Consolidate to the typed `client.ts` (or the `typed-client.ts` approach, but properly typed). Remove `any-client.ts`.

---

## CQ-008 — Hardcoded `<a href>` vs `<Link>` (LOW)

**Files:**
- `src/features/dashboard/dashboard-content.tsx:59,69,113` — uses `<a href="/settings">`, `<a href="/notifications">`, `<a href="/transactions">`
- `src/components/layout/header.tsx:71` — uses `<a href="/settings">`
- `src/features/settings/settings-content.tsx` — n/a (button clicks)

Raw `<a>` tags cause full page navigation (loading indicator, JS re-parsing). Next.js `<Link>` does client-side navigation with prefetching.

**Fix:** Replace all `<a href="...">` inside app layouts with `<Link href="...">` from `next/link`.

---

## CQ-009 — Supabase Placeholder Values in Client Code (LOW)

**Files:** `src/lib/supabase/client.ts`, `src/lib/supabase/any-client.ts`, `src/lib/supabase/middleware.ts`, `src/lib/supabase/server.ts`

All four Supabase client files have identical fallback patterns:
```typescript
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
```

This silently creates a Supabase client pointed at a placeholder URL if env vars are missing. Requests will fail with network errors rather than a clear "missing configuration" message.

**Fix:** Replace with explicit guards:
```typescript
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!url || !key) throw new Error('Missing Supabase environment variables')
```

---

## CQ-010 — Custom Toggle UI Re-implements `Switch` (LOW)

**File:** `src/features/goals/goals-content.tsx:111-117`
```typescript
<button className={cn('w-11 h-6 rounded-full ...', showCompleted ? 'bg-primary' : 'bg-muted')} ...>
  <div className={cn('w-5 h-5 bg-white rounded-full absolute ...', showCompleted ? 'translate-x-5' : 'translate-x-0.5')} />
</button>
```

This reimplements a toggle switch manually when `src/components/ui/switch.tsx` (`@base-ui/react/switch`) already exists and is used in the same codebase.

**Fix:** Replace with `<Switch checked={showCompleted} onCheckedChange={setShowCompleted} />`.

---

## CQ-011 — `save()` in Settings Casts to `any` (LOW)

**File:** `src/features/settings/settings-content.tsx:89-103`
```typescript
const save = async (fields: Record<string, unknown>) => {
  ...
  setProfile({ ...base, ...fields } as any)
}
```

The `as any` cast here means TypeScript won't catch if `fields` contains invalid profile keys. If someone calls `save({ curency: 'EUR' })` (typo), it silently stores a wrong field in the profile without any error.

**Fix:** Type `fields` as `Partial<Profile>` and remove the `as any` on `setProfile`.

---

## Summary

| Issue | Severity | Effort |
|---|---|---|
| CQ-007: `any` in core data layer | High | Medium |
| CQ-004: Duplicate `cn` | High | Low |
| CQ-005: Multiple auth subscriptions | Medium | Medium |
| CQ-001: Duplicate groupByDate | Medium | Low |
| CQ-002: Duplicate balance calc | Medium | Low |
| CQ-003: Duplicate categories fetch | Medium | Medium |
| CQ-006: Forms in content files | Low | Medium |
| CQ-008: `<a href>` vs `<Link>` | Low | Low |
| CQ-009: Silent placeholder URLs | Low | Low |
| CQ-010: Custom toggle | Low | Low |
| CQ-011: `save()` cast | Low | Low |
