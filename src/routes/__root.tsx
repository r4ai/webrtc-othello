import { createRootRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { ConfirmDialog } from "../ui/ConfirmDialog";

const CONFIRM_BACK_ROUTES = ["/solo", "/online/match"];

function RootLayout() {
  const { location } = useRouterState();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const requiresConfirmBack = CONFIRM_BACK_ROUTES.includes(location.pathname);
  const [confirmingBack, setConfirmingBack] = useState(false);

  const handleBackPress = () => {
    if (requiresConfirmBack) {
      setConfirmingBack(true);
    } else {
      void navigate({ to: "/" });
    }
  };

  const handleConfirmBack = () => {
    setConfirmingBack(false);
    void navigate({ to: "/" });
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_20%,#2d6a4f_0%,#1b4332_38%,#081c15_100%)] px-4 py-8 text-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex items-center gap-4 rounded-3xl px-5 py-4 mx-auto">
          {!isHome && (
            <button
              type="button"
              onClick={handleBackPress}
              className="shrink-0 flex justify-center items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white w-20"
              aria-label="ホームへ戻る"
            >
              ← 戻る
            </button>
          )}
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">WebRTC Othello</h1>
          {!isHome && <div className="shrink-0 px-3 py-1.5 w-20" />}
        </header>

        <Outlet />
      </div>

      <ConfirmDialog
        isOpen={confirmingBack}
        title="ホームへ戻りますか？"
        description="現在の盤面の進捗は失われ、再び同じ状態には戻れません。"
        confirmLabel="ホームへ戻る"
        cancelLabel="続ける"
        onConfirm={handleConfirmBack}
        onCancel={() => setConfirmingBack(false)}
      />
    </main>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
