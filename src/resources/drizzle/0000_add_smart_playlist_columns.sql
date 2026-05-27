ALTER TABLE playlists ADD COLUMN is_smart boolean NOT NULL DEFAULT false;
ALTER TABLE playlists ADD COLUMN criteria text;

CREATE INDEX idx_playlists_is_smart ON playlists (is_smart);
