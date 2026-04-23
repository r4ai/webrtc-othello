import { startTransition, useOptimistic, useState } from 'react'
import type { MatchConnectionState, PlayerRole } from '../game/types'
import { Button } from '../ui/Button'

interface OnlineSetupPanelProps {
  localRole: PlayerRole | null
  connectionState: MatchConnectionState
  inviteCode: string
  onCreateRoom: () => Promise<void>
  onJoinRoom: (inviteCode: string) => Promise<void>
  onSubmitAnswerCode: (inviteCode: string) => Promise<void>
  onCopyInviteCode: () => Promise<boolean>
  onBack: () => void
}

type SetupStep = 'choose' | 'host' | 'guest' | 'connecting'
type PendingAction = 'create-room' | 'join-room' | 'submit-answer' | null

interface SetupUiState {
  step: SetupStep
  pendingAction: PendingAction
}

function resolveSetupStep(
  localRole: PlayerRole | null,
  connectionState: MatchConnectionState,
  inviteCode: string,
): SetupStep {
  if (connectionState === 'connecting') {
    return 'connecting'
  }

  if (connectionState === 'failed' || connectionState === 'disconnected') {
    return 'choose'
  }

  if (localRole === 'host' && inviteCode.length > 0) {
    return 'host'
  }

  if (localRole === 'guest' && inviteCode.length > 0) {
    return 'guest'
  }

  return 'choose'
}

