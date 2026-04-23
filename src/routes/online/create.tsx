import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { StatusLine } from '../../components/StatusLine'
import { useOnlineMatchContext } from '../../effects/useOnlineMatchContext'
import { Button } from '../../ui/Button'

type CreateStep = 'preparing' | 'share' | 'connecting'

function resolveStep(
  connectionState: string,
  requiresAnswerCode: boolean,
  canRetryRoom: boolean,
): CreateStep {
  if (canRetryRoom) return 'preparing'
  if (requiresAnswerCode) return 'share'
  if (connectionState === 'connecting') return 'connecting'
  return 'preparing'
}

function CreateRoute() {
  const { viewModel, actions } = useOnlineMatchContext()
  const navigate = useNavigate()
  const [answerCode, setAnswerCode] = useState('')
  const [copiedInvite, setCopiedInvite] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const started = useRef(false)

  const canRetryRoom =
    viewModel.connectionState === 'disconnected' || viewModel.connectionState === 'failed'
  const currentStep = resolveStep(
    viewModel.connectionState,
    viewModel.requiresAnswerCode,
    canRetryRoom,
  )

  useEffect(() => {
    if (!started.current) {
      started.current = true
      actions.createRoom()
    }
  }, [actions])

  useEffect(() => {
    if (viewModel.connectionState === 'connected') {
      navigate({ to: '/online/match' })
    }
  }, [viewModel.connectionState, navigate])

  const shareableLink =
    viewModel.inviteCode.length > 0
      ? `${window.location.origin}/online/join?i=${encodeURIComponent(viewModel.inviteCode)}`
      : null

  const handleCopyInvite = async () => {
    const ok = await actions.copyInviteCode()
    setCopiedInvite(ok)
  }

  const handleCopyLink = () => {
    if (!shareableLink) return
    navigator.clipboard.writeText(shareableLink).then(() => setCopiedLink(true))
  }

  const handleConnect = () => {
    void actions.submitAnswerCode(answerCode)
  }

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-3xl border border-white/15 bg-black/20 p-6 text-white backdrop-blur">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
          Online Match
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-tight">部屋を作る</h2>
      </div>

      {viewModel.errorMessage && (
        <StatusLine tone="error">{viewModel.errorMessage}</StatusLine>
      )}

      {/* Step 1: Generating invite code */}
      <div
        className={
          currentStep !== 'preparing'
            ? 'rounded-2xl border border-white/10 bg-white/3 p-4 opacity-50'
            : 'rounded-2xl border border-white/15 bg-white/8 p-4'
        }
      >
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/30 text-xs font-bold text-emerald-300">
            {currentStep !== 'preparing' ? '✓' : '1'}
          </span>
          <p className="text-base font-semibold">招待コードを生成</p>
        </div>
        {currentStep === 'preparing' && (
          <div className="mt-3 flex flex-col gap-3">
            <p className="text-sm text-white/70">
              {canRetryRoom ? '接続が切れたため、部屋を作り直してください。' : '部屋を準備しています...'}
            </p>
            {canRetryRoom && (
              <Button
                className="w-full"
                variant="secondary"
                onPress={() => void actions.createRoom()}
                isDisabled={viewModel.isCreatingRoom}
              >
                {viewModel.isCreatingRoom ? '部屋を作り直し中...' : '部屋を作り直す'}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Share invite code + paste answer code */}
      <div
        className={
          currentStep === 'preparing'
            ? 'rounded-2xl border border-white/10 bg-white/3 p-4 opacity-40'
            : currentStep === 'connecting'
              ? 'rounded-2xl border border-white/10 bg-white/3 p-4 opacity-50'
              : 'rounded-2xl border border-white/15 bg-white/8 p-4'
        }
      >
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/30 text-xs font-bold text-emerald-300">
            {currentStep === 'connecting' ? '✓' : '2'}
          </span>
          <p className="text-base font-semibold">相手に招待コードを送る</p>
        </div>
        {currentStep === 'share' && (
          <div className="mt-3 flex flex-col gap-3">
            <p className="text-sm font-semibold text-white/70">招待コード</p>
            <textarea
              readOnly
              value={viewModel.inviteCode}
              rows={3}
              className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-sm text-white/85 outline-none"
            />
            <Button
              className="w-full"
              variant="secondary"
              onPress={handleCopyInvite}
              isDisabled={viewModel.inviteCode.length === 0}
            >
              {copiedInvite ? '招待コードをコピー済み ✓' : '招待コードをコピー'}
            </Button>
            {shareableLink && (
              <Button
                className="w-full"
                variant="ghost"
                onPress={handleCopyLink}
              >
                {copiedLink ? '招待リンクをコピー済み ✓' : '招待リンクをコピー'}
              </Button>
            )}

            <hr className="border-white/15" />

            <p className="text-sm text-white/70">
              相手が参加したら、届いた応答コードを入力してください。
            </p>
            <div>
              <label
                className="block text-sm font-semibold text-white/70"
                htmlFor="answer-code"
              >
                相手の応答コード
              </label>
              <textarea
                id="answer-code"
                value={answerCode}
                onChange={(e) => setAnswerCode(e.target.value)}
                rows={3}
                className="mt-2 w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-emerald-300"
                placeholder="応答コードを貼り付け"
              />
            </div>
            <Button
              className="w-full"
              onPress={handleConnect}
              isDisabled={answerCode.trim().length === 0 || viewModel.isSubmittingAnswer}
            >
              {viewModel.isSubmittingAnswer ? '接続を開始中...' : '接続開始'}
            </Button>
          </div>
        )}
      </div>

      {/* Step 3: Connecting */}
      <div
        className={
          currentStep !== 'connecting'
            ? 'rounded-2xl border border-white/10 bg-white/3 p-4 opacity-40'
            : 'rounded-2xl border border-white/15 bg-white/8 p-4'
        }
      >
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/30 text-xs font-bold text-emerald-300">
            3
          </span>
          <p className="text-base font-semibold">接続を確立</p>
        </div>
        {currentStep === 'connecting' && (
          <p className="mt-3 text-sm text-white/70">
            接続を確立しています。画面はそのままでお待ちください。
          </p>
        )}
      </div>
    </section>
  )
}

export const Route = createFileRoute('/online/create')({
  component: CreateRoute,
})
