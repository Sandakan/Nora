/* eslint-disable react/no-array-index-key */
/* eslint-disable no-restricted-syntax */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable consistent-return */
/* eslint-disable no-else-return */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react/self-closing-comp */
/* eslint-disable import/prefer-default-export */
import React from 'react';
// import { AppContext } from 'renderer/contexts/AppContext';
import { SongCard } from '../SongsPage/SongCard';
import { Artist } from '../ArtistPage/Artist';
import DefaultSongCover from '../../../../assets/images/song_cover_default.png';
import NoSongsImage from '../../../../assets/images/Empty Inbox _Monochromatic.svg';
import DataFetchingImage from '../../../../assets/images/Umbrella_Monochromatic.svg';
// import ResetAppConfirmationPrompt from './ResetAppConfirmationPrompt';

interface HomePageReducer {
  songsData: (AudioInfo | null)[];
  recentlyPlayedSongsData: SongData[];
  recentSongArtists: Artist[];
}

type HomePageReducerActionTypes =
  | 'SONGS_DATA'
  | 'RECENTLY_PLAYED_SONGS_DATA'
  | 'RECENT_SONGS_ARTISTS';

const reducer = (
  state: HomePageReducer,
  action: { type: HomePageReducerActionTypes; data?: any }
): HomePageReducer => {
  switch (action.type) {
    case 'SONGS_DATA':
      return {
        ...state,
        songsData: action.data,
      };
    case 'RECENTLY_PLAYED_SONGS_DATA':
      return {
        ...state,
        recentlyPlayedSongsData: action.data,
      };
    case 'RECENT_SONGS_ARTISTS':
      return {
        ...state,
        recentSongArtists: action.data,
      };
    default:
      return state;
  }
};

