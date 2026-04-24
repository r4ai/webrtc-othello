import { Button } from "../ui/Button";

interface HomeModePickerProps {
  onSelectSolo: () => void;
  onSelectOnline: () => void;
}

export function HomeModePicker({ onSelectSolo, onSelectOnline }: HomeModePickerProps) {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-3xl border border-white/15 bg-black/20 p-6 text-white backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
        Play Mode
      </p>
      <h2 className="text-3xl font-black tracking-tight">遊び方を選ぶ</h2>
      <p className="text-sm text-emerald-50/85">
        ひとりで遊ぶか、招待コードを共有してオンライン対戦を始めます。
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <Button className="min-h-14 text-base" onPress={onSelectSolo}>
          ひとりで遊ぶ
        </Button>
        <Button className="min-h-14 text-base" variant="secondary" onPress={onSelectOnline}>
          オンライン対戦
        </Button>
      </div>
    </section>
  );
}
