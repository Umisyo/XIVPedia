-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- profiles
-- ============================================================
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_admin" ON profiles
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- tag_categories
-- ============================================================
CREATE POLICY "tag_categories_select_all" ON tag_categories
  FOR SELECT USING (true);

CREATE POLICY "tag_categories_insert_admin" ON tag_categories
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "tag_categories_update_admin" ON tag_categories
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "tag_categories_delete_admin" ON tag_categories
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- tags
-- ============================================================
CREATE POLICY "tags_select_all" ON tags
  FOR SELECT USING (true);

CREATE POLICY "tags_insert_admin" ON tags
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "tags_update_admin" ON tags
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "tags_delete_admin" ON tags
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- articles
-- ============================================================
CREATE POLICY "articles_select_published" ON articles
  FOR SELECT USING (
    status = 'published' OR author_id = auth.uid()
  );

CREATE POLICY "articles_insert_authenticated" ON articles
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "articles_update_own" ON articles
  FOR UPDATE USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "articles_delete_own_or_admin" ON articles
  FOR DELETE USING (
    author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- article_tags
-- ============================================================
CREATE POLICY "article_tags_select_all" ON article_tags
  FOR SELECT USING (true);

CREATE POLICY "article_tags_insert_owner" ON article_tags
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM articles WHERE id = article_id AND author_id = auth.uid())
  );

CREATE POLICY "article_tags_delete_owner" ON article_tags
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM articles WHERE id = article_id AND author_id = auth.uid())
  );

-- ============================================================
-- comments
-- ============================================================
CREATE POLICY "comments_select_all" ON comments
  FOR SELECT USING (true);

CREATE POLICY "comments_insert_authenticated" ON comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "comments_update_own" ON comments
  FOR UPDATE USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "comments_delete_own_or_admin" ON comments
  FOR DELETE USING (
    author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- reactions
-- ============================================================
CREATE POLICY "reactions_select_all" ON reactions
  FOR SELECT USING (true);

CREATE POLICY "reactions_insert_own" ON reactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "reactions_delete_own" ON reactions
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- tag_requests
-- ============================================================
CREATE POLICY "tag_requests_select_own_or_staff" ON tag_requests
  FOR SELECT USING (
    requester_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

CREATE POLICY "tag_requests_insert_authenticated" ON tag_requests
  FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY "tag_requests_update_staff" ON tag_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- ============================================================
-- reports
-- ============================================================
CREATE POLICY "reports_select_staff" ON reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

CREATE POLICY "reports_insert_authenticated" ON reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "reports_update_staff" ON reports
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );
