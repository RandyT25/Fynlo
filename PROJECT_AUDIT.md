# PROJECT_AUDIT.md — Fynlo Full Codebase Audit

> Generated: 2026-06-14 | Auditor: Senior Staff Engineer Review

---

## 1. Project Overview

**Fynlo** is a personal finance PWA (Progressive Web App) built mobile-first. It allows users to track income/expenses, manage accounts, set budgets, define savings goals, and monitor subscriptions and recurring payments.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.7 (App Router) |
| Runtime | React 19.2.4 |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS v4 + shadcn/ui components |
| UI Primitives | `@base-ui/react` (replaces Radix in latest shadcn) |
| State Management | Zustand 5 (auth + UI stores) |
| Backend / Auth | Supabase (`@supabase/ssr` 0.10, `@supabase/supabase-js` 2.107) |
| Forms | react-hook-form 7 + zod 4 validation |
| Charts | Recharts 3 |
| Date Utilities | date-fns 4 |
| Animations | framer-motion 12 |
| Toast Notifications | Sonner 2 |
| Deployment | Vercel (`.vercel/project.json` present) |
| PWA | Manifest + service worker (`/public/sw.js`) |
| Package Manager | npm (package-lock.json present) |

---

## 3. Architecture Pattern

**Client-heavy with optional SSR.** The application is almost entirely rendered on the client:

- All feature content components are `'use client'` — they're not SSR'd
- Page files (`/app/(dashboard)/*/page.tsx`) are Server Components that render into `AppLayout`, which wraps `MobileNav` + content
- Data is fetched client-side via Supabase JS SDK in custom React hooks
- No API routes exist; all DB access goes directly from the browser to Supabase via Row Level Security

---

## 4. Framework Versions

- **Next.js**: 16.2.7 (bleeding edge — verify against official docs before touching routing or middleware)
- **React**: 19.2.4 (concurrent features available)
- **Tailwind**: v4 (different config model from v3 — no `tailwind.config.js`, uses CSS-native config)
- **Zod**: v4 (breaking changes from v3)
- **Zustand**: v5 (new store creation API)

---

## 5. Folder Structure

```
Fynlo/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Login / Signup / ForgotPassword pages
│   │   ├── (dashboard)/         # All authenticated pages (14 routes)
│   │   ├── globals.css          # Global styles + custom utilities
│   │   ├── layout.tsx           # Root layout (font, metadata, Providers)
│   │   └── page.tsx             # Root → redirects to /dashboard
│   ├── components/
│   │   ├── layout/              # AppLayout, MobileNav, MobileHeader, (dead: Header, Sidebar)
│   │   ├── shared/              # EmptyState, ErrorState, LoadingSpinner, DynamicIcon
│   │   └── ui/                  # shadcn/base-ui components (accordion, dialog, sheet…)
│   ├── features/
│   │   ├── accounts/            # AccountsContent, AccountForm
│   │   ├── analytics/           # AnalyticsContent
│   │   ├── budgets/             # BudgetsContent + inline BudgetForm
│   │   ├── calendar/            # CalendarContent
│   │   ├── dashboard/           # DashboardContent + 9 UNUSED sub-components
│   │   ├── family/              # FamilyContent
│   │   ├── goals/               # GoalsContent + inline GoalForm
│   │   ├── more/                # MoreContent (grid nav menu)
│   │   ├── notifications/       # NotificationsContent
│   │   ├── recurring/           # RecurringContent
│   │   ├── settings/            # SettingsContent (profile, currency, theme, timezone)
│   │   ├── subscriptions/       # SubscriptionsContent
│   │   ├── tasks/               # TasksContent
│   │   ├── transactions/        # TransactionsContent + TransactionForm
│   │   └── wishlist/            # WishlistContent
│   ├── hooks/
│   │   ├── use-auth.ts          # Auth state + session listener
│   │   ├── use-accounts.ts      # Account CRUD
│   │   ├── use-dashboard.ts     # Dashboard aggregation (multiple queries)
│   │   ├── use-transactions.ts  # Transaction CRUD with filters
│   │   ├── use-currency.ts      # Read currency from auth store
│   │   └── use-currency-symbol.ts
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── any-client.ts    # Browser Supabase client (untyped)
│   │   │   ├── client.ts        # Browser Supabase client (typed)
│   │   │   ├── middleware.ts    # updateSession helper for middleware
│   │   │   ├── server.ts        # Server-side Supabase client
│   │   │   └── typed-client.ts  # DEAD: useless db() wrapper
│   │   ├── utils/
│   │   │   ├── index.ts         # cn, sleep, groupBy, formatters (WARNING: duplicate cn)
│   │   │   ├── format.ts        # formatCurrency, formatDate, etc.
│   │   │   └── colors.ts        # Color maps for account/transaction types
│   │   ├── validations/
│   │   │   ├── auth.ts, account.ts, budget.ts, goal.ts, transaction.ts
│   │   └── utils.ts             # shadcn cn() — uses clsx + tailwind-merge
│   ├── store/
│   │   ├── auth.store.ts        # User + profile state (persisted)
│   │   ├── dashboard.store.ts   # DEAD: never imported
│   │   └── ui.store.ts          # Sidebar/command state — only used by dead components
│   ├── types/
│   │   └── database.ts          # Full Supabase DB type definitions
│   └── proxy.ts                 # Next.js Middleware (auth protection + session refresh)
├── supabase/migrations/         # 9 SQL migration files
├── public/
│   ├── icons/                   # PWA icons (7 sizes)
│   ├── manifest.json            # PWA manifest
│   └── sw.js                    # Service worker
└── docs/                        # GitHub Pages marketing site
```

