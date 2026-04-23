import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { countDiscs } from '../game/board'
import { createInitialGameState, playTurn } from '../game/game'
import type { GameState, Move, Player, PlayerRole } from '../game/types'
import {
  type OnlineMatchActions,
  type OnlineMatchViewModel,
  type PeerEnvelope,
} from './peerProtocol'
import { usePeerConnection } from './usePeerConnection'

export interface UseOnlineMatchResult {
  viewModel: OnlineMatchViewModel & { score: { black: number; white: number } }
  actions: OnlineMatchActions
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '通信処理に失敗しました。'
}

function createMatchId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `match-${Date.now()}`
}

function playerForRole(role: PlayerRole | null): Player | null {
  if (role === 'host') {
    return 'black'
  }

  if (role === 'guest') {
    return 'white'
  }

  return null
}

function hasMove(validMoves: Move[], move: Move): boolean {
  return validMoves.some((candidate) => {
    return candidate.row === move.row && candidate.col === move.col
  })
}

export function useOnlineMatch(): UseOnlineMatchResult {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState())
  const [matchId, setMatchId] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [isJoiningRoom, setIsJoiningRoom] = useState(false)
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false)
  const [isAwaitingAnswerCode, setIsAwaitingAnswerCode] = useState(false)
  const [localRematchRequested, setLocalRematchRequested] = useState(false)
  const [peerRequestedRematch, setPeerRequestedRematch] = useState(false)
  const matchIdRef = useRef<string | null>(null)
  const revisionRef = useRef(0)
  const gameStateRef = useRef(gameState)
  const createRoomPromiseRef = useRef<Promise<void> | null>(null)
  const joinRoomPromiseRef = useRef<Promise<void> | null>(null)
  const submitAnswerPromiseRef = useRef<Promise<void> | null>(null)

  const clearPendingActions = useCallback(() => {
    createRoomPromiseRef.current = null
    joinRoomPromiseRef.current = null
    submitAnswerPromiseRef.current = null
    setIsCreatingRoom(false)
    setIsJoiningRoom(false)
    setIsSubmittingAnswer(false)
  }, [])

  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  const syncState = useCallback(
    (nextState: GameState, nextRevision: number, sendEnvelope: (envelope: PeerEnvelope) => boolean) => {
      setGameState(nextState)
      setRevision(nextRevision)
      revisionRef.current = nextRevision
      setErrorMessage(null)

      const currentMatchId = matchIdRef.current
      if (currentMatchId === null) {
        return
      }

      sendEnvelope({
        type: 'sync-state',
        revision: nextRevision,
        payload: {
          gameState: nextState,
          matchId: currentMatchId,
          revision: nextRevision,
        },
      })
    },
    [],
  )

  const {
    localRole,
    connectionState,
    inviteCode,
    errorMessage: peerErrorMessage,
    createRoom: createPeerRoom,
    joinRoom: joinPeerRoom,
    acceptGuestAnswer,
    sendEnvelope,
    leaveConnection,
  } = usePeerConnection({
    onEnvelope: (envelope) => {
      setErrorMessage(null)
      const currentMatchId = matchIdRef.current

      switch (envelope.type) {
        case 'join-request': {
          if (localRole !== 'host' || currentMatchId === null) {
            return
          }

          sendEnvelope({
            type: 'join-accepted',
            payload: { matchId: currentMatchId },
          })
          sendEnvelope({
            type: 'sync-state',
            revision: revisionRef.current,
            payload: {
              gameState: gameStateRef.current,
              matchId: currentMatchId,
              revision: revisionRef.current,
            },
          })
          return
        }
        case 'join-accepted': {
          return
        }
        case 'move-request': {
          if (localRole !== 'host') {
            return
          }

          if (envelope.revision !== revisionRef.current) {
            setErrorMessage('盤面がずれたため最新状態を再送しました。')
            sendEnvelope({
              type: 'sync-state',
              revision: revisionRef.current,
              payload: {
                gameState: gameStateRef.current,
                matchId: currentMatchId ?? createMatchId(),
                revision: revisionRef.current,
              },
            })
            return
          }

          const state = gameStateRef.current
          const move = envelope.payload
          if (
            state.status !== 'playing' ||
            state.currentPlayer !== 'white' ||
            !hasMove(state.validMoves, move)
          ) {
            sendEnvelope({
              type: 'error',
              payload: { message: 'その手は受理できません。' },
            })
            return
          }

          const nextState = playTurn(state, move)
          syncState(nextState, revisionRef.current + 1, sendEnvelope)
          return
        }
        case 'pass-request': {
          if (localRole !== 'host') {
            return
          }

          const state = gameStateRef.current
          if (
            envelope.revision !== revisionRef.current ||
            state.status !== 'playing' ||
            state.currentPlayer !== 'white' ||
            state.validMoves.length > 0
          ) {
            sendEnvelope({
              type: 'error',
              payload: { message: 'パスを受理できません。' },
            })
            sendEnvelope({
              type: 'sync-state',
              revision: revisionRef.current,
              payload: {
                gameState: state,
                matchId: currentMatchId ?? createMatchId(),
                revision: revisionRef.current,
              },
            })
            return
          }

          const nextState = playTurn(state, null)
          syncState(nextState, revisionRef.current + 1, sendEnvelope)
          return
        }
        case 'rematch-request': {
          setPeerRequestedRematch(true)
          return
        }
        case 'rematch-accepted': {
          if (localRole !== 'host') {
            setLocalRematchRequested(false)
            setPeerRequestedRematch(false)
            return
          }

          const nextState = createInitialGameState()
          setLocalRematchRequested(false)
          setPeerRequestedRematch(false)
          syncState(nextState, revisionRef.current + 1, sendEnvelope)
          return
        }
        case 'sync-state': {
          setGameState(envelope.payload.gameState)
          setMatchId(envelope.payload.matchId)
          matchIdRef.current = envelope.payload.matchId
          setRevision(envelope.payload.revision)
          revisionRef.current = envelope.payload.revision
          setLocalRematchRequested(false)
          setPeerRequestedRematch(false)
          return
        }
        case 'peer-left': {
          clearPendingActions()
          setErrorMessage('相手が切断しました。')
          return
        }
        case 'error': {
          setErrorMessage(envelope.payload.message)
          return
        }
      }
    },
    onConnectionLost: () => {
      clearPendingActions()
      setErrorMessage('接続が切れました。')
    },
  })

  const resetLocalState = useCallback(() => {
    const initialState = createInitialGameState()
    setGameState(initialState)
    setRevision(0)
    revisionRef.current = 0
    clearPendingActions()
    setIsAwaitingAnswerCode(false)
    setLocalRematchRequested(false)
    setPeerRequestedRematch(false)
    setErrorMessage(null)
  }, [clearPendingActions])

  const createRoom = useCallback(() => {
    if (createRoomPromiseRef.current !== null) {
      return createRoomPromiseRef.current
    }

    const request = (async () => {
      setIsCreatingRoom(true)
      setIsJoiningRoom(false)
      setIsSubmittingAnswer(false)
      setIsAwaitingAnswerCode(false)

      try {
        resetLocalState()
        setIsCreatingRoom(true)
        const nextMatchId = createMatchId()
        setMatchId(nextMatchId)
        matchIdRef.current = nextMatchId
        await createPeerRoom()
        setIsAwaitingAnswerCode(true)
      } catch (error) {
        leaveConnection()
        matchIdRef.current = null
        setMatchId(null)
        resetLocalState()
        setErrorMessage(toErrorMessage(error))
      } finally {
        setIsCreatingRoom(false)
        createRoomPromiseRef.current = null
      }
    })()

    createRoomPromiseRef.current = request
    return request
  }, [createPeerRoom, leaveConnection, resetLocalState])

  const joinRoom = useCallback(
    (inviteCode: string) => {
      if (joinRoomPromiseRef.current !== null) {
        return joinRoomPromiseRef.current
      }

      const request = (async () => {
        setIsJoiningRoom(true)
        setIsCreatingRoom(false)
        setIsSubmittingAnswer(false)
        setIsAwaitingAnswerCode(false)

        try {
          resetLocalState()
          setIsJoiningRoom(true)
          setMatchId(null)
          matchIdRef.current = null
          await joinPeerRoom(inviteCode)
        } catch (error) {
          leaveConnection()
          matchIdRef.current = null
          setMatchId(null)
          resetLocalState()
          setErrorMessage(toErrorMessage(error))
        } finally {
          setIsJoiningRoom(false)
          joinRoomPromiseRef.current = null
        }
      })()

      joinRoomPromiseRef.current = request
      return request
    },
    [joinPeerRoom, leaveConnection, resetLocalState],
  )

  const submitAnswerCode = useCallback(
    (inviteCode: string) => {
      if (submitAnswerPromiseRef.current !== null) {
        return submitAnswerPromiseRef.current
      }

      const request = (async () => {
        setIsSubmittingAnswer(true)

        try {
          await acceptGuestAnswer(inviteCode)
          setIsAwaitingAnswerCode(false)
        } catch (error) {
          setErrorMessage(toErrorMessage(error))
        } finally {
          setIsSubmittingAnswer(false)
          submitAnswerPromiseRef.current = null
        }
      })()

      submitAnswerPromiseRef.current = request
      return request
    },
    [acceptGuestAnswer],
  )

  useEffect(() => {
    if (connectionState !== 'connected' || localRole !== 'guest') {
      return
    }

    const currentMatchId = matchIdRef.current ?? createMatchId()
    sendEnvelope({
      type: 'join-request',
      payload: { matchId: currentMatchId },
    })
  }, [connectionState, localRole, sendEnvelope])

  const applyHostMove = useCallback(
    (move: Move | null) => {
      const state = gameStateRef.current
      if (state.status !== 'playing') {
        return
      }

      const nextState = playTurn(state, move)
      syncState(nextState, revisionRef.current + 1, sendEnvelope)
    },
    [sendEnvelope, syncState],
  )

  const submitMove = useCallback(
    (move: Move) => {
      const localPlayer = playerForRole(localRole)
      if (
        connectionState !== 'connected' ||
        localPlayer === null ||
        gameStateRef.current.currentPlayer !== localPlayer
      ) {
        return
      }

      if (localRole === 'host') {
        if (!hasMove(gameStateRef.current.validMoves, move)) {
          return
        }

        applyHostMove(move)
        return
      }

      sendEnvelope({
        type: 'move-request',
        revision: revisionRef.current,
        payload: move,
      })
    },
    [applyHostMove, connectionState, localRole, sendEnvelope],
  )

  const submitPass = useCallback(() => {
    const state = gameStateRef.current
    const localPlayer = playerForRole(localRole)
    if (
      connectionState !== 'connected' ||
      localPlayer === null ||
      state.currentPlayer !== localPlayer ||
      state.validMoves.length > 0
    ) {
      return
    }

    if (localRole === 'host') {
      applyHostMove(null)
      return
    }

    sendEnvelope({
      type: 'pass-request',
      revision: revisionRef.current,
      payload: { matchId: matchIdRef.current ?? '' },
    })
  }, [applyHostMove, connectionState, localRole, sendEnvelope])

  const requestRematch = useCallback(() => {
    if (connectionState !== 'connected' || gameStateRef.current.status !== 'finished') {
      return
    }

    if (localRole === 'host' && peerRequestedRematch) {
      sendEnvelope({
        type: 'rematch-accepted',
        payload: { matchId: matchIdRef.current ?? '' },
      })
      const nextState = createInitialGameState()
      setPeerRequestedRematch(false)
      setLocalRematchRequested(false)
      syncState(nextState, revisionRef.current + 1, sendEnvelope)
      return
    }

    if (localRole === 'guest' && peerRequestedRematch) {
      sendEnvelope({
        type: 'rematch-accepted',
        payload: { matchId: matchIdRef.current ?? '' },
      })
      setPeerRequestedRematch(false)
      setLocalRematchRequested(false)
      return
    }

    sendEnvelope({
      type: 'rematch-request',
      payload: { matchId: matchIdRef.current ?? '' },
    })
    setLocalRematchRequested(true)
  }, [connectionState, localRole, peerRequestedRematch, sendEnvelope, syncState])

  const leaveMatch = useCallback(() => {
    if (connectionState === 'connected') {
      sendEnvelope({
        type: 'peer-left',
        payload: { matchId: matchIdRef.current ?? '' },
      })
    }

    leaveConnection()
    matchIdRef.current = null
    setMatchId(null)
    resetLocalState()
  }, [connectionState, leaveConnection, resetLocalState, sendEnvelope])

  const copyInviteCode = useCallback(async () => {
    if (inviteCode.length === 0 || navigator.clipboard === undefined) {
      return false
    }

    await navigator.clipboard.writeText(inviteCode)
    return true
  }, [inviteCode])

  const score = useMemo(() => countDiscs(gameState.board), [gameState.board])
  const localPlayer = playerForRole(localRole)
  const canInteract =
    connectionState === 'connected' &&
    localPlayer !== null &&
    gameState.status === 'playing' &&
    gameState.currentPlayer === localPlayer

  return {
    viewModel: {
      gameState,
      score,
      localRole,
      connectionState,
      inviteCode,
      errorMessage: errorMessage ?? peerErrorMessage,
      isCreatingRoom,
      isJoiningRoom,
      isSubmittingAnswer,
      canInteract,
      canRequestRematch: connectionState === 'connected' && gameState.status === 'finished',
      localPlayerLabel: localRole === 'host' ? '黒' : localRole === 'guest' ? '白' : '未参加',
      matchId,
      revision,
      pendingRematch: localRematchRequested,
      peerRequestedRematch,
      requiresAnswerCode: isAwaitingAnswerCode,
    },
    actions: {
      createRoom,
      joinRoom,
      submitAnswerCode,
      submitMove,
      submitPass,
      requestRematch,
      leaveMatch,
      copyInviteCode,
    },
  }
}
