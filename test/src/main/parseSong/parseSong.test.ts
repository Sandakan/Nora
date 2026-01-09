import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';
import { parseSong } from '../../../../src/main/parseSong/parseSong';
import {
  createMockSongMetadata,
  createMockFileStats,
  createMockSongData,
  createMockArtworkData,
  createMockAlbumManagerResult,
  createMockArtistManagerResult,
  createMockGenreManagerResult,
  createMockPicture,
  expectDataUpdateEventCalledWith,
  expectMessageSentToRenderer
} from './testUtils';

// Mock all dependencies
vi.mock('../../../../src/main/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    verbose: vi.fn()
  }
}));

vi.mock('node-taglib-sharp', () => ({
  File: {
    createFromPath: vi.fn()
  }
}));

vi.mock('fs/promises', () => ({
  default: {
    stat: vi.fn()
  }
}));

vi.mock('../../../../src/main/main', () => ({
  dataUpdateEvent: vi.fn(),
  sendMessageToRenderer: vi.fn()
}));

vi.mock('../../../../src/main/other/artworks', () => ({
  storeArtworks: vi.fn()
}));

vi.mock('../../../../src/main/other/generatePalette', () => ({
  generatePalettes: vi.fn()
}));

vi.mock('../../../../src/main/db/queries/songs', () => ({
  isSongWithPathAvailable: vi.fn(),
  saveSong: vi.fn()
}));

vi.mock('../../../../src/main/db/queries/artworks', () => ({
  linkArtworksToSong: vi.fn()
}));

vi.mock('../../../../src/main/db/db', () => ({
  db: {
    transaction: vi.fn((callback) => callback({}))
  }
}));

vi.mock('../../../../src/main/parseSong/manageAlbumsOfParsedSong', () => ({
  default: vi.fn()
}));

vi.mock('../../../../src/main/parseSong/manageArtistsOfParsedSong', () => ({
  default: vi.fn()
}));

vi.mock('../../../../src/main/parseSong/manageGenresOfParsedSong', () => ({
  default: vi.fn()
}));

vi.mock('../../../../src/main/parseSong/manageAlbumArtistOfParsedSong', () => ({
  default: vi.fn()
}));

