import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  parseSong,
  tryToParseSong,
} from "../../../../src/main/parseSong/parseSong";
import {
  createMockAlbumManagerResult,
  createMockArtistManagerResult,
  createMockArtworkData,
  createMockFileStats,
  createMockGenreManagerResult,
  createMockSongData,
  createMockSongMetadata,
} from "./testUtils";

// Mock all dependencies
vi.mock("../../../../src/main/logger", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    verbose: vi.fn(),
  },
}));

vi.mock("node-taglib-sharp", () => ({
  File: {
    createFromPath: vi.fn(),
  },
}));

vi.mock("fs/promises", () => ({
  default: {
    stat: vi.fn(),
  },
}));

vi.mock("../../../../src/main/main", () => ({
  dataUpdateEvent: vi.fn(),
  sendMessageToRenderer: vi.fn(),
}));

vi.mock("../../../../src/main/other/artworks", () => ({
  storeArtworks: vi.fn(),
}));

vi.mock("../../../../src/main/other/generatePalette", () => ({
  generatePalettes: vi.fn(),
}));

vi.mock("../../../../src/main/db/queries/songs", () => ({
  isSongWithPathAvailable: vi.fn(),
  saveSong: vi.fn(),
}));

vi.mock("../../../../src/main/db/queries/artworks", () => ({
  linkArtworksToSong: vi.fn(),
}));

vi.mock("../../../../src/main/db/db", () => ({
  db: {
    transaction: vi.fn((callback) => callback({})),
  },
}));

vi.mock("../../../../src/main/parseSong/manageAlbumsOfParsedSong", () => ({
  default: vi.fn(),
}));

vi.mock("../../../../src/main/parseSong/manageArtistsOfParsedSong", () => ({
  default: vi.fn(),
}));

vi.mock("../../../../src/main/parseSong/manageGenresOfParsedSong", () => ({
  default: vi.fn(),
}));

vi.mock("../../../../src/main/parseSong/manageAlbumArtistOfParsedSong", () => ({
  default: vi.fn(),
}));

