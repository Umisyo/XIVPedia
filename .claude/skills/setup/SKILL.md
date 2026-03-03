---
name: setup
description: XIVPedia プロジェクトの初期セットアップ（ラベル作成、Project 情報取得、認証確認）
user_invocable: true
---

# /setup — 初期セットアップ

プロジェクトの初期セットアップを行うスキル。ラベル作成、GitHub Project の情報取得、認証確認を実施する。

## 使い方

- `/setup` — 対話的にセットアップ内容を選択
- `/setup auth` — gh auth のスコープ確認・追加
- `/setup labels` — カスタムラベル一括作成
- `/setup project` — 既存 GitHub Project の情報取得と CLAUDE.md への記録
- `/setup verify` — セットアップの検証

## 共通設定

- **リポジトリ**: `Umisyo/XIVPedia`
- **CLAUDE.md パス**: プロジェクトルートの `CLAUDE.md`

## サブコマンド詳細

### `/setup auth`

gh CLI の認証スコープを確認し、不足があれば追加する。

**手順**:
1. `gh auth status` でトークンのスコープを確認
2. `project` スコープが無い場合、ユーザーに以下のコマンドの実行を提案:
   ```
   gh auth refresh -s project
   ```
3. 再度 `gh auth status` で確認

### `/setup labels`

CLAUDE.md で定義されたラベルを一括作成する。`--force` オプションで既存ラベルは上書きする。

**手順**:
1. CLAUDE.md からラベル定義を読み取る
2. 以下のラベルを `gh label create` で作成:

```bash
# Type ラベル
gh label create "type:feature" --color "0E8A16" --description "新機能" --force -R Umisyo/XIVPedia
gh label create "type:bug" --color "D93F0B" --description "バグ" --force -R Umisyo/XIVPedia
gh label create "type:docs" --color "0075CA" --description "ドキュメント" --force -R Umisyo/XIVPedia
gh label create "type:chore" --color "BFDADC" --description "雑務・メンテナンス" --force -R Umisyo/XIVPedia
gh label create "type:refactor" --color "D4C5F9" --description "リファクタリング" --force -R Umisyo/XIVPedia

# Priority ラベル
gh label create "priority:high" --color "B60205" --description "優先度高" --force -R Umisyo/XIVPedia
gh label create "priority:medium" --color "FBCA04" --description "優先度中" --force -R Umisyo/XIVPedia
gh label create "priority:low" --color "C2E0C6" --description "優先度低" --force -R Umisyo/XIVPedia

# Status ラベル
gh label create "needs-triage" --color "E4E669" --description "トリアージ待ち" --force -R Umisyo/XIVPedia
gh label create "blocked" --color "B60205" --description "ブロック中" --force -R Umisyo/XIVPedia

# Scope ラベル
gh label create "scope:frontend" --color "1D76DB" --description "フロントエンド" --force -R Umisyo/XIVPedia
gh label create "scope:backend" --color "5319E7" --description "バックエンド" --force -R Umisyo/XIVPedia
gh label create "scope:infra" --color "F9D0C4" --description "インフラ" --force -R Umisyo/XIVPedia
```

3. 作成結果を一覧表示

### `/setup project`

既存の GitHub Project の情報を取得し、CLAUDE.md に記録する。

**手順**:
1. `gh project list --owner Umisyo --format json` で Project 一覧を取得
2. ユーザーに使用する Project を選択してもらう
3. 選択された Project の番号を確認
4. Project の Field 情報を取得:
   ```bash
   gh project field-list <PROJECT_NUMBER> --owner Umisyo --format json
   ```
5. Status フィールドの ID と各 Option（Backlog, Todo, In Progress, In Review, Done）の ID を取得
6. CLAUDE.md の以下の箇所を更新:
   - `GitHub Project 番号`
   - `GitHub Project ID`
   - `Status Field ID`
   - `Status Option ID` セクション（各ステータスの Option ID をテーブル形式で記録）

**CLAUDE.md 更新例**（Status Option ID セクション）:
```markdown
### Status Option ID
| Status | Option ID |
|--------|-----------|
| Backlog | XXXXXXXX |
| Todo | XXXXXXXX |
| In Progress | XXXXXXXX |
| In Review | XXXXXXXX |
| Done | XXXXXXXX |
```

### `/setup verify`

セットアップが正しく完了しているか検証する。

**チェック項目**:
1. `gh auth status` — 認証状態と `project` スコープの有無
2. `gh label list -R Umisyo/XIVPedia` — 必要なラベルがすべて存在するか
3. CLAUDE.md の Project 番号・ID が記入済みか
4. `gh project field-list` で Status フィールドにアクセスできるか

**出力形式**:
```
セットアップ検証結果:
  ✓ gh 認証: OK (project スコープあり)
  ✓ ラベル: 13/13 作成済み
  ✓ Project 番号: #X (CLAUDE.md に記録済み)
  ✓ Status Field: アクセス可能
  ✗ 問題点があればここに表示
```
