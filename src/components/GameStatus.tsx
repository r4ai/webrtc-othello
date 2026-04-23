interface GameStatusProps {
  title: string
  detail: string
}

export function GameStatus({ title, detail }: GameStatusProps) {
  return (
    <section className="rounded-2xl border border-white/20 bg-white/10 p-4 text-white">
      <h2 className="text-sm font-bold uppercase tracking-[0.18em]">{title}</h2>
      <p className="mt-2 text-lg font-semibold">{detail}</p>
    </section>
  )
}
