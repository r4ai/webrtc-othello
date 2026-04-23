import { createRootRoute, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'

function RootLayout() {
  const { location } = useRouterState()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_20%,#2d6a4f_0%,#1b4332_38%,#081c15_100%)] px-4 py-8 text-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex items-center gap-4 rounded-3xl border border-white/15 bg-black/20 px-5 py-4 backdrop-blur">
          {!isHome && (
            <button
              type="button"
              onClick={() => navigate({ to: '/' })}
              className="shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="ホームへ戻る"
            >
              ← 戻る
            </button>
          )}
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">WebRTC Othello</h1>
        </header>

        <Outlet />
      </div>
    </main>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
})
