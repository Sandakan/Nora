import { TagConstants } from 'node-id3';
import parseLyrics, {
  SyncedLyricsInput,
  parseSyncedLyricsFromAudioDataSource,
} from '../src/main/utils/parseLyrics';

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
      timeStamp: 9810,
    },
    {
      text: 'Hope the winds of change will change your mind',
      timeStamp: 14060,
    },
    { text: 'I could give a thousand reasons why', timeStamp: 19110 },
  ],
};

const syncedLyricsString = `[00:09.81] Waiting for the time to pass you by
[00:14.06] Hope the winds of change will change your mind
[00:19.11] I could give a thousand reasons why`;

const unsyncedLyricsString = `Waiting for the time to pass you by
Hope the winds of change will change your mind
I could give a thousand reasons why`;

const enhancedSyncedLyricsString = `[00:14.871] This <00:15.138> party <00:16.273> is <00:16.563> too <00:17.116> loud
[00:18.113] I <00:18.365> see <00:18.817> you <00:19.643> with <00:19.972> her <00:20.28> now`;

describe('Check the full output of parseLyrics function', () => {
  test('Parsing an enhanced syncedLyrics string without song metadata', () => {
    const parsedLyrics = parseLyrics(enhancedSyncedLyricsString);
    console.log('Parsed Synced Lyrics : \n', parsedLyrics);

    expect(parsedLyrics).toEqual<LyricsData>({
      isSynced: true,
      copyright: undefined,
      lyrics: [
        'This <00:15.138> party <00:16.273> is <00:16.563> too <00:17.116> loud',
        'I <00:18.365> see <00:18.817> you <00:19.643> with <00:19.972> her <00:20.28> now',
      ],
      syncedLyrics: [
        {
          text: [
            {
              text: 'This',
              unparsedText: '[00:14.871] This',
              start: 14.871,
              end: 15.138,
            },
            {
              text: 'party',
              unparsedText: '<00:15.138> party',
              start: 15.138,
              end: 16.273,
            },
            {
              text: 'is',
              unparsedText: '<00:16.273> is',
              start: 16.273,
              end: 16.563,
            },
            {
              text: 'too',
              unparsedText: '<00:16.563> too',
              start: 16.563,
              end: 17.116,
            },
            {
              text: 'loud',
              unparsedText: '<00:17.116> loud',
              start: 17.116,
              end: 18.113,
            },
          ],
          start: 14.871,
          end: 18.113,
        },
        {
          text: [
            {
              text: 'I',
              unparsedText: '[00:18.113] I',
              start: 18.113,
              end: 18.365,
            },
            {
              text: 'see',
              unparsedText: '<00:18.365> see',
              start: 18.365,
              end: 18.817,
            },
            {
              text: 'you',
              unparsedText: '<00:18.817> you',
              start: 18.817,
              end: 19.643,
            },
            {
              text: 'with',
              unparsedText: '<00:19.643> with',
              start: 19.643,
              end: 19.972,
            },
            {
              text: 'her',
              unparsedText: '<00:19.972> her',
              start: 19.972,
              end: 20.28,
            },
            {
              text: 'now',
              unparsedText: '<00:20.28> now',
              start: 20.28,
              end: Number.POSITIVE_INFINITY,
            },
          ],
          start: 18.113,
          end: Number.POSITIVE_INFINITY,
        },
      ],
      unparsedLyrics: enhancedSyncedLyricsString,
      offset: 0,
    });
  });

  test('Parsing a syncedLyrics string without song metadata', () => {
    const parsedLyrics = parseLyrics(syncedLyricsString);
    console.log('Parsed Synced Lyrics : \n', parsedLyrics);

    expect(parsedLyrics).toEqual<LyricsData>({
      isSynced: true,
      copyright: undefined,
      lyrics: [
        'Waiting for the time to pass you by',
        'Hope the winds of change will change your mind',
        'I could give a thousand reasons why',
      ],
      syncedLyrics: [
        {
          text: 'Waiting for the time to pass you by',
          start: 9.81,
          end: 14.06,
        },
        {
          text: 'Hope the winds of change will change your mind',
          start: 14.06,
          end: 19.11,
        },
        {
          text: 'I could give a thousand reasons why',
          start: 19.11,
          end: Number.POSITIVE_INFINITY,
        },
      ],
      unparsedLyrics: syncedLyricsString,
      offset: 0,
    });
  });

  test('Parsing an unsyncedLyrics string without song metadata', () => {
    const parsedLyrics = parseLyrics(unsyncedLyricsString);
    console.log('Parsed Unsynced Lyrics : \n', parsedLyrics);

    expect(parsedLyrics).toEqual<LyricsData>({
      isSynced: false,
      copyright: undefined,
      lyrics: [
        'Waiting for the time to pass you by',
        'Hope the winds of change will change your mind',
        'I could give a thousand reasons why',
      ],
      syncedLyrics: undefined,
      unparsedLyrics: unsyncedLyricsString,
      offset: 0,
    });
  });

  test('Parsing synced lyrics from audio data source', () => {
    const parsedLyrics = parseSyncedLyricsFromAudioDataSource(
      syncedLyricsFromSongMetadata,
    );
    console.log('Parsed Synced Lyrics from Audio Source : \n', parsedLyrics);

    expect(parsedLyrics).toEqual<LyricsData>({
      isSynced: true,
      copyright: undefined,
      lyrics: [
        'Waiting for the time to pass you by',
        'Hope the winds of change will change your mind',
        'I could give a thousand reasons why',
      ],
      syncedLyrics: [
        {
          text: 'Waiting for the time to pass you by',
          start: 9.81,
          end: 14.06,
        },
        {
          text: 'Hope the winds of change will change your mind',
          start: 14.06,
          end: 19.11,
        },
        {
          text: 'I could give a thousand reasons why',
          start: 19.11,
          end: Number.POSITIVE_INFINITY,
        },
      ],
      unparsedLyrics: syncedLyricsString,
      offset: 0,
    });
  });
});
