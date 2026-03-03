---
name: dev
description: 開発環境セットアップ（ブランチ・worktree 作成）とエージェントチーム並列実装
user_invocable: true
---

# /dev — 開発環境セットアップ

Git ブランチと worktree の作成、エージェントチームによる並列実装を管理するスキル。

## 使い方

- `/dev` — 対話的に操作を選択
- `/dev start <issue-number>` — ブランチ + worktree を作成して開発環境をセットアップ
- `/dev team` — エージェントチームを起動して並列実装

## 共通設定

- **リポジトリ**: `Umisyo/XIVPedia`
- **メインリポジトリ**: `/Users/souta.kusunoki/.ghr/github.com/Umisyo/XIVPedia`
- **Worktree 配置先**: `/Users/souta.kusunoki/.ghr/github.com/yumemi/worktrees/<branch-name>`
- **CLAUDE.md**: プロジェクトルートの CLAUDE.md を参照（ブランチ命名規則、ラベル体系）
- 各操作の実行前に**必ずユーザーに確認**すること

## サブコマンド詳細

### `/dev start <issue-number>`

Issue に対応するブランチと worktree を作成する。

**手順**:
1. `gh issue view <issue-number> --json title,labels -R Umisyo/XIVPedia` で Issue 情報を取得
2. ラベルからブランチ type を決定:
   | ラベル | type |
   |--------|------|
   | `type:feature` | `feat` |
   | `type:bug` | `fix` |
   | `type:docs` | `docs` |
   | `type:chore` | `chore` |
   | `type:refactor` | `refactor` |
   - type ラベルが未設定の場合はユーザーに選択を求める
3. ブランチ名を生成（`<type>/<issue-number>-<short-description>`）してユーザーに確認:
   ```
   📋 Issue #42: ユーザー認証機能を追加
   🔖 Labels: type:feature, priority:high

   ブランチ名: feat/42-user-auth

   この名前でよろしいですか？
   ```
4. ブランチを作成:
   ```bash
   git -C /Users/souta.kusunoki/.ghr/github.com/Umisyo/XIVPedia fetch origin main
   git -C /Users/souta.kusunoki/.ghr/github.com/Umisyo/XIVPedia branch <branch-name> origin/main
   ```
5. Worktree を作成:
   ```bash
   mkdir -p /Users/souta.kusunoki/.ghr/github.com/yumemi/worktrees/<branch-name>
   git -C /Users/souta.kusunoki/.ghr/github.com/Umisyo/XIVPedia worktree add /Users/souta.kusunoki/.ghr/github.com/yumemi/worktrees/<branch-name> <branch-name>
   ```
   - ブランチ名にスラッシュが含まれるため、`mkdir -p` でディレクトリ階層を事前作成
6. メインリポジトリの `.env` が存在する場合、worktree にシンボリックリンクを作成:
   ```bash
   ln -sf /Users/souta.kusunoki/.ghr/github.com/Umisyo/XIVPedia/.env /Users/souta.kusunoki/.ghr/github.com/yumemi/worktrees/<branch-name>/.env
   ```
7. 結果を表示:
   ```
   ✅ 開発環境セットアップ完了
     Issue:    #42 ユーザー認証機能を追加
     Branch:   feat/42-user-auth
     Worktree: /Users/souta.kusunoki/.ghr/github.com/yumemi/worktrees/feat/42-user-auth

   以降の作業はこの worktree 内で実施してください。
   ```

### `/dev team`

エージェントチームを起動して、複数エージェントで並列実装を行う。

**前提条件**:
- 現在のディレクトリが worktree 内であること（main ブランチでの実行は禁止）
- 対象 Issue が明確であること

**手順**:
1. 現在の Issue とブランチを確認
2. Issue の実装スコープを分析し、並列実行可能なワークストリームに分割（2-4 エージェント）
3. 分割案をユーザーに提示・確認:
   ```
   🏗️ エージェントチーム分割案

   Issue #42: ユーザー認証機能を追加

   ■ Agent 1: 認証 API 実装
     担当: src/api/auth.ts, src/api/middleware.ts
     内容: ログイン・ログアウト・トークン管理

   ■ Agent 2: 認証 UI 実装
     担当: src/components/Login.tsx, src/components/AuthProvider.tsx
     内容: ログインフォーム・認証状態管理

   ■ Agent 3: テスト作成
     担当: tests/auth.test.ts, tests/login.test.ts
     内容: 認証 API とコンポーネントのテスト

   ■ Agent 4: コードレビュー（必須）
     担当: なし（ファイル編集なし）
     内容: 全エージェント完了後に codex review --base main を実行し、結果をレポート

   ⚠️ 競合回避: 各エージェントの担当ファイルは重複なし

   この分割で進めてよろしいですか？
   ```
4. ユーザーの承認後、Task ツールで各エージェントを起動:
   - `subagent_type: "general-purpose"` を使用
   - 各エージェントに渡す情報:
     - **作業ディレクトリ**: 現在の worktree パス
     - **担当ファイル**: 編集してよいファイルのリスト
     - **編集禁止ファイル**: 他エージェントが担当するファイルのリスト（明示的に列挙）
     - **実装要件**: Issue の該当部分の詳細
     - **コーディング規約**: CLAUDE.md の関連ルール
   - 可能な限り並列で起動する（独立したエージェントは同時起動）
   - ただしレビュー担当エージェントは全実装エージェントの完了後に起動する
5. 全エージェント完了後:
   - 統合確認（ビルド・lint の実行）
   - 競合やエラーがあれば修正
   - 結果をユーザーに報告

**分割の原則**:
- **ファイル競合回避**: 各エージェントの担当ファイルを明確に分離し、同一ファイルを複数エージェントが編集しないようにする
- **機能単位での分割**: 意味のある機能単位でワークストリームを分ける
- **依存関係の最小化**: エージェント間の依存が最小になるよう分割する
- **エージェント数**: 2-4 が適切。多すぎると調整コストが増大する
- **レビュー担当エージェント（必須）**: 全実装エージェント完了後に `codex review --base main` を実行する専用エージェントを必ず含める。このエージェントはファイルを編集せず、レビュー結果をユーザーに報告する
