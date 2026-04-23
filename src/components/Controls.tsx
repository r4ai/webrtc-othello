import { Button } from '../ui/Button'
import { Toggle } from '../ui/Toggle'

interface ControlsProps {
  canPass: boolean
  onPass: () => void
  onReset: () => void
  aiEnabled: boolean
  onToggleAI: (enabled: boolean) => void
  isAiTurn: boolean
}

export function Controls({
  canPass,
  onPass,
  onReset,
  aiEnabled,
  onToggleAI,
  isAiTurn,
}: ControlsProps) {
  return (
    <section className="space-y-3 rounded-2xl border border-white/20 bg-white/10 p-4">
      <Toggle
        label="白をAIで操作"
        isSelected={aiEnabled}
        onChange={onToggleAI}
      />

      <p className="text-sm text-white/90">
        {isAiTurn ? 'AIが思考中です...' : 'あなたの操作を待っています。'}
      </p>

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onPress={onReset}>
          リスタート
        </Button>
        <Button variant="ghost" onPress={onPass} isDisabled={!canPass}>
          パス
        </Button>
      </div>
    </section>
  )
}
