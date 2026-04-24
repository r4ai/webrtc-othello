interface GameStatusProps {
  title: string
  detail: string
}

export function GameStatus({ title, detail }: GameStatusProps) {
  return (
    <section className="rounded-2xl border border-white/20 bg-white/10 p-4 text-white">
      <p className="text-xs font-semibold text-white/55 tracking-[0.12em]">{title}</p>
      <p className="mt-1 text-xl font-bold">{detail}</p>
    </section>
  )
}