describe('parseSong', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup default successful mocks
    const fs = await import('fs/promises');
    const taglib = await import('node-taglib-sharp');
    const { isSongWithPathAvailable, saveSong } = await import(
      '../../../../src/main/db/queries/songs'
    );
    const { storeArtworks } = await import('../../../../src/main/other/artworks');
    const { linkArtworksToSong } = await import('../../../../src/main/db/queries/artworks');
    const manageAlbumsOfParsedSong = (
      await import('../../../../src/main/parseSong/manageAlbumsOfParsedSong')
    ).default;
    const manageArtistsOfParsedSong = (
      await import('../../../../src/main/parseSong/manageArtistsOfParsedSong')
    ).default;
    const manageGenresOfParsedSong = (
      await import('../../../../src/main/parseSong/manageGenresOfParsedSong')
    ).default;
    const manageAlbumArtistOfParsedSong = (
      await import('../../../../src/main/parseSong/manageAlbumArtistOfParsedSong')
    ).default;

    vi.mocked(fs.default.stat).mockResolvedValue(createMockFileStats() as any);
    vi.mocked(taglib.File.createFromPath).mockReturnValue(createMockSongMetadata() as any);
    vi.mocked(isSongWithPathAvailable).mockResolvedValue(false);
    vi.mocked(saveSong).mockResolvedValue(createMockSongData() as any);
    vi.mocked(storeArtworks).mockResolvedValue(createMockArtworkData() as any);
    vi.mocked(linkArtworksToSong).mockResolvedValue([] as any);
    vi.mocked(manageAlbumsOfParsedSong).mockResolvedValue(createMockAlbumManagerResult() as any);
    vi.mocked(manageArtistsOfParsedSong).mockResolvedValue(
      createMockArtistManagerResult() as any
    );
    vi.mocked(manageGenresOfParsedSong).mockResolvedValue(createMockGenreManagerResult() as any);
    vi.mocked(manageAlbumArtistOfParsedSong).mockResolvedValue({
      newAlbumArtists: [],
      relevantAlbumArtists: []
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Happy Path - Complete Metadata', () => {
    test('should parse song with all metadata fields', async () => {
      const songPath = '/test/complete-song.mp3';
      const mockMetadata = createMockSongMetadata({
        title: 'Complete Song',
        performers: ['Artist One', 'Artist Two'],
        album: 'Complete Album',
        albumArtists: ['Album Artist'],
        genres: ['Rock', 'Pop'],
        year: 2023,
        disc: 1,
        track: 5,
        pictures: [createMockPicture()]
      });

      const taglib = await import('node-taglib-sharp');
      vi.mocked(taglib.File.createFromPath).mockReturnValue(mockMetadata as any);

      await parseSong(songPath);

      const { saveSong } = await import('../../../../src/main/db/queries/songs');
      expect(saveSong).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Complete Song',
          path: songPath,
          year: 2023,
          diskNumber: 1,
          trackNumber: 5
        }),
        expect.anything()
      );
    });

    test('should create song, artworks, album, artists, and genres', async () => {
      const songPath = '/test/full-metadata-song.mp3';

      await parseSong(songPath);

      const { saveSong } = await import('../../../../src/main/db/queries/songs');
      const { storeArtworks } = await import('../../../../src/main/other/artworks');
      const { linkArtworksToSong } = await import('../../../../src/main/db/queries/artworks');
      const manageAlbumsOfParsedSong = (
        await import('../../../../src/main/parseSong/manageAlbumsOfParsedSong')
      ).default;
      const manageArtistsOfParsedSong = (
        await import('../../../../src/main/parseSong/manageArtistsOfParsedSong')
      ).default;
      const manageGenresOfParsedSong = (
        await import('../../../../src/main/parseSong/manageGenresOfParsedSong')
      ).default;

      expect(saveSong).toHaveBeenCalled();
      expect(storeArtworks).toHaveBeenCalled();
      expect(linkArtworksToSong).toHaveBeenCalled();
      expect(manageAlbumsOfParsedSong).toHaveBeenCalled();
      expect(manageArtistsOfParsedSong).toHaveBeenCalled();
      expect(manageGenresOfParsedSong).toHaveBeenCalled();
    });

    test('should send all data update events for new entities', async () => {
      const songPath = '/test/new-entities-song.mp3';
      const manageArtistsOfParsedSong = (
        await import('../../../../src/main/parseSong/manageArtistsOfParsedSong')
      ).default;
      const manageAlbumsOfParsedSong = (
        await import('../../../../src/main/parseSong/manageAlbumsOfParsedSong')
      ).default;
      const manageGenresOfParsedSong = (
        await import('../../../../src/main/parseSong/manageGenresOfParsedSong')
      ).default;

      // Mock new entities being created
      vi.mocked(manageArtistsOfParsedSong).mockResolvedValue(
        createMockArtistManagerResult({
          newArtists: [{ id: 1, name: 'New Artist' }],
          relevantArtists: [{ id: 1, name: 'New Artist' }]
        }) as any
      );
      vi.mocked(manageAlbumsOfParsedSong).mockResolvedValue(
        createMockAlbumManagerResult({
          newAlbum: { id: 1, title: 'New Album' },
          relevantAlbum: { id: 1, title: 'New Album' }
        }) as any
      );
      vi.mocked(manageGenresOfParsedSong).mockResolvedValue(
        createMockGenreManagerResult({
          newGenres: [{ id: 1, name: 'New Genre' }],
          relevantGenres: [{ id: 1, name: 'New Genre' }]
        }) as any
      );

      await parseSong(songPath);

      const { dataUpdateEvent } = await import('../../../../src/main/main');
      
      expectDataUpdateEventCalledWith(dataUpdateEvent, 'songs/newSong', [1]);
      expectDataUpdateEventCalledWith(dataUpdateEvent, 'artists/newArtist', [1]);
      expectDataUpdateEventCalledWith(dataUpdateEvent, 'albums/newAlbum', [1]);
      expectDataUpdateEventCalledWith(dataUpdateEvent, 'genres/newGenre', [1]);
    });

    test('should send PARSE_SUCCESSFUL message by default', async () => {
      const songPath = '/test/success-message-song.mp3';

      await parseSong(songPath);

      const { sendMessageToRenderer } = await import('../../../../src/main/main');
      expectMessageSentToRenderer(sendMessageToRenderer, 'PARSE_SUCCESSFUL', 'Test Song');
    });
  });

  describe('Happy Path - Minimal Metadata', () => {
    test('should parse song with only title', async () => {
      const songPath = '/test/minimal-song.mp3';
      const mockMetadata = createMockSongMetadata({
        title: 'Minimal Song',
        performers: [],
        album: '',
        genres: []
      });

      const taglib = await import('node-taglib-sharp');
      vi.mocked(taglib.File.createFromPath).mockReturnValue(mockMetadata as any);

      await parseSong(songPath);

      const { saveSong } = await import('../../../../src/main/db/queries/songs');
      expect(saveSong).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Minimal Song'
        }),
        expect.anything()
      );
    });

    test('should fallback to filename when no title metadata', async () => {
      const songPath = '/test/folder/My Awesome Song.mp3';
      const mockMetadata = createMockSongMetadata({
        title: '',
        performers: [],
        album: '',
        genres: []
      });

      const taglib = await import('node-taglib-sharp');
      vi.mocked(taglib.File.createFromPath).mockReturnValue(mockMetadata as any);

      await parseSong(songPath);

      const { saveSong } = await import('../../../../src/main/db/queries/songs');
      expect(saveSong).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'My Awesome Song'
        }),
        expect.anything()
      );
    });

    test('should handle song with no artists', async () => {
      const songPath = '/test/no-artists-song.mp3';
      const mockMetadata = createMockSongMetadata({
        performers: []
      });

      const taglib = await import('node-taglib-sharp');
      vi.mocked(taglib.File.createFromPath).mockReturnValue(mockMetadata as any);

      await parseSong(songPath);

      const manageArtistsOfParsedSong = (
        await import('../../../../src/main/parseSong/manageArtistsOfParsedSong')
      ).default;
      expect(manageArtistsOfParsedSong).toHaveBeenCalledWith(
        expect.objectContaining({
          songArtists: []
        }),
        expect.anything()
      );
    });

    test('should handle song with no genres', async () => {
      const songPath = '/test/no-genres-song.mp3';
      const mockMetadata = createMockSongMetadata({
        genres: []
      });

      const taglib = await import('node-taglib-sharp');
      vi.mocked(taglib.File.createFromPath).mockReturnValue(mockMetadata as any);

      await parseSong(songPath);

      const manageGenresOfParsedSong = (
        await import('../../../../src/main/parseSong/manageGenresOfParsedSong')
      ).default;
      expect(manageGenresOfParsedSong).toHaveBeenCalledWith(
        expect.objectContaining({
          songGenres: []
        }),
        expect.anything()
      );
    });

    test('should handle song with no album', async () => {
      const songPath = '/test/no-album-song.mp3';
      const mockMetadata = createMockSongMetadata({
        album: ''
      });

      const taglib = await import('node-taglib-sharp');
      vi.mocked(taglib.File.createFromPath).mockReturnValue(mockMetadata as any);

      await parseSong(songPath);

      const manageAlbumsOfParsedSong = (
        await import('../../../../src/main/parseSong/manageAlbumsOfParsedSong')
      ).default;
      expect(manageAlbumsOfParsedSong).toHaveBeenCalledWith(
        expect.objectContaining({
          albumName: undefined
        }),
        expect.anything()
      );
    });
  });

  describe('Metadata Parsing', () => {
    test('should parse multiple artists separated by comma', async () => {
      const songPath = '/test/comma-artists-song.mp3';
      const mockMetadata = createMockSongMetadata({
        performers: ['Artist One, Artist Two, Artist Three']
      });

      const taglib = await import('node-taglib-sharp');
      vi.mocked(taglib.File.createFromPath).mockReturnValue(mockMetadata as any);

      await parseSong(songPath);

      const manageArtistsOfParsedSong = (
        await import('../../../../src/main/parseSong/manageArtistsOfParsedSong')
      ).default;
      expect(manageArtistsOfParsedSong).toHaveBeenCalledWith(
        expect.objectContaining({
          songArtists: ['Artist One', 'Artist Two', 'Artist Three']
        }),
        expect.anything()
      );
    });

    test('should parse multiple artists separated by ampersand', async () => {
      const songPath = '/test/ampersand-artists-song.mp3';
      const mockMetadata = createMockSongMetadata({
        performers: ['Artist One & Artist Two']
      });

      const taglib = await import('node-taglib-sharp');
      vi.mocked(taglib.File.createFromPath).mockReturnValue(mockMetadata as any);

      await parseSong(songPath);

      const manageArtistsOfParsedSong = (
        await import('../../../../src/main/parseSong/manageArtistsOfParsedSong')
      ).default;
      expect(manageArtistsOfParsedSong).toHaveBeenCalledWith(
        expect.objectContaining({
          songArtists: ['Artist One', 'Artist Two']
        }),
        expect.anything()
      );
    });

    test('should calculate duration correctly', async () => {
      const songPath = '/test/duration-song.mp3';
      const mockMetadata = createMockSongMetadata({
        durationMilliseconds: 245678 // 245.678 seconds
      });

      const taglib = await import('node-taglib-sharp');
      vi.mocked(taglib.File.createFromPath).mockReturnValue(mockMetadata as any);

      await parseSong(songPath);

      const { saveSong } = await import('../../../../src/main/db/queries/songs');
      expect(saveSong).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: '245.68' // Rounded to 2 decimal places
        }),
        expect.anything()
      );
    });

    test('should round bitrate up', async () => {
      const songPath = '/test/bitrate-song.mp3';
      const mockMetadata = createMockSongMetadata({
        audioBitrate: 320.7 // Should ceil to 321
      });

      const taglib = await import('node-taglib-sharp');
      vi.mocked(taglib.File.createFromPath).mockReturnValue(mockMetadata as any);

      await parseSong(songPath);

      const { saveSong } = await import('../../../../src/main/db/queries/songs');
      expect(saveSong).toHaveBeenCalledWith(
        expect.objectContaining({
          bitRate: 321
        }),
        expect.anything()
      );
    });

    test('should handle undefined bitrate', async () => {
      const songPath = '/test/no-bitrate-song.mp3';
      const mockMetadata = createMockSongMetadata({
        audioBitrate: 0
      });

      const taglib = await import('node-taglib-sharp');
      vi.mocked(taglib.File.createFromPath).mockReturnValue(mockMetadata as any);

      await parseSong(songPath);

      const { saveSong } = await import('../../../../src/main/db/queries/songs');
      expect(saveSong).toHaveBeenCalledWith(
        expect.objectContaining({
          bitRate: undefined
        }),
        expect.anything()
      );
    });
  });

  describe('Artwork Handling', () => {
    test('should store artwork when present in metadata', async () => {
      const songPath = '/test/artwork-song.mp3';
      const mockMetadata = createMockSongMetadata({
        pictures: [createMockPicture()]
      });

      const taglib = await import('node-taglib-sharp');
      vi.mocked(taglib.File.createFromPath).mockReturnValue(mockMetadata as any);

      await parseSong(songPath);

      const { storeArtworks } = await import('../../../../src/main/other/artworks');
      expect(storeArtworks).toHaveBeenCalledWith(
        'songs',
        expect.any(Uint8Array),
        expect.anything()
      );
    });

    test('should pass undefined when no artwork present', async () => {
      const songPath = '/test/no-artwork-song.mp3';
      const mockMetadata = createMockSongMetadata({
        pictures: []
      });

      const taglib = await import('node-taglib-sharp');
      vi.mocked(taglib.File.createFromPath).mockReturnValue(mockMetadata as any);

      await parseSong(songPath);

      const { storeArtworks } = await import('../../../../src/main/other/artworks');
      expect(storeArtworks).toHaveBeenCalledWith('songs', undefined, expect.anything());
    });

    test('should link artworks to song', async () => {
      const songPath = '/test/link-artwork-song.mp3';
      const mockSongData = createMockSongData({ id: 42 });
      const mockArtworkData = createMockArtworkData();

      const { saveSong } = await import('../../../../src/main/db/queries/songs');
      const { storeArtworks } = await import('../../../../src/main/other/artworks');
      vi.mocked(saveSong).mockResolvedValue(mockSongData as any);
      vi.mocked(storeArtworks).mockResolvedValue(mockArtworkData as any);

      await parseSong(songPath);

      const { linkArtworksToSong } = await import('../../../../src/main/db/queries/artworks');
      expect(linkArtworksToSong).toHaveBeenCalledWith(
        [
          { songId: 42, artworkId: 1 },
          { songId: 42, artworkId: 2 }
        ],
        expect.anything()
      );
    });
  });

  describe('Eligibility Checks', () => {
    test('should not parse if song already exists', async () => {
      const songPath = '/test/existing-song.mp3';
      const { isSongWithPathAvailable } = await import('../../../../src/main/db/queries/songs');
      vi.mocked(isSongWithPathAvailable).mockResolvedValue(true);

      await parseSong(songPath);

      const { saveSong } = await import('../../../../src/main/db/queries/songs');
      expect(saveSong).not.toHaveBeenCalled();
    });

    test('should parse if song exists but reparseToSync is true', async () => {
      const songPath = '/test/reparse-song.mp3';
      const { isSongWithPathAvailable } = await import('../../../../src/main/db/queries/songs');
      vi.mocked(isSongWithPathAvailable).mockResolvedValue(true);

      await parseSong(songPath, undefined, true);

      const { saveSong } = await import('../../../../src/main/db/queries/songs');
      expect(saveSong).toHaveBeenCalled();
    });

    test('should not parse if metadata is null', async () => {
      const songPath = '/test/no-metadata-song.mp3';
      const taglib = await import('node-taglib-sharp');
      vi.mocked(taglib.File.createFromPath).mockReturnValue({
        tag: null,
        properties: createMockSongMetadata().properties
      } as any);

      await parseSong(songPath);

      const { saveSong } = await import('../../../../src/main/db/queries/songs');
      expect(saveSong).not.toHaveBeenCalled();
    });

    test('should log when song is not eligible for parsing', async () => {
      const songPath = '/test/ineligible-song.mp3';
      const { isSongWithPathAvailable } = await import('../../../../src/main/db/queries/songs');
      vi.mocked(isSongWithPathAvailable).mockResolvedValue(true);

      await parseSong(songPath);

      const logger = (await import('../../../../src/main/logger')).default;
      expect(logger.debug).toHaveBeenCalledWith(
        'Song not eligable for parsing.',
        expect.objectContaining({
          absoluteFilePath: songPath
        })
      );
    });
  });

  describe('Transaction Handling', () => {
    test('should execute all operations in a transaction', async () => {
      const songPath = '/test/transaction-song.mp3';
      const { db } = await import('../../../../src/main/db/db');

      await parseSong(songPath);

      expect(db.transaction).toHaveBeenCalledTimes(1);
      expect(db.transaction).toHaveBeenCalledWith(expect.any(Function));
    });

    test('should pass transaction context to all manager functions', async () => {
      const songPath = '/test/trx-context-song.mp3';
      const mockTrx = { some: 'transaction' };
      const { db } = await import('../../../../src/main/db/db');
      vi.mocked(db.transaction).mockImplementation((callback: any) => callback(mockTrx));

      await parseSong(songPath);

      const { saveSong } = await import('../../../../src/main/db/queries/songs');
      const manageAlbumsOfParsedSong = (
        await import('../../../../src/main/parseSong/manageAlbumsOfParsedSong')
      ).default;
      const manageArtistsOfParsedSong = (
        await import('../../../../src/main/parseSong/manageArtistsOfParsedSong')
      ).default;

      expect(saveSong).toHaveBeenCalledWith(expect.anything(), mockTrx);
      expect(manageAlbumsOfParsedSong).toHaveBeenCalledWith(expect.anything(), mockTrx);
      expect(manageArtistsOfParsedSong).toHaveBeenCalledWith(expect.anything(), mockTrx);
    });
  });

  describe('Error Handling', () => {
    test('should throw error and log on failure', async () => {
      const songPath = '/test/error-song.mp3';
      const error = new Error('Database error');
      const { saveSong } = await import('../../../../src/main/db/queries/songs');
      vi.mocked(saveSong).mockRejectedValue(error);

      await expect(parseSong(songPath)).rejects.toThrow('Database error');

      const logger = (await import('../../../../src/main/logger')).default;
      expect(logger.error).toHaveBeenCalledWith(
        'Error occurred when parsing a song.',
        expect.objectContaining({
          error,
          absoluteFilePath: songPath
        })
      );
    });

    test('should cleanup parseQueue on error in finally block', async () => {
      const songPath = '/test/cleanup-error-song.mp3';
      const { saveSong } = await import('../../../../src/main/db/queries/songs');
      vi.mocked(saveSong).mockRejectedValue(new Error('Fatal error'));

      await expect(parseSong(songPath)).rejects.toThrow();

      // parseQueue cleanup is implicit - verify by attempting to parse again
      vi.mocked(saveSong).mockResolvedValue(createMockSongData() as any);
      await parseSong(songPath);

      // Should be called (not blocked by parseQueue)
      expect(saveSong).toHaveBeenCalled();
    });
  });

  describe('Renderer Messages', () => {
    test('should not send message when noRendererMessages is true', async () => {
      const songPath = '/test/no-message-song.mp3';

      await parseSong(songPath, undefined, false, true);

      const { sendMessageToRenderer } = await import('../../../../src/main/main');
      expect(sendMessageToRenderer).not.toHaveBeenCalled();
    });

    test('should send message with song title and ID', async () => {
      const songPath = '/test/message-song.mp3';
      const mockSongData = createMockSongData({ id: 123, title: 'Message Song' });
      const { saveSong } = await import('../../../../src/main/db/queries/songs');
      vi.mocked(saveSong).mockResolvedValue(mockSongData as any);

      await parseSong(songPath);

      const { sendMessageToRenderer } = await import('../../../../src/main/main');
      expect(sendMessageToRenderer).toHaveBeenCalledWith({
        messageCode: 'PARSE_SUCCESSFUL',
        data: { name: 'Test Song', songId: 123 }
      });
    });
  });

  describe('Folder ID', () => {
    test('should associate song with folder when folderId provided', async () => {
      const songPath = '/test/folder-song.mp3';
      const folderId = 99;

      await parseSong(songPath, folderId);

      const { saveSong } = await import('../../../../src/main/db/queries/songs');
      expect(saveSong).toHaveBeenCalledWith(
        expect.objectContaining({
          folderId: 99
        }),
        expect.anything()
      );
    });

    test('should leave folderId undefined when not provided', async () => {
      const songPath = '/test/no-folder-song.mp3';

      await parseSong(songPath);

      const { saveSong } = await import('../../../../src/main/db/queries/songs');
      expect(saveSong).toHaveBeenCalledWith(
        expect.objectContaining({
          folderId: undefined
        }),
        expect.anything()
      );
    });
  });

  describe('File Stats', () => {
    test('should save file creation and modification dates', async () => {
      const songPath = '/test/dates-song.mp3';
      const mockStats = createMockFileStats({
        birthtime: new Date('2020-01-15T10:30:00Z'),
        mtime: new Date('2023-06-20T14:45:00Z')
      });

      const fs = await import('fs/promises');
      vi.mocked(fs.default.stat).mockResolvedValue(mockStats as any);

      await parseSong(songPath);

      const { saveSong } = await import('../../../../src/main/db/queries/songs');
      expect(saveSong).toHaveBeenCalledWith(
        expect.objectContaining({
          fileCreatedAt: new Date('2020-01-15T10:30:00Z'),
          fileModifiedAt: new Date('2023-06-20T14:45:00Z')
        }),
        expect.anything()
      );
    });

    test('should use current date when stats are null', async () => {
      const songPath = '/test/no-stats-song.mp3';
      const fs = await import('fs/promises');
      vi.mocked(fs.default.stat).mockResolvedValue(null as any);

      const beforeParse = new Date();
      await parseSong(songPath);
      const afterParse = new Date();

      const { saveSong } = await import('../../../../src/main/db/queries/songs');
      const savedCall = vi.mocked(saveSong).mock.calls[0][0];
      
      expect(savedCall.fileCreatedAt).toBeInstanceOf(Date);
      expect(savedCall.fileCreatedAt.getTime()).toBeGreaterThanOrEqual(beforeParse.getTime());
      expect(savedCall.fileCreatedAt.getTime()).toBeLessThanOrEqual(afterParse.getTime());
    });
  });

  describe('Logging', () => {
    test('should log start of parsing', async () => {
      const songPath = '/test/logs/start-song.mp3';

      await parseSong(songPath);

      const logger = (await import('../../../../src/main/logger')).default;
      expect(logger.debug).toHaveBeenCalledWith(
        "Starting the parsing process of song 'start-song.mp3'."
      );
    });

    test('should log successful completion with details', async () => {
      const songPath = '/test/logs/complete-song.mp3';
      const mockSongData = createMockSongData({ id: 456, title: 'Complete Song' });
      const { saveSong } = await import('../../../../src/main/db/queries/songs');
      vi.mocked(saveSong).mockResolvedValue(mockSongData as any);

      await parseSong(songPath);

      const logger = (await import('../../../../src/main/logger')).default;
      expect(logger.debug).toHaveBeenCalledWith(
        'Song parsing completed successfully.',
        expect.objectContaining({
          songId: 456,
          title: 'Complete Song',
          artistCount: 1,
          albumCount: 1,
          genreCount: 1
        })
      );
    });
  });
});
