# ERROR_REPORT.md — Fynlo Error Analysis

> Generated: 2026-06-14

---

## Build & Type Errors

**Current build status: ✅ Passes (0 errors)**
TypeScript strict mode passes. No compile-time errors found.

---

## Runtime Errors

### ERR-001 — Silent DB Error Swallowing (HIGH)
**File:** `src/hooks/use-dashboard.ts:41-56`
```typescript
const [
  { data: accounts },           // ← error field discarded
  { data: recentTxn },          // ← error field discarded
  ...
] = await Promise.all([...])
```
**Severity:** High
**Explanation:** All 7 parallel Supabase queries destructure only `data`, silently discarding the `error` field. If RLS policies block a query (e.g., user not authenticated mid-session), the dashboard renders with null data and no indication of failure.
**Fix:**
```typescript
const [accountsRes, txnRes, ...] = await Promise.all([...])
if (accountsRes.error) { setError(accountsRes.error.message); setIsLoading(false); return }
```

---

### ERR-002 — Unstable Effect Dependency (MEDIUM)
**File:** `src/hooks/use-dashboard.ts:28-29`
```typescript
useEffect(() => {
  fetchDashboardData()
}, [])
```
**Severity:** Medium
**Explanation:** `fetchDashboardData` is defined inside the hook but not in the `useEffect` dependency array. React's exhaustive-deps rule would flag this. While it works here (function is stable due to being defined in hook scope), the pattern is inconsistent with how `useAccounts` and `useTransactions` handle it, and breaks if `fetchDashboardData` ever captures reactive values.
**Fix:** Move `fetchDashboardData` into a `useCallback` and add it as a dep, or add it to the effect dependencies.

---

### ERR-003 — Stale Closure in `useTransactions` (MEDIUM)
**File:** `src/hooks/use-transactions.ts:62`
```typescript
}, [JSON.stringify(filters)])
```
**Severity:** Medium
**Explanation:** Using `JSON.stringify` as a `useCallback` dependency is a fragile hack. It breaks when filter values contain non-serializable types or when key order changes. It also creates a new string on every render unnecessarily.
**Fix:** Destructure individual filter fields as dependencies:
```typescript
}, [filters.accountId, filters.categoryId, filters.type, filters.dateFrom, filters.dateTo, filters.search, filters.limit])
```

---

### ERR-004 — Unsafe `as any` Type Bypasses (HIGH)
**Files:**
- `src/lib/supabase/any-client.ts:7` — `return createBrowserClient(url, key) as any`
- `src/hooks/use-auth.ts:38` — `setProfile({ id: ..., email: ... } as any)`
- `src/features/budgets/budgets-content.tsx:258,262` — `null as any`
- `src/hooks/use-dashboard.ts:65,71,116` — multiple `as any` casts

**Severity:** High
**Explanation:** These type bypasses defeat TypeScript's value — a wrong field name or shape won't be caught at compile time. The `setProfile(...as any)` is especially risky: if the Profile type changes, the fallback will silently build a malformed profile object.
**Fix per site:**
1. `any-client.ts` → Type the return properly using `Database` generic: `return createBrowserClient<Database>(url, key)`
2. `use-auth.ts:38` → Create a typed partial profile constant
3. `budgets-content.tsx` → Use `undefined` instead of `null as any` for optional Zod fields
4. `use-dashboard.ts` → Type the intermediate variables properly

---

### ERR-005 — `confirm()` Blocking Dialog (MEDIUM)
**Files:**
- `src/features/goals/goals-content.tsx:56`
- `src/features/recurring/recurring-content.tsx:56`

```typescript
if (!confirm('Delete this goal?')) return
```
**Severity:** Medium
**Explanation:** `window.confirm()` is a synchronous blocking call. It doesn't work in iOS PWA standalone mode, gets blocked by some browsers' popup-blocking, looks jarring vs the app's design, and is inaccessible.
**Fix:** Replace with an `AlertDialog` from the existing shadcn/base-ui `alert-dialog.tsx` component.

---

