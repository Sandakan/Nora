import { describe, test, expect, beforeEach, vi } from 'vitest';

vi.mock('react', () => ({
  useCallback: (fn: unknown) => fn
}));

import { useQueueOperations } from '../../../../../src/renderer/src/hooks/useQueueOperations';
import {
  getQueue,
  resetQueueForTesting
} from '../../../../../src/renderer/src/other/queueSingleton';

describe('useQueueOperations', () => {
  beforeEach(() => {
    resetQueueForTesting();
  });

  describe('addToNext', () => {
    test('adds song immediately after current position', () => {
      const queue = getQueue();
      queue.replaceQueue([1, 2, 3], 0);

      const { addToNext } = useQueueOperations();
      addToNext([99]);

      expect(queue.songIds).toEqual([1, 99, 2, 3]);
      expect(queue.position).toBe(0);
      expect(queue.currentSongId).toBe(1);
    });

    test('adds multiple songs immediately after current position', () => {
      const queue = getQueue();
      queue.replaceQueue([1, 2, 3], 1); // current is 2

      const { addToNext } = useQueueOperations();
      addToNext([88, 99]);

      expect(queue.songIds).toEqual([1, 2, 88, 99, 3]);
      expect(queue.position).toBe(1);
      expect(queue.currentSongId).toBe(2);
    });

    test('removes duplicate occurrences elsewhere in queue but protects current playing song', () => {
      const queue = getQueue();
      // Queue has [10, 20, 30, 40], currently playing 20 (position 1)
      queue.replaceQueue([10, 20, 30, 40], 1);

      const { addToNext } = useQueueOperations();
      // Adding 40 and 20 (the current song) with removeDuplicates: true
      addToNext([40, 20], { removeDuplicates: true });

      // 40 should be removed from end and inserted after 20.
      // 20 (currently playing) should NOT be removed from its playback position!
      expect(queue.currentSongId).toBe(20);
      expect(queue.songIds).toEqual([10, 20, 40, 20, 30]);
    });
  });

  describe('addToEnd', () => {
    test('adds songs to the end of the queue', () => {
      const queue = getQueue();
      queue.replaceQueue([1, 2], 0);

      const { addToEnd } = useQueueOperations();
      addToEnd([3, 4]);

      expect(queue.songIds).toEqual([1, 2, 3, 4]);
    });

    test('removes duplicates when requested without removing current song', () => {
      const queue = getQueue();
      queue.replaceQueue([1, 2, 3], 1); // current is 2

      const { addToEnd } = useQueueOperations();
      addToEnd([1, 2], { removeDuplicates: true });

      // 1 should be removed from index 0 and added to end.
      // 2 (currently playing) should remain at current playback position.
      expect(queue.currentSongId).toBe(2);
      expect(queue.songIds).toEqual([2, 3, 1, 2]);
    });
  });
});