---

## 6. State Management Approach

| Store | Purpose | Status |
|---|---|---|
| `useAuthStore` | User session + profile (persisted to localStorage) | Active |
| `useDashboardStore` | Dashboard data snapshot | **DEAD — never imported** |
| `useUIStore` | Sidebar open/command palette state | **DEAD — only used by dead sidebar/header** |

Majority of data state lives in local component state via custom hooks (`useState` + Supabase queries). No global data cache.

---

## 7. Database Structure (Supabase)

**14 tables:** `profiles`, `accounts`, `categories`, `transactions`, `recurring_transactions`, `budgets`, `goals`, `goal_milestones`, `families`, `family_members`, `subscriptions`, `bill_reminders`, `notifications`, `exchange_rates`, `wishlist`, `tasks`, `audit_logs`

**2 views:** `monthly_summary`, `category_spending`

**2 functions:** `get_net_worth`, `calculate_budget_utilization`

RLS policies enforced. Soft-delete pattern (`deleted_at` timestamp) on all mutable tables.

---

## 8. Authentication Flow

1. User visits `/login` → `supabase.auth.signInWithPassword()` or Google OAuth or magic link
2. On success, `onAuthStateChange` in `useAuth()` fires → fetches `profiles` row → populates `useAuthStore`
3. `proxy.ts` (Next.js middleware) calls `updateSession` on every request → refreshes Supabase session cookies
4. Protected routes redirect to `/login` if no session; auth routes redirect to `/dashboard` if session exists
5. Profile is persisted to `localStorage` via Zustand `persist` middleware (only `profile` field, not `user`)

---

## 9. API Architecture

**No custom API routes.** All data operations go directly browser → Supabase:
- Row Level Security enforces per-user data isolation
- Client uses `createBrowserClient` from `@supabase/ssr`
- Auth via Supabase JWT cookies managed by middleware

---

## 10. Deployment Configuration

- **Platform:** Vercel (project.json present)
- **Build:** `next build` → static pages (`○`) for all routes
- **Middleware:** `proxy.ts` runs as Edge middleware on all non-static paths
- **Environment variables:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`

---

## 11. Third-Party Dependencies (Key)

| Package | Purpose | Notes |
|---|---|---|
| `@supabase/ssr` | Server-side Supabase | Primary backend |
| `@supabase/supabase-js` | Browser Supabase SDK | Primary backend |
| `@base-ui/react` | UI primitives (replaces Radix) | Used in all UI components |
| `@radix-ui/*` (9 packages) | Legacy UI primitives | **Potentially unused — see Dependency Report** |
| `framer-motion` | Animations | Heavy dep, used heavily |
| `recharts` | Charts | Used in analytics, accounts, dashboard |
| `react-hook-form` + `zod` | Forms + validation | Used in all forms |
| `zustand` | State management | 3 stores, 2 dead |
| `date-fns` | Date utilities | Used everywhere |
| `next-themes` | Dark/light theme | Used in providers |
| `shadcn` | Component CLI | **Should be devDependency** |
| `cmdk` | Command palette | Listed but no palette UI implemented |
| `react-day-picker` | Calendar picker | Used only in Calendar component |
