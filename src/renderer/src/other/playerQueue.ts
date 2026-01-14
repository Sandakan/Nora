/* 
    Represents a queue of songs to be played in the music player.
*/
class PlayerQueue {
  songIds: number[];
  position: number;
  queueBeforeShuffle?: number[];
  metadata?: PlayerQueueMetadata;
  private listeners: Map<QueueEventType, Set<QueueEventCallback<unknown>>>;

  constructor(
    songIds: number[] = [],
    position = 0,
    queueBeforeShuffle?: number[],
    metadata?: PlayerQueueMetadata
  ) {
    this.songIds = songIds;
    this.position = position;
    this.metadata = metadata;
    this.queueBeforeShuffle = queueBeforeShuffle;
    this.listeners = new Map();
  }

  get currentSongId(): number | null {
    return this.songIds[this.position] || null;
  }

  set currentSongId(songId: number) {
    const index = this.songIds.indexOf(songId);
    if (index !== -1) {
      this.position = index;
    } else {
      this.songIds.push(songId);
      this.position = this.songIds.length - 1;
    }
  }

  get length(): number {
    return this.songIds.length;
  }

  get isEmpty(): boolean {
    return this.songIds.length === 0;
  }

  get hasNext(): boolean {
    return this.position < this.songIds.length - 1;
  }

  get hasPrevious(): boolean {
    return this.position > 0;
  }

  get nextSongId(): number | null {
    return this.songIds[this.position + 1] || null;
  }

  get previousSongId(): number | null {
    return this.songIds[this.position - 1] || null;
  }

  get isAtStart(): boolean {
    return this.position === 0;
  }

  get isAtEnd(): boolean {
    return this.position === this.songIds.length - 1;
  }

