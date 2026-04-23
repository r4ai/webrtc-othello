import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '../../ui/Button'

function OnlineLandingRoute() {
  const navigate = useNavigate()

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-6 rounded-3xl border border-white/15 bg-black/20 p-6 text-white backdrop-blur">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
          Online Match
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-tight">オンライン対戦</h2>
      </div>

      <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
        <p className="mb-4 text-sm text-emerald-50/85">
          招待URLまたはコードを受け取ったらこちらから入室
        </p>
        <Button
          className="min-h-14 w-full text-base"
          onPress={() => navigate({ to: '/online/join' })}
        >
          招待コードで参加
        </Button>
      </div>

      <Button
        variant="secondary"
        className="w-full"
        onPress={() => navigate({ to: '/online/create' })}
      >
        部屋を作る
      </Button>
    </section>
  )
}

export const Route = createFileRoute('/online/')({
  component: OnlineLandingRoute,
})
