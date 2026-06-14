# SECURITY_REPORT.md — Fynlo Security Audit

> Generated: 2026-06-14

---

## CRITICAL

*No critical findings.*

---

## HIGH

### SEC-001 — Service Role Key Present in Local Environment (HIGH)

**File:** `.env.local`
```
SUPABASE_SERVICE_ROLE_KEY=<value>
```

**Explanation:** The Supabase service role key bypasses Row Level Security and grants full database access. It should ONLY be used in server-side code (Next.js Server Actions or API Routes). Currently, no server-side code exists in the app — all DB access is done client-side via the anon key with RLS.

**Risk:** If this key accidentally gets included in client-side code (via a `NEXT_PUBLIC_` prefix or a server component that leaks it), an attacker gains unrestricted database access.

**Evidence of current exposure:** The key is NOT `NEXT_PUBLIC_`-prefixed, so it's not currently exposed to the client. But it's also not used anywhere in the codebase — suggesting it was added in anticipation of future server-side features.

**Fix:**
1. Document where this key will be used (admin API routes, scheduled jobs)
2. Rotate it if it has ever been committed to git
3. Verify with `git log -- .env.local` that `.env.local` is git-ignored (it should be)

---

### SEC-002 — VAPID Keys Present Without Push Implementation (HIGH)

**File:** `.env.local`
```
VAPID_PUBLIC_KEY=<value>
VAPID_PRIVATE_KEY=<value>
```

`VAPID_PRIVATE_KEY` is present in the local environment. The public service worker (`/public/sw.js`) exists but no push notification implementation was found in the codebase.

**Risk:** The VAPID private key signs push notifications. If leaked, an attacker could send arbitrary push notifications to your users.

**Fix:**
1. Verify `sw.js` doesn't expose or use the VAPID private key
2. The private key should only exist server-side (in environment variables, never in client code)
3. Rotate if you suspect any exposure

---

## MEDIUM

### SEC-003 — No Avatar File Type Server-Side Validation (MEDIUM)

**File:** `src/features/settings/settings-content.tsx:105-117`
```typescript
const ext = file.name.split('.').pop()
const path = `${user.id}/avatar.${ext}`
const { error: upErr } = await supabase.storage
  .from('avatars').upload(path, file, { upsert: true })
```

**Explanation:**
1. `file.name.split('.').pop()` trusts the client-provided filename. A user could name their file `malware.exe.png` → `ext` = `"png"`, but could also name it `script.php` → `ext` = `"php"`.
2. The `accept="image/*"` attribute is client-side only and trivially bypassed.
3. There's no validation that the uploaded bytes are actually an image.

**Risk:** Supabase Storage doesn't execute uploaded files, so malicious script uploads don't execute. However, a user could upload a non-image file that displays broken in the app. More importantly, if Supabase Storage policies are misconfigured, arbitrary files could be publicly served.

**Fix:**
```typescript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
if (!ALLOWED_TYPES.includes(file.type)) {
  toast.error('Please upload a JPEG, PNG, WebP, or GIF image')
  return
}
const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }[file.type] ?? 'jpg'
```

---

### SEC-004 — Auth State Persisted to localStorage (MEDIUM)

**File:** `src/store/auth.store.ts:17-31`
```typescript
persist(
  (set) => ({ ... }),
  { name: 'fynlo-auth', partialize: (state) => ({ profile: state.profile }) }
)
```

The user's profile (including email, currency, avatar_url) is stored in `localStorage` under `fynlo-auth`. This persists across browser sessions and is readable by any JavaScript on the page.

**Risk:**
- XSS attack could read profile data from localStorage
- If a shared device isn't logged out properly, the next user can read the profile from localStorage even after session expiry (the Supabase session is in cookies, but the profile remains in localStorage)

**Mitigation:** This is acceptable for profile preferences (name, currency, avatar) — the data isn't highly sensitive. However:

**Fix:** Add a `clearOnLogout` behavior: ensure `reset()` in `useAuth.signOut()` is always called and clears the persisted store. Currently it does call `reset()`, which clears `user` and `profile`. Verify the `persist` middleware actually writes the cleared state to localStorage (it does — Zustand persist writes on every state change).

---

### SEC-005 — Unvalidated URL in Avatar Display (MEDIUM)

**File:** `src/features/settings/settings-content.tsx:142`
```typescript
<img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
```

`profile.avatar_url` is stored in the database. If a malicious profile row is created (e.g., by direct API call), the avatar URL could be set to an attacker-controlled domain. This enables:
1. Cross-origin request from user's browser to attacker's server (IP tracking)
2. SSRF-like behavior if the image loads server-side

**Severity:** Medium (requires database compromise or RLS bypass to exploit)

**Fix:** Use Next.js `<Image>` with an explicit `domains` whitelist in `next.config.ts`:
```typescript
images: {
  domains: ['your-project.supabase.co'],
  remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }]
}
```

---

## LOW

### SEC-006 — Supabase Anon Key Placeholder Fallback (LOW)

**Files:** `src/lib/supabase/client.ts`, `src/lib/supabase/any-client.ts`, `src/lib/supabase/middleware.ts`, `src/lib/supabase/server.ts`
```typescript
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
```

If `NEXT_PUBLIC_SUPABASE_ANON_KEY` is somehow empty in production (misconfigured deployment), the app silently creates a Supabase client with a placeholder key. This doesn't expose any data (the placeholder will fail authentication), but it makes debugging harder.

**Fix:** Throw a clear error: `if (!key) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')`

---

### SEC-007 — Cache-Busting Query String on Avatar URL (LOW)

**File:** `src/features/settings/settings-content.tsx:115`
```typescript
await save({ avatar_url: `${publicUrl}?t=${Date.now()}` })
```

`Date.now()` is used as a cache-busting parameter. This is stored in the database, meaning every avatar upload changes the URL stored in profiles. This is fine functionally, but:

1. The timestamp exposes the exact time of each avatar upload
2. If the URL is shared, the `?t=` reveals upload timing

**Risk:** Informational only. Not a security risk.

---

### SEC-008 — No Rate Limiting on Auth Endpoints (LOW)

**Scope:** Supabase managed auth

Supabase handles rate limiting for auth endpoints. The application has no additional rate limiting on top of this. If Supabase's default rate limits are insufficient for brute force, the app is vulnerable.

**Fix:** Enable Supabase auth rate limiting in the Supabase dashboard (already on by default). For additional protection, consider Cloudflare in front of the app.

---

### SEC-009 — `window.location.href` Navigation Skips CSP (INFO)

**File:** `src/components/layout/header.tsx:67`

Direct `window.location.href` navigation causes a full page reload which can bypass Content Security Policy directives set via `<meta>` tags (though Next.js sets them via headers). Minor concern.

---

## Summary

| ID | Finding | Severity |
|---|---|---|
| SEC-001 | Service role key in local env, unused | High |
| SEC-002 | VAPID private key with no push impl | High |
| SEC-003 | No server-side avatar file validation | Medium |
| SEC-004 | Profile in localStorage post-logout | Medium |
| SEC-005 | Unvalidated avatar URL in img tag | Medium |
| SEC-006 | Silent placeholder on missing key | Low |
| SEC-007 | Timestamp in stored avatar URL | Low |
| SEC-008 | No app-level rate limiting | Low |
| SEC-009 | window.location navigation | Info |

**Overall security posture:** Acceptable for a personal finance PWA. The Supabase RLS is the primary security boundary and it's correctly set up. No SQL injection risk (Supabase SDK uses parameterized queries). No XSS vectors (React escapes by default, no `dangerouslySetInnerHTML`). The main risks are operational (key management) and informational (avatar validation).