### ERR-006 — Module-Level Side Effect in Settings (MEDIUM)
**File:** `src/features/settings/settings-content.tsx:57`
```typescript
const ALL_TIMEZONES = buildTimezones()
```
**Severity:** Medium
**Explanation:** `buildTimezones()` is called at module scope (outside any component), running on the first import. `Intl.supportedValuesOf('timeZone')` can return 400+ timezones, each requiring `Intl.DateTimeFormat` instantiation. This runs synchronously on the server during SSR and on the client on the first render. It adds measurable parse/execution time to the settings module.
**Fix:** Move inside the component with `useMemo`, or compute lazily on first open of the timezone sheet.

---

### ERR-007 — Hard Navigation in Header (LOW)
**File:** `src/components/layout/header.tsx:67`
```typescript
onClick={() => window.location.href='/notifications'}
```
**Severity:** Low
**Explanation:** Uses hard full-page navigation instead of Next.js client-side routing. Causes full page reload, loses scroll position, flushes React state.
**Fix:** Use `useRouter().push('/notifications')` or `<Link href="/notifications">`.

---

### ERR-008 — Analytics Effect Missing Stable Dependency (LOW)
**File:** `src/features/analytics/analytics-content.tsx:45`
```typescript
useEffect(() => { fetchAnalytics() }, [range])
```
**Severity:** Low
**Explanation:** `fetchAnalytics` is recreated on every render but not listed as a dependency. The correct pattern is either to memoize it with `useCallback` or define it inline in the effect. Currently works by coincidence (React bails out of re-running when `range` hasn't changed), but violates the rules of hooks.
**Fix:** Wrap `fetchAnalytics` in `useCallback([range])` and add to effect deps.

---

### ERR-009 — Potential Promise Unhandled Rejection (LOW)
**Files:** Multiple feature components
```typescript
const fetchGoals = useCallback(async () => { ... }, [])
useEffect(() => { fetchGoals() }, [fetchGoals])
```
**Severity:** Low
**Explanation:** Async functions called inside `useEffect` without `.catch()` can produce unhandled promise rejections if the component unmounts mid-fetch. Supabase queries don't throw (they return `{ data, error }`), but if network fails entirely, the promise may reject.
**Fix:** Add try/catch around async operations in useEffect, or use a cleanup flag.

---

### ERR-010 — Supabase Client Recreated Inside Form Component (LOW)
**Files:**
- `src/features/transactions/transaction-form.tsx:53` — `const supabase = createClient()` at component level
- `src/features/budgets/budgets-content.tsx:43` — `const supabase = createClient()`
- `src/features/goals/goals-content.tsx:38` — `const supabase = createClient()`

**Severity:** Low
**Explanation:** A new Supabase browser client is created on every render. Supabase clients cache the connection internally so this doesn't cause connection leaks, but it's unnecessary overhead and inconsistent with other hooks that create the client inside callbacks.
**Fix:** Extract to module-level singleton or a `useMemo`.

---

## Logic Errors

### ERR-011 — `GOAL_ICONS` Defined But Never Used (LOW)
**File:** `src/features/goals/goals-content.tsx:27`
```typescript
const GOAL_ICONS = ['🎯', '🏠', '✈️', '🚗', ...]
```
**Severity:** Low
**Explanation:** The constant is defined but the rendering always uses the hardcoded `'🎯'` emoji. The form's color picker uses `GOAL_COLORS` but the icon picker UI was never built.

---

### ERR-012 — Missing Loading State Propagation in `useAuth` (LOW)
**File:** `src/hooks/use-auth.ts:13-50`
**Severity:** Low
**Explanation:** The `useEffect` in `useAuth` creates a new `onAuthStateChange` subscription every time the hook is called. Multiple components call `useAuth()` — this means multiple parallel subscriptions to Supabase auth state. While Supabase deduplicates the underlying websocket, each component gets its own subscription cleanup. If components unmount and remount rapidly, there can be duplicate state updates.
**Fix:** Move the `onAuthStateChange` subscription to a single top-level Provider component, not a hook called in every component.