describe("parseSong Concurrency and State Management", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup default successful mocks
    const fs = await import("fs/promises");
    const taglib = await import("node-taglib-sharp");
    const { isSongWithPathAvailable, saveSong } = await import(
      "../../../../src/main/db/queries/songs"
    );
    const { storeArtworks } = await import(
      "../../../../src/main/other/artworks"
    );
    const { linkArtworksToSong } = await import(
      "../../../../src/main/db/queries/artworks"
    );
    const manageAlbumsOfParsedSong = (
      await import("../../../../src/main/parseSong/manageAlbumsOfParsedSong")
    ).default;
    const manageArtistsOfParsedSong = (
      await import("../../../../src/main/parseSong/manageArtistsOfParsedSong")
    ).default;
    const manageGenresOfParsedSong = (
      await import("../../../../src/main/parseSong/manageGenresOfParsedSong")
    ).default;
    const manageAlbumArtistOfParsedSong = (
      await import(
        "../../../../src/main/parseSong/manageAlbumArtistOfParsedSong"
      )
    ).default;

    vi.mocked(fs.default.stat).mockResolvedValue(createMockFileStats() as any);
    vi.mocked(taglib.File.createFromPath).mockReturnValue(
      createMockSongMetadata() as any,
    );
    vi.mocked(isSongWithPathAvailable).mockResolvedValue(false);
    vi.mocked(saveSong).mockResolvedValue(createMockSongData() as any);
    vi.mocked(storeArtworks).mockResolvedValue(createMockArtworkData() as any);
    vi.mocked(linkArtworksToSong).mockResolvedValue([] as any);
    vi.mocked(manageAlbumsOfParsedSong).mockResolvedValue(
      createMockAlbumManagerResult() as any,
    );
    vi.mocked(manageArtistsOfParsedSong).mockResolvedValue(
      createMockArtistManagerResult() as any,
    );
    vi.mocked(manageGenresOfParsedSong).mockResolvedValue(
      createMockGenreManagerResult() as any,
    );
    vi.mocked(manageAlbumArtistOfParsedSong).mockResolvedValue({
      newAlbumArtists: [],
      relevantAlbumArtists: [],
    } as any);
  });

  describe("pathsQueue - tryToParseSong Concurrency Control", () => {
    test("should block concurrent tryToParseSong calls with same path", async () => {
      const songPath = "/concurrent/song1.mp3";
      const logger = (await import("../../../../src/main/logger")).default;

      // Start two parsing operations simultaneously
      const promise1 = tryToParseSong(songPath);
      const promise2 = tryToParseSong(songPath);

      expect(promise2).toBeUndefined();
      expect(logger.info).toHaveBeenCalledWith(
        "Song parsing ignored because it is not eligible.",
        expect.objectContaining({
          songPath,
          reason: { isSongInPathsQueue: true },
        }),
      );

      await promise1;
    });

    test("should allow parsing same path after first completes", async () => {
      const songPath = "/concurrent/song2.mp3";
      const { saveSong } = await import(
        "../../../../src/main/db/queries/songs"
      );

      // First parse
      await tryToParseSong(songPath);

      // Clear mock to track second call
      vi.mocked(saveSong).mockClear();

      // Second parse (should be allowed now)
      await tryToParseSong(songPath);

      // Note: saveSong won't be called second time because song exists
      // but the attempt should not be blocked by pathsQueue
      const { isSongWithPathAvailable } = await import(
        "../../../../src/main/db/queries/songs"
      );
      expect(isSongWithPathAvailable).toHaveBeenCalled();
    });

    test("should handle multiple different paths concurrently", async () => {
      const paths = [
        "/concurrent/song-a.mp3",
        "/concurrent/song-b.mp3",
        "/concurrent/song-c.mp3",
        "/concurrent/song-d.mp3",
      ];

      const promises = paths.map((path) => tryToParseSong(path));

      // All should be defined (not blocked)
      expect(promises.every((p) => p !== undefined)).toBe(true);

      await Promise.all(promises);

      const { saveSong } = await import(
        "../../../../src/main/db/queries/songs"
      );
      expect(saveSong).toHaveBeenCalledTimes(4);
    });

    test("should clean up pathsQueue on successful parse", async () => {
      const songPath = "/concurrent/cleanup-success.mp3";

      await tryToParseSong(songPath);

      // Try parsing same path again - should not be blocked
      const secondAttempt = tryToParseSong(songPath);
      expect(secondAttempt).toBeDefined();

      await secondAttempt;
    });

    test("should clean up pathsQueue on failed parse", async () => {
      vi.useFakeTimers();
      const songPath = "/concurrent/cleanup-failure.mp3";
      const { isSongWithPathAvailable } = await import(
        "../../../../src/main/db/queries/songs"
      );

      // Make parsing fail permanently
      vi.mocked(isSongWithPathAvailable).mockRejectedValue(new Error("Fatal"));

      const promise = tryToParseSong(songPath);

      // Catch rejection to prevent unhandled promise
      if (promise) promise.catch(() => {});

      // Fast-forward through all retries
      await vi.runOnlyPendingTimersAsync();
      for (let i = 0; i < 5; i++) {
        await vi.advanceTimersByTimeAsync(5000);
      }

      // Reset mock for second attempt
      vi.mocked(isSongWithPathAvailable).mockResolvedValue(false);

      // Try parsing same path again - should not be blocked
      const secondAttempt = tryToParseSong(songPath);
      expect(secondAttempt).toBeDefined();

      await secondAttempt;

      vi.useRealTimers();
    });
  });

  describe("parseQueue - parseSong Concurrency Control", () => {
    test("should block concurrent parseSong calls with same path", async () => {
      const songPath = "/parsequeue/song1.mp3";
      const logger = (await import("../../../../src/main/logger")).default;
      const { saveSong } = await import(
        "../../../../src/main/db/queries/songs"
      );

      // Mock saveSong to return pending promise for first call only
      let resolveFirst: any;
      const firstPromise = new Promise((resolve) => {
        resolveFirst = () => resolve(createMockSongData() as any);
      });
      vi.mocked(saveSong).mockReturnValueOnce(firstPromise as any);

      // Start first call
      const promise1 = parseSong(songPath);
      // Use setImmediate to ensure promise1 executes its synchronous code first
      await new Promise((resolve) => setImmediate(resolve));

      // Now second call should be blocked
      const promise2 = parseSong(songPath);

      // Both should be promises (async functions always return promises)
      expect(promise2).toBeInstanceOf(Promise);

      // Second call should resolve to undefined (blocked)
      const promise2Result = await promise2;
      expect(promise2Result).toBeUndefined();

      expect(logger.debug).toHaveBeenCalledWith(
        "Song not eligable for parsing.",
        expect.objectContaining({
          absoluteFilePath: songPath,
          reason: expect.objectContaining({
            isSongInParseQueue: true,
          }),
        }),
      );

      // Release first and wait for it
      resolveFirst();
      await promise1;
    });

    test("should prevent duplicate database writes", async () => {
      const songPath = "/parsequeue/song2.mp3";
      const { saveSong } = await import(
        "../../../../src/main/db/queries/songs"
      );

      // Slow down first parse
      let resolveFirst: any;
      const firstPromise = new Promise((resolve) => {
        resolveFirst = () => resolve(createMockSongData() as any);
      });
      vi.mocked(saveSong).mockReturnValueOnce(firstPromise as any);

      // Start first concurrent parsing
      const promise1 = parseSong(songPath);
      // Let first call add to queue before second call checks
      await new Promise((resolve) => setImmediate(resolve));

      // Second call should be blocked
      const promise2 = parseSong(songPath);

      // Release first
      resolveFirst();
      await Promise.all([promise1, promise2]);

      // saveSong should only be called once (from first parse)
      expect(saveSong).toHaveBeenCalledTimes(1);
    });

    test("should allow parsing after parseQueue cleanup", async () => {
      const songPath = "/parsequeue/song3.mp3";
      const { saveSong, isSongWithPathAvailable } = await import(
        "../../../../src/main/db/queries/songs"
      );

      // First parse
      await parseSong(songPath);
      expect(saveSong).toHaveBeenCalledTimes(1);

      // Mark song as existing for second parse attempt
      vi.mocked(isSongWithPathAvailable).mockResolvedValue(true);

      // Second parse should be allowed (parseQueue cleaned up)
      await parseSong(songPath);

      // Won't parse again because song now exists
      expect(saveSong).toHaveBeenCalledTimes(1); // Still 1
    });

    test("should clean up parseQueue in finally block on error", async () => {
      const songPath = "/parsequeue/error-cleanup.mp3";
      const { saveSong } = await import(
        "../../../../src/main/db/queries/songs"
      );

      // First attempt fails
      vi.mocked(saveSong).mockRejectedValueOnce(new Error("Database error"));

      await expect(parseSong(songPath)).rejects.toThrow();

      // Reset mock for second attempt
      vi.mocked(saveSong).mockResolvedValue(createMockSongData() as any);

      // Second attempt should be allowed (parseQueue cleaned)
      await parseSong(songPath);

      expect(saveSong).toHaveBeenCalledTimes(2);
    });

    test("should handle race condition at eligibility check", async () => {
      const songPath = "/parsequeue/race-condition.mp3";
      const { isSongWithPathAvailable, saveSong } = await import(
        "../../../../src/main/db/queries/songs"
      );

      // Both calls pass eligibility check initially
      let callCount = 0;
      vi.mocked(isSongWithPathAvailable).mockImplementation(() => {
        callCount++;
        return Promise.resolve(false);
      });

      // Control saveSong timing
      let resolveFirst: any;
      const firstPromise = new Promise((resolve) => {
        resolveFirst = () =>
          resolve(createMockSongData({ id: callCount }) as any);
      });
      vi.mocked(saveSong).mockReturnValueOnce(firstPromise as any);

      // Start concurrent calls
      const promise1 = parseSong(songPath);
      // Let first call add to queue before second call checks
      await new Promise((resolve) => setImmediate(resolve));
      const promise2 = parseSong(songPath);

      // Release first
      resolveFirst();
      await Promise.all([promise1, promise2]);

      // Only one should actually parse (second blocked by parseQueue)
      expect(saveSong).toHaveBeenCalledTimes(1);
    });
  });

  describe("reparseToSync Flag Behavior", () => {
    test("should bypass existing song check when reparseToSync is true", async () => {
      const songPath = "/reparse/song1.mp3";
      const { isSongWithPathAvailable, saveSong } = await import(
        "../../../../src/main/db/queries/songs"
      );

      // Song already exists
      vi.mocked(isSongWithPathAvailable).mockResolvedValue(true);

      // Parse with reparseToSync = false (default)
      await parseSong(songPath, undefined, false);
      expect(saveSong).not.toHaveBeenCalled();

      // Parse with reparseToSync = true
      await parseSong(songPath, undefined, true);
      expect(saveSong).toHaveBeenCalled();
    });

    test("should reparse existing song metadata", async () => {
      const songPath = "/reparse/song2.mp3";
      const { isSongWithPathAvailable, saveSong } = await import(
        "../../../../src/main/db/queries/songs"
      );

      vi.mocked(isSongWithPathAvailable).mockResolvedValue(true);

      // Updated metadata
      const taglib = await import("node-taglib-sharp");
      vi.mocked(taglib.File.createFromPath).mockReturnValue(
        createMockSongMetadata({
          title: "Updated Title",
          year: 2024,
        }) as any,
      );

      await parseSong(songPath, undefined, true);

      expect(saveSong).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Updated Title",
          year: 2024,
        }),
        expect.anything(),
      );
    });

    test("should respect parseQueue even with reparseToSync", async () => {
      const songPath = "/reparse/song3.mp3";
      const { isSongWithPathAvailable, saveSong } = await import(
        "../../../../src/main/db/queries/songs"
      );

      vi.mocked(isSongWithPathAvailable).mockResolvedValue(true);

      // Control saveSong timing
      let resolveFirst: any;
      const firstPromise = new Promise((resolve) => {
        resolveFirst = () => resolve(createMockSongData() as any);
      });
      vi.mocked(saveSong).mockReturnValueOnce(firstPromise as any);

      // Start two reparse operations
      const promise1 = parseSong(songPath, undefined, true);
      // Let first call add to queue before second call checks
      await new Promise((resolve) => setImmediate(resolve));
      const promise2 = parseSong(songPath, undefined, true);

      // Release first
      resolveFirst();
      await Promise.all([promise1, promise2]);

      // Should still only parse once (blocked by parseQueue)
      expect(saveSong).toHaveBeenCalledTimes(1);
    });
  });

  describe("Mixed Concurrency Scenarios", () => {
    test("should handle burst of parsing requests", async () => {
      const paths = Array.from({ length: 20 }, (_, i) => `/burst/song${i}.mp3`);
      const { saveSong } = await import(
        "../../../../src/main/db/queries/songs"
      );

      const promises = paths.map((path) => tryToParseSong(path));

      await Promise.all(promises);

      // All songs should be parsed
      expect(saveSong).toHaveBeenCalledTimes(20);
    });

    test("should handle duplicate paths in burst", async () => {
      const paths = [
        "/burst/duplicate1.mp3",
        "/burst/duplicate1.mp3", // Duplicate
        "/burst/unique1.mp3",
        "/burst/duplicate1.mp3", // Duplicate
        "/burst/unique2.mp3",
      ];
      const { saveSong } = await import(
        "../../../../src/main/db/queries/songs"
      );
      const logger = (await import("../../../../src/main/logger")).default;

      const promises = paths.map((path) => tryToParseSong(path));

      await Promise.allSettled(promises);

      // Only unique paths should be parsed
      expect(saveSong).toHaveBeenCalledTimes(3);

      // Duplicates should be logged as ineligible
      const ineligibleCalls = vi
        .mocked(logger.info)
        .mock.calls.filter((call) => call[0].includes("not eligible"));
      expect(ineligibleCalls.length).toBeGreaterThan(0);
    });

    test("should maintain data consistency across concurrent operations", async () => {
      const paths = [
        "/consistency/song1.mp3",
        "/consistency/song2.mp3",
        "/consistency/song3.mp3",
      ];
      const { dataUpdateEvent } = await import("../../../../src/main/main");

      const promises = paths.map((path) => tryToParseSong(path));

      await Promise.all(promises);

      // Each song should trigger its own update event
      expect(dataUpdateEvent).toHaveBeenCalledWith(
        "songs/newSong",
        expect.anything(),
      );
    });
  });

  describe("Module-Level State Isolation", () => {
    test("should not leak state between test runs", async () => {
      const songPath = "/isolation/test1.mp3";

      // First test run
      await parseSong(songPath);

      // Clear mocks
      vi.clearAllMocks();

      // Second test run with same path
      await parseSong(songPath);

      // Should attempt to parse (not blocked by previous test's parseQueue)
      const { isSongWithPathAvailable } = await import(
        "../../../../src/main/db/queries/songs"
      );
      expect(isSongWithPathAvailable).toHaveBeenCalled();
    });
  });

  describe("Concurrent Artwork Processing", () => {
    test("should handle concurrent artwork storage for different songs", async () => {
      const paths = [
        "/artwork/song1.mp3",
        "/artwork/song2.mp3",
        "/artwork/song3.mp3",
      ];
      const { storeArtworks } = await import(
        "../../../../src/main/other/artworks"
      );

      const promises = paths.map((path) => parseSong(path));

      await Promise.all(promises);

      // Each song should store artworks
      expect(storeArtworks).toHaveBeenCalledTimes(3);
    });

    test("should not mix up artwork data between concurrent parses", async () => {
      const songPath1 = "/artwork/unique1.mp3";
      const songPath2 = "/artwork/unique2.mp3";
      const { storeArtworks } = await import(
        "../../../../src/main/other/artworks"
      );

      // Create distinct artwork data for each song
      const artwork1 = createMockArtworkData();
      artwork1[0].id = 100;
      const artwork2 = createMockArtworkData();
      artwork2[0].id = 200;

      vi.mocked(storeArtworks)
        .mockResolvedValueOnce(artwork1 as any)
        .mockResolvedValueOnce(artwork2 as any);

      const [result1, result2] = await Promise.all([
        parseSong(songPath1),
        parseSong(songPath2),
      ]);

      // Each parse should get its own artwork data
      const { linkArtworksToSong } = await import(
        "../../../../src/main/db/queries/artworks"
      );
      const calls = vi.mocked(linkArtworksToSong).mock.calls;

      expect(calls[0][0][0].artworkId).toBe(100);
      expect(calls[1][0][0].artworkId).toBe(200);
    });
  });
});
