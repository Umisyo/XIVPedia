-- =============================================================================
-- RLS (Row Level Security) ポリシー整備
-- 全テーブルに対して適切なアクセス制御を設定する
-- =============================================================================

-- =============================================================================
-- 1. 全テーブルで RLS を有効化
-- =============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 2. profiles
-- =============================================================================

-- SELECT: 誰でも閲覧可能
CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT
  USING (true);

-- INSERT: 自分のプロフィールのみ作成可能
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- UPDATE: 自分のプロフィールのみ編集可能
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- DELETE: admin のみ
CREATE POLICY "profiles_delete_admin"
  ON profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- 3. tag_categories
-- =============================================================================

-- SELECT: 誰でも閲覧可能
CREATE POLICY "tag_categories_select_all"
  ON tag_categories FOR SELECT
  USING (true);

-- INSERT: admin のみ
CREATE POLICY "tag_categories_insert_admin"
  ON tag_categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- UPDATE: admin のみ
CREATE POLICY "tag_categories_update_admin"
  ON tag_categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- DELETE: admin のみ
CREATE POLICY "tag_categories_delete_admin"
  ON tag_categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- 4. tags
-- =============================================================================

-- SELECT: 誰でも閲覧可能
CREATE POLICY "tags_select_all"
  ON tags FOR SELECT
  USING (true);

-- INSERT: admin のみ
CREATE POLICY "tags_insert_admin"
  ON tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- UPDATE: admin のみ
CREATE POLICY "tags_update_admin"
  ON tags FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- DELETE: admin のみ
CREATE POLICY "tags_delete_admin"
  ON tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- 5. articles
-- =============================================================================

-- SELECT: published は誰でも、draft/archived は著者のみ
CREATE POLICY "articles_select"
  ON articles FOR SELECT
  USING (
    status = 'published'
    OR author_id = auth.uid()
  );

-- INSERT: 認証済みユーザー
CREATE POLICY "articles_insert_authenticated"
  ON articles FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: 著者のみ
CREATE POLICY "articles_update_author"
  ON articles FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- DELETE: 著者または admin
CREATE POLICY "articles_delete_author_or_admin"
  ON articles FOR DELETE
  USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- 6. article_tags
-- =============================================================================

-- SELECT: 誰でも閲覧可能
CREATE POLICY "article_tags_select_all"
  ON article_tags FOR SELECT
  USING (true);

-- INSERT: 対象記事の著者のみ
CREATE POLICY "article_tags_insert_author"
  ON article_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM articles
      WHERE id = article_id AND author_id = auth.uid()
    )
  );

-- DELETE: 対象記事の著者のみ
CREATE POLICY "article_tags_delete_author"
  ON article_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM articles
      WHERE id = article_id AND author_id = auth.uid()
    )
  );

-- =============================================================================
-- 7. comments
-- =============================================================================

-- SELECT: 誰でも閲覧可能
CREATE POLICY "comments_select_all"
  ON comments FOR SELECT
  USING (true);

-- INSERT: 認証済みユーザー
CREATE POLICY "comments_insert_authenticated"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: 著者のみ
CREATE POLICY "comments_update_author"
  ON comments FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- DELETE: 著者または admin
CREATE POLICY "comments_delete_author_or_admin"
  ON comments FOR DELETE
  USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- 8. reactions
-- =============================================================================

-- SELECT: 誰でも閲覧可能
CREATE POLICY "reactions_select_all"
  ON reactions FOR SELECT
  USING (true);

-- INSERT: 認証済みユーザー（自分のリアクションのみ）
CREATE POLICY "reactions_insert_own"
  ON reactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- DELETE: 自分のリアクションのみ
CREATE POLICY "reactions_delete_own"
  ON reactions FOR DELETE
  USING (user_id = auth.uid());

-- =============================================================================
-- 9. tag_requests
-- =============================================================================

-- SELECT: 自分の申請、または admin/moderator は全て閲覧可能
CREATE POLICY "tag_requests_select"
  ON tag_requests FOR SELECT
  USING (
    requester_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- INSERT: 認証済みユーザー（自分の申請のみ）
CREATE POLICY "tag_requests_insert_own"
  ON tag_requests FOR INSERT
  WITH CHECK (requester_id = auth.uid());

-- UPDATE: admin/moderator のみ（ステータス変更）
CREATE POLICY "tag_requests_update_staff"
  ON tag_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- DELETE: 不可（ポリシーなし = 全拒否）

-- =============================================================================
-- 10. reports
-- =============================================================================

-- SELECT: admin/moderator のみ
CREATE POLICY "reports_select_staff"
  ON reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- INSERT: 認証済みユーザー（自分の通報のみ）
CREATE POLICY "reports_insert_own"
  ON reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

-- UPDATE: admin/moderator のみ
CREATE POLICY "reports_update_staff"
  ON reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- DELETE: 不可（ポリシーなし = 全拒否）
