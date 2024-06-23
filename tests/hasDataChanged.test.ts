import hasDataChanged from '../src/renderer/src/utils/hasDataChanged';

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
      songs: [{ songId: 'GsEGhFOgMA', title: 'Love Like This' }]
    };

    const obj2 = {
      songs: [{ songId: 'GsEGhFOgMA', title: 'Love Like This' }]
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
              'https://e-cdns-images.dzcdn.net/images/artist/2c54c5a0b0593a1c454def8cf6f31902/1000x1000-000000-80-0-0.jpg'
          }
        }
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
          'nora:\\localFiles\\C:\\Users\\adsan\\AppData\\Roaming\\Nora\\song_covers\\GsEGhFOgMA.webp?ts=1699108835053'
      },
      genres: [],
      releasedYear: 2020,
      synchronizedLyrics:
        "[00:00.69] Ha-yay, ha-yay, yeah\n[00:05.77] You could make my heart beat stronger than a drumbeat\n[00:09.44] Drown by the screams when the show starts\n[02:52.76] Ooh, but you should know that I don't always love like this\n[02:59.95] ♪",
      artworkPath:
        'nora:\\localFiles\\C:\\Users\\adsan\\AppData\\Roaming\\Nora\\song_covers\\GsEGhFOgMA.webp?ts=1699108835053',
      duration: 182.47,
      trackNumber: 1,
      isLyricsSavePending: false,
      isMetadataSavePending: false
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
              'https://e-cdns-images.dzcdn.net/images/artist/2c54c5a0b0593a1c454def8cf6f31902/1000x1000-000000-80-0-0.jpg'
          }
        }
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
          'nora:\\localFiles\\C:\\Users\\adsan\\AppData\\Roaming\\Nora\\song_covers\\GsEGhFOgMA.webp?ts=1699108835053'
      },
      genres: [],
      releasedYear: 2020,
      synchronizedLyrics:
        "[00:00.69] Ha-yay, ha-yay, yeah\n[00:05.77] You could make my heart beat stronger than a drumbeat\n[00:09.44] Drown by the screams when the show starts\n[02:52.76] Ooh, but you should know that I don't always love like this\n[02:59.95] ♪",
      artworkPath:
        'nora:\\localFiles\\C:\\Users\\adsan\\AppData\\Roaming\\Nora\\song_covers\\GsEGhFOgMA.webp?ts=1699108835053',
      duration: 182.47,
      trackNumber: 1,
      isLyricsSavePending: false,
      isMetadataSavePending: false
    };

    const output1 = {
      songs: false
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
      trackNumber: false
    };

    expect(hasDataChanged(obj1, obj1)).toStrictEqual(output1);
    expect(hasDataChanged(obj2, obj2)).toStrictEqual(output1);

    expect(hasDataChanged(obj1, obj2)).toStrictEqual(output1);

    expect(hasDataChanged(obj3, obj3)).toStrictEqual(output2);
    expect(hasDataChanged(obj4, obj4)).toStrictEqual(output2);

    expect(hasDataChanged(obj3, obj4)).toStrictEqual(output2);
  });
});
