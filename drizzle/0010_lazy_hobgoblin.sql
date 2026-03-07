CREATE INDEX "article_tags_tag_id_idx" ON "article_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "articles_status_published_at_idx" ON "articles" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "articles_status_created_at_idx" ON "articles" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "articles_author_id_idx" ON "articles" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "comments_article_id_idx" ON "comments" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "reactions_article_id_idx" ON "reactions" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reports_target_idx" ON "reports" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "tag_requests_status_idx" ON "tag_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tags_category_idx" ON "tags" USING btree ("category");