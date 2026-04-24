import { clsx } from "clsx";
import { Button as AriaButton } from "react-aria-components";
import type { Cell as CellValue, Move } from "../game/types";
import { Disc } from "./Disc";

interface CellProps {
  row: number;
  col: number;
  value: CellValue;
  canPlace: boolean;
  isEnabled: boolean;
  onSelect: (move: Move) => void;
}

export function Cell({ row, col, value, canPlace, isEnabled, onSelect }: CellProps) {
  const statusLabel =
    value === null ? (canPlace ? "置けます" : "空きマス") : value === "black" ? "黒石" : "白石";

  return (
    <AriaButton
      aria-label={`${row + 1}行${col + 1}列 ${statusLabel}`}
      isDisabled={!isEnabled}
      onPress={() => onSelect({ row, col })}
      className={clsx(
        "relative flex aspect-square w-full items-center justify-center rounded-[10px] border border-black/15 bg-(--color-board) shadow-[inset_0_-10px_20px_rgba(0,0,0,0.16)] transition data-hovered:-translate-y-px data-pressed:translate-y-0",
        isEnabled
          ? "cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)"
          : "cursor-default",
      )}
    >
      {value !== null && <Disc player={value} />}
      {value === null && canPlace && (
        <span
          data-testid="move-hint"
          aria-hidden="true"
          className="h-3 w-3 rounded-full bg-(--color-hint)"
        />
      )}
    </AriaButton>
  );
}
