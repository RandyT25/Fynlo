// Protected routes must be dynamic so Next.js skips ETag generation.
// Static ETags cause 304 responses which strip Set-Cookie headers — this
// means a server-side token refresh never reaches the browser, breaking auth.
export const dynamic = 'force-dynamic'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
