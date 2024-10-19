import { LOCAL_STORAGE_DEFAULT_TEMPLATE } from './appReducer';

export const equalizerBandHertzData: Record<EqualizerBandFilters, number> = {
  thirtyTwoHertzFilter: 32,
  sixtyFourHertzFilter: 64,
  hundredTwentyFiveHertzFilter: 125,
  twoHundredFiftyHertzFilter: 250,
  fiveHundredHertzFilter: 500,
  thousandHertzFilter: 1000,
  twoThousandHertzFilter: 2000,
  fourThousandHertzFilter: 4000,
  eightThousandHertzFilter: 8000,
  sixteenThousandHertzFilter: 16000
};

export const equalizerPresetsData: EqualizerPresetsData = [
  {
    title: 'flat',
    preset: LOCAL_STORAGE_DEFAULT_TEMPLATE.equalizerPreset
  },
  {
    title: 'acoustic',
    preset: {
      thirtyTwoHertzFilter: 4.8,
      sixtyFourHertzFilter: 4.5,
      hundredTwentyFiveHertzFilter: 3.5,
      twoHundredFiftyHertzFilter: 0.4,
      fiveHundredHertzFilter: 1.8,
      thousandHertzFilter: 1.6,
      twoThousandHertzFilter: 3.3,
      fourThousandHertzFilter: 3.8,
      eightThousandHertzFilter: 3.3,
      sixteenThousandHertzFilter: 1.3
    }
  },
  {
    title: 'bassBooster',
    preset: {
      thirtyTwoHertzFilter: 5,
      sixtyFourHertzFilter: 4,
      hundredTwentyFiveHertzFilter: 3,
      twoHundredFiftyHertzFilter: 2.1,
      fiveHundredHertzFilter: 1.1,
      thousandHertzFilter: -0.4,
      twoThousandHertzFilter: -0.4,
      fourThousandHertzFilter: -0.4,
      eightThousandHertzFilter: -0.4,
      sixteenThousandHertzFilter: -0.4
    }
  },
  {
    title: 'bassReducer',
    preset: {
      thirtyTwoHertzFilter: -6.2,
      sixtyFourHertzFilter: -4.5,
      hundredTwentyFiveHertzFilter: -3.8,
      twoHundredFiftyHertzFilter: -3,
      fiveHundredHertzFilter: -1.6,
      thousandHertzFilter: -0.4,
      twoThousandHertzFilter: -0.4,
      fourThousandHertzFilter: -0.4,
      eightThousandHertzFilter: -0.4,
      sixteenThousandHertzFilter: -0.4
    }
  },
  {
    title: 'classical',
    preset: {
      thirtyTwoHertzFilter: 0,
      sixtyFourHertzFilter: 0,
      hundredTwentyFiveHertzFilter: 0,
      twoHundredFiftyHertzFilter: 0,
      fiveHundredHertzFilter: 0,
      thousandHertzFilter: 0,
      twoThousandHertzFilter: 0,
      fourThousandHertzFilter: -1.5,
      eightThousandHertzFilter: -3.7,
      sixteenThousandHertzFilter: -5.3
    }
  },
  {
    title: 'club',
    preset: {
      thirtyTwoHertzFilter: 0.1,
      sixtyFourHertzFilter: 0.1,
      hundredTwentyFiveHertzFilter: 2.3,
      twoHundredFiftyHertzFilter: 3.5,
      fiveHundredHertzFilter: 3.5,
      thousandHertzFilter: 3.5,
      twoThousandHertzFilter: 2.6,
      fourThousandHertzFilter: 0.1,
      eightThousandHertzFilter: 0.1,
      sixteenThousandHertzFilter: 0.2
    }
  },
  {
    title: 'dance',
    preset: {
      thirtyTwoHertzFilter: 6.8,
      sixtyFourHertzFilter: 5.3,
      hundredTwentyFiveHertzFilter: 4,
      twoHundredFiftyHertzFilter: 2,
      fiveHundredHertzFilter: 0,
      thousandHertzFilter: 0,
      twoThousandHertzFilter: 0,
      fourThousandHertzFilter: -3.1,
      eightThousandHertzFilter: -3.1,
      sixteenThousandHertzFilter: 0
    }
  },
  {
    title: 'deep',
    preset: {
      thirtyTwoHertzFilter: 4.5,
      sixtyFourHertzFilter: 3,
      hundredTwentyFiveHertzFilter: 1.3,
      twoHundredFiftyHertzFilter: 0.4,
      fiveHundredHertzFilter: 2.3,
      thousandHertzFilter: 1.8,
      twoThousandHertzFilter: 1.1,
      fourThousandHertzFilter: -2.8,
      eightThousandHertzFilter: -4,
      sixteenThousandHertzFilter: -5
    }
  },
  {
    title: 'electronic',
    preset: {
      thirtyTwoHertzFilter: 4,
      sixtyFourHertzFilter: 3.5,
      hundredTwentyFiveHertzFilter: 0.9,
      twoHundredFiftyHertzFilter: -0.6,
      fiveHundredHertzFilter: -2.6,
      thousandHertzFilter: 1.8,
      twoThousandHertzFilter: 0.4,
      fourThousandHertzFilter: 0.9,
      eightThousandHertzFilter: 3.5,
      sixteenThousandHertzFilter: 4.3
    }
  },
  {
    title: 'hipHop',
    preset: {
      thirtyTwoHertzFilter: 4.5,
      sixtyFourHertzFilter: 3.8,
      hundredTwentyFiveHertzFilter: 0.9,
      twoHundredFiftyHertzFilter: 2.3,
      fiveHundredHertzFilter: -1.3,
      thousandHertzFilter: -1.3,
      twoThousandHertzFilter: 1.1,
      fourThousandHertzFilter: -1.3,
      eightThousandHertzFilter: 1.8,
      sixteenThousandHertzFilter: 2.3
    }
  },
  {
    title: 'jazz',
    preset: {
      thirtyTwoHertzFilter: 3.8,
      sixtyFourHertzFilter: 2.3,
      hundredTwentyFiveHertzFilter: 0.9,
      twoHundredFiftyHertzFilter: 1.8,
      fiveHundredHertzFilter: -1.8,
      thousandHertzFilter: -1.8,
      twoThousandHertzFilter: -0.6,
      fourThousandHertzFilter: 1.1,
      eightThousandHertzFilter: 2.6,
      sixteenThousandHertzFilter: 3.5
    }
  },
  {
    title: 'latin',
    preset: {
      thirtyTwoHertzFilter: 4,
      sixtyFourHertzFilter: 2.3,
      hundredTwentyFiveHertzFilter: -0.6,
      twoHundredFiftyHertzFilter: -0.6,
      fiveHundredHertzFilter: -1.8,
      thousandHertzFilter: -1.8,
      twoThousandHertzFilter: -1.8,
      fourThousandHertzFilter: -0.4,
      eightThousandHertzFilter: 2.6,
      sixteenThousandHertzFilter: 4
    }
  },
  {
    title: 'live',
    preset: {
      thirtyTwoHertzFilter: -4.6,
      sixtyFourHertzFilter: -2.9,
      hundredTwentyFiveHertzFilter: -0.4,
      twoHundredFiftyHertzFilter: 1.8,
      fiveHundredHertzFilter: 3.1,
      thousandHertzFilter: 3.7,
      twoThousandHertzFilter: 3.7,
      fourThousandHertzFilter: 2.6,
      eightThousandHertzFilter: 1.3,
      sixteenThousandHertzFilter: 0.4
    }
  },
  {
    title: 'loudness',
    preset: {
      thirtyTwoHertzFilter: 5.2,
      sixtyFourHertzFilter: 3.5,
      hundredTwentyFiveHertzFilter: -0.6,
      twoHundredFiftyHertzFilter: -0.6,
      fiveHundredHertzFilter: -2.6,
      thousandHertzFilter: -0.4,
      twoThousandHertzFilter: -1.6,
      fourThousandHertzFilter: -5.5,
      eightThousandHertzFilter: 4.5,
      sixteenThousandHertzFilter: 0.4
    }
  },
  {
    title: 'lounge',
    preset: {
      thirtyTwoHertzFilter: -3.5,
      sixtyFourHertzFilter: -1.8,
      hundredTwentyFiveHertzFilter: -1.1,
      twoHundredFiftyHertzFilter: 0.9,
      fiveHundredHertzFilter: 3.5,
      thousandHertzFilter: 1.8,
      twoThousandHertzFilter: -0.4,
      fourThousandHertzFilter: -1.8,
      eightThousandHertzFilter: 1.8,
      sixteenThousandHertzFilter: 0.4
    }
  },
  {
    title: 'metal',
    preset: {
      thirtyTwoHertzFilter: -0.3,
      sixtyFourHertzFilter: 2.9,
      hundredTwentyFiveHertzFilter: 2.7,
      twoHundredFiftyHertzFilter: -0.7,
      fiveHundredHertzFilter: -2.7,
      thousandHertzFilter: -3.1,
      twoThousandHertzFilter: 0,
      fourThousandHertzFilter: 3.1,
      eightThousandHertzFilter: 5.7,
      sixteenThousandHertzFilter: 2.9
    }
  },
  {
    title: 'piano',
    preset: {
      thirtyTwoHertzFilter: 2.6,
      sixtyFourHertzFilter: 1.6,
      hundredTwentyFiveHertzFilter: -0.6,
      twoHundredFiftyHertzFilter: 2.1,
      fiveHundredHertzFilter: 2.6,
      thousandHertzFilter: 0.6,
      twoThousandHertzFilter: 3.3,
      fourThousandHertzFilter: 4,
      eightThousandHertzFilter: 2.3,
      sixteenThousandHertzFilter: 3
    }
  },
  {
    title: 'pop',
    preset: {
      thirtyTwoHertzFilter: -2.4,
      sixtyFourHertzFilter: -0.9,
      hundredTwentyFiveHertzFilter: 1.8,
      twoHundredFiftyHertzFilter: 3.5,
      fiveHundredHertzFilter: 4.6,
      thousandHertzFilter: 3.3,
      twoThousandHertzFilter: 1.5,
      fourThousandHertzFilter: 0,
      eightThousandHertzFilter: -0.9,
      sixteenThousandHertzFilter: -1.1
    }
  },
  {
    title: 'reggae',
    preset: {
      thirtyTwoHertzFilter: 0,
      sixtyFourHertzFilter: 0,
      hundredTwentyFiveHertzFilter: 0,
      twoHundredFiftyHertzFilter: -1.3,
      fiveHundredHertzFilter: -3.7,
      thousandHertzFilter: -0.7,
      twoThousandHertzFilter: 2,
      fourThousandHertzFilter: 3.3,
      eightThousandHertzFilter: 1.8,
      sixteenThousandHertzFilter: 0
    }
  },
  {
    title: 'rnb',
    preset: {
      thirtyTwoHertzFilter: 2.1,
      sixtyFourHertzFilter: 6.2,
      hundredTwentyFiveHertzFilter: 5.5,
      twoHundredFiftyHertzFilter: 1.1,
      fiveHundredHertzFilter: -2.8,
      thousandHertzFilter: -1.8,
      twoThousandHertzFilter: 2.1,
      fourThousandHertzFilter: 2.6,
      eightThousandHertzFilter: 2.3,
      sixteenThousandHertzFilter: 3.5
    }
  },
  {
    title: 'rock',
    preset: {
      thirtyTwoHertzFilter: 5.9,
      sixtyFourHertzFilter: 4.8,
      hundredTwentyFiveHertzFilter: 1.5,
      twoHundredFiftyHertzFilter: -1.8,
      fiveHundredHertzFilter: -4.6,
      thousandHertzFilter: -1.1,
      twoThousandHertzFilter: 2.6,
      fourThousandHertzFilter: 5.5,
      eightThousandHertzFilter: 6.6,
      sixteenThousandHertzFilter: 7
    }
  },
  {
    title: 'ska',
    preset: {
      thirtyTwoHertzFilter: -1.8,
      sixtyFourHertzFilter: -3,
      hundredTwentyFiveHertzFilter: -2.8,
      twoHundredFiftyHertzFilter: -0.4,
      fiveHundredHertzFilter: 2.6,
      thousandHertzFilter: 3.5,
      twoThousandHertzFilter: 5.5,
      fourThousandHertzFilter: 6,
      eightThousandHertzFilter: 6.5,
      sixteenThousandHertzFilter: 6
    }
  },
  {
    title: 'smallSpeakers',
    preset: {
      thirtyTwoHertzFilter: 4.8,
      sixtyFourHertzFilter: 3.5,
      hundredTwentyFiveHertzFilter: 3,
      twoHundredFiftyHertzFilter: 1.8,
      fiveHundredHertzFilter: 0.4,
      thousandHertzFilter: -0.6,
      twoThousandHertzFilter: -1.6,
      fourThousandHertzFilter: -3,
      eightThousandHertzFilter: -4,
      sixteenThousandHertzFilter: -4.5
    }
  },
  {
    title: 'soft',
    preset: {
      thirtyTwoHertzFilter: 3,
      sixtyFourHertzFilter: 0.9,
      hundredTwentyFiveHertzFilter: -0.9,
      twoHundredFiftyHertzFilter: -1.8,
      fiveHundredHertzFilter: -1.1,
      thousandHertzFilter: 2.8,
      twoThousandHertzFilter: 5.2,
      fourThousandHertzFilter: 6,
      eightThousandHertzFilter: 6.5,
      sixteenThousandHertzFilter: 7.2
    }
  },
  {
    title: 'softRock',
    preset: {
      thirtyTwoHertzFilter: 2.6,
      sixtyFourHertzFilter: 2.6,
      hundredTwentyFiveHertzFilter: 1.3,
      twoHundredFiftyHertzFilter: -0.4,
      fiveHundredHertzFilter: -2.8,
      thousandHertzFilter: -3.5,
      twoThousandHertzFilter: -2.6,
      fourThousandHertzFilter: -0.4,
      eightThousandHertzFilter: 1.8,
      sixteenThousandHertzFilter: 2.6
    }
  },
  {
    title: 'spokenWord',
    preset: {
      thirtyTwoHertzFilter: -4.3,
      sixtyFourHertzFilter: -1.1,
      hundredTwentyFiveHertzFilter: -0.4,
      twoHundredFiftyHertzFilter: 0.1,
      fiveHundredHertzFilter: 3,
      thousandHertzFilter: 4.3,
      twoThousandHertzFilter: 4.8,
      fourThousandHertzFilter: 3.8,
      eightThousandHertzFilter: 1.8,
      sixteenThousandHertzFilter: -0.6
    }
  },
  {
    title: 'techno',
    preset: {
      thirtyTwoHertzFilter: 4.8,
      sixtyFourHertzFilter: 3.5,
      hundredTwentyFiveHertzFilter: 0.1,
      twoHundredFiftyHertzFilter: -3.5,
      fiveHundredHertzFilter: -3,
      thousandHertzFilter: 0.1,
      twoThousandHertzFilter: 4.8,
      fourThousandHertzFilter: 6,
      eightThousandHertzFilter: 6,
      sixteenThousandHertzFilter: 5.7
    }
  },
  {
    title: 'trebleBooster',
    preset: {
      thirtyTwoHertzFilter: -0.4,
      sixtyFourHertzFilter: -0.4,
      hundredTwentyFiveHertzFilter: -0.4,
      twoHundredFiftyHertzFilter: -0.4,
      fiveHundredHertzFilter: -0.4,
      thousandHertzFilter: 0.6,
      twoThousandHertzFilter: 2.1,
      fourThousandHertzFilter: 3.3,
      eightThousandHertzFilter: 3.8,
      sixteenThousandHertzFilter: 5.2
    }
  },
  {
    title: 'trebleReducer',
    preset: {
      thirtyTwoHertzFilter: -0.4,
      sixtyFourHertzFilter: -0.4,
      hundredTwentyFiveHertzFilter: -0.4,
      twoHundredFiftyHertzFilter: -0.4,
      fiveHundredHertzFilter: -0.4,
      thousandHertzFilter: -1.6,
      twoThousandHertzFilter: -3,
      fourThousandHertzFilter: -4,
      eightThousandHertzFilter: -4.8,
      sixteenThousandHertzFilter: -5.5
    }
  },
  {
    title: 'vocalBooster',
    preset: {
      thirtyTwoHertzFilter: -2.1,
      sixtyFourHertzFilter: -3.3,
      hundredTwentyFiveHertzFilter: -3.3,
      twoHundredFiftyHertzFilter: 0.9,
      fiveHundredHertzFilter: 3.3,
      thousandHertzFilter: 3.3,
      twoThousandHertzFilter: 2.6,
      fourThousandHertzFilter: 1,
      eightThousandHertzFilter: -0.3,
      sixteenThousandHertzFilter: -2.1
    }
  }
];
