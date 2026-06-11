# 🧠 Fynlo Brain
> The complete knowledge base for building, maintaining, and extending Fynlo.  
> Read this before touching any code.

---

## Table of Contents
1. [What is Fynlo](#1-what-is-fynlo)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Critical Conventions & Gotchas](#4-critical-conventions--gotchas)
5. [Database Schema](#5-database-schema)
6. [Authentication Flow](#6-authentication-flow)
7. [Feature Map](#7-feature-map)
8. [Component Patterns](#8-component-patterns)
9. [Supabase Patterns](#9-supabase-patterns)
10. [State Management](#10-state-management)
11. [Styling System](#11-styling-system)
12. [Known Issues & Fixes](#12-known-issues--fixes)
13. [Environment Variables](#13-environment-variables)
14. [Deployment](#14-deployment)
15. [Roadmap](#15-roadmap)

---

## 1. What is Fynlo

Fynlo is a **modern budgeting and money management SaaS PWA** — think Revolut meets Copilot Money.

**Core purpose:** Help users understand where money comes from, where it goes, whether they're on budget, and how close they are to their goals.

**Target feel:** Apple-quality UI, premium fintech design, glassmorphism, smooth animations, mobile-first.

**Repository:** https://github.com/RandyT25/Fynlo.git  
**Local path:** `/Users/randy/Fynlo`  
**Dev app path:** `/Users/randy/fynlo-app` (working directory for dev server)  
**Supabase project:** `https://bkexmqciihsbbsxrwwag.supabase.co`

---

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | **Next.js 16.2.7** | App Router, Turbopack, NOT pages router |
| Language | **TypeScript** (strict) | No `any` except in Supabase mutations |
| Styling | **Tailwind CSS v4** | Uses `@import "tailwindcss"`, NOT `@tailwind` directives |
| Components | **Shadcn UI v3** (base-ui) | Uses `@base-ui/react`, NOT Radix UI |
| Animations | **Framer Motion** | Used on cards, page transitions, lists |
| Charts | **Recharts** | AreaChart, BarChart, PieChart, LineChart |
| Backend | **Supabase** | Auth + PostgreSQL + Storage + RLS |
| State | **Zustand** | auth.store, ui.store, dashboard.store |
| Forms | **React Hook Form + Zod** | All forms validated with Zod schemas |
| ORM | None | Direct Supabase JS client queries |
| Hosting | **Vercel** | Auto-deploy on push to main |
| PWA | Service Worker | `/public/sw.js` + `/public/manifest.json` |

---

## 3. Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login, signup, forgot-password — no sidebar
│   │   ├── layout.tsx       # Full-screen gradient background
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (dashboard)/         # All authenticated pages — has sidebar
│   │   ├── layout.tsx       # Server component — checks auth, redirects
│   │   ├── dashboard/page.tsx
│   │   ├── transactions/page.tsx
│   │   ├── accounts/page.tsx
│   │   ├── budgets/page.tsx
│   │   ├── goals/page.tsx
│   │   ├── analytics/page.tsx
│   │   ├── calendar/page.tsx
│   │   ├── subscriptions/page.tsx
│   │   ├── recurring/page.tsx
│   │   ├── family/page.tsx
│   │   ├── tasks/page.tsx
│   │   ├── wishlist/page.tsx
│   │   ├── notifications/page.tsx
│   │   └── settings/page.tsx
│   ├── layout.tsx           # Root layout — fonts, ThemeProvider, Toaster
│   ├── page.tsx             # Redirects to /dashboard
│   └── globals.css          # Tailwind + custom CSS variables + utilities
│
├── components/
│   ├── layout/
│   │   ├── app-layout.tsx   # Wraps all dashboard pages (Sidebar + Header + MobileNav)
│   │   ├── sidebar.tsx      # Collapsible desktop sidebar with nav items
│   │   ├── header.tsx       # Top bar with search, theme toggle, avatar
│   │   ├── mobile-nav.tsx   # Bottom tab bar for mobile
│   │   └── providers.tsx    # ThemeProvider + TooltipProvider
│   ├── shared/
│   │   ├── loading-spinner.tsx  # LoadingSpinner + LoadingPage
│   │   ├── empty-state.tsx      # Reusable empty state with icon + CTA
│   │   └── error-state.tsx      # Error display with retry button
│   └── ui/                  # Shadcn generated components (don't edit manually)
│       └── amount-input.tsx # Custom formatted number input — shows dots as thousands separator while typing
│
├── features/                # Feature-based architecture — one folder per feature
│   ├── dashboard/           # Balance card, stat cards, charts, previews
│   ├── transactions/        # Transaction list, form, filters, CSV export
│   ├── accounts/            # Account cards, form, grouped by type
│   ├── budgets/             # Budget cards with progress bars, form
│   ├── goals/               # Goal cards, form, milestone tracking
│   ├── analytics/           # Time-range charts (area, bar, pie, line)
│   ├── calendar/            # Financial events on calendar
│   ├── subscriptions/       # Subscription list + monthly cost summary
│   ├── recurring/           # Recurring transaction list + pause/resume
│   ├── family/              # Family group + member management
│   ├── tasks/               # Financial to-do list
│   ├── wishlist/            # Wishlist with goal conversion
│   ├── notifications/       # Notification center
│   └── settings/            # Profile, theme, notification preferences
│
├── hooks/
│   ├── use-auth.ts          # Auth state + signOut (uses Supabase onAuthStateChange)
│   ├── use-accounts.ts      # Fetch accounts + totalBalance calculation
│   ├── use-transactions.ts  # Fetch transactions with filters + delete
│   └── use-dashboard.ts     # All dashboard data in one hook
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # Browser Supabase client (typed, for reads)
│   │   ├── server.ts        # Server Supabase client (async cookies)
│   │   ├── middleware.ts    # Auth session refresh for proxy.ts
│   │   └── any-client.ts   # Untyped client for mutations (bypasses strict types)
│   ├── utils/
│   │   ├── format.ts        # formatCurrency, formatDate, formatPercent, etc.
│   │   ├── colors.ts        # CHART_COLORS, getAccountColor, getTransactionColor
│   │   └── index.ts         # cn(), groupBy(), sortByDate(), calculateGrowthRate()
│   └── validations/
│       ├── auth.ts          # loginSchema, signUpSchema, etc.
│       ├── transaction.ts   # transactionSchema, recurringTransactionSchema
│       ├── account.ts       # accountSchema
│       ├── budget.ts        # budgetSchema
│       └── goal.ts          # goalSchema
│
├── store/
│   ├── auth.store.ts        # user, profile, isLoading
│   ├── ui.store.ts          # sidebarOpen, mobileNavOpen, commandOpen
│   └── dashboard.store.ts   # accounts, budgets, goals, summaries
│
├── types/
│   └── database.ts          # Complete Supabase DB types + all Row/Insert/Update types
│
└── proxy.ts                 # Next.js 16 auth middleware (was middleware.ts in v14)

supabase/
└── migrations/
    ├── 001_initial_schema.sql        # All tables, enums, triggers, RLS, seed categories
    ├── 002_fix_rls_policies.sql      # Fixed infinite recursion in family_members RLS
    ├── 003_grant_permissions.sql     # GRANT statements for anon/authenticated roles
    ├── 004_fix_auth_trigger.sql      # Fixed handle_new_user trigger for Supabase Auth
    ├── 005_backfill_missing_profiles.sql
    ├── 006_storage_avatars.sql
    ├── 007_add_loan_category.sql
    ├── 008_seed_subcategories.sql
    └── 009_fix_loan_balance_and_original.sql  # Fixes transfer→loan trigger direction; adds original_balance column

public/
├── manifest.json            # PWA manifest
├── sw.js                    # Service worker (offline + push notifications)
└── icons/                   # PWA icons (72, 96, 128, 144, 152, 192, 384, 512)
```

---

## 4. Critical Conventions & Gotchas

### ⚠️ Next.js 16 is NOT Next.js 14/15

| Thing | Old (v14) | New (v16) |
|---|---|---|
| Middleware file | `middleware.ts` → export `middleware` | `proxy.ts` → export `proxy` |
| cookies() | sync | **async** — must `await cookies()` |
| Viewport | part of `Metadata` | separate `Viewport` export |
| `@tailwind` | `@tailwind base/components/utilities` | `@import "tailwindcss"` |

### ⚠️ Shadcn v3 uses `@base-ui/react` NOT Radix UI

This is the most common mistake. The components look the same but the API is different:

| Feature | Radix UI (old) | base-ui (current) |
|---|---|---|
| Render different element | `asChild` prop | `render` prop |
| TooltipProvider delay | `delayDuration` | `delay` |
| Select onChange | `(value: string) => void` | `(value: string \| null, eventDetails) => void` |
| Nesting | Button inside trigger = fine | **Button inside trigger = nested `<button>` error** |

**The `render` prop pattern** (use when SheetTrigger/DropdownMenuTrigger needs custom styling):
```tsx
// ❌ WRONG — nested button
<SheetTrigger>
  <Button>Open</Button>
</SheetTrigger>

// ✅ CORRECT — style the trigger directly
<SheetTrigger className="inline-flex items-center gap-2 h-8 px-2.5 text-sm font-medium rounded-lg gradient-primary text-white cursor-pointer">
  <Plus className="w-4 h-4" /> Add
</SheetTrigger>

// ✅ ALSO CORRECT — use render prop
<DropdownMenuTrigger render={<button className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))} />}>
  <Icon className="w-4 h-4" />
</DropdownMenuTrigger>
```

### ⚠️ Supabase TypeScript types are strict

The generated `Database` types make `.update()` and `.insert()` return `never` when payload doesn't exactly match. Two workarounds used in this project:

1. **For reads** → use `createClient()` from `lib/supabase/client.ts` (typed)
2. **For mutations in feature files** → use `createAnyClient()` from `lib/supabase/any-client.ts` (returns `any`, bypasses strict types)

```ts
// Reads — use typed client
import { createClient } from '@/lib/supabase/client'

// Mutations — use any client
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
```

### ⚠️ Theme hydration mismatch

Any component that reads `theme` from `next-themes` will mismatch between server and client because the server doesn't know the user's theme. Fix:

```tsx
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])

// Only apply theme-dependent classes after mount
const active = mounted && theme === value
```

### ⚠️ Supabase `.single()` vs `.maybeSingle()`

- `.single()` — throws 406 if no row found. Only use when you **know** a row exists (e.g., after insert).
- `.maybeSingle()` — returns `null` if no row found. Use for user lookups.

```ts
// ❌ 406 error if user has no family
await supabase.from('family_members').select('*').eq('user_id', id).single()

// ✅ Returns null safely
await supabase.from('family_members').select('*').eq('user_id', id).maybeSingle()
```

### ⚠️ Zod schemas — no `.default()` or `.coerce.number()`

React Hook Form with Zod resolvers breaks when schemas have `.default()` or `z.coerce.number()`. Use plain `.number()` and pass `valueAsNumber: true` on the input:

```tsx
// Schema
const schema = z.object({ amount: z.number().positive() })

// Input
<Input type="number" {...register('amount', { valueAsNumber: true })} />
```

### ⚠️ `.env.local` URL must be a real URL format

`NEXT_PUBLIC_SUPABASE_URL` must start with `https://` — not placeholder text. The Supabase client validates it at module load time, causing prerender failures at build time.

---

## 5. Database Schema

### Tables

| Table | Purpose |
|---|---|
| `profiles` | User profile extending `auth.users` |
| `accounts` | Financial accounts (cash, checking, credit card, etc.) |
| `categories` | Hierarchical transaction categories (unlimited nesting) |
| `transactions` | All income/expense/transfer/refund records |
| `recurring_transactions` | Templates for auto-generated transactions |
| `budgets` | Spending limits per category per period |
| `goals` | Savings/debt/custom financial goals |
| `goal_milestones` | Checkpoints within a goal |
| `families` | Family group (one owner, many members) |
| `family_members` | Users belonging to a family with roles |
| `subscriptions` | Tracked recurring services (Netflix, Spotify, etc.) |
| `bill_reminders` | Upcoming bills with due dates |
| `notifications` | In-app notification inbox |
| `exchange_rates` | Historical currency rates |
| `wishlist` | Items to save for (can convert to goals) |
| `tasks` | Financial to-dos |
| `audit_logs` | Record of all data changes |

### Enums

```sql
account_type:    cash | checking | savings | credit_card | loan | investment | crypto | business | custom
transaction_type: income | expense | transfer | refund
category_type:   income | expense | transfer
recurring_frequency: daily | weekly | biweekly | monthly | quarterly | yearly | custom
budget_period:   monthly | quarterly | yearly | custom
goal_type:       savings | debt | custom
family_role:     owner | admin | member | viewer
member_status:   pending | active | inactive
billing_cycle:   weekly | monthly | quarterly | yearly
subscription_status: active | cancelled | paused
priority:        low | medium | high | urgent
notification_type: bill_due | budget_exceeded | goal_milestone | subscription_renewal | transfer_reminder | general
```

### Key Triggers

- `on_auth_user_created` — auto-creates a `profiles` row when a user signs up
- `on_transaction_change` → `update_account_balance()` — updates `accounts.balance` on every transaction change:
  - income/refund → balance +
  - expense → balance −
  - transfer from account → balance −; transfer **to** asset account → balance +; transfer **to** liability (loan/credit_card) → balance − (paying off debt reduces it)
- `update_*_updated_at` — auto-updates `updated_at` timestamp on every table

### `accounts` table — extra columns
- `original_balance DECIMAL` — for loan/credit_card accounts: the original total borrowed. Used to compute "Paid = original − balance". NULL for non-loan accounts or loans created before migration 009.

### RLS Policy Pattern

All tables use Row Level Security. The key helper function:

```sql
CREATE OR REPLACE FUNCTION get_my_family_ids()
RETURNS UUID[] AS $$
  SELECT ARRAY(
    SELECT family_id FROM family_members
    WHERE user_id = auth.uid() AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

Most table policies follow: "user owns it OR it belongs to one of the user's families."

### Views

- `monthly_summary` — income, expenses, net, savings_rate per user per month
- `category_spending` — total spending per category per user per month

---

## 6. Authentication Flow

```
User visits app
  → proxy.ts checks session via Supabase
  → No session + protected route → redirect to /login
  → Has session + auth route → redirect to /dashboard

Sign Up:
  1. supabase.auth.signUp() creates auth.users row
  2. on_auth_user_created trigger fires → creates profiles row
  3. User redirected to dashboard

Sign In:
  1. supabase.auth.signInWithPassword() or signInWithOAuth()
  2. Session stored in cookies (handled by @supabase/ssr)
  3. use-auth.ts hook listens to onAuthStateChange
  4. Profile fetched and stored in Zustand auth.store

Sign Out:
  1. supabase.auth.signOut()
  2. Zustand store reset
  3. Redirect to /login
```

**Google OAuth:** Configured in Supabase Auth → Providers → Google. Redirect URL: `https://bkexmqciihsbbsxrwwag.supabase.co/auth/v1/callback`

**Magic Link:** Uses `supabase.auth.signInWithOtp({ email })`

---

## 7. Feature Map

### Dashboard
- **Files:** `features/dashboard/`
- **Key components:** `BalanceCard`, `StatCard`, `CashFlowChart`, `CategoryBreakdown`, `RecentTransactions`, `BudgetOverview`, `GoalsPreview`, `UpcomingBills`, `AccountsOverview`
- **Data hook:** `hooks/use-dashboard.ts` — fetches all dashboard data in parallel

### Transactions
- **CRUD:** Create, edit, delete, duplicate
- **Types:** income, expense, transfer, refund
- **Features:** bulk select+delete, CSV export, search, type filter
- **Form:** `features/transactions/transaction-form.tsx`
  - Accepts `initialValues?: Partial<TransactionInput>` to pre-fill fields (used by budget "Add Transaction")
  - Category picker is two-level pills: parent row → subcategory row when expanded
  - Amount input uses `AmountInput` component (dot-formatted for IDR)

### Accounts
- **Types:** cash, checking, savings, credit_card, loan, investment, crypto, business, custom
- **Net worth:** assets minus liabilities (credit cards and loans counted negative)
- **Grouped display:** "My Money" (assets) | "I Owe" (liabilities)
- **Loan tracking:** loan accounts store `original_balance` (total loan amount); the card shows "Owe $X · Paid $Y" when set
- **Loan form:** create asks for "Total Loan Amount" + optional "Amount Already Paid" → computes starting balance automatically
- **Transfer to loan:** correctly reduces loan balance (debt decreases when you pay it off) — fixed in migration 009

### Budgets
- **Period:** monthly, quarterly, yearly, custom
- **Rollover:** unused budget carries to next period
- **Utilization:** green (<80%) → yellow (80-99%) → red (over 100%)
- **Category picker:** two-level pill picker (same as transaction form), shows only expense categories
- **Add Transaction button:** each budget card has an inline "Add Transaction" button that opens TransactionForm pre-filled with that budget's category and type=expense

### Goals
- **Types:** savings, debt, custom
- **Features:** color-coded, target date optional, mark complete, milestones
- **Priority:** integer 0–10, sorted descending

### Analytics
- **Time ranges:** 7D, 30D, 90D, 6M, 1Y, ALL
- **Charts:** Cash flow trend (area), Net flow (bar), Category spending (pie), Income trend (line), Account allocation (pie)

### Family
- **Roles:** owner > admin > member > viewer
- **Shared:** accounts, transactions, budgets, goals all support `family_id`
- **Invite:** email-based (currently shows success toast — SMTP needed for real delivery)

### Subscriptions
- **Billing cycles:** weekly, monthly, quarterly, yearly
- **Monthly cost:** calculated by normalizing all cycles to monthly equivalent
- **Yearly cost:** monthly × 12

### Recurring Transactions
- **Frequencies:** daily, weekly, biweekly, monthly, quarterly, yearly, custom
- **Controls:** pause, resume, set end date, auto-create toggle
- **Next date:** calculated from start date + frequency on creation

---

## 8. Component Patterns

### Page structure
Every dashboard page follows this pattern:
```tsx
// page.tsx (server component)
export const metadata: Metadata = { title: 'Page Name' }
export default function Page() {
  return (
    <AppLayout title="Page Name" subtitle="Description">
      <FeatureContent />   {/* 'use client' component */}
    </AppLayout>
  )
}
```

### Loading / Empty / Error states
```tsx
if (isLoading) return <LoadingPage />
if (error) return <ErrorState message={error} onRetry={refetch} />
if (data.length === 0) return <EmptyState icon={Icon} title="..." action={{ label: '...', onClick: () => {} }} />
```

### Sheet (drawer) pattern
```tsx
// ✅ Correct — style trigger directly, no nested Button
<Sheet open={open} onOpenChange={setOpen}>
  <SheetTrigger className="inline-flex items-center gap-2 h-8 px-2.5 text-sm font-medium rounded-lg gradient-primary text-white cursor-pointer">
    <Plus className="w-4 h-4" /> Add Item
  </SheetTrigger>
  <SheetContent className="w-full sm:max-w-md overflow-y-auto">
    <SheetHeader><SheetTitle>Title</SheetTitle></SheetHeader>
    <div className="mt-6"><YourForm /></div>
  </SheetContent>
</Sheet>
```

### Form pattern
```tsx
const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<Input>({
  resolver: zodResolver(schema),
  defaultValues: { ... }
})

// Numeric inputs need valueAsNumber
<Input type="number" {...register('amount', { valueAsNumber: true })} />

// Selects need manual setValue
<Select onValueChange={(v: string | null) => setValue('field', v as any)}>
```

### FAB (Floating Action Button) pattern
**Never use `bottom-20` or any fixed Tailwind bottom class on a FAB.** The mobile nav bar's height includes `env(safe-area-inset-bottom)` for iPhones with home indicators, so a fixed pixel offset will clip the FAB.

Always use:
```tsx
<button
  className="fixed z-40 w-14 h-14 rounded-full gradient-primary text-white shadow-xl flex items-center justify-center active:scale-95 transition-transform"
  style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))', right: '1rem' }}
>
  <Plus className="w-6 h-6" />
</button>
```

Also add `pb-24` (or `pb-28`) to the scrollable list container so the last item isn't hidden behind the FAB.

### AmountInput component
Use `AmountInput` (not a plain `<input type="number">`) for all monetary inputs:

```tsx
import { AmountInput } from '@/components/ui/amount-input'

<AmountInput
  value={watch('amount') || 0}
  onChange={v => setValue('amount', v, { shouldValidate: true })}
  currency={userCurrency}          // determines thousands separator style
  currencySymbol={currencySymbol}  // prefix label (Rp, $, €…)
  placeholder="0"
/>
```

- **IDR / VND / JPY / KRW** → dot thousands, no decimals (`11.000.000`)
- **USD / EUR / GBP / etc.** → comma thousands, dot decimal (`1,050.50`)
- Passes a raw `number` to `onChange`, so form schema stays `z.number()`

### Number formatting
`formatCurrency(amount, currency)` in `lib/utils/format.ts` selects the locale automatically:

| Currency | Locale | Example |
|---|---|---|
| IDR | id-ID | Rp 11.000.000 |
| MYR, THB, PHP, VND | local | dot thousands |
| JPY, KRW | ja-JP / ko-KR | ¥ 11,000 |
| USD, EUR, GBP | en-US | $11,000.00 |

Never hardcode `'en-US'` locale in number formatting — always pass the currency to `formatCurrency`.

### Animations
```tsx
// List items
<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>

// Cards
<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>

// Page entry
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
```

---

## 9. Supabase Patterns

### Client selection
```ts
// Server components / hooks that only READ
import { createClient } from '@/lib/supabase/client'         // browser
import { createClient } from '@/lib/supabase/server'         // server component

// Feature files that WRITE (avoids TypeScript 'never' errors)
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
```

### Standard query pattern
```ts
const supabase = createClient()

// Read with relations
const { data, error } = await supabase
  .from('transactions')
  .select('*, account:accounts(id,name), category:categories(id,name,color)')
  .is('deleted_at', null)
  .eq('user_id', userId)
  .order('date', { ascending: false })
  .limit(10)

// Soft delete (never hard delete)
await supabase.from('transactions')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', id)

// Safe single row (won't 406 if missing)
const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
```

### RLS means no `user_id` filter needed (but add it anyway for performance)
RLS automatically filters by `auth.uid()`. Adding `.eq('user_id', userId)` is redundant but avoids full table scans.

### Casting narrow selects
When you select only specific columns, TypeScript infers a narrow type that may not match your usage. Cast it:
```ts
const txns = res.data as Array<{ type: string; amount: number; date: string }> | null
```

---

## 10. State Management

### Zustand stores

**`auth.store.ts`** — User + profile state
```ts
const { user, profile, isLoading } = useAuthStore()
```

**`ui.store.ts`** — UI state
```ts
const { sidebarOpen, toggleSidebar, setCommandOpen } = useUIStore()
```

**`dashboard.store.ts`** — Dashboard data cache
```ts
const { accounts, totalBalance, monthlyIncome } = useDashboardStore()
```

### When to use store vs hook
- **Store:** data shared across multiple components (auth, sidebar state)
- **Hook:** data specific to one feature (useTransactions, useAccounts)
- **Local state:** UI state within a single component (form open/closed, loading)

---

## 11. Styling System

### Brand colors
```
Primary:   #3B82F6  (blue)
Secondary: #8B5CF6  (purple)
Success:   #22C55E  (green)
Danger:    #EF4444  (red)
Neutral:   Slate scale
```

### CSS utility classes (defined in globals.css)
```css
.gradient-primary    /* blue → purple gradient background */
.gradient-success    /* green gradient */
.gradient-danger     /* red gradient */
.text-gradient       /* blue → purple gradient text */
.glass               /* glassmorphism background */
.glass-card          /* card with glass effect */
.card-hover          /* hover lift + shadow transition */
.scrollbar-hide      /* hide scrollbar (mobile) */
```

### Tailwind v4 — key differences
- No `tailwind.config.js` — configuration is in CSS via `@theme`
- Use `@import "tailwindcss"` not `@tailwind base/components/utilities`
- CSS variables use `oklch()` color format (not `hsl()`)

### Dark mode
The app uses `class` strategy (`dark` class on `<html>`). Managed by `next-themes`. Always test both modes.

---

## 12. Known Issues & Fixes

| Issue | Cause | Fix Applied |
|---|---|---|
| `<button>` nested in `<button>` | `SheetTrigger` + `Button` together | Style `SheetTrigger` directly with classes |
| `DropdownMenuTrigger` nested button | Same as above | Use `render` prop on trigger |
| Theme hydration mismatch | `theme` unknown on server | `mounted` state, only apply classes after `useEffect` |
| `handle_new_user` trigger fails | Auth role missing INSERT permission on profiles | Migration 004 grants `supabase_auth_admin` access |
| RLS infinite recursion | `family_members` policy referenced itself | Helper function `get_my_family_ids()` breaks the cycle |
| Supabase mutation `never` type | Strict DB types reject form data | Use `createAnyClient` for all mutation operations |
| `.single()` returns 406 | No row found but `.single()` requires exactly one | Use `.maybeSingle()` for optional lookups |
| `z.coerce.number()` breaks RHF | Coercion creates `unknown` input type | Use `z.number()` + `valueAsNumber: true` on input |
| PWA icons 404 | Icons directory was empty | SVG placeholder icons generated in `public/icons/` |
| `proxy.ts` deprecation warning | Old `middleware.ts` name used | Renamed to `proxy.ts`, export renamed to `proxy` |
| Loan balance increases on transfer payment | Trigger always added to `to_account` balance | Migration 009: subtract from liability `to_account` instead |
| Budget category shows UUID | `Select` defaultValue was UUID with no matching label | Replaced with two-level pill picker, no Select needed |
| FAB hides last list item | Insufficient bottom padding on scrollable containers | `pb-24` (dashboard) and `pb-28` (budgets) on list containers |
| FAB clipped by bottom nav on iPhone | `bottom-20` (fixed 80px) doesn't account for safe-area-inset | Use `style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))', right: '1rem' }}` on all FABs |
| IDR shows commas (11,000,000) | `formatCurrency` used `en-US` locale for all currencies | `CURRENCY_LOCALE` map picks `id-ID` for IDR → dots (11.000.000) |
| Amount input no live formatting | `type="number"` inputs don't format while typing | New `AmountInput` component with text input + dot-thousands formatter |

---

## 13. Environment Variables

```env
# Required — Supabase project
NEXT_PUBLIC_SUPABASE_URL=https://bkexmqciihsbbsxrwwag.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Required for server-side operations (Edge Functions, admin tasks)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App URL (used for OAuth redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000   # Change to prod URL on Vercel

# Push notifications (optional — for web push)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

**Finding your keys:** Supabase Dashboard → Settings → API

**Service Role Key:** Supabase Dashboard → Settings → API → `service_role` (secret, never expose client-side)

---

## 14. Deployment

### Vercel (recommended)

1. Push to GitHub (already connected at `RandyT25/Fynlo`)
2. Go to [vercel.com](https://vercel.com) → Import project → Select `Fynlo` repo
3. Add environment variables (same as `.env.local` but with production values)
4. Change `NEXT_PUBLIC_APP_URL` to your Vercel domain
5. Deploy

### Supabase Auth redirect URL for production
Supabase Dashboard → Authentication → URL Configuration → add:
```
https://your-app.vercel.app/dashboard
https://your-app.vercel.app/auth/callback
```

### Running locally
```bash
cd /Users/randy/fynlo-app
npm run dev        # http://localhost:3000
npm run build      # production build check
npm run lint       # ESLint
```

---

## 15. Roadmap

### Phase 1 — Core (Done ✅)
- [x] Auth (email, Google, magic link)
- [x] Dashboard with live data
- [x] Accounts management
- [x] Transactions (CRUD, export, bulk)
- [x] Budgets with rollover
- [x] Goals with milestones
- [x] Analytics with charts
- [x] Subscriptions tracker
- [x] Recurring transactions
- [x] Calendar view
- [x] Family sharing
- [x] Tasks, Wishlist
- [x] Notifications
- [x] Settings
- [x] PWA manifest + service worker

### Phase 2 — Polish
- [ ] Real PWA icons (replace SVG placeholders with actual Fynlo branding)
- [ ] Google OAuth setup in Supabase
- [ ] Email SMTP (Resend or SendGrid) for real transactional emails
- [ ] CSV import for transactions
- [ ] Search feature (global search across all data)
- [ ] Bill reminders with real push notifications

### Phase 3 — Advanced
- [ ] AI insights (spending anomaly detection, budget recommendations)
- [ ] Bank connection (Plaid/TrueLayer)
- [ ] Net worth historical chart
- [ ] Multi-currency with live exchange rates
- [ ] Subscription detection from transaction patterns
- [ ] Mobile app (React Native with shared Supabase backend)

### Phase 4 — Monetization
- [ ] Stripe subscription billing
- [ ] Free vs Pro tier gating
- [ ] Team/Business accounts
- [ ] White-label for financial advisors

---

*Last updated: June 11 2026*  
*Built with Claude Code*
