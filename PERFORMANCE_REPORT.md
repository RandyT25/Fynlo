# PERFORMANCE_REPORT.md — Fynlo Performance Audit

> Generated: 2026-06-14

---

## PERF-001 — N+1 Database Queries in Cash Flow (CRITICAL)

**File:** `src/hooks/use-dashboard.ts:100-123` — `getCashFlowData()`

```typescript
for (let i = months - 1; i >= 0; i--) {
  // One DB query PER MONTH — 6 sequential round trips
  const { data } = await supabase
    .from('transactions')
    .select('type,amount')
    .gte('date', start).lte('date', end)
}
```

**Severity:** Critical
**Impact:** Dashboard load time increases by ~N × DB_LATENCY. With 6 months, that's 6 sequential roundtrips (~1-2 seconds on typical latency) just for the chart data, blocking the dashboard from rendering.

**Fix:** Single query with full date range, then group in JavaScript:
```typescript
async function getCashFlowData(supabase, months: number) {
  const oldest = format(subMonths(new Date(), months - 1), 'yyyy-MM-dd')
  const { data } = await supabase
    .from('transactions')
    .select('type,amount,date')
    .is('deleted_at', null)
    .gte('date', oldest)
  
  // Group by month in JS — no extra DB round trips
  const monthMap: Record<string, { income: number; expenses: number }> = {}
  for (const t of data ?? []) {
    const month = t.date.slice(0, 7)
    if (!monthMap[month]) monthMap[month] = { income: 0, expenses: 0 }
    if (t.type === 'income' || t.type === 'refund') monthMap[month].income += t.amount
    else if (t.type === 'expense') monthMap[month].expenses += t.amount
  }
  return results
}
```

---

## PERF-002 — No Data Caching Layer (HIGH)

**Files:** All hooks (`use-dashboard.ts`, `use-transactions.ts`, `use-accounts.ts`, etc.)

Every hook triggers fresh Supabase queries on every component mount. Navigating away from and back to the Dashboard page fetches all 7+ queries again. There's no stale-while-revalidate, no in-memory cache, no time-based invalidation.

**Severity:** High
**Impact:** Users experience loading spinners every time they navigate back to a page they've already visited. Heavy data usage on mobile.

**Options (in order of effort):**
1. **Low effort:** Store fetched data in Zustand (the unused `useDashboardStore` was built for this)
2. **Medium effort:** Add `react-query` (`@tanstack/react-query`) or `swr` — industry standard for this pattern
3. **Low effort:** Cache in a `useMemo` with a TTL flag at module level (quick & dirty)

---

## PERF-003 — Redundant Categories Fetches (HIGH)

**Files:** `use-dashboard.ts`, `use-transactions.ts`, `analytics-content.tsx`, `budgets-content.tsx`

