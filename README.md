# Othello

オセロ（リバーシ）の Web アプリ。AI 対戦とオンライン対戦に対応。

## 機能

- **ソロモード** — Minimax アルゴリズムによる AI と対戦
- **オンラインモード** — ブラウザ間でリアルタイム対戦（WebRTC P2P）

## オンライン対戦の仕組み

サーバーを一切介さず、**WebRTC DataChannel** でブラウザ同士が直接通信する。

1. ホストが `RTCPeerConnection` を作成し、SDP offer を**招待コード**（Base64 文字列）にエンコード
2. ゲストがそのコードを貼り付けると SDP answer を生成し、**参加コード**としてエンコード
3. ホストが参加コードを受け取ると ICE ネゴシエーションが始まり、P2P 接続が確立
4. 以降のゲームデータは DataChannel 経由で JSON メッセージとして直接やりとり

コードのコピー&ペーストだけでシグナリングを完結させているため、バックエンドが不要。

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