  /**
   * Emits an event to all registered listeners
   * @param eventType - The type of event to emit
   * @param data - The data to pass to the listeners
   */
  private emit<K extends QueueEventType>(eventType: K, data: QueueEventData[K]): void {
    const eventListeners = this.listeners.get(eventType);
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in queue event listener for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Registers a callback for a specific queue event
   * @param eventType - The type of event to listen for
   * @param callback - The callback function to execute when the event occurs
   * @returns A function to unregister the listener
   */
  on<K extends QueueEventType>(
    eventType: K,
    callback: QueueEventCallback<QueueEventData[K]>
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    const eventListeners = this.listeners.get(eventType)!;
    eventListeners.add(callback as QueueEventCallback<unknown>);

    // Return unsubscribe function
    return () => {
      eventListeners.delete(callback as QueueEventCallback<unknown>);
      if (eventListeners.size === 0) {
        this.listeners.delete(eventType);
      }
    };
  }

  /**
   * Removes a specific callback for an event type
   * @param eventType - The type of event
   * @param callback - The callback to remove
   */
  off<K extends QueueEventType>(
    eventType: K,
    callback: QueueEventCallback<QueueEventData[K]>
  ): void {
    const eventListeners = this.listeners.get(eventType);
    if (eventListeners) {
      eventListeners.delete(callback as QueueEventCallback<unknown>);
      if (eventListeners.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  /**
   * Removes all listeners for a specific event type or all events
   * @param eventType - Optional event type to clear. If not provided, clears all listeners
   */
  removeAllListeners(eventType?: QueueEventType): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Moves to the next song in the queue
   * @returns true if moved successfully, false if at the end
   */
  moveToNext(): boolean {
    if (this.hasNext) {
      const oldPosition = this.position;
      this.position += 1;
      console.log('[PlayerQueue.moveToNext]', {
        oldPosition,
        newPosition: this.position,
        currentSongId: this.currentSongId,
        queueLength: this.songIds.length
      });
      this.emit('positionChange', {
        oldPosition,
        newPosition: this.position,
        currentSongId: this.currentSongId
      });
      return true;
    }
    console.log('[PlayerQueue.moveToNext] Already at end, position:', this.position);
    return false;
  }

  /**
   * Moves to the previous song in the queue
   * @returns true if moved successfully, false if at the start
   */
  moveToPrevious(): boolean {
    if (this.hasPrevious) {
      const oldPosition = this.position;
      this.position -= 1;
      console.log('[PlayerQueue.moveToPrevious]', {
        oldPosition,
        newPosition: this.position,
        currentSongId: this.currentSongId,
        queueLength: this.songIds.length
      });
      this.emit('positionChange', {
        oldPosition,
        newPosition: this.position,
        currentSongId: this.currentSongId
      });
      return true;
    }
    console.log('[PlayerQueue.moveToPrevious] Already at start, position:', this.position);
    return false;
  }

  /**
   * Moves to the first song in the queue
   */
  moveToStart(): void {
    const oldPosition = this.position;
    this.position = 0;
    console.log('[PlayerQueue.moveToStart]', {
      oldPosition,
      newPosition: this.position,
      currentSongId: this.currentSongId,
      queueLength: this.songIds.length
    });
    if (oldPosition !== this.position) {
      this.emit('positionChange', {
        oldPosition,
        newPosition: this.position,
        currentSongId: this.currentSongId
      });
    }
  }

  /**
   * Moves to the last song in the queue
   */
  moveToEnd(): void {
    const oldPosition = this.position;
    if (this.songIds.length > 0) {
      this.position = this.songIds.length - 1;
    }
    if (oldPosition !== this.position) {
      this.emit('positionChange', {
        oldPosition,
        newPosition: this.position,
        currentSongId: this.currentSongId
      });
    }
  }

  /**
   * Moves to a specific position in the queue
   * @param position - The target position (0-indexed)
   * @returns true if position is valid and moved successfully
   */
  moveToPosition(position: number): boolean {
    if (position >= 0 && position < this.songIds.length) {
      const oldPosition = this.position;
      this.position = position;
      console.log('[PlayerQueue.moveToPosition]', {
        oldPosition,
        newPosition: this.position,
        currentSongId: this.currentSongId,
        queueLength: this.songIds.length
      });
      this.emit('positionChange', {
        oldPosition,
        newPosition: this.position,
        currentSongId: this.currentSongId
      });
      return true;
    }
    console.log('[PlayerQueue.moveToPosition] Invalid position:', {
      requestedPosition: position,
      currentPosition: this.position,
      queueLength: this.songIds.length
    });
    return false;
  }

  /**
   * Adds song IDs to the next position in the queue
   * @param songIds - Array of song IDs to add
   */
  addSongIdsToNext(songIds: number[]): void {
    console.log('[PlayerQueue.addSongIdsToNext]', {
      addingCount: songIds.length,
      currentPosition: this.position,
      insertPosition: this.position + 1,
      queueLengthBefore: this.songIds.length
    });
    this.songIds.splice(this.position + 1, 0, ...songIds);
    songIds.forEach((songId, index) => {
      this.emit('songAdded', { songId, position: this.position + 1 + index });
    });
    console.log('[PlayerQueue.addSongIdsToNext.done]', {
      addedCount: songIds.length,
      queueLengthAfter: this.songIds.length
    });
    this.emit('queueChange', { queue: [...this.songIds], length: this.songIds.length });
  }

  /**
   * Adds song IDs to the end of the queue
   * @param songIds - Array of song IDs to add
   */
  addSongIdsToEnd(songIds: number[]): void {
    console.log('[PlayerQueue.addSongIdsToEnd]', {
      addingCount: songIds.length,
      currentPosition: this.position,
      queueLengthBefore: this.songIds.length
    });
    const startPosition = this.songIds.length;
    this.songIds.push(...songIds);
    songIds.forEach((songId, index) => {
      this.emit('songAdded', { songId, position: startPosition + index });
    });
    console.log('[PlayerQueue.addSongIdsToEnd.done]', {
      addedCount: songIds.length,
      queueLengthAfter: this.songIds.length
    });
    this.emit('queueChange', { queue: [...this.songIds], length: this.songIds.length });
  }

  /**
   * Adds a single song ID to the next position
   * @param songId - Song ID to add
   */
  addSongIdToNext(songId: number): void {
    this.songIds.splice(this.position + 1, 0, songId);
    this.emit('songAdded', { songId, position: this.position + 1 });
    this.emit('queueChange', { queue: [...this.songIds], length: this.songIds.length });
  }

  /**
   * Adds a single song ID to the end of the queue
   * @param songId - Song ID to add
   */
  addSongIdToEnd(songId: number): void {
    const position = this.songIds.length;
    this.songIds.push(songId);
    this.emit('songAdded', { songId, position });
    this.emit('queueChange', { queue: [...this.songIds], length: this.songIds.length });
  }

  /**
   * Removes a song from the queue by ID
   * @param songId - Song ID to remove
   * @returns true if removed successfully, false if not found
   */
  removeSongId(songId: number): boolean {
    const index = this.songIds.indexOf(songId);
    console.log('[PlayerQueue.removeSongId]', {
      songId,
      foundAtIndex: index,
      currentPosition: this.position,
      queueLengthBefore: this.songIds.length
    });
    if (index !== -1) {
      this.songIds.splice(index, 1);
      this.emit('songRemoved', { songId, position: index });
      console.log('[PlayerQueue.removeSongId.removed]', {
        removedIndex: index,
        newPosition: this.position,
        queueLengthAfter: this.songIds.length
      });
      // Adjust position if necessary
      if (index < this.position) {
        const oldPosition = this.position;
        this.position -= 1;
        this.emit('positionChange', {
          oldPosition,
          newPosition: this.position,
          currentSongId: this.currentSongId
        });
      } else if (index === this.position && this.position >= this.songIds.length) {
        const oldPosition = this.position;
        this.position = Math.max(0, this.songIds.length - 1);
        this.emit('positionChange', {
          oldPosition,
          newPosition: this.position,
          currentSongId: this.currentSongId
        });
      }
      this.emit('queueChange', { queue: [...this.songIds], length: this.songIds.length });
      return true;
    }
    return false;
  }

  /**
   * Removes a song from the queue by position
   * @param position - Position to remove (0-indexed)
   * @returns the removed song ID, or null if position is invalid
   */
  removeSongAtPosition(position: number): number | null {
    if (position >= 0 && position < this.songIds.length) {
      const [removed] = this.songIds.splice(position, 1);
      this.emit('songRemoved', { songId: removed, position });
      // Adjust current position if necessary
      if (position < this.position) {
        const oldPosition = this.position;
        this.position -= 1;
        this.emit('positionChange', {
          oldPosition,
          newPosition: this.position,
          currentSongId: this.currentSongId
        });
      } else if (position === this.position && this.position >= this.songIds.length) {
        const oldPosition = this.position;
        this.position = Math.max(0, this.songIds.length - 1);
        this.emit('positionChange', {
          oldPosition,
          newPosition: this.position,
          currentSongId: this.currentSongId
        });
      }
      this.emit('queueChange', { queue: [...this.songIds], length: this.songIds.length });
      return removed;
    }
    return null;
  }

  /**
   * Clears all songs from the queue
   */
  clear(): void {
    console.log('[PlayerQueue.clear]', {
      queueLengthBefore: this.songIds.length,
      currentPosition: this.position
    });
    this.songIds = [];
    const oldPosition = this.position;
    this.position = 0;
    this.queueBeforeShuffle = undefined;
    this.emit('queueCleared', {});
    this.emit('queueChange', { queue: [], length: 0 });
    console.log('[PlayerQueue.clear.done]', {
      queueLengthAfter: this.songIds.length,
      position: this.position
    });
    if (oldPosition !== 0) {
      this.emit('positionChange', {
        oldPosition,
        newPosition: 0,
        currentSongId: null
      });
    }
  }

  /**
   * Replaces the entire queue with new song IDs
   * @param songIds - New array of song IDs
   * @param newPosition - Optional new position (defaults to 0)
   * @param clearShuffleHistory - Whether to clear shuffle history (defaults to true)
   * @param metadata - Optional queue metadata to set
   */
  replaceQueue(
    songIds: number[],
    newPosition = 0,
    clearShuffleHistory = true,
    metadata?: PlayerQueueMetadata
  ): void {
    console.log('[PlayerQueue.replaceQueue]', {
      newQueueLength: songIds.length,
      newPosition,
      oldQueueLength: this.songIds.length,
      oldPosition: this.position,
      hasMetadata: metadata !== undefined
    });
    const oldQueue = [...this.songIds];
    const oldPosition = this.position;
    const oldMetadata = this.metadata;
    this.songIds = [...songIds];
    this.position = newPosition >= 0 && newPosition < songIds.length ? newPosition : 0;
    if (clearShuffleHistory) {
      this.queueBeforeShuffle = undefined;
    }
    if (metadata !== undefined) {
      this.metadata = metadata;
    }
    console.log('[PlayerQueue.replaceQueue.done]', {
      finalQueueLength: this.songIds.length,
      finalPosition: this.position,
      currentSongId: this.currentSongId
    });
    this.emit('queueReplaced', {
      oldQueue,
      newQueue: [...this.songIds],
      newPosition: this.position
    });
    this.emit('queueChange', { queue: [...this.songIds], length: this.songIds.length });
    if (oldPosition !== this.position) {
      this.emit('positionChange', {
        oldPosition,
        newPosition: this.position,
        currentSongId: this.currentSongId
      });
    }
    if (metadata !== undefined && JSON.stringify(oldMetadata) !== JSON.stringify(metadata)) {
      this.emit('metadataChange', { queueId: metadata?.queueId, queueType: metadata?.queueType });
    }
  }

  /**
   * Shuffles the queue randomly, keeping the current song at the start
   * @returns object containing the shuffled queue and position mapping
   */
  shuffle(): { shuffledQueue: number[]; positions: number[] } {
    console.log('[PlayerQueue.shuffle]', {
      queueLength: this.songIds.length,
      currentPosition: this.position,
      currentSongId: this.currentSongId
    });
    const positions: number[] = [];
    const initialQueue = this.songIds.slice(0);
    const currentSongId = this.songIds.splice(this.position, 1)[0];

    // Fisher-Yates shuffle
    for (let i = this.songIds.length - 1; i > 0; i -= 1) {
      const randomIndex = Math.floor(Math.random() * (i + 1));
      [this.songIds[i], this.songIds[randomIndex]] = [this.songIds[randomIndex], this.songIds[i]];
    }

    // Place current song at the beginning
    if (currentSongId) {
      this.songIds.unshift(currentSongId);
    }

    // Create position mapping
    for (let i = 0; i < initialQueue.length; i += 1) {
      positions.push(this.songIds.indexOf(initialQueue[i]));
    }

    const oldPosition = this.position;
    this.position = 0;
    this.queueBeforeShuffle = positions;

    console.log('[PlayerQueue.shuffle.done]', {
      newQueueLength: this.songIds.length,
      newPosition: this.position
    });

    this.emit('shuffled', {
      originalQueue: initialQueue,
      shuffledQueue: [...this.songIds],
      positions
    });
    this.emit('queueChange', { queue: [...this.songIds], length: this.songIds.length });
    if (oldPosition !== 0) {
      this.emit('positionChange', {
        oldPosition,
        newPosition: 0,
        currentSongId: this.currentSongId
      });
    }

    return { shuffledQueue: this.songIds, positions };
  }

  /**
   * Restores the queue from a position mapping
   * @param positionMapping - Array of positions to restore the original order
   * @param currentSongId - Optional current song ID to maintain after restore
   */
  restoreFromPositions(positionMapping: number[], currentSongId?: number): void {
    if (positionMapping.length !== this.songIds.length) {
      return;
    }

    const restoredQueue: number[] = [];
    const currentQueue = [...this.songIds];

    for (let i = 0; i < positionMapping.length; i += 1) {
      restoredQueue.push(currentQueue[positionMapping[i]]);
    }

    const oldPosition = this.position;
    this.songIds = restoredQueue;

    if (currentSongId) {
      const newPosition = this.songIds.indexOf(currentSongId);
      this.position = newPosition !== -1 ? newPosition : 0;
    } else {
      this.position = 0;
    }

    // Clear the shuffle history since we've restored
    this.queueBeforeShuffle = undefined;

    this.emit('restored', { restoredQueue: [...this.songIds] });
    this.emit('queueChange', { queue: [...this.songIds], length: this.songIds.length });
    if (oldPosition !== this.position) {
      this.emit('positionChange', {
        oldPosition,
        newPosition: this.position,
        currentSongId: this.currentSongId
      });
    }
  }

  /**
   * Restores the queue from the stored shuffle positions (if available)
   * @param currentSongId - Optional current song ID to maintain after restore
   * @returns true if restored successfully, false if no shuffle history exists
   */
  restoreFromShuffle(currentSongId?: number): boolean {
    if (!this.queueBeforeShuffle || this.queueBeforeShuffle.length === 0) {
      return false;
    }

    this.restoreFromPositions(this.queueBeforeShuffle, currentSongId);
    return true;
  }

  /**
   * Checks if the queue has shuffle history available for restoration
   * @returns true if queue can be restored from shuffle
   */
  canRestoreFromShuffle(): boolean {
    return (
      Array.isArray(this.queueBeforeShuffle) &&
      this.queueBeforeShuffle.length > 0 &&
      this.queueBeforeShuffle.length === this.songIds.length
    );
  }

  /**
   * Clears the shuffle history without restoring the queue
   */
  clearShuffleHistory(): void {
    this.queueBeforeShuffle = undefined;
  }

  /**
   * Sets the queue metadata
   * @param queueId - Optional queue identifier
   * @param queueType - Optional queue type
   */
  setMetadata(queueId?: string, queueType?: QueueTypes): void {
    this.metadata = { queueId, queueType };
    this.emit('metadataChange', { queueId, queueType });
  }

  /**
   * Gets the queue metadata
   * @returns object containing queueId and queueType
   */
  getMetadata(): PlayerQueueMetadata {
    return this.metadata || {};
  }

  /**
   * Gets a song ID at a specific position
   * @param position - Position to get (0-indexed)
   * @returns the song ID at the position, or null if invalid
   */
  getSongIdAtPosition(position: number): number | null {
    return this.songIds[position] || null;
  }

  /**
   * Gets the position of a song ID in the queue
   * @param songId - Song ID to find
   * @returns the position (0-indexed), or -1 if not found
   */
  getPositionOfSongId(songId: number): number {
    return this.songIds.indexOf(songId);
  }

  /**
   * Checks if a song ID exists in the queue
   * @param songId - Song ID to check
   * @returns true if the song is in the queue
   */
  hasSongId(songId: number): boolean {
    return this.songIds.includes(songId);
  }

  /**
   * Gets a copy of all song IDs in the queue
   * @returns array of all song IDs
   */
  getAllSongIds(): number[] {
    return [...this.songIds];
  }

  /**
   * Gets remaining song IDs after the current position
   * @returns array of song IDs after current position
   */
  getRemainingSongIds(): number[] {
    return this.songIds.slice(this.position + 1);
  }

  /**
   * Gets previous song IDs before the current position
   * @returns array of song IDs before current position
   */
  getPreviousSongIds(): number[] {
    return this.songIds.slice(0, this.position);
  }

  /**
   * Creates a clone of the queue
   * @returns a new PlayerQueue instance with the same data
   */
  clone(): PlayerQueue {
    return new PlayerQueue(
      [...this.songIds],
      this.position,
      this.queueBeforeShuffle ? [...this.queueBeforeShuffle] : undefined,
      this.metadata ? { ...this.metadata } : undefined
    );
  }

  /**
   * Converts the queue to a JSON-serializable object
   * @returns object representation of the queue
   */
  toJSON(): PlayerQueueJson {
    return {
      songIds: [...this.songIds],
      position: this.position,
      queueBeforeShuffle: this.queueBeforeShuffle ? [...this.queueBeforeShuffle] : undefined,
      metadata: this.metadata ? { ...this.metadata } : undefined
    };
  }

  /**
   * Creates a PlayerQueue instance from a JSON object
   * @param json - JSON object representation of a queue
   * @returns a new PlayerQueue instance
   */
  static fromJSON(json: {
    songIds: number[];
    position: number;
    queueBeforeShuffle?: number[];
    metadata?: PlayerQueueMetadata;
  }): PlayerQueue {
    return new PlayerQueue(
      json.songIds || [],
      json.position || 0,
      json.queueBeforeShuffle,
      json.metadata
    );
  }
}

export default PlayerQueue;
