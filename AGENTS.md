# Othello

## Architecture

src/
├── game/                    ← 純粋関数 (副作用ゼロ)
├── ai/                      ← 純粋関数 (AI推論)
├── effects/                 ← 副作用隔離層
├── components/              ← 表示層
└── ui/                      ← 共有UIプリミティブ

## Coding Guideline

- カプセル化、関心の分離、契約による設計、副作用の隔離を厳守
- 古典派テストによるTDDで実装
