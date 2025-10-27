import PlayerQueue from '../../../../../src/renderer/src/other/playerQueue';

type QueueTypes = 'album' | 'playlist' | 'artist' | 'songs' | 'genre' | 'folder';

describe('PlayerQueue', () => {
  describe('Constructor and Initial State', () => {
    test('should create an empty queue with default values', () => {
      const queue = new PlayerQueue();
      expect(queue.songIds).toEqual([]);
      expect(queue.position).toBe(0);
      expect(queue.metadata).toBeUndefined();
      expect(queue.queueBeforeShuffle).toBeUndefined();
    });

    test('should create a queue with provided song IDs', () => {
      const songIds = ['song1', 'song2', 'song3'];
      const queue = new PlayerQueue(songIds);
      expect(queue.songIds).toEqual(songIds);
      expect(queue.position).toBe(0);
    });

    test('should create a queue with custom position', () => {
      const songIds = ['song1', 'song2', 'song3'];
      const queue = new PlayerQueue(songIds, 1);
      expect(queue.position).toBe(1);
    });

    test('should create a queue with metadata', () => {
      const songIds = ['song1', 'song2'];
      const queue = new PlayerQueue(songIds, 0, undefined, {
        queueId: 'playlist-123',
        queueType: 'playlist'
      });
      expect(queue.metadata?.queueId).toBe('playlist-123');
      expect(queue.metadata?.queueType).toBe('playlist');
    });

    test('should create a queue with shuffle history', () => {
      const songIds = ['song1', 'song2', 'song3'];
      const shuffleHistory = [2, 0, 1];
      const queue = new PlayerQueue(songIds, 0, shuffleHistory, {
        queueId: 'album-456',
        queueType: 'album'
      });
      expect(queue.queueBeforeShuffle).toEqual(shuffleHistory);
    });
  });

  describe('Getters', () => {
    describe('currentSongId', () => {
      test('should return the song ID at current position', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3'], 1);
        expect(queue.currentSongId).toBe('song2');
      });

      test('should return null for empty queue', () => {
        const queue = new PlayerQueue();
        expect(queue.currentSongId).toBeNull();
      });

      test('should return null for invalid position', () => {
        const queue = new PlayerQueue(['song1'], 5);
        expect(queue.currentSongId).toBeNull();
      });
    });

    describe('length', () => {
      test('should return 0 for empty queue', () => {
        const queue = new PlayerQueue();
        expect(queue.length).toBe(0);
      });

      test('should return correct length', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3']);
        expect(queue.length).toBe(3);
      });
    });

    describe('isEmpty', () => {
      test('should return true for empty queue', () => {
        const queue = new PlayerQueue();
        expect(queue.isEmpty).toBe(true);
      });

      test('should return false for non-empty queue', () => {
        const queue = new PlayerQueue(['song1']);
        expect(queue.isEmpty).toBe(false);
      });
    });

    describe('hasNext', () => {
      test('should return true when not at the end', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 0);
        expect(queue.hasNext).toBe(true);
      });

      test('should return false when at the end', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 1);
        expect(queue.hasNext).toBe(false);
      });

      test('should return false for empty queue', () => {
        const queue = new PlayerQueue();
        expect(queue.hasNext).toBe(false);
      });
    });

    describe('hasPrevious', () => {
      test('should return true when not at the start', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 1);
        expect(queue.hasPrevious).toBe(true);
      });

      test('should return false when at the start', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 0);
        expect(queue.hasPrevious).toBe(false);
      });

      test('should return false for empty queue', () => {
        const queue = new PlayerQueue();
        expect(queue.hasPrevious).toBe(false);
      });
    });

    describe('nextSongId', () => {
      test('should return the next song ID', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3'], 1);
        expect(queue.nextSongId).toBe('song3');
      });

      test('should return null when at the end', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 1);
        expect(queue.nextSongId).toBeNull();
      });
    });

    describe('previousSongId', () => {
      test('should return the previous song ID', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3'], 2);
        expect(queue.previousSongId).toBe('song2');
      });

      test('should return null when at the start', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 0);
        expect(queue.previousSongId).toBeNull();
      });
    });

    describe('isAtStart', () => {
      test('should return true when at position 0', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 0);
        expect(queue.isAtStart).toBe(true);
      });

      test('should return false when not at position 0', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 1);
        expect(queue.isAtStart).toBe(false);
      });
    });

    describe('isAtEnd', () => {
      test('should return true when at last position', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 1);
        expect(queue.isAtEnd).toBe(true);
      });

      test('should return false when not at last position', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 0);
        expect(queue.isAtEnd).toBe(false);
      });
    });
  });

  describe('Setters', () => {
    describe('currentSongId', () => {
      test('should update position when song exists in queue', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3'], 0);
        queue.currentSongId = 'song3';
        expect(queue.position).toBe(2);
      });

      test('should add song to end and update position when song does not exist', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 0);
        queue.currentSongId = 'song3';
        expect(queue.songIds).toContain('song3');
        expect(queue.position).toBe(2);
      });

      test('should handle duplicate songs correctly', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song1'], 0);
        queue.currentSongId = 'song1';
        expect(queue.position).toBe(0); // First occurrence
      });
    });
  });

  describe('Navigation Methods', () => {
    describe('moveToNext', () => {
      test('should move to next position and return true', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3'], 0);
        const result = queue.moveToNext();
        expect(result).toBe(true);
        expect(queue.position).toBe(1);
      });

      test('should return false when already at the end', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 1);
        const result = queue.moveToNext();
        expect(result).toBe(false);
        expect(queue.position).toBe(1);
      });

      test('should return false for empty queue', () => {
        const queue = new PlayerQueue();
        const result = queue.moveToNext();
        expect(result).toBe(false);
      });
    });

    describe('moveToPrevious', () => {
      test('should move to previous position and return true', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3'], 2);
        const result = queue.moveToPrevious();
        expect(result).toBe(true);
        expect(queue.position).toBe(1);
      });

      test('should return false when already at the start', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 0);
        const result = queue.moveToPrevious();
        expect(result).toBe(false);
        expect(queue.position).toBe(0);
      });

      test('should return false for empty queue', () => {
        const queue = new PlayerQueue();
        const result = queue.moveToPrevious();
        expect(result).toBe(false);
      });
    });

    describe('moveToStart', () => {
      test('should move to position 0', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3'], 2);
        queue.moveToStart();
        expect(queue.position).toBe(0);
      });

      test('should stay at position 0 if already there', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 0);
        queue.moveToStart();
        expect(queue.position).toBe(0);
      });
    });

    describe('moveToEnd', () => {
      test('should move to last position', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3'], 0);
        queue.moveToEnd();
        expect(queue.position).toBe(2);
      });

      test('should handle empty queue', () => {
        const queue = new PlayerQueue();
        queue.moveToEnd();
        expect(queue.position).toBe(0);
      });
    });

    describe('moveToPosition', () => {
      test('should move to valid position and return true', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3'], 0);
        const result = queue.moveToPosition(2);
        expect(result).toBe(true);
        expect(queue.position).toBe(2);
      });

      test('should return false for negative position', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 0);
        const result = queue.moveToPosition(-1);
        expect(result).toBe(false);
        expect(queue.position).toBe(0);
      });

      test('should return false for position beyond length', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 0);
        const result = queue.moveToPosition(5);
        expect(result).toBe(false);
        expect(queue.position).toBe(0);
      });
    });
  });

  describe('Queue Manipulation Methods', () => {
    describe('addSongIdsToNext', () => {
      test('should add songs after current position', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3'], 1);
        queue.addSongIdsToNext(['songA', 'songB']);
        expect(queue.songIds).toEqual(['song1', 'song2', 'songA', 'songB', 'song3']);
      });

      test('should add to end when at last position', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 1);
        queue.addSongIdsToNext(['songA']);
        expect(queue.songIds).toEqual(['song1', 'song2', 'songA']);
      });

      test('should handle empty array', () => {
        const queue = new PlayerQueue(['song1'], 0);
        queue.addSongIdsToNext([]);
        expect(queue.songIds).toEqual(['song1']);
      });
    });

    describe('addSongIdsToEnd', () => {
      test('should add songs to the end', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 0);
        queue.addSongIdsToEnd(['song3', 'song4']);
        expect(queue.songIds).toEqual(['song1', 'song2', 'song3', 'song4']);
      });

      test('should work on empty queue', () => {
        const queue = new PlayerQueue();
        queue.addSongIdsToEnd(['song1', 'song2']);
        expect(queue.songIds).toEqual(['song1', 'song2']);
      });
    });

    describe('addSongIdToNext', () => {
      test('should add a single song after current position', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 0);
        queue.addSongIdToNext('songA');
        expect(queue.songIds).toEqual(['song1', 'songA', 'song2']);
      });
    });

    describe('addSongIdToEnd', () => {
      test('should add a single song to the end', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 0);
        queue.addSongIdToEnd('song3');
        expect(queue.songIds).toEqual(['song1', 'song2', 'song3']);
      });
    });

    describe('removeSongId', () => {
      test('should remove song and return true', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3'], 1);
        const result = queue.removeSongId('song3');
        expect(result).toBe(true);
        expect(queue.songIds).toEqual(['song1', 'song2']);
      });

      test('should return false when song not found', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 0);
        const result = queue.removeSongId('song99');
        expect(result).toBe(false);
        expect(queue.songIds).toEqual(['song1', 'song2']);
      });

      test('should adjust position when removing song before current', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3'], 2);
        queue.removeSongId('song1');
        expect(queue.position).toBe(1);
      });

      test('should adjust position when removing current song at end', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3'], 2);
        queue.removeSongId('song3');
        expect(queue.position).toBe(1);
      });

      test('should handle removing the only song', () => {
        const queue = new PlayerQueue(['song1'], 0);
        queue.removeSongId('song1');
        expect(queue.songIds).toEqual([]);
        expect(queue.position).toBe(0);
      });
    });

    describe('removeSongAtPosition', () => {
      test('should remove song at position and return it', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3'], 0);
        const removed = queue.removeSongAtPosition(1);
        expect(removed).toBe('song2');
        expect(queue.songIds).toEqual(['song1', 'song3']);
      });

      test('should return null for invalid position', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 0);
        const removed = queue.removeSongAtPosition(5);
        expect(removed).toBeNull();
      });

      test('should adjust position when removing before current', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3'], 2);
        queue.removeSongAtPosition(0);
        expect(queue.position).toBe(1);
      });

      test('should adjust position when removing current at end', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3'], 2);
        queue.removeSongAtPosition(2);
        expect(queue.position).toBe(1);
      });
    });

    describe('clear', () => {
      test('should clear all songs and reset position', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3'], 2);
        queue.clear();
        expect(queue.songIds).toEqual([]);
        expect(queue.position).toBe(0);
      });

      test('should clear shuffle history', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 0, [1, 0]);
        queue.clear();
        expect(queue.queueBeforeShuffle).toBeUndefined();
      });

      test('should handle clearing empty queue', () => {
        const queue = new PlayerQueue();
        queue.clear();
        expect(queue.songIds).toEqual([]);
        expect(queue.position).toBe(0);
      });
    });

    describe('replaceQueue', () => {
      test('should replace queue with new songs', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 1);
        queue.replaceQueue(['songA', 'songB', 'songC']);
        expect(queue.songIds).toEqual(['songA', 'songB', 'songC']);
        expect(queue.position).toBe(0);
      });

      test('should set custom position', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 0);
        queue.replaceQueue(['songA', 'songB', 'songC'], 2);
        expect(queue.position).toBe(2);
      });

      test('should clear shuffle history by default', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 0, [1, 0]);
        queue.replaceQueue(['songA', 'songB']);
        expect(queue.queueBeforeShuffle).toBeUndefined();
      });

      test('should preserve shuffle history when specified', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 0, [1, 0]);
        queue.replaceQueue(['songA', 'songB'], 0, false);
        expect(queue.queueBeforeShuffle).toEqual([1, 0]);
      });

      test('should handle invalid position gracefully', () => {
        const queue = new PlayerQueue();
        queue.replaceQueue(['song1', 'song2'], 10);
        expect(queue.position).toBe(0);
      });
    });
  });

  describe('Shuffle and Restore Methods', () => {
    describe('shuffle', () => {
      test('should shuffle queue and keep current song at start', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3', 'song4', 'song5'], 2);
        const result = queue.shuffle();

        expect(queue.songIds[0]).toBe('song3'); // Current song at start
        expect(queue.songIds).toHaveLength(5);
        expect(queue.position).toBe(0);
        expect(result.shuffledQueue).toEqual(queue.songIds);
        expect(result.positions).toHaveLength(5);
      });

      test('should store shuffle history', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3'], 0);
        queue.shuffle();
        expect(queue.queueBeforeShuffle).toBeDefined();
        expect(queue.queueBeforeShuffle).toHaveLength(3);
      });

      test('should shuffle all songs except current', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3', 'song4'], 1);
        const originalCurrent = queue.currentSongId;
        queue.shuffle();

        expect(queue.currentSongId).toBe(originalCurrent);
        expect(queue.songIds).toContain('song1');
        expect(queue.songIds).toContain('song3');
        expect(queue.songIds).toContain('song4');
      });

      test('should handle single song queue', () => {
        const queue = new PlayerQueue(['song1'], 0);
        queue.shuffle();
        expect(queue.songIds).toEqual(['song1']);
        expect(queue.position).toBe(0);
      });

      test('should handle two song queue', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 0);
        queue.shuffle();
        expect(queue.songIds[0]).toBe('song1');
        expect(queue.songIds).toContain('song2');
      });
    });

    describe('restoreFromPositions', () => {
      test('should restore queue from position mapping', () => {
        const queue = new PlayerQueue(['songC', 'songA', 'songB'], 0);
        queue.restoreFromPositions([1, 2, 0]); // Reverse mapping
        expect(queue.songIds).toEqual(['songA', 'songB', 'songC']);
      });

      test('should maintain current song position', () => {
        const queue = new PlayerQueue(['songC', 'songA', 'songB'], 0);
        queue.restoreFromPositions([1, 2, 0], 'songC');
        expect(queue.currentSongId).toBe('songC');
      });

      test('should clear shuffle history', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 0, [1, 0]);
        queue.restoreFromPositions([1, 0]);
        expect(queue.queueBeforeShuffle).toBeUndefined();
      });

      test('should not restore if mapping length mismatch', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3'], 0);
        const originalSongs = [...queue.songIds];
        queue.restoreFromPositions([0, 1]); // Wrong length
        expect(queue.songIds).toEqual(originalSongs);
      });

      test('should reset position to 0 if currentSongId not found', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 0);
        queue.restoreFromPositions([1, 0], 'nonexistent');
        expect(queue.position).toBe(0);
      });
    });

    describe('restoreFromShuffle', () => {
      test('should restore from stored shuffle history', () => {
        const originalSongs = ['song1', 'song2', 'song3', 'song4', 'song5'];
        const queue = new PlayerQueue([...originalSongs], 0);
        const shuffleResult = queue.shuffle();

        const result = queue.restoreFromShuffle();

        expect(result).toBe(true);
        expect(queue.songIds).toEqual(originalSongs);
        expect(queue.queueBeforeShuffle).toBeUndefined();
      });

      test('should return false if no shuffle history', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 0);
        const result = queue.restoreFromShuffle();
        expect(result).toBe(false);
      });

      test('should maintain current song when provided', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3'], 1);
        queue.shuffle();
        const currentSong = 'song2';
        queue.restoreFromShuffle(currentSong);
        expect(queue.currentSongId).toBe(currentSong);
      });
    });

    describe('canRestoreFromShuffle', () => {
      test('should return true when shuffle history exists and valid', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3'], 0);
        queue.shuffle();
        expect(queue.canRestoreFromShuffle()).toBe(true);
      });

      test('should return false when no shuffle history', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 0);
        expect(queue.canRestoreFromShuffle()).toBe(false);
      });

      test('should return false when shuffle history is empty', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 0, []);
        expect(queue.canRestoreFromShuffle()).toBe(false);
      });

      test('should return false when shuffle history length mismatch', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3'], 0, [0, 1]);
        expect(queue.canRestoreFromShuffle()).toBe(false);
      });
    });

    describe('clearShuffleHistory', () => {
      test('should clear shuffle history', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 0, [1, 0]);
        queue.clearShuffleHistory();
        expect(queue.queueBeforeShuffle).toBeUndefined();
      });

      test('should not affect queue or position', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 1, [1, 0]);
        queue.clearShuffleHistory();
        expect(queue.songIds).toEqual(['song1', 'song2']);
        expect(queue.position).toBe(1);
      });
    });
  });

  describe('Metadata Methods', () => {
    describe('setMetadata', () => {
      test('should set queue ID and type', () => {
        const queue = new PlayerQueue(['song1', 'song2']);
        queue.setMetadata('album-123', 'album');
        expect(queue.metadata?.queueId).toBe('album-123');
        expect(queue.metadata?.queueType).toBe('album');
      });

      test('should update existing metadata', () => {
        const queue = new PlayerQueue(['song1'], 0, undefined, {
          queueId: 'old-id',
          queueType: 'songs'
        });
        queue.setMetadata('new-id', 'playlist');
        expect(queue.metadata?.queueId).toBe('new-id');
        expect(queue.metadata?.queueType).toBe('playlist');
      });

      test('should handle undefined values', () => {
        const queue = new PlayerQueue(['song1'], 0, undefined, {
          queueId: 'id',
          queueType: 'album'
        });
        queue.setMetadata();
        expect(queue.metadata?.queueId).toBeUndefined();
        expect(queue.metadata?.queueType).toBeUndefined();
      });
    });

    describe('getMetadata', () => {
      test('should return queue metadata', () => {
        const queue = new PlayerQueue(['song1'], 0, undefined, {
          queueId: 'playlist-456',
          queueType: 'playlist'
        });
        const metadata = queue.getMetadata();
        expect(metadata).toEqual({
          queueId: 'playlist-456',
          queueType: 'playlist'
        });
      });

      test('should return undefined values when not set', () => {
        const queue = new PlayerQueue(['song1']);
        const metadata = queue.getMetadata();
        expect(metadata).toEqual({});
      });
    });
  });

  describe('Query Methods', () => {
    describe('getSongIdAtPosition', () => {
      test('should return song ID at valid position', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3']);
        expect(queue.getSongIdAtPosition(1)).toBe('song2');
      });

      test('should return null for invalid position', () => {
        const queue = new PlayerQueue(['song1', 'song2']);
        expect(queue.getSongIdAtPosition(5)).toBeNull();
      });

      test('should return null for negative position', () => {
        const queue = new PlayerQueue(['song1']);
        expect(queue.getSongIdAtPosition(-1)).toBeNull();
      });
    });

    describe('getPositionOfSongId', () => {
      test('should return position of existing song', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3']);
        expect(queue.getPositionOfSongId('song3')).toBe(2);
      });

      test('should return -1 for non-existing song', () => {
        const queue = new PlayerQueue(['song1', 'song2']);
        expect(queue.getPositionOfSongId('song99')).toBe(-1);
      });

      test('should return first occurrence for duplicate songs', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song1']);
        expect(queue.getPositionOfSongId('song1')).toBe(0);
      });
    });

    describe('hasSongId', () => {
      test('should return true for existing song', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3']);
        expect(queue.hasSongId('song2')).toBe(true);
      });

      test('should return false for non-existing song', () => {
        const queue = new PlayerQueue(['song1', 'song2']);
        expect(queue.hasSongId('song99')).toBe(false);
      });

      test('should return false for empty queue', () => {
        const queue = new PlayerQueue();
        expect(queue.hasSongId('song1')).toBe(false);
      });
    });

    describe('getAllSongIds', () => {
      test('should return copy of all song IDs', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3']);
        const allSongs = queue.getAllSongIds();
        expect(allSongs).toEqual(['song1', 'song2', 'song3']);
      });

      test('should return a copy, not reference', () => {
        const queue = new PlayerQueue(['song1', 'song2']);
        const allSongs = queue.getAllSongIds();
        allSongs.push('song3');
        expect(queue.songIds).toEqual(['song1', 'song2']);
      });

      test('should return empty array for empty queue', () => {
        const queue = new PlayerQueue();
        expect(queue.getAllSongIds()).toEqual([]);
      });
    });

    describe('getRemainingSongIds', () => {
      test('should return songs after current position', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3', 'song4'], 1);
        expect(queue.getRemainingSongIds()).toEqual(['song3', 'song4']);
      });

      test('should return empty array when at end', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 1);
        expect(queue.getRemainingSongIds()).toEqual([]);
      });

      test('should return all songs except first when at start', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3'], 0);
        expect(queue.getRemainingSongIds()).toEqual(['song2', 'song3']);
      });
    });

    describe('getPreviousSongIds', () => {
      test('should return songs before current position', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3', 'song4'], 2);
        expect(queue.getPreviousSongIds()).toEqual(['song1', 'song2']);
      });

      test('should return empty array when at start', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 0);
        expect(queue.getPreviousSongIds()).toEqual([]);
      });

      test('should return all songs except last when at end', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3'], 2);
        expect(queue.getPreviousSongIds()).toEqual(['song1', 'song2']);
      });
    });
  });

  describe('Utility Methods', () => {
    describe('clone', () => {
      test('should create deep copy of queue', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3'], 1, [2, 0, 1], {
          queueId: 'playlist-789',
          queueType: 'playlist'
        });
        const cloned = queue.clone();

        expect(cloned.songIds).toEqual(queue.songIds);
        expect(cloned.position).toBe(queue.position);
        expect(cloned.metadata?.queueId).toBe(queue.metadata?.queueId);
        expect(cloned.metadata?.queueType).toBe(queue.metadata?.queueType);
        expect(cloned.queueBeforeShuffle).toEqual(queue.queueBeforeShuffle);
      });

      test('should create independent copy', () => {
        const queue = new PlayerQueue(['song1', 'song2']);
        const cloned = queue.clone();

        cloned.addSongIdToEnd('song3');
        cloned.moveToNext();

        expect(queue.songIds).toEqual(['song1', 'song2']);
        expect(queue.position).toBe(0);
        expect(cloned.songIds).toEqual(['song1', 'song2', 'song3']);
      });

      test('should handle cloning queue with no shuffle history', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 0, undefined, {
          queueId: 'id',
          queueType: 'songs'
        });
        const cloned = queue.clone();
        expect(cloned.queueBeforeShuffle).toBeUndefined();
      });

      test('should deep copy shuffle history', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 0, [1, 0]);
        const cloned = queue.clone();

        cloned.queueBeforeShuffle![0] = 99;
        expect(queue.queueBeforeShuffle![0]).toBe(1);
      });
    });

    describe('toJSON', () => {
      test('should convert queue to JSON object', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3'], 1);
        const json = queue.toJSON();

        expect(json).toEqual({
          songIds: ['song1', 'song2', 'song3'],
          position: 1,
          queueBeforeShuffle: undefined,
          metadata: undefined
        });
      });

      test('should include metadata in JSON', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 0, undefined, {
          queueId: 'playlist-123',
          queueType: 'playlist'
        });
        const json = queue.toJSON();

        expect(json.metadata).toEqual({
          queueId: 'playlist-123',
          queueType: 'playlist'
        });
      });

      test('should include shuffle history in JSON', () => {
        const queue = new PlayerQueue(['song1', 'song2', 'song3'], 0, [2, 0, 1]);
        const json = queue.toJSON();

        expect(json.queueBeforeShuffle).toEqual([2, 0, 1]);
      });

      test('should create independent copy of data', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 1, [1, 0], {
          queueId: 'album-456',
          queueType: 'album'
        });
        const json = queue.toJSON();

        // Modify the JSON
        json.songIds.push('song3');
        json.position = 2;
        json.queueBeforeShuffle![0] = 99;
        json.metadata!.queueId = 'modified';

        // Original queue should be unchanged
        expect(queue.songIds).toEqual(['song1', 'song2']);
        expect(queue.position).toBe(1);
        expect(queue.queueBeforeShuffle![0]).toBe(1);
        expect(queue.metadata?.queueId).toBe('album-456');
      });

      test('should handle empty queue', () => {
        const queue = new PlayerQueue();
        const json = queue.toJSON();

        expect(json).toEqual({
          songIds: [],
          position: 0,
          queueBeforeShuffle: undefined,
          metadata: undefined
        });
      });

      test('should be JSON.stringify compatible', () => {
        const queue = new PlayerQueue(['song1', 'song2'], 1, undefined, {
          queueId: 'test-id',
          queueType: 'songs'
        });

        const jsonString = JSON.stringify(queue);
        const parsed = JSON.parse(jsonString);

        expect(parsed.songIds).toEqual(['song1', 'song2']);
        expect(parsed.position).toBe(1);
        expect(parsed.metadata.queueId).toBe('test-id');
      });
    });

    describe('fromJSON', () => {
      test('should create queue from JSON object', () => {
        const json = {
          songIds: ['song1', 'song2', 'song3'],
          position: 1,
          queueBeforeShuffle: undefined,
          metadata: undefined
        };
        const queue = PlayerQueue.fromJSON(json);

        expect(queue.songIds).toEqual(['song1', 'song2', 'song3']);
        expect(queue.position).toBe(1);
        expect(queue.queueBeforeShuffle).toBeUndefined();
        expect(queue.metadata).toBeUndefined();
      });

      test('should restore metadata from JSON', () => {
        const json = {
          songIds: ['song1', 'song2'],
          position: 0,
          queueBeforeShuffle: undefined,
          metadata: {
            queueId: 'playlist-123',
            queueType: 'playlist' as QueueTypes
          }
        };
        const queue = PlayerQueue.fromJSON(json);

        expect(queue.metadata?.queueId).toBe('playlist-123');
        expect(queue.metadata?.queueType).toBe('playlist');
      });

      test('should restore shuffle history from JSON', () => {
        const json = {
          songIds: ['song1', 'song2', 'song3'],
          position: 0,
          queueBeforeShuffle: [2, 0, 1],
          metadata: undefined
        };
        const queue = PlayerQueue.fromJSON(json);

        expect(queue.queueBeforeShuffle).toEqual([2, 0, 1]);
        expect(queue.canRestoreFromShuffle()).toBe(true);
      });

      test('should handle empty JSON object with defaults', () => {
        const json = {
          songIds: [],
          position: 0
        };
        const queue = PlayerQueue.fromJSON(json);

        expect(queue.songIds).toEqual([]);
        expect(queue.position).toBe(0);
        expect(queue.isEmpty).toBe(true);
      });

      test('should handle missing songIds with empty array', () => {
        const json = {
          songIds: undefined as any,
          position: 5
        };
        const queue = PlayerQueue.fromJSON(json);

        expect(queue.songIds).toEqual([]);
        expect(queue.position).toBe(5);
      });

      test('should handle missing position with 0', () => {
        const json = {
          songIds: ['song1', 'song2'],
          position: undefined as any
        };
        const queue = PlayerQueue.fromJSON(json);

        expect(queue.songIds).toEqual(['song1', 'song2']);
        expect(queue.position).toBe(0);
      });

      test('should restore complete queue state', () => {
        const json = {
          songIds: ['song1', 'song2', 'song3', 'song4'],
          position: 2,
          queueBeforeShuffle: [3, 1, 0, 2],
          metadata: {
            queueId: 'album-789',
            queueType: 'album' as QueueTypes
          }
        };
        const queue = PlayerQueue.fromJSON(json);

        expect(queue.currentSongId).toBe('song3');
        expect(queue.hasNext).toBe(true);
        expect(queue.hasPrevious).toBe(true);
        expect(queue.canRestoreFromShuffle()).toBe(true);
        expect(queue.getMetadata()).toEqual({
          queueId: 'album-789',
          queueType: 'album'
        });
      });
    });

    describe('toJSON and fromJSON round-trip', () => {
      test('should preserve queue state through serialization', () => {
        const originalQueue = new PlayerQueue(
          ['song1', 'song2', 'song3', 'song4'],
          2,
          [3, 1, 0, 2],
          { queueId: 'test-123', queueType: 'playlist' }
        );

        const json = originalQueue.toJSON();
        const restoredQueue = PlayerQueue.fromJSON(json);

        expect(restoredQueue.songIds).toEqual(originalQueue.songIds);
        expect(restoredQueue.position).toBe(originalQueue.position);
        expect(restoredQueue.queueBeforeShuffle).toEqual(originalQueue.queueBeforeShuffle);
        expect(restoredQueue.metadata).toEqual(originalQueue.metadata);
      });

      test('should work with JSON.stringify and JSON.parse', () => {
        const originalQueue = new PlayerQueue(['song1', 'song2'], 1, undefined, {
          queueId: 'genre-rock',
          queueType: 'genre'
        });

        const jsonString = JSON.stringify(originalQueue.toJSON());
        const parsed = JSON.parse(jsonString);
        const restoredQueue = PlayerQueue.fromJSON(parsed);

        expect(restoredQueue.songIds).toEqual(originalQueue.songIds);
        expect(restoredQueue.position).toBe(originalQueue.position);
        expect(restoredQueue.metadata?.queueId).toBe('genre-rock');
        expect(restoredQueue.metadata?.queueType).toBe('genre');
      });

      test('should preserve queue functionality after round-trip', () => {
        const originalQueue = new PlayerQueue(['song1', 'song2', 'song3'], 1);
        originalQueue.shuffle();

        const json = originalQueue.toJSON();
        const restoredQueue = PlayerQueue.fromJSON(json);

        expect(restoredQueue.canRestoreFromShuffle()).toBe(true);
        expect(restoredQueue.moveToNext()).toBe(true);
        expect(restoredQueue.hasPrevious).toBe(true);
      });

      test('should handle empty queue round-trip', () => {
        const originalQueue = new PlayerQueue();
        const json = originalQueue.toJSON();
        const restoredQueue = PlayerQueue.fromJSON(json);

        expect(restoredQueue.isEmpty).toBe(true);
        expect(restoredQueue.position).toBe(0);
        expect(restoredQueue.currentSongId).toBeNull();
      });

      test('should create independent instances after fromJSON', () => {
        const originalQueue = new PlayerQueue(['song1', 'song2'], 0);
        const json = originalQueue.toJSON();
        const restoredQueue = PlayerQueue.fromJSON(json);

        restoredQueue.addSongIdToEnd('song3');
        restoredQueue.moveToNext();

        expect(originalQueue.songIds).toEqual(['song1', 'song2']);
        expect(originalQueue.position).toBe(0);
        expect(restoredQueue.songIds).toEqual(['song1', 'song2', 'song3']);
        expect(restoredQueue.position).toBe(1);
      });
    });

    describe('Event Listeners', () => {
      describe('on and off', () => {
        test('should register and trigger positionChange event', () => {
          const queue = new PlayerQueue(['song1', 'song2', 'song3'], 0);
          const callback = jest.fn();

          queue.on('positionChange', callback);
          queue.moveToNext();

          expect(callback).toHaveBeenCalledTimes(1);
          expect(callback).toHaveBeenCalledWith({
            oldPosition: 0,
            newPosition: 1,
            currentSongId: 'song2'
          });
        });

        test('should register and trigger queueChange event', () => {
          const queue = new PlayerQueue(['song1', 'song2'], 0);
          const callback = jest.fn();

          queue.on('queueChange', callback);
          queue.addSongIdToEnd('song3');

          expect(callback).toHaveBeenCalledTimes(1);
          expect(callback).toHaveBeenCalledWith({
            queue: ['song1', 'song2', 'song3'],
            length: 3
          });
        });

        test('should register and trigger songAdded event', () => {
          const queue = new PlayerQueue(['song1', 'song2'], 0);
          const callback = jest.fn();

          queue.on('songAdded', callback);
          queue.addSongIdToNext('newSong');

          expect(callback).toHaveBeenCalledTimes(1);
          expect(callback).toHaveBeenCalledWith({
            songId: 'newSong',
            position: 1
          });
        });

        test('should register and trigger songRemoved event', () => {
          const queue = new PlayerQueue(['song1', 'song2', 'song3'], 1);
          const callback = jest.fn();

          queue.on('songRemoved', callback);
          queue.removeSongId('song2');

          expect(callback).toHaveBeenCalledTimes(1);
          expect(callback).toHaveBeenCalledWith({
            songId: 'song2',
            position: 1
          });
        });

        test('should register and trigger queueCleared event', () => {
          const queue = new PlayerQueue(['song1', 'song2'], 0);
          const callback = jest.fn();

          queue.on('queueCleared', callback);
          queue.clear();

          expect(callback).toHaveBeenCalledTimes(1);
          expect(callback).toHaveBeenCalledWith({});
        });

        test('should register and trigger queueReplaced event', () => {
          const queue = new PlayerQueue(['song1', 'song2'], 0);
          const callback = jest.fn();

          queue.on('queueReplaced', callback);
          queue.replaceQueue(['songA', 'songB', 'songC'], 1);

          expect(callback).toHaveBeenCalledTimes(1);
          expect(callback).toHaveBeenCalledWith({
            oldQueue: ['song1', 'song2'],
            newQueue: ['songA', 'songB', 'songC'],
            newPosition: 1
          });
        });

        test('should register and trigger shuffled event', () => {
          const queue = new PlayerQueue(['song1', 'song2', 'song3', 'song4'], 1);
          const callback = jest.fn();

          queue.on('shuffled', callback);
          queue.shuffle();

          expect(callback).toHaveBeenCalledTimes(1);
          expect(callback.mock.calls[0][0]).toHaveProperty('originalQueue');
          expect(callback.mock.calls[0][0]).toHaveProperty('shuffledQueue');
          expect(callback.mock.calls[0][0]).toHaveProperty('positions');
        });

        test('should register and trigger restored event', () => {
          const queue = new PlayerQueue(['song1', 'song2', 'song3'], 0);
          queue.shuffle();
          const callback = jest.fn();

          queue.on('restored', callback);
          queue.restoreFromShuffle();

          expect(callback).toHaveBeenCalledTimes(1);
          expect(callback.mock.calls[0][0]).toHaveProperty('restoredQueue');
        });

        test('should register and trigger metadataChange event', () => {
          const queue = new PlayerQueue(['song1', 'song2'], 0);
          const callback = jest.fn();

          queue.on('metadataChange', callback);
          queue.setMetadata('playlist-123', 'playlist');

          expect(callback).toHaveBeenCalledTimes(1);
          expect(callback).toHaveBeenCalledWith({
            queueId: 'playlist-123',
            queueType: 'playlist'
          });
        });

        test('should remove specific listener with off', () => {
          const queue = new PlayerQueue(['song1', 'song2'], 0);
          const callback = jest.fn();

          queue.on('positionChange', callback);
          queue.moveToNext();
          expect(callback).toHaveBeenCalledTimes(1);

          queue.off('positionChange', callback);
          queue.moveToNext();
          expect(callback).toHaveBeenCalledTimes(1); // Should not be called again
        });

        test('should return unsubscribe function from on', () => {
          const queue = new PlayerQueue(['song1', 'song2'], 0);
          const callback = jest.fn();

          const unsubscribe = queue.on('positionChange', callback);
          queue.moveToNext();
          expect(callback).toHaveBeenCalledTimes(1);

          unsubscribe();
          queue.moveToNext();
          expect(callback).toHaveBeenCalledTimes(1); // Should not be called again
        });

        test('should support multiple listeners for same event', () => {
          const queue = new PlayerQueue(['song1', 'song2'], 0);
          const callback1 = jest.fn();
          const callback2 = jest.fn();

          queue.on('positionChange', callback1);
          queue.on('positionChange', callback2);
          queue.moveToNext();

          expect(callback1).toHaveBeenCalledTimes(1);
          expect(callback2).toHaveBeenCalledTimes(1);
        });

        test('should handle errors in listeners gracefully', () => {
          const queue = new PlayerQueue(['song1', 'song2'], 0);
          const errorCallback = jest.fn(() => {
            throw new Error('Test error');
          });
          const normalCallback = jest.fn();
          const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

          queue.on('positionChange', errorCallback);
          queue.on('positionChange', normalCallback);
          queue.moveToNext();

          expect(errorCallback).toHaveBeenCalledTimes(1);
          expect(normalCallback).toHaveBeenCalledTimes(1);
          expect(consoleErrorSpy).toHaveBeenCalled();

          consoleErrorSpy.mockRestore();
        });
      });

      describe('removeAllListeners', () => {
        test('should remove all listeners for specific event type', () => {
          const queue = new PlayerQueue(['song1', 'song2'], 0);
          const positionCallback = jest.fn();
          const queueCallback = jest.fn();

          queue.on('positionChange', positionCallback);
          queue.on('queueChange', queueCallback);

          queue.removeAllListeners('positionChange');

          queue.moveToNext();
          queue.addSongIdToEnd('song3');

          expect(positionCallback).not.toHaveBeenCalled();
          expect(queueCallback).toHaveBeenCalledTimes(1);
        });

        test('should remove all listeners for all events when no type specified', () => {
          const queue = new PlayerQueue(['song1', 'song2'], 0);
          const positionCallback = jest.fn();
          const queueCallback = jest.fn();

          queue.on('positionChange', positionCallback);
          queue.on('queueChange', queueCallback);

          queue.removeAllListeners();

          queue.moveToNext();
          queue.addSongIdToEnd('song3');

          expect(positionCallback).not.toHaveBeenCalled();
          expect(queueCallback).not.toHaveBeenCalled();
        });
      });

      describe('Event emission scenarios', () => {
        test('should emit events in correct order for multiple operations', () => {
          const queue = new PlayerQueue(['song1', 'song2'], 0);
          const events: string[] = [];

          queue.on('songAdded', () => events.push('songAdded'));
          queue.on('queueChange', () => events.push('queueChange'));
          queue.on('positionChange', () => events.push('positionChange'));

          queue.addSongIdToNext('song3');
          queue.moveToNext();

          expect(events).toEqual(['songAdded', 'queueChange', 'positionChange']);
        });

        test('should not emit positionChange when position does not change', () => {
          const queue = new PlayerQueue(['song1', 'song2'], 0);
          const callback = jest.fn();

          queue.on('positionChange', callback);
          queue.moveToStart(); // Already at start

          expect(callback).not.toHaveBeenCalled();
        });

        test('should emit both songAdded and queueChange for batch add', () => {
          const queue = new PlayerQueue(['song1'], 0);
          const songAddedCallback = jest.fn();
          const queueChangeCallback = jest.fn();

          queue.on('songAdded', songAddedCallback);
          queue.on('queueChange', queueChangeCallback);

          queue.addSongIdsToEnd(['song2', 'song3', 'song4']);

          expect(songAddedCallback).toHaveBeenCalledTimes(3);
          expect(queueChangeCallback).toHaveBeenCalledTimes(1);
        });

        test('should emit positionChange when removing current song', () => {
          const queue = new PlayerQueue(['song1', 'song2', 'song3'], 2);
          const callback = jest.fn();

          queue.on('positionChange', callback);
          queue.removeSongId('song3');

          expect(callback).toHaveBeenCalledTimes(1);
          expect(callback).toHaveBeenCalledWith({
            oldPosition: 2,
            newPosition: 1,
            currentSongId: 'song2'
          });
        });

        test('should emit multiple events for clear operation', () => {
          const queue = new PlayerQueue(['song1', 'song2'], 1);
          const clearedCallback = jest.fn();
          const queueChangeCallback = jest.fn();
          const positionChangeCallback = jest.fn();

          queue.on('queueCleared', clearedCallback);
          queue.on('queueChange', queueChangeCallback);
          queue.on('positionChange', positionChangeCallback);

          queue.clear();

          expect(clearedCallback).toHaveBeenCalledTimes(1);
          expect(queueChangeCallback).toHaveBeenCalledTimes(1);
          expect(positionChangeCallback).toHaveBeenCalledTimes(1);
        });

        test('should emit events for shuffle and restore cycle', () => {
          const queue = new PlayerQueue(['song1', 'song2', 'song3'], 1);
          const shuffledCallback = jest.fn();
          const restoredCallback = jest.fn();

          queue.on('shuffled', shuffledCallback);
          queue.on('restored', restoredCallback);

          queue.shuffle();
          expect(shuffledCallback).toHaveBeenCalledTimes(1);

          queue.restoreFromShuffle();
          expect(restoredCallback).toHaveBeenCalledTimes(1);
        });
      });
    });
  });

  describe('Complex Scenarios', () => {
    test('should handle shuffle and restore cycle', () => {
      const originalSongs = ['song1', 'song2', 'song3', 'song4', 'song5'];
      const queue = new PlayerQueue([...originalSongs], 2);
      const originalCurrent = queue.currentSongId;

      queue.shuffle();
      expect(queue.currentSongId).toBe(originalCurrent);
      expect(queue.position).toBe(0);

      queue.restoreFromShuffle(originalCurrent || undefined);
      expect(queue.songIds).toEqual(originalSongs);
      expect(queue.currentSongId).toBe(originalCurrent);
    });

    test('should handle adding songs during shuffle', () => {
      const queue = new PlayerQueue(['song1', 'song2', 'song3'], 1);
      queue.shuffle();
      queue.addSongIdToNext('newSong');

      expect(queue.songIds).toContain('newSong');
      expect(queue.songIds[1]).toBe('newSong');
    });

    test('should handle removing songs and position adjustment', () => {
      const queue = new PlayerQueue(['song1', 'song2', 'song3', 'song4'], 2);

      queue.removeSongId('song1'); // Remove before current
      expect(queue.position).toBe(1);
      expect(queue.currentSongId).toBe('song3');

      queue.removeSongId('song3'); // Remove current
      expect(queue.position).toBe(1);
      expect(queue.currentSongId).toBe('song4');
    });

    test('should handle metadata changes during operations', () => {
      const queue = new PlayerQueue(['song1', 'song2'], 0, undefined, {
        queueId: 'album-1',
        queueType: 'album'
      });

      queue.shuffle();
      expect(queue.metadata?.queueId).toBe('album-1');
      expect(queue.metadata?.queueType).toBe('album');

      queue.setMetadata('playlist-1', 'playlist');
      expect(queue.metadata?.queueId).toBe('playlist-1');
      expect(queue.metadata?.queueType).toBe('playlist');
    });

    test('should maintain integrity through multiple operations', () => {
      const queue = new PlayerQueue(['song1', 'song2', 'song3'], 0);

      queue.moveToNext();
      queue.addSongIdsToNext(['songA', 'songB']);
      queue.removeSongId('song1');
      queue.shuffle();

      expect(queue.songIds).toContain('song2');
      expect(queue.songIds).toContain('song3');
      expect(queue.songIds).toContain('songA');
      expect(queue.songIds).toContain('songB');
      expect(queue.songIds).toHaveLength(4);
    });
  });

  describe('Edge Cases', () => {
    test('should handle queue with single repeated song', () => {
      const queue = new PlayerQueue(['song1', 'song1', 'song1'], 1);
      expect(queue.currentSongId).toBe('song1');
      queue.moveToNext();
      expect(queue.currentSongId).toBe('song1');
    });

    test('should handle very large queues', () => {
      const largeSongList = Array.from({ length: 10000 }, (_, i) => `song${i}`);
      const queue = new PlayerQueue(largeSongList, 5000);

      expect(queue.length).toBe(10000);
      expect(queue.currentSongId).toBe('song5000');
      expect(queue.moveToNext()).toBe(true);
      expect(queue.currentSongId).toBe('song5001');
    });

    test('should handle queue operations with special characters in IDs', () => {
      const queue = new PlayerQueue(['song-1', 'song_2', 'song.3', 'song@4'], 0);
      expect(queue.hasSongId('song_2')).toBe(true);
      queue.removeSongId('song.3');
      expect(queue.songIds).toEqual(['song-1', 'song_2', 'song@4']);
    });

    test('should handle rapid position changes', () => {
      const queue = new PlayerQueue(['song1', 'song2', 'song3', 'song4', 'song5'], 0);

      for (let i = 0; i < 100; i++) {
        queue.moveToNext();
        if (queue.isAtEnd) queue.moveToStart();
      }

      expect(queue.songIds).toHaveLength(5);
      expect(queue.position).toBeGreaterThanOrEqual(0);
      expect(queue.position).toBeLessThan(5);
    });

    test('should maintain correct position when adding songs before current position', () => {
      const queue = new PlayerQueue(['song1', 'song2', 'song3', 'song4'], 2);
      expect(queue.currentSongId).toBe('song3');
      expect(queue.position).toBe(2);

      // Adding songs after position 0 should not affect current position
      queue.songIds.splice(1, 0, 'newSong1', 'newSong2');
      // Position should now be 4 because we added 2 songs before it
      queue.position = queue.position + 2;
      expect(queue.position).toBe(4);
      expect(queue.currentSongId).toBe('song3');
    });

    test('should maintain correct position after multiple removals', () => {
      const queue = new PlayerQueue(['song1', 'song2', 'song3', 'song4', 'song5'], 4);
      expect(queue.currentSongId).toBe('song5');
      expect(queue.position).toBe(4);

      queue.removeSongId('song1'); // Remove before current
      expect(queue.position).toBe(3);
      expect(queue.currentSongId).toBe('song5');

      queue.removeSongId('song2'); // Remove before current
      expect(queue.position).toBe(2);
      expect(queue.currentSongId).toBe('song5');

      queue.removeSongId('song3'); // Remove before current
      expect(queue.position).toBe(1);
      expect(queue.currentSongId).toBe('song5');

      queue.removeSongId('song4'); // Remove before current
      expect(queue.position).toBe(0);
      expect(queue.currentSongId).toBe('song5');
    });

    test('should handle position correctly when removing all songs before current', () => {
      const queue = new PlayerQueue(['a', 'b', 'c', 'd', 'e', 'f'], 5);
      expect(queue.currentSongId).toBe('f');

      ['a', 'b', 'c', 'd', 'e'].forEach((song) => queue.removeSongId(song));

      expect(queue.position).toBe(0);
      expect(queue.currentSongId).toBe('f');
      expect(queue.songIds).toEqual(['f']);
    });

    test('should handle position when removing songs in the middle', () => {
      const queue = new PlayerQueue(['song1', 'song2', 'song3', 'song4', 'song5'], 3);
      expect(queue.currentSongId).toBe('song4');

      queue.removeSongId('song2'); // Remove before current
      expect(queue.position).toBe(2);
      expect(queue.currentSongId).toBe('song4');

      queue.removeSongId('song5'); // Remove after current
      expect(queue.position).toBe(2);
      expect(queue.currentSongId).toBe('song4');
    });

    test('should handle position at boundary when replacing queue', () => {
      const queue = new PlayerQueue(['song1', 'song2', 'song3'], 2);
      expect(queue.position).toBe(2);

      // Replace with smaller queue, position should adjust
      queue.replaceQueue(['newSong1'], 0);
      expect(queue.position).toBe(0);
      expect(queue.currentSongId).toBe('newSong1');

      // Replace with larger queue, position should be preserved
      queue.replaceQueue(['a', 'b', 'c', 'd'], 2);
      expect(queue.position).toBe(2);
      expect(queue.currentSongId).toBe('c');
    });

    test('should maintain position integrity during shuffle with position at end', () => {
      const queue = new PlayerQueue(['song1', 'song2', 'song3', 'song4', 'song5'], 4);
      expect(queue.currentSongId).toBe('song5');
      expect(queue.position).toBe(4);

      queue.shuffle();

      expect(queue.position).toBe(0);
      expect(queue.currentSongId).toBe('song5');
      expect(queue.songIds[0]).toBe('song5');
    });

    test('should maintain position integrity during shuffle with position at start', () => {
      const queue = new PlayerQueue(['song1', 'song2', 'song3', 'song4', 'song5'], 0);
      expect(queue.currentSongId).toBe('song1');
      expect(queue.position).toBe(0);

      queue.shuffle();

      expect(queue.position).toBe(0);
      expect(queue.currentSongId).toBe('song1');
      expect(queue.songIds[0]).toBe('song1');
    });

    test('should handle position correctly when adding multiple songs at once', () => {
      const queue = new PlayerQueue(['song1', 'song2', 'song3'], 1);
      expect(queue.currentSongId).toBe('song2');

      queue.addSongIdsToNext(['a', 'b', 'c']);
      // Position should remain 1, songs added after it
      expect(queue.position).toBe(1);
      expect(queue.currentSongId).toBe('song2');
      expect(queue.nextSongId).toBe('a');
    });

    test('should handle position when queue becomes empty after removals', () => {
      const queue = new PlayerQueue(['song1', 'song2', 'song3'], 1);

      queue.removeSongId('song1');
      expect(queue.position).toBe(0);
      expect(queue.currentSongId).toBe('song2');

      queue.removeSongId('song2');
      expect(queue.position).toBe(0);
      expect(queue.currentSongId).toBe('song3');

      queue.removeSongId('song3');
      expect(queue.position).toBe(0);
      expect(queue.isEmpty).toBe(true);
      expect(queue.currentSongId).toBeNull();
    });

    test('should handle position overflow gracefully', () => {
      const queue = new PlayerQueue(['song1', 'song2', 'song3'], 10); // Invalid position
      expect(queue.currentSongId).toBeNull();

      // moveToNext should not work from invalid position (already beyond bounds)
      expect(queue.moveToNext()).toBe(false);

      // moveToPrevious will work because position > 0, but currentSongId is still null
      const couldMoveBack = queue.moveToPrevious();
      expect(couldMoveBack).toBe(true);
      expect(queue.position).toBe(9);

      // Setting to valid position should work
      queue.position = 1;
      expect(queue.currentSongId).toBe('song2');
    });

    test('should handle negative position gracefully', () => {
      const queue = new PlayerQueue(['song1', 'song2', 'song3'], -1); // Invalid position
      expect(queue.currentSongId).toBeNull();

      // Setting to valid position should work
      queue.position = 0;
      expect(queue.currentSongId).toBe('song1');
    });

    test('should maintain position when cloning and then modifying clone', () => {
      const queue = new PlayerQueue(['song1', 'song2', 'song3', 'song4'], 2);
      const cloned = queue.clone();

      expect(cloned.position).toBe(2);
      expect(cloned.currentSongId).toBe('song3');

      cloned.moveToNext();
      expect(cloned.position).toBe(3);
      expect(queue.position).toBe(2); // Original unchanged
    });

    test('should handle position correctly through restore cycle', () => {
      const queue = new PlayerQueue(['song1', 'song2', 'song3', 'song4', 'song5'], 3);
      expect(queue.currentSongId).toBe('song4');
      expect(queue.position).toBe(3);

      queue.shuffle();
      expect(queue.position).toBe(0);
      expect(queue.currentSongId).toBe('song4');

      queue.restoreFromShuffle('song4');
      expect(queue.currentSongId).toBe('song4');
      expect(queue.position).toBe(3);
    });

    test('should handle position when using currentSongId setter multiple times', () => {
      const queue = new PlayerQueue(['song1', 'song2', 'song3', 'song4'], 0);

      queue.currentSongId = 'song3';
      expect(queue.position).toBe(2);

      queue.currentSongId = 'song1';
      expect(queue.position).toBe(0);

      queue.currentSongId = 'song4';
      expect(queue.position).toBe(3);

      // Set to non-existing song - should add and move position
      queue.currentSongId = 'newSong';
      expect(queue.position).toBe(4);
      expect(queue.songIds).toHaveLength(5);
    });
  });
});