export const HomePage = () => {
  // const {
  //   updateContextMenuData,
  //   changePromptMenuData,
  //   updateNotificationPanelData,
  // } = useContext(AppContext);

  const [content, dispatch] = React.useReducer(reducer, {
    songsData: [],
    recentlyPlayedSongsData: [],
    recentSongArtists: [],
  });

  const fetchAllSongs = () => {
    window.api.getAllSongs('dateAddedAscending', 1, 5).then((audioData) => {
      if (!audioData || audioData.data.length === 0)
        return dispatch({ type: 'SONGS_DATA', data: [null] });
      else {
        dispatch({
          type: 'SONGS_DATA',
          data: audioData.data,
        });
        return undefined;
      }
    });
  };

  const fetchUserData = () => {
    window.api.getUserData().then((res) => {
      if (!res) return undefined;
      dispatch({
        type: 'RECENTLY_PLAYED_SONGS_DATA',
        data: res.recentlyPlayedSongs,
      });
      return undefined;
    });
  };

  const fetchRecentArtistsData = React.useCallback(() => {
    if (content.recentlyPlayedSongsData.length > 0) {
      window.api
        .getArtistData(
          content.recentlyPlayedSongsData
            .map((song) =>
              song.artists
                ? [...new Set(song.artists.map((artist) => artist.artistId))]
                : []
            )
            .flat()
            .filter((_, index) => index < 5)
        )
        .then((res) => {
          if (res && Array.isArray(res))
            dispatch({
              type: 'RECENT_SONGS_ARTISTS',
              data: res,
            });
        });
    }
  }, [content.recentlyPlayedSongsData]);

  React.useEffect(() => {
    fetchUserData();
    fetchAllSongs();
    window.api.dataUpdateEvent((_, dataType) => {
      if (dataType === 'userData/recentlyPlayedSongs') fetchUserData();
      if (
        dataType === 'songs' ||
        dataType === 'songs/deletedSong' ||
        dataType === 'songs/newSong'
      )
        fetchAllSongs();
      if (dataType === 'artists/artworks') fetchRecentArtistsData();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(fetchRecentArtistsData, [fetchRecentArtistsData]);

  const addNewSongs = () => {
    dispatch({ type: 'SONGS_DATA', data: [] });
    window.api
      .addMusicFolder()
      .then((songs) => {
        const relevantSongsData: AudioInfo[] = songs.map((song) => {
          return {
            title: song.title,
            songId: song.songId,
            artists: song.artists,
            duration: song.duration,
            palette: song.palette,
            path: song.path,
            artworkPath: song.artworkPath,
            addedDate: song.addedDate,
          };
        });
        dispatch({ type: 'SONGS_DATA', data: relevantSongsData });
      })
      // eslint-disable-next-line no-console
      .catch(() => dispatch({ type: 'SONGS_DATA', data: [null] }));
  };

  const recentlyPlayedSongs = content.recentlyPlayedSongsData
    .filter((_, index) => index < 3)
    .map((song, index) => {
      return (
        <SongCard
          key={`${song.songId}-${index}`}
          title={song.title}
          artworkPath={song.artworkPath || DefaultSongCover}
          path={song.path}
          duration={song.duration}
          songId={song.songId}
          artists={song.artists}
          palette={song.palette}
        />
      );
    });

  const recentlyPlayedSongArtists =
    content.recentlyPlayedSongsData.length > 0
      ? content.recentSongArtists
          .map((val, index) => {
            if (val)
              return (
                <Artist
                  name={val.name}
                  key={`${val.artistId}-${index}`}
                  artworkPath={val.artworkPath}
                  artistId={val.artistId}
                  songIds={val.songs.map((song) => song.songId)}
                  onlineArtworkPaths={val.onlineArtworkPaths}
                />
              );
            else return undefined;
          })
          .filter((x) => x !== undefined)
      : [];

  return (
    <div
      className="main-container home-page"
      // onContextMenu={(e) => {
      //   e.preventDefault();
      //   e.stopPropagation();
      //   updateContextMenuData(
      //     true,
      //     [
      //       {
      //         label: 'Alert Error',
      //         iconName: 'report',
      //         handlerFunction: () =>
      //           changePromptMenuData(
      //             true,
      //             <ErrorPrompt isFatal />,
      //             'error-alert-prompt'
      //           ),
      //       },
      //     ],
      //     e.pageX,
      //     e.pageY
      //   );
      // }}
    >
      {content.songsData.length > 0 && content.songsData[0] !== null && (
        <div className="main-container recently-added-songs-container appear-from-bottom">
          <div className="title-container">Recently Added Songs</div>
          <div className="songs-container">
            {content.songsData
              .filter((_, index) => index < 3)
              .map((song, index) => {
                const songData = song as AudioInfo;
                return (
                  <SongCard
                    key={`${songData.songId}-${index}`}
                    title={songData.title}
                    artworkPath={songData.artworkPath || DefaultSongCover}
                    path={songData.path}
                    duration={songData.duration}
                    songId={songData.songId}
                    artists={songData.artists}
                    palette={songData.palette}
                  />
                );
              })}
          </div>
        </div>
      )}
      {recentlyPlayedSongs.length > 0 && (
        <div className="main-container recently-played-songs-container appear-from-bottom">
          <div className="title-container">Recently Played Songs</div>
          <div className="songs-container">{recentlyPlayedSongs}</div>
        </div>
      )}
      {recentlyPlayedSongArtists.length > 0 && (
        <div className="main-container artists-list-container appear-from-bottom">
          <div className="title-container">Recent Artists</div>
          <div className="artists-container">{recentlyPlayedSongArtists}</div>
        </div>
      )}
      {content.songsData[0] === null && (
        <div className="no-songs-container">
          <img src={NoSongsImage} alt="No songs available." />
          <div>There&apos;s nothing here. Do you know where are they?</div>
          <button type="button" id="add-new-song-folder" onClick={addNewSongs}>
            Add Folder
          </button>
        </div>
      )}
      {recentlyPlayedSongs.length === 0 && content.songsData.length === 0 && (
        <div className="no-songs-container">
          <img src={DataFetchingImage} alt="Stay calm" />
          <span>Just hold on. We are readying everything for you...</span>
        </div>
      )}
    </div>
  );
};
