import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { startTransition, useEffect, useOptimistic, useState } from 'react'
import { StatusLine } from '../../components/StatusLine'
import { useOnlineMatchContext } from '../../effects/OnlineMatchContext'
import { Button } from '../../ui/Button'

type JoinStep = 'input' | 'response' | 'connecting'

function resolveStep(
  connectionState: string,
  localRole: string | null,
  inviteCode: string,
): JoinStep {
  if (connectionState === 'connecting') return 'connecting'
  if (localRole === 'guest' && inviteCode.length > 0) return 'response'
  return 'input'
}

function JoinRoute() {
  const { viewModel, actions } = useOnlineMatchContext()
  const navigate = useNavigate()
  const { i: prefillCode } = Route.useSearch()
  const [joinCode, setJoinCode] = useState(() => prefillCode)
  const [copiedCode, setCopiedCode] = useState('')

  const actualStep = resolveStep(
    viewModel.connectionState,
    viewModel.localRole,
    viewModel.inviteCode,
  )
  const [optimisticStep, setOptimisticStep] = useOptimistic(
    actualStep,
    (_: JoinStep, next: JoinStep) => next,
  )
  const isBusy = optimisticStep !== actualStep
  const copied = viewModel.inviteCode.length > 0 && copiedCode === viewModel.inviteCode

  useEffect(() => {
    if (viewModel.connectionState === 'connected') {
      navigate({ to: '/online/match' })
    }
  }, [viewModel.connectionState, navigate])

  const handleJoin = () => {
    startTransition(async () => {
      setOptimisticStep('response')
      await actions.joinRoom(joinCode)
    })
  }

  const handleCopyResponse = async () => {
    const ok = await actions.copyInviteCode()
    setCopiedCode(ok ? viewModel.inviteCode : '')
  }

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-3xl border border-white/15 bg-black/20 p-6 text-white backdrop-blur">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
          Online Match
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-tight">招待コードで参加</h2>
      </div>

      {viewModel.errorMessage && (
        <StatusLine tone="error">{viewModel.errorMessage}</StatusLine>
      )}

      {/* Step 1: Paste invite code */}
      <div
        className={
          optimisticStep !== 'input'
            ? 'rounded-2xl border border-white/10 bg-white/3 p-4 opacity-50'
            : 'rounded-2xl border border-white/15 bg-white/8 p-4'
        }
      >
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/30 text-xs font-bold text-emerald-300">
            {optimisticStep !== 'input' ? '✓' : '1'}
          </span>
          <p className="text-sm font-semibold">招待コードを貼り付ける</p>
        </div>
        {optimisticStep === 'input' && (
          <div className="mt-3 space-y-3">
            <div>
              <label
                className="block text-xs font-semibold text-white/70"
                htmlFor="join-code"
              >
                招待コード
              </label>
              <textarea
                id="join-code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                rows={4}
                className="mt-2 w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-emerald-300"
                placeholder="ホストから受け取った招待コードを貼り付け"
              />
            </div>
            <Button
              className="w-full"
              onPress={handleJoin}
              isDisabled={joinCode.trim().length === 0 || isBusy}
            >
              {isBusy ? '応答コードを作成中...' : '応答コードを生成'}
            </Button>
          </div>
        )}
      </div>

      {/* Step 2: Copy response code */}
      <div
        className={
          optimisticStep === 'input'
            ? 'rounded-2xl border border-white/10 bg-white/3 p-4 opacity-40'
            : optimisticStep === 'connecting'
              ? 'rounded-2xl border border-white/10 bg-white/3 p-4 opacity-50'
              : 'rounded-2xl border border-white/15 bg-white/8 p-4'
        }
      >
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/30 text-xs font-bold text-emerald-300">
            {optimisticStep === 'connecting' ? '✓' : '2'}
          </span>
          <p className="text-sm font-semibold">応答コードをホストに送る</p>
        </div>
        {optimisticStep === 'response' && (
          <div className="mt-3 space-y-3">
            <p className="text-xs text-white/70">
              この応答コードをホストに送り、接続承認を待ってください。
            </p>
            <p className="text-xs font-semibold text-white/70">応答コード</p>
            <textarea
              readOnly
              value={viewModel.inviteCode}
              rows={4}
              className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-sm text-white/85 outline-none"
            />
            <Button
              className="w-full"
              variant="secondary"
              onPress={handleCopyResponse}
              isDisabled={viewModel.inviteCode.length === 0}
            >
              {copied ? 'コピー済み ✓' : '応答コードをコピー'}
            </Button>
          </div>
        )}
      </div>

      {/* Step 3: Waiting for host */}
      <div
        className={
          optimisticStep !== 'connecting'
            ? 'rounded-2xl border border-white/10 bg-white/3 p-4 opacity-40'
            : 'rounded-2xl border border-white/15 bg-white/8 p-4'
        }
      >
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/30 text-xs font-bold text-emerald-300">
            3
          </span>
          <p className="text-sm font-semibold">ホストの接続承認を待つ</p>
        </div>
        {optimisticStep === 'connecting' && (
          <p className="mt-3 text-sm text-white/70">
            接続を確立しています。画面はそのままでお待ちください。
          </p>
        )}
      </div>
    </section>
  )
}

export const Route = createFileRoute('/online/join')({
  validateSearch: (search: Record<string, unknown>) => ({
    i: typeof search['i'] === 'string' ? search['i'] : '',
  }),
  component: JoinRoute,
})
