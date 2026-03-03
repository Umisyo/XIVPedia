---
name: issue
description: GitHub Issue の作成・一覧・編集・クローズなどの管理操作
user_invocable: true
---

# /issue — Issue 管理

GitHub Issue の CRUD 操作を行うスキル。

## 使い方

- `/issue` — 対話的に操作を選択
- `/issue create` — Issue を新規作成
- `/issue list` — Issue 一覧を表示
- `/issue view <number>` — Issue の詳細を表示
- `/issue edit <number>` — Issue を編集
- `/issue close <number>` — Issue をクローズ
- `/issue search <query>` — Issue を検索
- `/issue triage` — 未トリアージの Issue を一覧表示し分類を提案

## 共通設定

- **リポジトリ**: `Umisyo/XIVPedia`
- Issue 作成・クローズ時は**必ずユーザーに確認**してから実行すること
- Issue には必ず `type:*` ラベルと `priority:*` ラベルを付与すること

## サブコマンド詳細

### `/issue create`

新しい Issue を作成する。

**手順**:
1. ユーザーから以下の情報を収集（対話的に）:
   - タイトル
   - 本文（CLAUDE.md の Issue テンプレートに準拠）
   - Type ラベル（`type:feature`, `type:bug`, `type:docs`, `type:chore`, `type:refactor`）
   - Priority ラベル（`priority:high`, `priority:medium`, `priority:low`）
   - Scope ラベル（任意: `scope:frontend`, `scope:backend`, `scope:infra`）
   - アサイン先（任意）
2. 作成内容をユーザーに確認
3. 確認後、`gh issue create` で作成:
   ```bash
   gh issue create \
     --title "<タイトル>" \
     --body "<本文>" \
     --label "<ラベル1>,<ラベル2>" \
     --assignee "<ユーザー>" \
     -R Umisyo/XIVPedia
   ```
4. 作成された Issue の URL を表示

### `/issue list`

Issue の一覧を表示する。フィルタ条件を指定可能。

**コマンド例**:
```bash
# 全 Open Issue
gh issue list -R Umisyo/XIVPedia

# ラベルでフィルタ
gh issue list -R Umisyo/XIVPedia --label "type:bug"
gh issue list -R Umisyo/XIVPedia --label "priority:high"

# アサインでフィルタ
gh issue list -R Umisyo/XIVPedia --assignee "@me"

# 状態でフィルタ
gh issue list -R Umisyo/XIVPedia --state closed
gh issue list -R Umisyo/XIVPedia --state all
```

**出力形式**: テーブル形式で `#番号 | タイトル | ラベル | アサイン | 更新日` を表示。

### `/issue view <number>`

指定した Issue の詳細を表示する。

```bash
gh issue view <number> -R Umisyo/XIVPedia
```

コメントも含めて表示する場合:
```bash
gh issue view <number> -R Umisyo/XIVPedia --comments
```

### `/issue edit <number>`

Issue のメタデータを編集する。

**編集可能な項目**:
- タイトル: `--title`
- 本文: `--body`
- ラベル追加: `--add-label`
- ラベル削除: `--remove-label`
- アサイン追加: `--add-assignee`
- アサイン削除: `--remove-assignee`

```bash
gh issue edit <number> --add-label "priority:high" --remove-label "priority:medium" -R Umisyo/XIVPedia
```

### `/issue close <number>`

Issue をクローズする。

**手順**:
1. `gh issue view <number>` で Issue の内容を確認
2. ユーザーにクローズ理由を確認
3. 必要に応じてコメントを追加:
   ```bash
   gh issue comment <number> --body "<クローズ理由>" -R Umisyo/XIVPedia
   ```
4. Issue をクローズ:
   ```bash
   gh issue close <number> -R Umisyo/XIVPedia
   ```
   - 完了の場合: `gh issue close <number> --reason completed -R Umisyo/XIVPedia`
   - 対応しないの場合: `gh issue close <number> --reason "not planned" -R Umisyo/XIVPedia`

### `/issue search <query>`

Issue をキーワードで検索する。

```bash
gh issue list -R Umisyo/XIVPedia --search "<query>"
```

### `/issue triage`

`needs-triage` ラベルが付いた Issue、またはラベルが不足している Issue を一覧表示し、分類を提案する。

**手順**:
1. `needs-triage` ラベル付き Issue を取得:
   ```bash
   gh issue list -R Umisyo/XIVPedia --label "needs-triage"
   ```
2. `type:*` や `priority:*` ラベルが無い Issue を特定
3. 各 Issue の内容を確認し、適切なラベルを提案
4. ユーザーの承認後、ラベルを適用
