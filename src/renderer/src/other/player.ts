import { store } from '../store/store';
import { equalizerBandHertzData } from './equalizerData';

const AUDIO_FADE_INTERVAL = 50;
const AUDIO_FADE_DURATION = 250;

class AudioPlayer extends Audio {
  currentVolume: number;

  currentContext: AudioContext;
  equalizerBands: Map<EqualizerBandFilters, BiquadFilterNode>;

  fadeOutIntervalId: NodeJS.Timeout | undefined;
  fadeInIntervalId: NodeJS.Timeout | undefined;

  unsubscribeFunc: () => void;

  constructor() {
    super();

    super.preload = 'auto';
    super.defaultPlaybackRate = 1.0;

    this.currentContext = new window.AudioContext();
    this.equalizerBands = new Map();

    this.currentVolume = super.volume;

    this.unsubscribeFunc = this.subscribeToStoreEvents();
    this.initializeEqualizer();
  }

  unsubscribeFromStoreEvents() {
    if (this.unsubscribeFunc) this.unsubscribeFunc();
  }

  private fadeOutAudio(): Promise<void> {
    return new Promise((resolve) => {
      if (this.fadeInIntervalId) clearInterval(this.fadeInIntervalId);
      if (this.fadeOutIntervalId) clearInterval(this.fadeOutIntervalId);

      this.fadeOutIntervalId = setInterval(() => {
        // console.log(super.volume);
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
        // console.log(super.volume);
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

  private initializeEqualizer() {
    for (const [filterName, hertzValue] of Object.entries(equalizerBandHertzData)) {
      const equalizerFilterName = filterName as EqualizerBandFilters;
      const equalizerBand = this.currentContext.createBiquadFilter();

      equalizerBand.type = 'peaking';
      equalizerBand.frequency.value = hertzValue;
      equalizerBand.Q.value = 1;
      equalizerBand.gain.value = 0;

      this.equalizerBands.set(equalizerFilterName, equalizerBand);
    }

    const source = this.currentContext.createMediaElementSource(this);
    const filterMapKeys = [...this.equalizerBands.keys()];

    this.equalizerBands.forEach((filter, key, map) => {
      const currentFilterIndex = filterMapKeys.indexOf(key);
      const isTheFirstFilter = currentFilterIndex === 0;
      const isTheLastFilter = currentFilterIndex === filterMapKeys.length - 1;

      if (isTheFirstFilter) source.connect(filter);
      else {
        const prevFilter = map.get(filterMapKeys[currentFilterIndex - 1]);
        if (prevFilter) prevFilter.connect(filter);

        if (isTheLastFilter) filter.connect(this.currentContext.destination);
      }
    });
  }

  // ? PLAYER RELATED STORE UPDATES HANDLING
  private updateEqualizerPreset(equalizerPreset: LocalStorage['equalizerPreset']) {
    if (equalizerPreset) {
      const filters = equalizerPreset;
      for (const filter of Object.entries(filters)) {
        const filterName = filter[0] as EqualizerBandFilters;
        const gainValue: number = filter[1];

        const equalizerFilter = this.equalizerBands.get(filterName);
        if (equalizerFilter) equalizerFilter.gain.value = gainValue;
      }
    }
  }

  private updatePlayerVolume(volume: PlayerVolume) {
    this.volume = volume.value / 100;
    this.muted = volume.isMuted;
  }

  private updatePlaybackRate(playbackRate: number) {
    if (this.playbackRate !== playbackRate) this.playbackRate = playbackRate;
  }

  private subscribeToStoreEvents() {
    const unsubscribeFunction = store.subscribe(() => {
      if (store) {
        const { localStorage, player } = store.state;

        this.updateEqualizerPreset(localStorage.equalizerPreset);
        this.updatePlayerVolume(player.volume);
        this.updatePlaybackRate(player.playbackRate);
      }
    });

    return unsubscribeFunction;
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
