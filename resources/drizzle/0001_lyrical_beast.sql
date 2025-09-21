DROP INDEX "idx_songs_title_text";--> statement-breakpoint
CREATE INDEX "idx_artworks_source_dimensions" ON "artworks" USING btree ("source","width","height");--> statement-breakpoint
CREATE INDEX "idx_songs_is_favorite" ON "songs" USING btree ("is_favorite");--> statement-breakpoint
CREATE INDEX "idx_songs_favorite_title" ON "songs" USING btree ("is_favorite","title");