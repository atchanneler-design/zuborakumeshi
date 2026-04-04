# ズボラキッチン MVP 実装タスクリスト (Claude Code向け)

Antigravityによる全体設計（`implementation_plan.md`）に基づく、MVP版の実装ステップです。
以下の順序で実装と検証(`npm run dev`等での確認)を繰り返し、進めてください。

## Phase 1: 開発基盤の構築とスモークテスト
- [ ] Next.js (App Router) プロジェクトのセットアップ (Tailwind CSS, TypeScript)
- [ ] Vercel へのデプロイ準備（またはローカル環境構築）
- [ ] `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` 等、今後のための環境変数の雛形作成
- [ ] **スモークテスト**: `POST /api/test` を作り、Claude API（Haikuなど）に簡単なテキスト（例: "Hello"）を投げて正常に返ってくるか最小構成で確認する

## Phase 2: 画像解析と食材リスト化（目）
- [ ] クライアント側（ブラウザ側）で写真を撮影/選択し、横幅1000px程度に圧縮・リサイズする処理の実装
- [ ] `POST /api/vision/parse-fridge` エンドポイントの実装
  - リサイズされた画像をClaude (最新のSonnet等) のVision API に渡す
  - 「食材名」と「大まかな数量」だけをJSONの配列で返すようプロンプトをチューニング
- [ ] `Zustand` を用いた LocalStorage 管理機能の実装（食材リストの保存・追加・編集・削除）
- [ ] `/fridge` （食材スキャン・編集）のUI作成と繋ぎこみ

## Phase 3: 4軸のレシピ生成（脳）
- [ ] `POST /api/recipe/generate` エンドポイントの実装
  - `/fridge` で確定した食材リストを入力として受け取る
  - Claude API（Haiku等）に渡し、【爆速】【定番】【一掃】【二刀流】の4種類のレシピを一度の通信で生成
  - 挨拶文などを禁止し、完全なJSON形式で返すようプロンプトを構築
- [ ] `/recipes` （レシピ提案画面）のUI作成
- [ ] 各レシピから外部レシピサイト（クラシル等）への検索URLリンク（`https://www.kurashiru.com/search?query=料理名`等）の実装

## Phase 4: UI/UXの仕上げと実証
- [ ] 「これを作った！」ボタンの実装：クリック時に使った食材を Zustand(LocalStorage) の在庫から必要分だけ自動的に減らす処理
- [ ] OGP画像生成API (`GET /api/og`) の実装（`@vercel/og`等を使用）
- [ ] 全体の導線テスト（トップ画面 `/` → `/fridge` → `/recipes` → `/` への回遊）
- [ ] 実際の冷蔵庫写真・レシート写真を用いて、AIが期待通り動くか最終検証
