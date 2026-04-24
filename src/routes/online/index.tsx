import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "../../ui/Button";

function OnlineLandingRoute() {
  const navigate = useNavigate();

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-6 rounded-3xl border border-white/15 bg-black/20 p-6 text-white backdrop-blur">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
          Online Match
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-tight">オンライン対戦</h2>
        <p className="mt-3 text-sm text-emerald-50/75">
          招待URLまたはコードを受け取ったらこちらから入室
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          className="min-h-14 w-full text-base"
          onPress={() => navigate({ to: "/online/join", search: { i: "" } })}
        >
          招待コードで参加
        </Button>
        <Button
          variant="secondary"
          className="min-h-12 w-full"
          onPress={() => navigate({ to: "/online/create" })}
        >
          部屋を作る
        </Button>
      </div>
    </section>
  );
}

export const Route = createFileRoute("/online/")({
  component: OnlineLandingRoute,
});
