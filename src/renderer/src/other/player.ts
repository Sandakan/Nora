const AUDIO_FADE_INTERVAL = 50;
const AUDIO_FADE_DURATION = 250;

class AudioPlayer extends Audio {
  currentVolume: number;
  fadeOutIntervalId: NodeJS.Timeout | undefined;
  fadeInIntervalId: NodeJS.Timeout | undefined;
  constructor() {
    super();
    this.currentVolume = super.volume;
  }

  private fadeOutAudio(): Promise<void> {
    return new Promise((resolve) => {
      if (this.fadeInIntervalId) clearInterval(this.fadeInIntervalId);
      if (this.fadeOutIntervalId) clearInterval(this.fadeOutIntervalId);

      this.fadeOutIntervalId = setInterval(() => {
        console.log(super.volume);
        if (super.volume > 0) {
          const rate = this.currentVolume / (100 * (AUDIO_FADE_DURATION / AUDIO_FADE_INTERVAL));
          if (super.volume - rate <= 0) super.volume = 0;
          else super.volume -= rate;
        } else {
          super.pause();
          if (this.fadeOutIntervalId) clearInterval(this.fadeOutIntervalId);
          resolve(undefined);
        }
      }, AUDIO_FADE_INTERVAL);
    });
  }

  private fadeInAudio(): Promise<void> {
    return new Promise((resolve) => {
      if (this.fadeInIntervalId) clearInterval(this.fadeInIntervalId);
      if (this.fadeOutIntervalId) clearInterval(this.fadeOutIntervalId);

      this.fadeInIntervalId = setInterval(() => {
        console.log(super.volume);
        if (super.volume < this.currentVolume / 100) {
          const rate =
            (this.currentVolume / 100 / AUDIO_FADE_INTERVAL) *
            (AUDIO_FADE_DURATION / AUDIO_FADE_INTERVAL);
          if (super.volume + rate >= this.currentVolume / 100)
            super.volume = this.currentVolume / 100;
          else super.volume += rate;
        } else if (this.fadeInIntervalId) {
          clearInterval(this.fadeInIntervalId);
          resolve(undefined);
        }
      }, AUDIO_FADE_INTERVAL);
    });
  }

  play() {
    super.play();
    return this.fadeInAudio();
  }
  pause() {
    return this.fadeOutAudio();
  }

  get volume(): number {
    return this.currentVolume / 100;
  }

  set volume(volume: number) {
    if (this.fadeInIntervalId) clearInterval(this.fadeInIntervalId);
    if (this.fadeOutIntervalId) clearInterval(this.fadeOutIntervalId);

    this.currentVolume = volume * 100;
    super.volume = volume;
  }
}

export default AudioPlayer;
