# Othello

オセロ（リバーシ）の Web アプリ。AI 対戦とオンライン対戦に対応。

## 機能

- **ソロモード** — Minimax アルゴリズムによる AI と対戦
- **オンラインモード** — ブラウザ間でリアルタイム対戦

## 技術スタック

- React 19 / TypeScript / Vite
- TanStack Router
- Tailwind CSS v4
- Vitest

## 開発

```bash
npm install
npm run dev
```

## コマンド

| コマンド                | 説明                 |
| ----------------------- | -------------------- |
| `npm run dev`           | 開発サーバー起動     |
| `npm run build`         | プロダクションビルド |
| `npm test`              | テスト実行           |
| `npm run test:coverage` | カバレッジ付きテスト |

## アーキテクチャ

```
src/
├── game/       # 純粋関数（ゲームロジック）
├── ai/         # 純粋関数（Minimax AI）
├── effects/    # 副作用隔離層
├── components/ # 表示層
└── ui/         # 共有 UI プリミティブ
```