export function OnlineSetupPanel({
  localRole,
  connectionState,
  inviteCode,
  onCreateRoom,
  onJoinRoom,
  onSubmitAnswerCode,
  onCopyInviteCode,
  onBack,
}: OnlineSetupPanelProps) {
  const [joinCode, setJoinCode] = useState('')
  const [answerCode, setAnswerCode] = useState('')
  const [copiedCode, setCopiedCode] = useState('')
  const [joinSelected, setJoinSelected] = useState(false)
  const actualUiState: SetupUiState = {
    step: resolveSetupStep(localRole, connectionState, inviteCode),
    pendingAction: null,
  }
  const [optimisticUiState, setOptimisticUiState] = useOptimistic(
    actualUiState,
    (_currentState, nextState: SetupUiState) => nextState,
  )

  const isBusy = optimisticUiState.pendingAction !== null
  const isHostStep = optimisticUiState.step === 'host'
  const isGuestStep = optimisticUiState.step === 'guest'
  const isConnectingStep = optimisticUiState.step === 'connecting'
  const isChooseStep = optimisticUiState.step === 'choose'
  const copied = inviteCode.length > 0 && copiedCode === inviteCode

  const handleCreateRoom = () => {
    startTransition(async () => {
      setOptimisticUiState({ step: 'host', pendingAction: 'create-room' })
      await onCreateRoom()
    })
  }

  const handleJoinRoom = () => {
    startTransition(async () => {
      setOptimisticUiState({ step: 'guest', pendingAction: 'join-room' })
      await onJoinRoom(joinCode)
    })
  }

  const handleSubmitAnswerCode = () => {
    startTransition(async () => {
      setOptimisticUiState({ step: 'connecting', pendingAction: 'submit-answer' })
      await onSubmitAnswerCode(answerCode)
    })
  }

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-3xl border border-white/15 bg-black/20 p-6 text-white backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
        Online Match
      </p>
      <h2 className="text-3xl font-black tracking-tight">オンライン対戦</h2>
      {isChooseStep && !joinSelected && (
        <>
          <p className="text-sm text-emerald-50/85">
            部屋を作るか、受け取った招待コードで参加します。
          </p>
          <div className="grid gap-3">
            <Button onPress={handleCreateRoom} isDisabled={isBusy}>
              {isBusy && optimisticUiState.pendingAction === 'create-room'
                ? '部屋を準備中...'
                : '部屋を作る'}
            </Button>
            <Button
              variant="secondary"
              onPress={() => setJoinSelected(true)}
              isDisabled={isBusy}
            >
              招待コードで参加
            </Button>
            <Button variant="ghost" onPress={onBack} isDisabled={isBusy}>
              戻る
            </Button>
          </div>
        </>
      )}

      {isChooseStep && joinSelected && (
        <div className="rounded-2xl border border-white/15 bg-white/8 p-4">
          <p className="text-sm text-emerald-50/85">
            ホストから受け取った招待コードを貼り付けてください。
          </p>
          <label className="mt-4 block text-sm font-semibold text-white/90" htmlFor="join-code">
            招待コード
          </label>
          <textarea
            id="join-code"
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value)}
            rows={4}
            className="mt-3 w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-emerald-300"
            placeholder="ホストの招待コードを貼り付け"
          />
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Button
              onPress={handleJoinRoom}
              isDisabled={joinCode.trim().length === 0 || isBusy}
            >
              {isBusy && optimisticUiState.pendingAction === 'join-room'
                ? '応答コードを作成中...'
                : '応答コードを作る'}
            </Button>
            <Button
              variant="ghost"
              onPress={() => setJoinSelected(false)}
              isDisabled={isBusy}
            >
              戻る
            </Button>
          </div>
        </div>
      )}

      {isHostStep && (
        <div className="rounded-2xl border border-white/15 bg-white/8 p-4">
          <p className="text-sm text-emerald-50/85">
            1. 招待コードを相手に送る 2. 相手から届いた応答コードを貼り付ける
          </p>
          <p className="mt-4 text-sm font-semibold text-white/90">招待コード</p>
          <textarea
            readOnly
            value={inviteCode}
            rows={4}
            className="mt-3 w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-sm text-white/85 outline-none"
          />
          <Button
            className="mt-3 w-full"
            variant="secondary"
            onPress={async () => {
              const ok = await onCopyInviteCode()
              setCopiedCode(ok ? inviteCode : '')
            }}
            isDisabled={inviteCode.length === 0 || isBusy}
          >
            {copied ? 'コピー済み' : 'コピー'}
          </Button>
          <label className="block text-sm font-semibold text-white/90" htmlFor="answer-code">
            相手の応答コード
          </label>
          <textarea
            id="answer-code"
            value={answerCode}
            onChange={(event) => setAnswerCode(event.target.value)}
            rows={4}
            className="mt-3 w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-emerald-300"
            placeholder="参加者から届いた応答コードを貼り付け"
          />
          <Button
            className="mt-3 w-full"
            onPress={handleSubmitAnswerCode}
            isDisabled={answerCode.trim().length === 0 || isBusy}
          >
            {isBusy && optimisticUiState.pendingAction === 'submit-answer'
              ? '接続を開始中...'
              : '接続を開始'}
          </Button>
          <Button className="mt-3 w-full" variant="ghost" onPress={onBack} isDisabled={isBusy}>
            戻る
          </Button>
        </div>
      )}

      {isGuestStep && (
        <div className="rounded-2xl border border-white/15 bg-white/8 p-4">
          <p className="text-sm text-emerald-50/85">
            この応答コードをホストに送り、接続完了まで待ってください。
          </p>
          <p className="mt-4 text-sm font-semibold text-white/90">応答コード</p>
          <textarea
            readOnly
            value={inviteCode}
            rows={4}
            className="mt-3 w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-sm text-white/85 outline-none"
          />
          <Button
            className="mt-3 w-full"
            variant="secondary"
            onPress={async () => {
              const ok = await onCopyInviteCode()
              setCopiedCode(ok ? inviteCode : '')
            }}
            isDisabled={inviteCode.length === 0 || isBusy}
          >
            {copied ? 'コピー済み' : 'コピー'}
          </Button>
          <Button className="mt-3 w-full" variant="ghost" onPress={onBack} isDisabled={isBusy}>
            戻る
          </Button>
        </div>
      )}

      {isConnectingStep && (
        <div className="rounded-2xl border border-white/15 bg-white/8 p-4">
          <p className="text-sm text-emerald-50/85">
            接続を確立しています。画面はこのままで待ってください。
          </p>
          <Button className="mt-4 w-full" variant="ghost" onPress={onBack} isDisabled={isBusy}>
            戻る
          </Button>
        </div>
      )}
    </section>
  )
}
