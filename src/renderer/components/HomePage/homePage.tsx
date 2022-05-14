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
import React, { useContext } from 'react';
import sortSongs from 'renderer/utils/sortSongs';
import { AppContext } from 'renderer/contexts/AppContext';
import { SongCard } from '../SongsPage/songCard';
import ErrorPrompt from '../ErrorPrompt';
import { Artist } from '../ArtistPage/Artist';
import DefaultSongCover from '../../../../assets/images/song_cover_default.png';
import NoSongsImage from '../../../../assets/images/empty-folder.png';
import ResetAppConfirmationPrompt from './ResetAppConfirmationPrompt';

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
  const {
    updateContextMenuData,
    currentlyActivePage,
    changeCurrentActivePage,
    updateNotificationPanelData,
    changePromptMenuData,
  } = useContext(AppContext);

  const [content, dispatch] = React.useReducer(reducer, {
    songsData: [],
    recentlyPlayedSongsData: [],
    recentSongArtists: [],
  });

  React.useEffect(() => {
    window.api.checkForSongs().then((audioData) => {
      if (!audioData || audioData.length === 0)
        return dispatch({ type: 'SONGS_DATA', data: [null] });
      else {
        dispatch({
          type: 'SONGS_DATA',
          data: sortSongs(audioData, 'dateAddedAscending').slice(0, 5),
        });
        return undefined;
      }
    });
  }, []);

  React.useEffect(() => {
    window.api.getUserData().then((res) => {
      if (!res) return undefined;
      dispatch({
        type: 'RECENTLY_PLAYED_SONGS_DATA',
        data: res.recentlyPlayedSongs.slice(0, 4),
      });
      return undefined;
    });
  }, []);

  React.useEffect(() => {
    if (content.recentlyPlayedSongsData.length > 0) {
      window.api.getArtistData('*').then((res) => {
        if (res && Array.isArray(res))
          dispatch({
            type: 'RECENT_SONGS_ARTISTS',
            data: res.filter((x) =>
              content.recentlyPlayedSongsData.some((y) =>
                y.artistsId ? y.artistsId.some((z) => z === x.artistId) : false
              )
            ),
          });
      });
    }
  }, [content.recentlyPlayedSongsData]);

  const addNewSongs = () => {
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
      .catch((err) => window.api.sendLogs(err));
  };

  const recentlyPlayedSongs = content.recentlyPlayedSongsData
    .filter((_, index) => index < 3)
    .map((song) => {
      return (
        <SongCard
          key={song.songId}
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

  // TODO - THIS HAS ALL THE ARTISTS DATA WHICH ALL OF THEM ARE NOT REQUIRED HERE
  const recentlyPlayedSongArtists =
    content.recentlyPlayedSongsData.length > 0
      ? content.recentSongArtists
          .map((val, index) => {
            if (val)
              return (
                <Artist
                  name={val.name}
                  key={index}
                  artworkPath={val.artworkPath}
                  changeCurrentActivePage={changeCurrentActivePage}
                  currentlyActivePage={currentlyActivePage}
                />
              );
            else return undefined;
          })
          .filter((x) => x !== undefined)
      : [];

  return (
    <div
      className="main-container home-page"
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        updateContextMenuData(
          true,
          [
            {
              label: 'Resync Songs',
              iconName: 'sync',
              handlerFunction: () =>
                window.api
                  .resyncSongsLibrary()
                  .then(() =>
                    updateNotificationPanelData(
                      5000,
                      <span>Songs Library updated successfully.</span>
                    )
                  )
                  .catch(() => {
                    updateNotificationPanelData(
                      5000,
                      <span>Resyncing Songs Library failed.</span>
                    );
                  }),
            },
            {
              label: 'Reset App',
              iconName: 'auto_mode',
              handlerFunction: () =>
                changePromptMenuData(
                  true,
                  <ResetAppConfirmationPrompt />,
                  'confirm-app-reset'
                ),
            },
            {
              label: 'Alert Error',
              iconName: 'report',
              handlerFunction: () =>
                changePromptMenuData(
                  true,
                  <ErrorPrompt isFatal />,
                  'error-alert-prompt'
                ),
            },
          ],
          e.pageX,
          e.pageY
        );
      }}
    >
      {content.songsData.length > 0 && content.songsData[0] !== null && (
        <div className="main-container recently-added-songs-container">
          <div className="title-container">Recently Added Songs</div>
          <div className="songs-container">
            {content.songsData
              .filter((_, index) => index < 3)
              .map((song) => {
                const songData = song as AudioInfo;
                return (
                  <SongCard
                    key={songData.songId}
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
        <div className="main-container recently-played-songs-container">
          <div className="title-container">Recently Played Songs</div>
          <div className="songs-container">{recentlyPlayedSongs}</div>
        </div>
      )}
      {recentlyPlayedSongArtists.length > 0 && (
        <div className="main-container artists-list-container">
          <div className="title-container">Recent Artists</div>
          <div className="artists-container">{recentlyPlayedSongArtists}</div>
        </div>
      )}
      {content.songsData[0] === null && (
        <div className="no-songs-container">
          <img src={NoSongsImage} alt="" />
          <span>We couldn't find any songs in your system.</span>
          <button type="button" id="add-new-song-folder" onClick={addNewSongs}>
            <i className="fa-solid fa-plus"></i> Add Folder
          </button>
        </div>
      )}
      {recentlyPlayedSongs.length === 0 && content.songsData.length === 0 && (
        <div className="no-songs-container">
          <span>Fetching your songs...</span>
        </div>
      )}
    </div>
  );
};
