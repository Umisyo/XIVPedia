CREATE TABLE "tag_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "tag_categories_name_unique" UNIQUE("name"),
	CONSTRAINT "tag_categories_slug_unique" UNIQUE("slug")
);
