import logger from '@main/logger';
import { db } from './db';
// import { artworks, artworksPlaylists, playlists } from './schema';

// import favoritesPlaylistCoverImage from '../../renderer/src/assets/images/webp/favorites-playlist-icon.webp?asset';
// import historyPlaylistCoverImage from '../../renderer/src/assets/images/webp/history-playlist-icon.webp?asset';
import { eq } from 'drizzle-orm';
import { userSettings } from './schema';

const isSettingsTableSeeded = async () => {
  const x = await db.$count(userSettings, eq(userSettings.id, 1));
  return x > 0;
};

export const seedDatabase = async () => {
  try {
    // # Seed the user_settings table
    const isSettingsSeeded = await isSettingsTableSeeded();
    if (!isSettingsSeeded) {
      // user_settings table has no entries, seed it with default values
      await db.insert(userSettings).values({ language: 'en' });
      logger.info('Seeded user_settings table with default values.');
    } else {
      logger.info('user_settings table already seeded. Skipping seeding process.');
    }

    // # Seed the playlists table
    // const isSeeded = await isDatabaseSeeded();
    // if (isSeeded) {
    //   return logger.info('Database already seeded. Skipping seeding process.');
    // }
    // await db.transaction(async (trx) => {
    //   // Seed playlists
    //   const [historyPlaylist, favoritesPlaylist] = await trx
    //     .insert(playlists)
    //     .values([{ name: 'History' }, { name: 'Favorites' }])
    //     .onConflictDoNothing()
    //     .returning();
    //   const [historyArtwork, favoritesArtwork] = await trx
    //     .insert(artworks)
    //     .values([
    //       { path: historyPlaylistCoverImage, source: 'LOCAL', width: 500, height: 500 },
    //       { path: favoritesPlaylistCoverImage, source: 'LOCAL', width: 500, height: 500 }
    //     ])
    //     .onConflictDoNothing()
    //     .returning();
    //   const data = await trx
    //     .insert(artworksPlaylists)
    //     .values([
    //       { artworkId: historyArtwork.id, playlistId: historyPlaylist.id },
    //       { artworkId: favoritesArtwork.id, playlistId: favoritesPlaylist.id }
    //     ])
    //     .onConflictDoNothing()
    //     .returning();
    //   logger.info('Seeded Playlists and ArtworksPlaylists:', { data });
    // });
  } catch (error) {
    logger.error('Error seeding database:', { error });
  }
};
