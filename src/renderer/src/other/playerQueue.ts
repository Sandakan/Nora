type QueueTypes = 'album' | 'playlist' | 'artist' | 'songs' | 'genre' | 'folder';

/* 
    Represents a queue of songs to be played in the music player.
*/
class PlayerQueue {
  songIds: string[];
  position: number;
  queueId?: string;
  queueType?: QueueTypes;
  queueBeforeShuffle?: number[];

  constructor(
    songIds: string[] = [],
    position = 0,
    queueId?: string,
    queueType?: QueueTypes,
    queueBeforeShuffle?: number[]
  ) {
    this.songIds = songIds;
    this.position = position;
    this.queueId = queueId;
    this.queueType = queueType;
    this.queueBeforeShuffle = queueBeforeShuffle;
  }

  get currentSongId(): string | null {
    return this.songIds[this.position] || null;
  }

  set currentSongId(songId: string) {
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

  get nextSongId(): string | null {
    return this.songIds[this.position + 1] || null;
  }

  get previousSongId(): string | null {
    return this.songIds[this.position - 1] || null;
  }

  get isAtStart(): boolean {
    return this.position === 0;
  }

  get isAtEnd(): boolean {
    return this.position === this.songIds.length - 1;
  }

  /**
   * Moves to the next song in the queue
   * @returns true if moved successfully, false if at the end
   */
  moveToNext(): boolean {
    if (this.hasNext) {
      this.position += 1;
      return true;
    }
    return false;
  }

  /**
   * Moves to the previous song in the queue
   * @returns true if moved successfully, false if at the start
   */
  moveToPrevious(): boolean {
    if (this.hasPrevious) {
      this.position -= 1;
      return true;
    }
    return false;
  }

  /**
   * Moves to the first song in the queue
   */
  moveToStart(): void {
    this.position = 0;
  }

  /**
   * Moves to the last song in the queue
   */
  moveToEnd(): void {
    if (this.songIds.length > 0) {
      this.position = this.songIds.length - 1;
    }
  }

  /**
   * Moves to a specific position in the queue
   * @param position - The target position (0-indexed)
   * @returns true if position is valid and moved successfully
   */
  moveToPosition(position: number): boolean {
    if (position >= 0 && position < this.songIds.length) {
      this.position = position;
      return true;
    }
    return false;
  }

  /**
   * Adds song IDs to the next position in the queue
   * @param songIds - Array of song IDs to add
   */
  addSongIdsToNext(songIds: string[]): void {
    this.songIds.splice(this.position + 1, 0, ...songIds);
  }

  /**
   * Adds song IDs to the end of the queue
   * @param songIds - Array of song IDs to add
   */
  addSongIdsToEnd(songIds: string[]): void {
    this.songIds.push(...songIds);
  }

  /**
   * Adds a single song ID to the next position
   * @param songId - Song ID to add
   */
  addSongIdToNext(songId: string): void {
    this.songIds.splice(this.position + 1, 0, songId);
  }

  /**
   * Adds a single song ID to the end of the queue
   * @param songId - Song ID to add
   */
  addSongIdToEnd(songId: string): void {
    this.songIds.push(songId);
  }

  /**
   * Removes a song from the queue by ID
   * @param songId - Song ID to remove
   * @returns true if removed successfully, false if not found
   */
  removeSongId(songId: string): boolean {
    const index = this.songIds.indexOf(songId);
    if (index !== -1) {
      this.songIds.splice(index, 1);
      // Adjust position if necessary
      if (index < this.position) {
        this.position -= 1;
      } else if (index === this.position && this.position >= this.songIds.length) {
        this.position = Math.max(0, this.songIds.length - 1);
      }
      return true;
    }
    return false;
  }

  /**
   * Removes a song from the queue by position
   * @param position - Position to remove (0-indexed)
   * @returns the removed song ID, or null if position is invalid
   */
  removeSongAtPosition(position: number): string | null {
    if (position >= 0 && position < this.songIds.length) {
      const [removed] = this.songIds.splice(position, 1);
      // Adjust current position if necessary
      if (position < this.position) {
        this.position -= 1;
      } else if (position === this.position && this.position >= this.songIds.length) {
        this.position = Math.max(0, this.songIds.length - 1);
      }
      return removed;
    }
    return null;
  }

  /**
   * Clears all songs from the queue
   */
  clear(): void {
    this.songIds = [];
    this.position = 0;
    this.queueBeforeShuffle = undefined;
  }

  /**
   * Replaces the entire queue with new song IDs
   * @param songIds - New array of song IDs
   * @param newPosition - Optional new position (defaults to 0)
   * @param clearShuffleHistory - Whether to clear shuffle history (defaults to true)
   */
  replaceQueue(songIds: string[], newPosition = 0, clearShuffleHistory = true): void {
    this.songIds = [...songIds];
    this.position = newPosition >= 0 && newPosition < songIds.length ? newPosition : 0;
    if (clearShuffleHistory) {
      this.queueBeforeShuffle = undefined;
    }
  }

  /**
   * Shuffles the queue randomly, keeping the current song at the start
   * @returns object containing the shuffled queue and position mapping
   */
  shuffle(): { shuffledQueue: string[]; positions: number[] } {
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

    this.position = 0;
    this.queueBeforeShuffle = positions;

    return { shuffledQueue: this.songIds, positions };
  }

  /**
   * Restores the queue from a position mapping
   * @param positionMapping - Array of positions to restore the original order
   * @param currentSongId - Optional current song ID to maintain after restore
   */
  restoreFromPositions(positionMapping: number[], currentSongId?: string): void {
    if (positionMapping.length !== this.songIds.length) {
      return;
    }

    const restoredQueue: string[] = [];
    const currentQueue = [...this.songIds];

    for (let i = 0; i < positionMapping.length; i += 1) {
      restoredQueue.push(currentQueue[positionMapping[i]]);
    }

    this.songIds = restoredQueue;

    if (currentSongId) {
      const newPosition = this.songIds.indexOf(currentSongId);
      this.position = newPosition !== -1 ? newPosition : 0;
    } else {
      this.position = 0;
    }

    // Clear the shuffle history since we've restored
    this.queueBeforeShuffle = undefined;
  }

  /**
   * Restores the queue from the stored shuffle positions (if available)
   * @param currentSongId - Optional current song ID to maintain after restore
   * @returns true if restored successfully, false if no shuffle history exists
   */
  restoreFromShuffle(currentSongId?: string): boolean {
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
    this.queueId = queueId;
    this.queueType = queueType;
  }

  /**
   * Gets the queue metadata
   * @returns object containing queueId and queueType
   */
  getMetadata(): { queueId?: string; queueType?: QueueTypes } {
    return {
      queueId: this.queueId,
      queueType: this.queueType
    };
  }

  /**
   * Gets a song ID at a specific position
   * @param position - Position to get (0-indexed)
   * @returns the song ID at the position, or null if invalid
   */
  getSongIdAtPosition(position: number): string | null {
    return this.songIds[position] || null;
  }

  /**
   * Gets the position of a song ID in the queue
   * @param songId - Song ID to find
   * @returns the position (0-indexed), or -1 if not found
   */
  getPositionOfSongId(songId: string): number {
    return this.songIds.indexOf(songId);
  }

  /**
   * Checks if a song ID exists in the queue
   * @param songId - Song ID to check
   * @returns true if the song is in the queue
   */
  hasSongId(songId: string): boolean {
    return this.songIds.includes(songId);
  }

  /**
   * Gets a copy of all song IDs in the queue
   * @returns array of all song IDs
   */
  getAllSongIds(): string[] {
    return [...this.songIds];
  }

  /**
   * Gets remaining song IDs after the current position
   * @returns array of song IDs after current position
   */
  getRemainingSongIds(): string[] {
    return this.songIds.slice(this.position + 1);
  }

  /**
   * Gets previous song IDs before the current position
   * @returns array of song IDs before current position
   */
  getPreviousSongIds(): string[] {
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
      this.queueId,
      this.queueType,
      this.queueBeforeShuffle ? [...this.queueBeforeShuffle] : undefined
    );
  }
}

export default PlayerQueue;
