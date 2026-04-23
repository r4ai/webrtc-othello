import { Button } from '../ui/Button'

interface OnlineControlsProps {
  canPass: boolean
  canRequestRematch: boolean
  pendingRematch: boolean
  peerRequestedRematch: boolean
  onPass: () => void
  onRematch: () => void
  onLeave: () => void
}

export function OnlineControls({
  canPass,
  canRequestRematch,
  pendingRematch,
  peerRequestedRematch,
  onPass,
  onRematch,
  onLeave,
}: OnlineControlsProps) {
  const rematchLabel = peerRequestedRematch
    ? '再戦を承認'
    : pendingRematch
      ? '再戦を申請中'
      : '再戦'

  return (
    <section className="space-y-3 rounded-2xl border border-white/20 bg-white/10 p-4">
      <p className="text-sm text-white/90">
        {peerRequestedRematch
          ? '相手が再戦を希望しています。'
          : pendingRematch
            ? '再戦の返答を待っています。'
            : '通信対戦では相手との同期を優先します。'}
      </p>

      <div className="flex flex-wrap gap-3">
        <Button variant="ghost" onPress={onPass} isDisabled={!canPass}>
          パス
        </Button>
        <Button
          variant="secondary"
          onPress={onRematch}
          isDisabled={!canRequestRematch || pendingRematch}
        >
          {rematchLabel}
        </Button>
        <Button variant="ghost" onPress={onLeave}>
          切断
        </Button>
      </div>
    </section>
  )
}