Categories are fetched from the DB in 4 separate places. Categories rarely change (they're system-seeded + user additions). Every page visit triggers a fresh categories query even though the data is essentially static.

**Severity:** High
**Impact:** 4× more DB queries than necessary. Categories table grows slowly, but each query adds latency.

**Fix:** Create a `useCategories()` hook backed by a short TTL Zustand cache or React Query.

---

## PERF-004 — `buildTimezones()` Module-Level Execution (MEDIUM)

**File:** `src/features/settings/settings-content.tsx:57`
```typescript
const ALL_TIMEZONES = buildTimezones()  // Runs on module import
```

`buildTimezones()` calls `Intl.supportedValuesOf('timeZone')` (returns ~400 strings) then calls `new Intl.DateTimeFormat(...)` for each one. This runs synchronously on the first import of the settings module.

**Severity:** Medium
**Impact:** ~5-15ms synchronous blocking during module initialization. Happens even when the user never opens the Timezone sheet.

**Fix:** Lazy compute — only run when the timezone sheet opens:
```typescript
const [allTimezones, setAllTimezones] = useState<Timezone[]>([])
// In openSheet handler:
if (sheet === 'timezone' && allTimezones.length === 0) {
  setAllTimezones(buildTimezones())
}
```

---

## PERF-005 — Framer Motion on Every Page (MEDIUM)

**Files:** Most feature content files import `motion` from `framer-motion`

Framer-motion 12 has tree-shaking support, but the full `motion` component import pulls in significant bundle weight. Usage is primarily for list-item enter animations (`opacity 0 → 1`, `y 8 → 0`).

**Severity:** Medium
**Impact:** Adds ~40-60KB gzipped to the JS bundle for simple fade-in animations that could be replaced with CSS transitions.

**Options:**
1. Replace simple opacity/translate animations with Tailwind CSS classes (`animate-in`, `fade-in`, `slide-in-from-bottom`)
2. Use framer-motion's `LazyMotion` + `domAnimation` feature set to reduce bundle size
3. Keep as-is (acceptable for a PWA where the bundle is cached after first load)

---

## PERF-006 — Dashboard Fetches 7 Queries on Every Mount (MEDIUM)

**File:** `src/hooks/use-dashboard.ts:40-56`

The dashboard fires 7 parallel Supabase queries + 2 more sequential calls (`getCashFlowData` with N+1, `getCategorySpending`). That's 9+ DB round trips per dashboard load.

**Severity:** Medium
**Impact:** Dashboard initial load takes 1-3 seconds on first visit. Subsequent loads just as slow (no caching).

**Fix:**
1. Fix the N+1 from PERF-001 first
2. Use the Supabase `monthly_summary` view for income/expense totals (already exists in DB)
3. Cache results for 5 minutes in Zustand

---

## PERF-007 — `useTransactions` Creates Client On Each `fetchTransactions` Call (LOW)

**File:** `src/hooks/use-transactions.ts:27`
```typescript
const fetchTransactions = useCallback(async () => {
  ...
  const supabase = createClient()  // new client on each fetch
```

**Severity:** Low
**Impact:** Negligible — Supabase browser clients are lightweight and cache the auth session.

**Fix (cosmetic):** Move `createClient()` outside the callback.

---

## PERF-008 — No Font Preloading (LOW)

**File:** `src/app/layout.tsx:12`
```typescript
preload: false,
```

IBM Plex Sans is configured with `preload: false`. This means the browser won't start downloading the font until it sees it referenced in CSS, adding ~100-300ms of FOIT (Flash of Invisible Text) on first visit.

**Severity:** Low
**Impact:** Visible text flash on first load in poor network conditions.

**Fix:** Change to `preload: true` (the default) or use `display: 'optional'` with `preload: true`.

---

## PERF-009 — No Image Optimization for Avatar / Icons (LOW)

**File:** `src/features/settings/settings-content.tsx:142`
```typescript
<img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
```

Raw `<img>` instead of Next.js `<Image>` component means no automatic size optimization, lazy loading, or WebP conversion.

**Severity:** Low
**Impact:** Avatar images are served at original resolution (potentially 2-5MB for camera photos) instead of optimized thumbnails.

**Fix:** Use `<Image>` from `next/image` for user-uploaded avatars.

---

## PERF-010 — `motion.div` Staggered Animations on Large Lists (LOW)

**Files:** `transactions-content.tsx`, `accounts-content.tsx`, `goals-content.tsx`
```typescript
transition={{ delay: Math.min(i * 0.02, 0.2) }}
```

Staggered animations are computed and applied for every item in a list. On transactions with 50+ items, 50 animation instances run simultaneously.

**Severity:** Low
**Impact:** Minor jank on first render of large transaction lists. `Math.min(i * 0.02, 0.2)` caps at 0.2s which is reasonable.

**Fix:** Apply stagger only to the first 10-15 items; render the rest without animation.

---

## Performance Summary

| ID | Issue | Severity | Estimated Improvement |
|---|---|---|---|
| PERF-001 | N+1 queries in cash flow | Critical | ~1-2s off dashboard load |
| PERF-002 | No data caching | High | Eliminates repeat loads |
| PERF-003 | Redundant category fetches | High | 3× fewer queries |
| PERF-004 | Module-level timezone build | Medium | 5-15ms faster import |
| PERF-005 | Framer-motion bundle | Medium | ~40KB bundle reduction |
| PERF-006 | 7+ queries on dashboard | Medium | With caching: near-instant |
| PERF-007 | Client per fetch call | Low | Negligible |
| PERF-008 | Font preload disabled | Low | ~100ms FOIT eliminated |
| PERF-009 | Raw img for avatars | Low | Smaller avatar payloads |
| PERF-010 | Staggered animations | Low | Smoother large lists |
