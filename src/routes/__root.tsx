import { createRootRoute, Outlet } from '@tanstack/react-router'

function RootLayout() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_20%,#2d6a4f_0%,#1b4332_38%,#081c15_100%)] px-4 py-8 text-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-white/15 bg-black/20 p-6 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
            Classical TDD Othello
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">
            Othello Engine + UI
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-emerald-100/90 md:text-base">
            純粋関数で構築したドメイン層と、React AriaベースのUIを結合した8x8オセロ実装です。
          </p>
        </header>

        <Outlet />
      </div>
    </main>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
})
