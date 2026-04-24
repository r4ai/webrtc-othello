import { clsx } from "clsx";
import type { Player } from "../game/types";

interface DiscProps {
  player: Player;
}

export function Disc({ player }: DiscProps) {
  return (
    <span
      aria-hidden="true"
      className={clsx(
        "block h-[82%] w-[82%] rounded-full shadow-(--shadow-disc) transition-transform duration-300",
        player === "black"
          ? "bg-[radial-gradient(circle_at_30%_30%,#4c4c66,#1a1a2e_65%)]"
          : "bg-[radial-gradient(circle_at_30%_30%,#ffffff,#eef0f5_70%)]",
      )}
    />
  );
}
