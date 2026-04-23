import { useState } from 'react'
import type { MatchConnectionState } from '../game/types'
import { Button } from '../ui/Button'

interface OnlineSetupPanelProps {
  connectionState: MatchConnectionState
  inviteCode: string
  requiresAnswerCode: boolean
  onCreateRoom: () => Promise<void>
  onJoinRoom: (inviteCode: string) => Promise<void>
  onSubmitAnswerCode: (inviteCode: string) => Promise<void>
  onCopyInviteCode: () => Promise<boolean>
  onBack: () => void
}

function statusLabel(connectionState: MatchConnectionState): string {
  switch (connectionState) {
    case 'code-ready':
      return '招待コードを共有してください。'
    case 'connecting':
      return '接続中です。'
    case 'connected':
      return '接続済みです。'
    case 'failed':
      return '接続に失敗しました。'
    case 'disconnected':
      return '接続が切れました。'
    default:
      return '部屋を作るか、招待コードを入力してください。'
  }
}

export function OnlineSetupPanel({
  connectionState,
  inviteCode,
  requiresAnswerCode,
  onCreateRoom,
  onJoinRoom,
  onSubmitAnswerCode,
  onCopyInviteCode,
  onBack,
}: OnlineSetupPanelProps) {
  const [joinCode, setJoinCode] = useState('')
  const [answerCode, setAnswerCode] = useState('')
  const [copied, setCopied] = useState(false)

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-3xl border border-white/15 bg-black/20 p-6 text-white backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
        Online Match
      </p>
      <h2 className="text-3xl font-black tracking-tight">オンライン対戦</h2>
      <p className="text-sm text-emerald-50/85">{statusLabel(connectionState)}</p>

      <div className="grid gap-3 md:grid-cols-2">
        <Button onPress={onCreateRoom}>部屋を作る</Button>
        <Button variant="ghost" onPress={onBack}>
          戻る
        </Button>
      </div>

      <div className="rounded-2xl border border-white/15 bg-white/8 p-4">
        <label className="block text-sm font-semibold text-white/90" htmlFor="join-code">
          部屋に入る
        </label>
        <textarea
          id="join-code"
          value={joinCode}
          onChange={(event) => setJoinCode(event.target.value)}
          rows={4}
          className="mt-3 w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-emerald-300"
          placeholder="ホストの招待コードを貼り付け"
        />
        <Button
          className="mt-3 w-full"
          variant="secondary"
          onPress={() => onJoinRoom(joinCode)}
          isDisabled={joinCode.trim().length === 0}
        >
          招待コードで入室
        </Button>
      </div>

      {inviteCode.length > 0 && (
        <div className="rounded-2xl border border-white/15 bg-white/8 p-4">
          <p className="text-sm font-semibold text-white/90">
            {requiresAnswerCode ? '招待コード' : '応答コード'}
          </p>
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
              setCopied(ok)
            }}
          >
            {copied ? 'コピー済み' : 'コピー'}
          </Button>
        </div>
      )}

      {requiresAnswerCode && (
        <div className="rounded-2xl border border-white/15 bg-white/8 p-4">
          <label className="block text-sm font-semibold text-white/90" htmlFor="answer-code">
            参加者の応答コード
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
            onPress={() => onSubmitAnswerCode(answerCode)}
            isDisabled={answerCode.trim().length === 0}
          >
            接続を開始
          </Button>
        </div>
      )}
    </section>
  )
}
