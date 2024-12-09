import { TagConstants } from 'node-id3';
import parseLyrics, {
  SyncedLyricsInput,
  parseSyncedLyricsFromAudioDataSource
} from '../src/common/parseLyrics';

// const songMetadata = `[ti:Stay]
// [length:03:30.13]
// [ar:Zedd]
// [al:Stay]`;

const syncedLyricsFromSongMetadata: SyncedLyricsInput = {
  language: 'ENG',
  timeStampFormat: TagConstants.TimeStampFormat.MILLISECONDS,
  contentType: TagConstants.SynchronisedLyrics.ContentType.LYRICS,
  shortText: undefined,
  synchronisedText: [
    {
      text: 'Waiting for the time to pass you by',
      timeStamp: 9810
    },
    {
      text: 'Hope the winds of change will change your mind',
      timeStamp: 14060
    },
    { text: 'I could give a thousand reasons why', timeStamp: 19110 }
  ]
};

const syncedLyricsString = `[00:09.81] Waiting for the time to pass you by
[00:14.06] Hope the winds of change will change your mind
[00:19.11] I could give a thousand reasons why`;

const syncedLyricsWithTranslationString = `[00:09.81] Waiting for the time to pass you by
[00:09.81][lang:en] Waiting for the time to pass you by
[00:14.06] Hope the winds of change will change your mind
[00:14.06][lang:en] Hope the winds of change will change your mind
[00:19.11] I could give a thousand reasons why
[00:19.11][lang:en] I could give a thousand reasons why`;

const unsyncedLyricsString = `Waiting for the time to pass you by
Hope the winds of change will change your mind
I could give a thousand reasons why`;

const unsyncedLyricsWithTranslationString = `Waiting for the time to pass you by
[lang:en] Waiting for the time to pass you by
Hope the winds of change will change your mind
[lang:en] Hope the winds of change will change your mind
I could give a thousand reasons why
[lang:en] I could give a thousand reasons why`;

const enhancedSyncedLyricsString = `[00:14.871] This <00:15.138> party <00:16.273> is <00:16.563> too <00:17.116> loud
[00:18.113] I <00:18.365> see <00:18.817> you <00:19.643> with <00:19.972> her <00:20.28> now`;

