import 'dotenv/config';
import {
  palettes,
  swatchTypes,
  paletteSwatches,
  artworks,
  albums,
  artists,
  genres,
  songs,
  artistsSongs,
  genresSongs,
  albumsArtists,
  listeningData
} from './schema';
import { drizzle } from 'drizzle-orm/pglite';

const db = drizzle(process.env.DATABASE_PATH!);

async function seed() {
  await db.insert(palettes).values([{ palette_id: 1 }]);

  await db.insert(swatchTypes).values([
    { swatch_type_id: 1, name: 'Vibrant' },
    { swatch_type_id: 2, name: 'Muted' }
  ]);

  await db.insert(paletteSwatches).values([
    {
      palette_swatch_id: 1,
      population: 2300,
      hex: '#ff5733',
      hsl: '14,100,60',
      swatch_type_id: 1,
      palette_id: 1
    }
  ]);

  await db.insert(artworks).values([{ artwork_id: 1, file_path: 'C:/Music/artworks/art1.jpg' }]);

  await db
    .insert(albums)
    .values([{ album_id: 1, title: 'Aurora Echoes', year: 2022, artwork_id: 1 }]);

  await db.insert(artists).values([{ artist_id: 1, name: 'Nova Rhythm', artwork_id: 1 }]);

  await db
    .insert(genres)
    .values([{ genre_id: 1, name: 'Synthwave', artwork_id: 1, palette_id: 1 }]);

  await db.insert(songs).values([
    {
      song_id: 1,
      title: 'Midnight Drive',
      duration: 235.4,
      path: 'C:/Music/MidnightDrive.mp3',
      sample_rate: 44100,
      bit_rate: 320,
      no_of_channels: 2,
      file_created_at: new Date(),
      file_modified_at: new Date(),
      artwork_id: 1,
      album_id: 1,
      palette_id: 1,
      created_at: new Date(),
      updated_at: new Date(),
      year: 2022,
      disk_number: 1,
      track_number: 1
    }
  ]);

  await db.insert(artistsSongs).values([{ song_id: 1, artist_id: 1 }]);
  await db.insert(genresSongs).values([{ song_id: 1, genre_id: 1 }]);
  await db.insert(albumsArtists).values([{ album_id: 1, artist_id: 1 }]);
  await db.insert(listeningData).values([
    {
      listening_data_id: 1,
      skip_count: 0,
      full_listens_count: 5,
      added_playlist_count: 2,
      song_id: 1
    }
  ]);

  console.log('✅ Database seeded successfully.');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
});

