import hasDataChanged from '../src/renderer/utils/hasDataChanged';

describe('hasDataChanged function check', () => {
  test('Basic comparisons with boolean returns', () => {
    const obj1 = { a: 1, b: '2', c: 3 };
    const obj2 = { a: 1, b: 2, c: 3 };

    expect(hasDataChanged(obj1, obj1, true)).toBe(false);
    expect(hasDataChanged(obj2, obj2, true)).toBe(false);
    expect(hasDataChanged(obj1, obj2, true)).toBe(true);
  });

  test('Basic comparisons including arrays with boolean returns', () => {
    const obj3 = { a: 1, b: ['2'], c: 3 };
    const obj4 = { a: 1, b: [2], c: 3 };

    expect(hasDataChanged(obj3, obj3, true)).toBe(false);
    expect(hasDataChanged(obj4, obj4, true)).toBe(false);
    expect(hasDataChanged(obj3, obj4, true)).toBe(true);
  });

  test('Complex comparisons with boolean returns', () => {
    const obj1 = {
      songs: [{ songId: 'GsEGhFOgMA', title: 'Love Like This' }],
    };

    const obj2 = {
      songs: [{ songId: 'GsEGhFOgMA', title: 'Love Like This' }],
    };

    const obj3 = {
      title: 'Love Like This',
      artists: [
        {
          name: 'Jessica Andrea',
          artistId: 'NDqQmRUlWj',
          songs: [{ songId: 'GsEGhFOgMA', title: 'Love Like This' }],
          artworkName: 'GsEGhFOgMA.webp',
          isAFavorite: false,
          onlineArtworkPaths: {
            picture_small:
              'https://e-cdns-images.dzcdn.net/images/artist/2c54c5a0b0593a1c454def8cf6f31902/56x56-000000-80-0-0.jpg',
            picture_medium:
              'https://e-cdns-images.dzcdn.net/images/artist/2c54c5a0b0593a1c454def8cf6f31902/250x250-000000-80-0-0.jpg',
            picture_xl:
              'https://e-cdns-images.dzcdn.net/images/artist/2c54c5a0b0593a1c454def8cf6f31902/1000x1000-000000-80-0-0.jpg',
          },
        },
      ],
      album: {
        title: 'Love Like This',
        artworkName: 'GsEGhFOgMA.webp',
        year: 2020,
        albumId: 'JhoYsOGGVY',
        artists: ['Jessica Andrea'],
        songs: [{ songId: 'GsEGhFOgMA', title: 'Love Like This' }],
        noOfSongs: 1,
        artworkPath:
          'nora:\\localFiles\\C:\\Users\\adsan\\AppData\\Roaming\\Nora\\song_covers\\GsEGhFOgMA.webp?ts=1699108835053',
      },
      genres: [],
      releasedYear: 2020,
      synchronizedLyrics:
        "[00:00.69] Ha-yay, ha-yay, yeah\n[00:05.77] You could make my heart beat stronger than a drumbeat\n[00:09.44] Drown by the screams when the show starts\n[00:12.47] You cover me in goosebumps, just thinkin' about us\n[00:15.85] Kinda makes me want to take it too far\n[00:18.55] You wear gold in my head\n[00:21.5] I'm living for the good, feels like a highlight reel\n[00:24.97] I knew the moment we met\n[00:27.61] You started as a good time, you came at the right time\n[00:31.37] But you should know that I don't always love like this\n[00:35.13] Laying in my bed, always thinkin' about it\n[00:38.38] Don't believe in heaven but I think I just found it\n[00:41.62] You say my name, that's the best that it sounded\n[00:44.84] I never knew I could love like this\n[00:47.82] Didn't mean to fall, but baby, it happened\n[00:51.21] You kissed my lips and it tasted just like magic\n[00:54.77] Ooh, but you should know that I don't always love like this\n[01:01.36] Ha-yay, ha-yay, yeah\n[01:06.76] Endless conversations, talking 'til the day ends\n[01:10.21] Finally fall asleep at sunrise\n[01:13.18] You don't have to tell me that you really want me\n[01:16.63] 'Cause you said it all with your eyes\n[01:19.39] You wear gold in my head\n[01:22.3] I'm living for the good, feels like a highlight reel\n[01:25.72] I knew the moment we met\n[01:28.48] You started as a good time, you came at the right time\n[01:32.29] But you should know that I don't always love like this\n[01:35.6] Laying in my bed, always thinkin' about it\n[01:39.12] Don't believe in heaven but I think I just found it\n[01:42.73] You say my name, that's the best that it sounded\n[01:45.62] I never knew I could love like this\n[01:48.6] Didn't mean to fall, but baby, it happened\n[01:52.1] You kissed my lips and it tasted just like magic\n[01:55.56] Ooh, but you should know that I don't always love like this\n[02:01.67] Ooh, but you should know that I don't always love like this\n[02:08.5] Cover me in goosebumps, just thinkin' about us\n[02:13.81] You cover me in goosebumps, just thinkin' about us\n[02:17.67] Kinda makes me want to take it too far\n[02:20.51] Laying in my bed, always thinkin' about it\n[02:24.2] Don't believe in heaven but I think I just found it\n[02:27.24] You say my name, that's the best that it sounded\n[02:30.44] I never knew I could love like this\n[02:33.32] Didn't mean to fall, but baby, it happened\n[02:36.95] You kissed my lips and it tasted just like magic\n[02:40.19] Ooh, but you should know that I don't always love like this\n[02:46.34] Ooh, but you should know that I don't always love like this\n[02:52.76] Ooh, but you should know that I don't always love like this\n[02:59.95] ♪",
      artworkPath:
        'nora:\\localFiles\\C:\\Users\\adsan\\AppData\\Roaming\\Nora\\song_covers\\GsEGhFOgMA.webp?ts=1699108835053',
      duration: 182.47,
      trackNumber: 1,
      isLyricsSavePending: false,
      isMetadataSavePending: false,
    };
    const obj4 = {
      title: 'Love Like This',
      artists: [
        {
          name: 'Jessica Andrea',
          artistId: 'NDqQmRUlWj',
          songs: [{ songId: 'GsEGhFOgMA', title: 'Love Like This' }],
          artworkName: 'GsEGhFOgMA.webp',
          isAFavorite: false,
          onlineArtworkPaths: {
            picture_small:
              'https://e-cdns-images.dzcdn.net/images/artist/2c54c5a0b0593a1c454def8cf6f31902/56x56-000000-80-0-0.jpg',
            picture_medium:
              'https://e-cdns-images.dzcdn.net/images/artist/2c54c5a0b0593a1c454def8cf6f31902/250x250-000000-80-0-0.jpg',
            picture_xl:
              'https://e-cdns-images.dzcdn.net/images/artist/2c54c5a0b0593a1c454def8cf6f31902/1000x1000-000000-80-0-0.jpg',
          },
        },
      ],
      album: {
        title: 'Love Like This',
        artworkName: 'GsEGhFOgMA.webp',
        year: 2020,
        albumId: 'JhoYsOGGVY',
        artists: ['Jessica Andrea'],
        songs: [{ songId: 'GsEGhFOgMA', title: 'Love Like This' }],
        noOfSongs: 1,
        artworkPath:
          'nora:\\localFiles\\C:\\Users\\adsan\\AppData\\Roaming\\Nora\\song_covers\\GsEGhFOgMA.webp?ts=1699108835053',
      },
      genres: [],
      releasedYear: 2020,
      synchronizedLyrics:
        "[00:00.69] Ha-yay, ha-yay, yeah\n[00:05.77] You could make my heart beat stronger than a drumbeat\n[00:09.44] Drown by the screams when the show starts\n[00:12.47] You cover me in goosebumps, just thinkin' about us\n[00:15.85] Kinda makes me want to take it too far\n[00:18.55] You wear gold in my head\n[00:21.5] I'm living for the good, feels like a highlight reel\n[00:24.97] I knew the moment we met\n[00:27.61] You started as a good time, you came at the right time\n[00:31.37] But you should know that I don't always love like this\n[00:35.13] Laying in my bed, always thinkin' about it\n[00:38.38] Don't believe in heaven but I think I just found it\n[00:41.62] You say my name, that's the best that it sounded\n[00:44.84] I never knew I could love like this\n[00:47.82] Didn't mean to fall, but baby, it happened\n[00:51.21] You kissed my lips and it tasted just like magic\n[00:54.77] Ooh, but you should know that I don't always love like this\n[01:01.36] Ha-yay, ha-yay, yeah\n[01:06.76] Endless conversations, talking 'til the day ends\n[01:10.21] Finally fall asleep at sunrise\n[01:13.18] You don't have to tell me that you really want me\n[01:16.63] 'Cause you said it all with your eyes\n[01:19.39] You wear gold in my head\n[01:22.3] I'm living for the good, feels like a highlight reel\n[01:25.72] I knew the moment we met\n[01:28.48] You started as a good time, you came at the right time\n[01:32.29] But you should know that I don't always love like this\n[01:35.6] Laying in my bed, always thinkin' about it\n[01:39.12] Don't believe in heaven but I think I just found it\n[01:42.73] You say my name, that's the best that it sounded\n[01:45.62] I never knew I could love like this\n[01:48.6] Didn't mean to fall, but baby, it happened\n[01:52.1] You kissed my lips and it tasted just like magic\n[01:55.56] Ooh, but you should know that I don't always love like this\n[02:01.67] Ooh, but you should know that I don't always love like this\n[02:08.5] Cover me in goosebumps, just thinkin' about us\n[02:13.81] You cover me in goosebumps, just thinkin' about us\n[02:17.67] Kinda makes me want to take it too far\n[02:20.51] Laying in my bed, always thinkin' about it\n[02:24.2] Don't believe in heaven but I think I just found it\n[02:27.24] You say my name, that's the best that it sounded\n[02:30.44] I never knew I could love like this\n[02:33.32] Didn't mean to fall, but baby, it happened\n[02:36.95] You kissed my lips and it tasted just like magic\n[02:40.19] Ooh, but you should know that I don't always love like this\n[02:46.34] Ooh, but you should know that I don't always love like this\n[02:52.76] Ooh, but you should know that I don't always love like this\n[02:59.95] ♪",
      artworkPath:
        'nora:\\localFiles\\C:\\Users\\adsan\\AppData\\Roaming\\Nora\\song_covers\\GsEGhFOgMA.webp?ts=1699108835053',
      duration: 182.47,
      trackNumber: 1,
      isLyricsSavePending: false,
      isMetadataSavePending: false,
    };

    const output1 = {
      songs: false,
    };

    const output2 = {
      artists: false,
      album: false,
      artworkPath: false,
      duration: false,
      genres: false,
      isLyricsSavePending: false,
      isMetadataSavePending: false,
      releasedYear: false,
      synchronizedLyrics: false,
      title: false,
      trackNumber: false,
    };

    expect(hasDataChanged(obj1, obj1)).toStrictEqual(output1);
    expect(hasDataChanged(obj2, obj2)).toStrictEqual(output1);

    expect(hasDataChanged(obj1, obj2)).toStrictEqual(output1);

    expect(hasDataChanged(obj3, obj3)).toStrictEqual(output2);
    expect(hasDataChanged(obj4, obj4)).toStrictEqual(output2);

    expect(hasDataChanged(obj3, obj4)).toStrictEqual(output2);
  });
});