describe('Check the full output of parseLyrics function', () => {
  test('Parsing an enhanced syncedLyrics string without song metadata', () => {
    const parsedLyrics = parseLyrics(enhancedSyncedLyricsString);
    // console.log('Parsed Enhanced Synced Lyrics : \n', JSON.stringify(parsedLyrics));

    expect(parsedLyrics).toEqual({
      copyright: undefined,
      isReset: false,
      isRomanized: false,
      originalLanguage: undefined,
      isSynced: true,
      isTranslated: false,
      parsedLyrics: [
        {
          convertedLyrics: '',
          originalText: [
            { text: 'This', unparsedText: '[00:14.871] This', start: 14.871, end: 15.138 },
            { text: 'party', unparsedText: '<00:15.138> party', start: 15.138, end: 16.273 },
            { text: 'is', unparsedText: '<00:16.273> is', start: 16.273, end: 16.563 },
            { text: 'too', unparsedText: '<00:16.563> too', start: 16.563, end: 17.116 },
            { text: 'loud', unparsedText: '<00:17.116> loud', start: 17.116, end: 18.113 }
          ],
          translatedTexts: [],
          isEnhancedSynced: true,
          start: 14.871,
          end: 18.113
        },
        {
          convertedLyrics: '',
          originalText: [
            { text: 'I', unparsedText: '[00:18.113] I', start: 18.113, end: 18.365 },
            { text: 'see', unparsedText: '<00:18.365> see', start: 18.365, end: 18.817 },
            { text: 'you', unparsedText: '<00:18.817> you', start: 18.817, end: 19.643 },
            { text: 'with', unparsedText: '<00:19.643> with', start: 19.643, end: 19.972 },
            { text: 'her', unparsedText: '<00:19.972> her', start: 19.972, end: 20.28 },
            { text: 'now', unparsedText: '<00:20.28> now', start: 20.28, end: Infinity }
          ],
          translatedTexts: [],
          isEnhancedSynced: true,
          start: 18.113,
          end: Infinity
        }
      ],
      unparsedLyrics:
        '[00:14.871] This <00:15.138> party <00:16.273> is <00:16.563> too <00:17.116> loud\n[00:18.113] I <00:18.365> see <00:18.817> you <00:19.643> with <00:19.972> her <00:20.28> now',
      translatedLanguages: [],
      offset: 0
    });
  });

  test('Parsing a syncedLyrics string without song metadata', () => {
    const parsedLyrics = parseLyrics(syncedLyricsString);
    // console.log('Parsed Synced Lyrics Without Song Metadata : \n', JSON.stringify(parsedLyrics));

    expect(parsedLyrics).toEqual({
      isReset: false,
      isRomanized: false,
      isSynced: true,
      isTranslated: false,
      copyright: undefined,
      parsedLyrics: [
        {
          convertedLyrics: '',
          originalText: 'Waiting for the time to pass you by',
          translatedTexts: [],
          isEnhancedSynced: false,
          start: 9.81,
          end: 14.06
        },
        {
          convertedLyrics: '',
          originalText: 'Hope the winds of change will change your mind',
          translatedTexts: [],
          isEnhancedSynced: false,
          start: 14.06,
          end: 19.11
        },
        {
          convertedLyrics: '',
          originalText: 'I could give a thousand reasons why',
          translatedTexts: [],
          isEnhancedSynced: false,
          start: 19.11,
          end: Infinity
        }
      ],
      unparsedLyrics: syncedLyricsString,
      originalLanguage: undefined,
      translatedLanguages: [],
      offset: 0
    });
  });

  test('Parsing a syncedLyrics string with translation and without song metadata', () => {
    const parsedLyrics = parseLyrics(syncedLyricsWithTranslationString);
    console.log(
      'Parsed Synced Lyrics With Translation And Without Song Metadata : \n',
      JSON.stringify(parsedLyrics)
    );

    expect(parsedLyrics).toEqual({
      isReset: false,
      isRomanized: false,
      isSynced: true,
      isTranslated: true,
      copyright: undefined,
      parsedLyrics: [
        {
          convertedLyrics: '',
          originalText: 'Waiting for the time to pass you by',
          translatedTexts: [{ lang: 'en', text: 'Waiting for the time to pass you by' }],
          isEnhancedSynced: false,
          start: 9.81,
          end: 14.06
        },
        {
          convertedLyrics: '',
          originalText: 'Hope the winds of change will change your mind',
          translatedTexts: [{ lang: 'en', text: 'Hope the winds of change will change your mind' }],
          isEnhancedSynced: false,
          start: 14.06,
          end: 19.11
        },
        {
          convertedLyrics: '',
          originalText: 'I could give a thousand reasons why',
          translatedTexts: [{ lang: 'en', text: 'I could give a thousand reasons why' }],
          isEnhancedSynced: false,
          start: 19.11,
          end: Infinity
        }
      ],
      unparsedLyrics: syncedLyricsWithTranslationString,
      originalLanguage: undefined,
      translatedLanguages: ['en'],
      offset: 0
    });
  });

  test('Parsing an unsyncedLyrics string without song metadata', () => {
    const parsedLyrics = parseLyrics(unsyncedLyricsString);
    // console.log('Parsed Unsynced Lyrics : \n', JSON.stringify(parsedLyrics));

    expect(parsedLyrics).toEqual({
      isReset: false,
      isRomanized: false,
      isSynced: false,
      isTranslated: false,
      copyright: undefined,
      parsedLyrics: [
        {
          convertedLyrics: '',
          originalText: 'Waiting for the time to pass you by',
          translatedTexts: [],
          isEnhancedSynced: false,
          start: undefined,
          end: undefined
        },
        {
          convertedLyrics: '',
          originalText: 'Hope the winds of change will change your mind',
          translatedTexts: [],
          isEnhancedSynced: false,
          start: undefined,
          end: undefined
        },
        {
          convertedLyrics: '',
          originalText: 'I could give a thousand reasons why',
          translatedTexts: [],
          isEnhancedSynced: false,
          start: undefined,
          end: undefined
        }
      ],
      unparsedLyrics: unsyncedLyricsString,
      originalLanguage: undefined,
      translatedLanguages: [],
      offset: 0
    });
  });

  test('Parsing an unsyncedLyrics string with translation and without song metadata', () => {
    const parsedLyrics = parseLyrics(unsyncedLyricsWithTranslationString);
    console.log(
      'Parsed Unsynced Lyrics With Translation And Without Song Metadata : \n',
      JSON.stringify(parsedLyrics)
    );

    expect(parsedLyrics).toEqual({
      isReset: false,
      isRomanized: false,
      isSynced: false,
      isTranslated: true,
      copyright: undefined,
      parsedLyrics: [
        {
          convertedLyrics: '',
          originalText: 'Waiting for the time to pass you by',
          translatedTexts: [{ lang: 'en', text: 'Waiting for the time to pass you by' }],
          isEnhancedSynced: false,
          start: undefined,
          end: undefined
        },
        {
          convertedLyrics: '',
          originalText: 'Hope the winds of change will change your mind',
          translatedTexts: [{ lang: 'en', text: 'Hope the winds of change will change your mind' }],
          isEnhancedSynced: false,
          start: undefined,
          end: undefined
        },
        {
          convertedLyrics: '',
          originalText: 'I could give a thousand reasons why',
          translatedTexts: [{ lang: 'en', text: 'I could give a thousand reasons why' }],
          isEnhancedSynced: false,
          start: undefined,
          end: undefined
        }
      ],
      unparsedLyrics: unsyncedLyricsWithTranslationString,
      originalLanguage: undefined,
      translatedLanguages: ['en'],
      offset: 0
    });
  });

  test('Parsing synced lyrics from audio data source', () => {
    const parsedLyrics = parseSyncedLyricsFromAudioDataSource(syncedLyricsFromSongMetadata);
    // console.log('Parsed Synced Lyrics from Audio Source : \n', JSON.stringify(parsedLyrics));

    expect(parsedLyrics).toEqual({
      isReset: false,
      isRomanized: false,
      isSynced: true,
      isTranslated: false,
      copyright: undefined,
      parsedLyrics: [
        {
          convertedLyrics: '',
          originalText: 'Waiting for the time to pass you by',
          translatedTexts: [],
          isEnhancedSynced: false,
          start: 9.81,
          end: 14.06
        },
        {
          convertedLyrics: '',
          originalText: 'Hope the winds of change will change your mind',
          translatedTexts: [],
          isEnhancedSynced: false,
          start: 14.06,
          end: 19.11
        },
        {
          convertedLyrics: '',
          originalText: 'I could give a thousand reasons why',
          translatedTexts: [],
          isEnhancedSynced: false,
          start: 19.11,
          end: Number.POSITIVE_INFINITY
        }
      ],
      unparsedLyrics: syncedLyricsString,
      originalLanguage: undefined,
      translatedLanguages: [],
      offset: 0
    });
  });
});
