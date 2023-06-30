import calculateTime from 'renderer/utils/calculateTime';

/* eslint-disable lines-between-class-members */
class ListeningDataSession {
  songId: string;
  duration: number;
  abortController: AbortController;
  isPaused: boolean;
  passedSkipRange: boolean;
  passedFullListenRange: boolean;
  seconds: number;
  skipEndRange: ReturnType<typeof calculateTime>;
  listenEndRange: ReturnType<typeof calculateTime>;
  intervalId?: NodeJS.Timer;
  seeks: { position: number; seeks: number }[];

  constructor(songId: string, duration: number) {
    this.songId = songId;
    this.duration = duration;

    this.skipEndRange = calculateTime((this.duration * 10) / 100);
    this.listenEndRange = calculateTime((this.duration * 90) / 100);
    this.abortController = new AbortController();
    this.isPaused = true;
    this.passedSkipRange = false;
    this.passedFullListenRange = false;
    this.seconds = 0;
    this.seeks = [];
  }

  recordListeningData() {
    console.warn(
      `Started recording listening data for ${this.songId}`,
      'duration',
      calculateTime(this.duration)
    );
    console.warn(
      this.songId,
      '-',
      'skip end range:',
      `${this.skipEndRange.minutes}:${this.skipEndRange.seconds}`,
      'full listen range:',
      `${this.listenEndRange.minutes}:${this.listenEndRange.seconds}`
    );

    this.intervalId = setInterval(() => {
      //  listen for song skips
      if (!this.passedSkipRange && this.seconds > (this.duration * 10) / 100) {
        this.passedSkipRange = true;
        console.warn(`User didn't skip ${this.songId} before 10% completion.`);
      }
      // listen for full song listens
      if (
        !this.passedFullListenRange &&
        this.seconds > (this.duration * 90) / 100
      ) {
        this.passedFullListenRange = true;
        console.warn(`User listened to 90% of ${this.songId}`);
        window.api.audioLibraryControls.updateSongListeningData(
          this.songId,
          'fullListens',
          'increment'
        );
        this.stopRecording();
      }

      if (!this.isPaused) {
        this.seconds += 1;
      }
    }, 1000);
  }

  stopRecording(isSongEnded = false) {
    try {
      if (!isSongEnded && !this.passedFullListenRange)
        console.warn(`User skipped ${this.songId} before 90% completion.`);
      if (!this.passedSkipRange) {
        console.warn(`User skipped ${this.songId}. before 10% completion.`);
        window.api.audioLibraryControls.updateSongListeningData(
          this.songId,
          'skips',
          'increment'
        );
      }
      this.abortController.abort();
      clearInterval(this.intervalId);
      console.warn(`Stopping listening data recording of ${this.songId}`);
    } catch (error) {
      console.error(error);
    }
  }

  set addSeekPosition(seekPosition: number) {
    for (const seek of this.seeks) {
      const isSeekPositionInRange =
        seekPosition > seek.position - 4 && seekPosition < seek.position + 4;
      if (isSeekPositionInRange) {
        seek.seeks += 1;
        return;
      }
    }
    this.seeks.push({ position: seekPosition, seeks: 1 });
  }
}

export default ListeningDataSession;
