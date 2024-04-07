import { Database } from 'better-sqlite3';

export const initializeDatabase = (db: Database) => {
  const songModel = db.prepare(
    `CREATE TABLE IF NOT EXISTS songs (
                songId INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                duration REAL NOT NULL,
                bitrate INTEGER NULL,
                trackNo INTEGER NULL,
                diskNo INTEGER NULL,
                noOfChannels INTEGER NULL,
                year INTEGER NULL,
                sampleRate INTEGER NULL,
                paletteId INTEGER NULL,
                isAFavorite INTEGER NOT NULL DEFAULT 0,
                isArtworkAvailable INTEGER NOT NULL DEFAULT 0,
                path TEXT NOT NULL UNIQUE,
                createdDate INTEGER NULL,
                modifiedDate INTEGER NULL,
                addedDate INTEGER NOT NULL
    );`
  );

  songModel.run();

  const songDataRow = db.prepare(
    `INSERT INTO songs (title, duration, path, addedDate) VALUES (? , ? , ?, ?)`
  );
  songDataRow.run('Unity A', 250.5, 'D://Music/Spotify/Unity A.mp3', 1234567890);
};
