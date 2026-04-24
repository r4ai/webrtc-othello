import { useState } from "react";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";

interface OnlineControlsProps {
  message: string;
  canPass: boolean;
  canRequestRematch: boolean;
  pendingRematch: boolean;
  peerRequestedRematch: boolean;
  onPass: () => void;
  onRematch: () => void;
  onLeave: () => void;
}

export function OnlineControls({
  message,
  canPass,
  canRequestRematch,
  pendingRematch,
  peerRequestedRematch,
  onPass,
  onRematch,
  onLeave,
}: OnlineControlsProps) {
  const [confirmingLeave, setConfirmingLeave] = useState(false);

  const rematchLabel = peerRequestedRematch
    ? "再戦を承認"
    : pendingRematch
      ? "再戦を申請中"
      : "再戦";

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-white/20 bg-white/10 p-4">
      <p className="text-sm text-white/85">{message}</p>

      <div className="flex flex-col gap-2">
        {canPass && (
          <Button className="w-full" onPress={onPass}>
            パス
          </Button>
        )}
        {canRequestRematch && (
          <Button
            className="w-full"
            variant="secondary"
            onPress={onRematch}
            isDisabled={pendingRematch}
          >
            {rematchLabel}
          </Button>
        )}
        <Button className="w-full" variant="ghost" onPress={() => setConfirmingLeave(true)}>
          対戦を終了
        </Button>
      </div>
      <ConfirmDialog
        isOpen={confirmingLeave}
        title="対戦を終了しますか？"
        description="対戦を終了すると、相手との接続が切断されます。"
        confirmLabel="終了する"
        cancelLabel="続ける"
        onConfirm={onLeave}
        onCancel={() => setConfirmingLeave(false)}
      />
    </section>
  );
}
