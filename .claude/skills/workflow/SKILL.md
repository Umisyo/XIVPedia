---
name: task
description: Issue + Project を組み合わせた高レベルなタスクワークフロー（作成・着手・レビュー・完了）
user_invocable: true
---

# /task — タスクワークフロー

Issue 管理と Project ボード操作を組み合わせた高レベルなワークフロースキル。

## 使い方

- `/task` — 対話的に操作を選択
- `/task new "<title>"` — 新規タスク作成（Issue + Project 追加 + ブランチ名提案）
- `/task start <number>` — タスク着手（アサイン + In Progress + ブランチ名提案）
- `/task review <number>` — レビュー依頼（In Review + PR 作成リマインド）
- `/task done <number>` — タスク完了（Issue クローズ + Done）
- `/task next` — 次に着手すべきタスクを提案
- `/task status` — ダッシュボード表示

## 共通設定

- **リポジトリ**: `Umisyo/XIVPedia`
- **CLAUDE.md**: プロジェクトルートの CLAUDE.md を参照（Project 情報、ラベル体系、ブランチ命名規則）
- 各操作の実行前に**必ずユーザーに確認**すること
- ブランチ命名規則: `<type>/<issue-number>-<short-description>`

## サブコマンド詳細

### `/task new "<title>"`

新規タスクを作成する複合操作。

**手順**:
1. ユーザーから情報を収集（対話的に）:
   - タイトル（引数で指定された場合はそれを使用）
   - 本文（CLAUDE.md の Issue テンプレートに準拠）
   - Type ラベル
   - Priority ラベル
   - Scope ラベル（任意）
2. ユーザーに作成内容を確認
3. 実行:
   - Issue を作成（`gh issue create`）
   - 作成された Issue を Project に追加（`gh project item-add`）
   - ブランチ命名規則に基づいたブランチ名を提案
4. 結果を表示:
   ```
   ✅ タスク作成完了
     Issue:   #42 ユーザー認証機能を追加
     Labels:  type:feature, priority:high
     Project: Backlog に追加
     Branch:  feat/42-user-auth
   ```

### `/task start <number>`

タスクに着手する。

**手順**:
1. `gh issue view <number>` で Issue の内容を確認
2. ユーザーに着手を確認
3. 実行:
   - 自分をアサイン: `gh issue edit <number> --add-assignee @me -R Umisyo/XIVPedia`
   - Project のステータスを In Progress に変更（`/project move` の手順に準拠）
   - `needs-triage` ラベルがあれば削除
4. 開発環境のセットアップを案内（ブランチ + worktree の作成は `/dev start` に委譲）:
   ```
   🚀 タスク着手
     Issue:   #42 ユーザー認証機能を追加
     Status:  In Progress

   開発環境をセットアップするには:
     /dev start 42
   ```
   - `/task start` = プロジェクト管理（アサイン・ステータス変更）
   - `/dev start` = Git 環境セットアップ（ブランチ・worktree 作成）

### `/task review <number>`

タスクをレビューフェーズに移行する。

**手順**:
1. `gh issue view <number>` で Issue の内容を確認
2. `codex review --base main` を実行してコードレビューを実施:
   - 指摘があれば修正を促し、修正完了後に再レビュー
   - 問題なければ次へ
3. Project のステータスを In Review に変更
4. PR を作成（ユーザーに確認後）:
   ```
   👀 レビューフェーズに移行
     Issue:  #42 ユーザー認証機能を追加
     Status: In Review

   PR を作成します:
     gh pr create --title "feat: ユーザー認証機能を追加 (#42)" --body "Closes #42"
   ```

### `/task done <number>`

タスクを完了する。

**手順**:
1. `gh issue view <number>` で Issue の内容を確認
2. ユーザーに完了を確認
3. 実行:
   - Issue をクローズ: `gh issue close <number> --reason completed -R Umisyo/XIVPedia`
   - Project のステータスを Done に変更
4. 完了メッセージを表示:
   ```
   ✅ タスク完了
     Issue:  #42 ユーザー認証機能を追加
     Status: Done (Closed)
   ```

### `/task next`

次に着手すべきタスクを提案する。

**手順**:
1. CLAUDE.md から Project 番号を取得
2. Project の Todo アイテムを取得（`gh project item-list` でフィルタ）
3. Priority ラベルで並べ替え（high → medium → low）
4. 上位 3 件を提案:
   ```
   📋 次に着手すべきタスク（Todo から優先度順）

   1. #42 ユーザー認証機能を追加      priority:high   type:feature
   2. #38 エラーハンドリング改善       priority:high   type:bug
   3. #45 API ドキュメント更新         priority:medium type:docs

   着手するタスク番号を指定してください（例: /task start 42）
   ```

### `/task status`

プロジェクト全体のダッシュボードを表示する。

**手順**:
1. Project のサマリーを取得（`/project summary` の手順に準拠）
2. 自分にアサインされた In Progress のタスクを取得
3. 直近のアクティビティを取得

**出力形式**:
```
📊 XIVPedia ダッシュボード
============================

■ Project 状況
  Backlog:      3 件
  Todo:         2 件
  In Progress:  1 件
  In Review:    1 件
  Done:         5 件

■ 自分の作業中タスク
  #42 ユーザー認証機能を追加  priority:high  type:feature

■ 直近のアクティビティ
  2h ago  #40 Closed  ログイン画面実装
  5h ago  #42 Assigned to @me
```
