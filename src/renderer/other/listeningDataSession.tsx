/* eslint-disable lines-between-class-members */
import calculateTime from 'renderer/utils/calculateTime';

class ListeningDataSession {
  songId: string;
  duration: number;
  abortController: AbortController;
  isPaused: boolean;
  isScrobbling: boolean;
  chosenByUser: boolean;
  passedSkipRange: boolean;
  passedFullListenRange: boolean;
  passedScrobblingRange: boolean;
  seconds: number;
  skipEndRange: ReturnType<typeof calculateTime>;
  listenEndRange: ReturnType<typeof calculateTime>;
  scrobbleEndRange: ReturnType<typeof calculateTime>;
  intervalId?: NodeJS.Timer;
  nowPlayingIntervalId?: NodeJS.Timer;
  seeks: { position: number; seeks: number }[];
  recordStartTime: Date;

  constructor(songId: string, duration: number, chosenByUser = false) {
    this.songId = songId;
    this.duration = duration;

    this.skipEndRange = calculateTime((duration * 10) / 100);
    this.listenEndRange = calculateTime((duration * 90) / 100);
    this.scrobbleEndRange = calculateTime((duration * 50) / 100);
    this.abortController = new AbortController();
    this.isPaused = true;
    this.isScrobbling = duration > 30;
    this.chosenByUser = chosenByUser;
    this.passedSkipRange = false;
    this.passedFullListenRange = false;
    this.passedScrobblingRange = false;
    this.seconds = 0;
    this.seeks = [];
    this.recordStartTime = new Date();
  }

  recordListeningData() {
    console.warn(
      `Started recording listening data for ${this.songId}`,
      'duration',
      calculateTime(this.duration),
    );
    this.nowPlayingIntervalId = setTimeout(() => {
      window.api.audioLibraryControls.sendNowPlayingSongDataToLastFM(
        this.songId,
      );
      console.warn('Now playing song data will be sent to LastFM if enabled.');
    }, 2500);

    console.warn(
      this.songId,
      '-',
      'skip end range:',
      `${this.skipEndRange.minutes}:${this.skipEndRange.seconds}`,
      'full listen range:',
      `${this.listenEndRange.minutes}:${this.listenEndRange.seconds}`,
      'scrobble range:',
      `${this.scrobbleEndRange.minutes}:${this.scrobbleEndRange.seconds}`,
    );

    this.intervalId = setInterval(() => {
      const skipRange = (this.duration * 10) / 100;
      const fullListenRange = (this.duration * 90) / 100;
      const scrobblingRange = (this.duration * 50) / 100;

      //  listen for song skips
      if (!this.passedSkipRange && this.seconds > skipRange) {
        this.passedSkipRange = true;
        console.warn(`User didn't skip ${this.songId} before 10% completion.`);
      }
      // listen for full song listens
      if (!this.passedFullListenRange && this.seconds > fullListenRange) {
        this.passedFullListenRange = true;
        console.warn(`User listened to 90% of ${this.songId}`);
        window.api.audioLibraryControls.updateSongListeningData(
          this.songId,
          'fullListens',
          'increment',
        );
        this.stopRecording();
      }
      // listen for scrobbling event
      if (
        this.isScrobbling &&
        !this.passedScrobblingRange &&
        this.seconds > scrobblingRange
      ) {
        this.passedScrobblingRange = true;
        console.warn(
          `${this.songId} will be added to scrobble list if enabled.`,
        );
        window.api.audioLibraryControls.scrobbleSong(
          this.songId,
          this.recordStartTime.getTime() / 1000,
        );
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
          'increment',
        );
      }
      this.abortController.abort();
      clearInterval(this.intervalId);
      clearTimeout(this.nowPlayingIntervalId);
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
