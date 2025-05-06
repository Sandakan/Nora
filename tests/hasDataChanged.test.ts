import hasDataChanged, { isDataChanged } from '../src/renderer/src/utils/hasDataChanged';

describe('hasDataChanged function check', () => {
  test('Basic comparisons with boolean returns', () => {
    const obj1 = { a: 1, b: '2', c: 3 } as object;
    const obj2 = { a: 1, b: 2, c: 3 } as object;

    expect(isDataChanged(obj1, obj1)).toBe(false);
    expect(isDataChanged(obj2, obj2)).toBe(false);
    expect(isDataChanged(obj1, obj2)).toBe(true);
  });

  test('Basic comparisons including arrays with boolean returns', () => {
    const obj3 = { a: 1, b: ['2'], c: 3 } as object;
    const obj4 = { a: 1, b: [2], c: 3 } as object;

    expect(isDataChanged(obj3, obj3)).toBe(false);
    expect(isDataChanged(obj4, obj4)).toBe(false);
    expect(isDataChanged(obj3, obj4)).toBe(true);
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
      songs: {
        current: [
          {
            songId: 'GsEGhFOgMA',
            title: 'Love Like This'
          }
        ],
        isModified: false,
        prev: [
          {
            songId: 'GsEGhFOgMA',
            title: 'Love Like This'
          }
        ]
      }
    };

    const output2 = {
      album: {
        current: {
          albumId: 'JhoYsOGGVY',
          artists: ['Jessica Andrea'],
          artworkName: 'GsEGhFOgMA.webp',
          artworkPath:
            'nora:\\localFiles\\C:\\Users\\adsan\\AppData\\Roaming\\Nora\\song_covers\\GsEGhFOgMA.webp?ts=1699108835053',
          noOfSongs: 1,
          songs: [
            {
              songId: 'GsEGhFOgMA',
              title: 'Love Like This'
            }
          ],
          title: 'Love Like This',
          year: 2020
        },
        isModified: false,
        prev: {
          albumId: 'JhoYsOGGVY',
          artists: ['Jessica Andrea'],
          artworkName: 'GsEGhFOgMA.webp',
          artworkPath:
            'nora:\\localFiles\\C:\\Users\\adsan\\AppData\\Roaming\\Nora\\song_covers\\GsEGhFOgMA.webp?ts=1699108835053',
          noOfSongs: 1,
          songs: [
            {
              songId: 'GsEGhFOgMA',
              title: 'Love Like This'
            }
          ],
          title: 'Love Like This',
          year: 2020
        }
      },
      artists: {
        current: [
          {
            artistId: 'NDqQmRUlWj',
            artworkName: 'GsEGhFOgMA.webp',
            isAFavorite: false,
            name: 'Jessica Andrea',
            onlineArtworkPaths: {
              picture_medium:
                'https://e-cdns-images.dzcdn.net/images/artist/2c54c5a0b0593a1c454def8cf6f31902/250x250-000000-80-0-0.jpg',
              picture_small:
                'https://e-cdns-images.dzcdn.net/images/artist/2c54c5a0b0593a1c454def8cf6f31902/56x56-000000-80-0-0.jpg',
              picture_xl:
                'https://e-cdns-images.dzcdn.net/images/artist/2c54c5a0b0593a1c454def8cf6f31902/1000x1000-000000-80-0-0.jpg'
            },
            songs: [
              {
                songId: 'GsEGhFOgMA',
                title: 'Love Like This'
              }
            ]
          }
        ],
        isModified: false,
        prev: [
          {
            artistId: 'NDqQmRUlWj',
            artworkName: 'GsEGhFOgMA.webp',
            isAFavorite: false,
            name: 'Jessica Andrea',
            onlineArtworkPaths: {
              picture_medium:
                'https://e-cdns-images.dzcdn.net/images/artist/2c54c5a0b0593a1c454def8cf6f31902/250x250-000000-80-0-0.jpg',
              picture_small:
                'https://e-cdns-images.dzcdn.net/images/artist/2c54c5a0b0593a1c454def8cf6f31902/56x56-000000-80-0-0.jpg',
              picture_xl:
                'https://e-cdns-images.dzcdn.net/images/artist/2c54c5a0b0593a1c454def8cf6f31902/1000x1000-000000-80-0-0.jpg'
            },
            songs: [
              {
                songId: 'GsEGhFOgMA',
                title: 'Love Like This'
              }
            ]
          }
        ]
      },
      artworkPath: {
        current:
          'nora:\\localFiles\\C:\\Users\\adsan\\AppData\\Roaming\\Nora\\song_covers\\GsEGhFOgMA.webp?ts=1699108835053',
        isModified: false,
        prev: 'nora:\\localFiles\\C:\\Users\\adsan\\AppData\\Roaming\\Nora\\song_covers\\GsEGhFOgMA.webp?ts=1699108835053'
      },
      duration: {
        current: 182.47,
        isModified: false,
        prev: 182.47
      },
      genres: {
        current: [],
        isModified: false,
        prev: []
      },
      isLyricsSavePending: {
        current: false,
        isModified: false,
        prev: false
      },
      isMetadataSavePending: {
        current: false,
        isModified: false,
        prev: false
      },
      releasedYear: {
        current: 2020,
        isModified: false,
        prev: 2020
      },
      synchronizedLyrics: {
        current:
          "[00:00.69] Ha-yay, ha-yay, yeah\n[00:05.77] You could make my heart beat stronger than a drumbeat\n[00:09.44] Drown by the screams when the show starts\n[02:52.76] Ooh, but you should know that I don't always love like this\n[02:59.95] ♪",
        isModified: false,
        prev: "[00:00.69] Ha-yay, ha-yay, yeah\n[00:05.77] You could make my heart beat stronger than a drumbeat\n[00:09.44] Drown by the screams when the show starts\n[02:52.76] Ooh, but you should know that I don't always love like this\n[02:59.95] ♪"
      },
      title: {
        current: 'Love Like This',
        isModified: false,
        prev: 'Love Like This'
      },
      trackNumber: {
        current: 1,
        isModified: false,
        prev: 1
      }
    };

    expect(hasDataChanged(obj1, obj1)).toStrictEqual(output1);
    expect(hasDataChanged(obj2, obj2)).toStrictEqual(output1);

    expect(hasDataChanged(obj1, obj2)).toStrictEqual(output1);

    expect(hasDataChanged(obj3, obj3)).toStrictEqual(output2);
    expect(hasDataChanged(obj4, obj4)).toStrictEqual(output2);

    expect(hasDataChanged(obj3, obj4)).toStrictEqual(output2);
  });
});
