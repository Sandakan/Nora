import calculateTime from '../utils/calculateTime';

class ListeningDataSession {
  songId: number;
  duration: number;
  abortController: AbortController;
  isPaused: boolean;
  isScrobbling: boolean;
  chosenByUser: boolean;
  passedSkipRange: boolean;
  passedFullListenRange: boolean;
  passedScrobblingRange: boolean;
  isKnownSource: boolean;
  seconds: number;
  skipEndRange: ReturnType<typeof calculateTime>;
  listenEndRange: ReturnType<typeof calculateTime>;
  scrobbleEndRange: ReturnType<typeof calculateTime>;
  intervalId?: NodeJS.Timeout;
  nowPlayingIntervalId?: NodeJS.Timeout;
  seeks: { position: number; seeks: number }[];
  startTime: Date;

  constructor(songId: number, duration: number, chosenByUser = false, isKnownSource = true) {
    this.songId = songId;
    this.duration = duration;
    this.isKnownSource = isKnownSource;

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
    this.startTime = new Date();
  }

  recordListeningData() {
    console.warn(
      `Started recording listening data for '${this.songId}'`,
      'duration',
      calculateTime(this.duration)
    );

    this.nowPlayingIntervalId = setTimeout(() => {
      window.api.audioLibraryControls.sendNowPlayingSongDataToLastFM(this.songId);
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
      `${this.scrobbleEndRange.minutes}:${this.scrobbleEndRange.seconds}`
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
        // if (this.isKnownSource)
        //   window.api.audioLibraryControls.updateSongListeningData(this.songId, 'fullListens', 1);
      }
      // listen for scrobbling event
      if (this.isScrobbling && !this.passedScrobblingRange && this.seconds > scrobblingRange) {
        this.passedScrobblingRange = true;
        console.warn(`${this.songId} will be added to scrobble list if enabled.`);
        window.api.audioLibraryControls.scrobbleSong(this.songId, this.startTime.getTime() / 1000);
      }
      if (!this.isPaused) {
        this.seconds += 1;
      }
    }, 1000);
  }

  stopRecording(isSongEnded = false) {
    try {
      if (this.passedSkipRange) {
        const playbackPercentage = this.seconds / this.duration;

        window.api.audioLibraryControls.updateSongListeningData(
          this.songId,
          'LISTEN',
          this.passedFullListenRange && playbackPercentage > 0.99 ? 1 : playbackPercentage
        );
      }

      if (!isSongEnded && !this.passedFullListenRange)
        console.warn(`User skipped ${this.songId} before 90% completion.`);
      if (!this.passedSkipRange) {
        console.warn(`User skipped ${this.songId}. before 10% completion.`);
        if (this.isKnownSource)
          window.api.audioLibraryControls.updateSongListeningData(this.songId, 'SKIP', 1);
      }

      // const seeks = this.seeks.filter((seekInstance) => seekInstance.seeks >= 3);
      // if (seeks.length > 0 && this.isKnownSource) {
      //   window.api.audioLibraryControls.updateSongListeningData(this.songId, 'SEEKS', seeks);
      // }

      this.abortController.abort();
      clearInterval(this.intervalId);
      clearTimeout(this.nowPlayingIntervalId);
      console.warn(`Stopping listening data recording of ${this.songId}`);
    } catch (error) {
      console.error(error);
    }
  }

  set addSeekPosition(seekPosition: number) {
    window.api.audioLibraryControls.updateSongListeningData(this.songId, 'SEEK', seekPosition);

    const seekRange = 5;
    for (const seek of this.seeks) {
      const isSeekPositionInRange =
        seekPosition > seek.position - seekRange && seekPosition < seek.position + seekRange;
      if (isSeekPositionInRange) {
        seek.seeks += 1;
        return;
      }
    }
    this.seeks.push({ position: seekPosition, seeks: 1 });
  }
}

export default ListeningDataSession;
