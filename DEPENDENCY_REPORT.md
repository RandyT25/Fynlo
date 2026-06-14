# DEPENDENCY_REPORT.md — Fynlo Dependency Audit

> Generated: 2026-06-14

---

## REMOVE — Unused or Misplaced Dependencies

### 1. `shadcn` (runtime → should be devDependency)
**Current:** `"dependencies": { "shadcn": "^4.10.0" }`
**Issue:** `shadcn` is the CLI tool for adding/updating shadcn/ui components. It has no runtime functionality. It should be in `devDependencies` (or not installed at all after components are generated — it's run with `npx shadcn add`).
**Fix:** `npm rm shadcn && npm install --save-dev shadcn`
**Bundle savings:** Eliminates `shadcn` CLI package from production bundle (~15KB+ in node_modules, excluded from client bundle but wastes install time).

---

### 2. `@radix-ui/*` packages — Potentially Superseded by `@base-ui/react`
The codebase has migrated UI primitives to `@base-ui/react` (the successor to Radix). However, 9 Radix packages remain as declared dependencies:

```json
"@radix-ui/react-accordion": "^1.2.12",
"@radix-ui/react-alert-dialog": "^1.1.15",
"@radix-ui/react-avatar": "^1.1.11",
"@radix-ui/react-checkbox": "^1.3.3",
"@radix-ui/react-dialog": "^1.1.15",
"@radix-ui/react-dropdown-menu": "^2.1.16",
"@radix-ui/react-label": "^2.1.8",
"@radix-ui/react-popover": "^1.1.15",
"@radix-ui/react-progress": "^1.1.8",
"@radix-ui/react-scroll-area": "^1.2.10",
"@radix-ui/react-select": "^2.2.6",
"@radix-ui/react-separator": "^1.1.8",
"@radix-ui/react-slot": "^1.2.4",
"@radix-ui/react-switch": "^1.2.6",
"@radix-ui/react-tabs": "^1.1.13",
"@radix-ui/react-toast": "^1.2.15",
"@radix-ui/react-tooltip": "^1.2.8"
```

**Investigation required:** Check if any of these are still transitively used by `@base-ui/react` or directly imported in any `src/components/ui/` file.

**Action:** Run `npx depcheck` to identify which Radix packages are actually consumed. Packages confirmed unused should be removed.

**Estimated bundle savings:** Radix packages are individually small (5-30KB each), but removing unused ones saves ~100-200KB from node_modules and potentially from the client bundle if tree-shaking misses them.

---

### 3. `cmdk` — No Command Palette UI Implemented
**Current:** `"cmdk": "^1.1.1"` in dependencies
**Status:** `command.tsx` exists in `src/components/ui/` but no command palette component is rendered anywhere in the app. `useUIStore.setCommandOpen` is only called from the dead `header.tsx`.
**Action:** **Keep** if command palette is planned. **Remove** if not.
**Bundle savings:** ~10KB gzipped if removed.

---

## UPGRADE — Outdated or Risky Packages

### 1. `@supabase/ssr` — Check for Breaking Changes
**Current:** `^0.10.3`
**Latest:** Check `npm outdated`
**Note:** The `0.x` version range means breaking changes can happen. Since the app relies heavily on cookie handling for auth, any breaking changes here would break authentication.
**Action:** Run `npm outdated @supabase/ssr` and review changelog before upgrading.

---

### 2. `next` — Actively Tracking Latest
**Current:** `16.2.7`
**Note:** This is a very recent version. The AGENTS.md warning ("This is NOT the Next.js you know") suggests there are breaking changes from earlier versions. Keep up with the Next.js changelog.

---

## KEEP — Dependencies in Good Shape

| Package | Reason |
|---|---|
| `@base-ui/react` | Actively used in all UI components |
| `@hookform/resolvers` | Required by react-hook-form + zod |
| `framer-motion` | Actively used for animations |
| `recharts` | Used in analytics, accounts, dashboard |
| `date-fns` | Used extensively throughout |
| `zustand` | Used for auth store |
| `next-themes` | Used in providers |
| `sonner` | Used for toasts |
| `clsx` + `tailwind-merge` | Used by `cn()` |
| `class-variance-authority` | Used by shadcn button variants |
| `react-day-picker` | Used by calendar component |
| `lucide-react` | Icons used everywhere |
| `react-hook-form` | Form validation |
| `zod` | Schema validation |

---

## DevDependency Review

| Package | Status |
|---|---|
| `@tailwindcss/postcss` | Correct — Tailwind v4 PostCSS plugin |
| `@types/node`, `@types/react`, `@types/react-dom` | Correct |
| `eslint` + `eslint-config-next` | Correct |
| `tailwindcss` | Correct — v4 |
| `typescript` | Correct |

---

## Dependency Inventory Summary

| Action | Packages | Bundle Impact |
|---|---|---|
| Remove/Move to dev | `shadcn` | ~0 client bundle, cleaner install |
| Audit & possibly remove | 17× `@radix-ui/*` | Up to ~200KB saved |
| Decide: keep or remove | `cmdk` | ~10KB |
| Upgrade: watch carefully | `@supabase/ssr` | — |
| Keep | All others | — |

**Recommended command to run:**
```bash
npx depcheck --ignores="eslint-config-next,@types/*"
```
This will identify any packages in `package.json` that aren't actually imported anywhere in the codebase.
