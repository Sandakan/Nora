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
import { SongCard } from '../SongsPage/songCard';
import { Artist } from '../ArtistPage/Artist';
import DefaultSongCover from '../../../../assets/images/song_cover_default.png';
import NoSongsImage from '../../../../assets/images/empty-folder.png';

interface HomePageProp {
  playSong: (songId: string) => void;
  updateContextMenuData: (
    isVisible: boolean,
    menuItems: any[],
    pageX?: number,
    pageY?: number
  ) => void;
  currentlyActivePage: { pageTitle: string; data?: any };
  changeCurrentActivePage: (pageTitle: string, data?: any) => void;
  // updateQueueData: (currentSongIndex?: number, queue?: string[]) => void;
  // queue: Queue;
}

export const HomePage = (props: HomePageProp) => {
  const songsData: SongData[] = [];
  const recentPlayedSongs: SongData[] = [];
  const z: Artist[] = [];
  const [songData, setSongData] = React.useState(songsData);
  const [recentlyPlayedSongsData, setRecentlyPlayedSongsData] =
    React.useState(recentPlayedSongs);
  const [recentSongArtists, setRecentSongArtists] = React.useState(z);

  React.useEffect(() => {
    window.api.checkForSongs().then((audioData) => {
      if (!audioData) return undefined;
      else {
        setSongData(audioData.slice(0, 5));
        return undefined;
      }
    });
  }, []);

  React.useEffect(() => {
    window.api.getUserData().then((res) => {
      if (!res) return undefined;
      setRecentlyPlayedSongsData(res.recentlyPlayedSongs.slice(0, 4));
      return undefined;
    });
  }, []);

  React.useEffect(() => {
    window.api.getArtistData('*').then((res) => {
      if (res && Array.isArray(res)) setRecentSongArtists(res);
    });
  }, []);

  const addNewSongs = () => {
    window.api.addMusicFolder().then((songs) => {
      setSongData(songs);
    });
  };

  const newlyAddedSongs = songData
    .sort((a, b) => {
      if (a.modifiedDate && b.modifiedDate) {
        return new Date(a.modifiedDate).getTime() <
          new Date(b.modifiedDate).getTime()
          ? 1
          : -1;
      }
      return 0;
    })
    .map((song, index) => {
      if (index < 3) {
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
            playSong={props.playSong}
            updateContextMenuData={props.updateContextMenuData}
            changeCurrentActivePage={props.changeCurrentActivePage}
            currentlyActivePage={props.currentlyActivePage}
          />
        );
      } else return undefined;
    })
    .filter((comp) => comp !== undefined);

  const recentlyPlayedSongs = recentlyPlayedSongsData
    .map((song, index) => {
      if (index < 3) {
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
            playSong={props.playSong}
            updateContextMenuData={props.updateContextMenuData}
            changeCurrentActivePage={props.changeCurrentActivePage}
            currentlyActivePage={props.currentlyActivePage}
          />
        );
      } else return undefined;
    })
    .filter((comp) => comp !== undefined);

  const recentlyPlayedSongArtists =
    recentlyPlayedSongsData.length > 0
      ? recentlyPlayedSongsData
          .slice(0, 5)
          .map((val) => (val.artistsId ? val.artistsId : []))
          .flat()
          .map((val, index) => {
            const artist = recentSongArtists.find((x) => x.artistId === val);
            if (artist)
              return (
                <Artist
                  name={artist.name}
                  key={index}
                  artworkPath={artist.artworkPath}
                  changeCurrentActivePage={props.changeCurrentActivePage}
                  currentlyActivePage={props.currentlyActivePage}
                />
              );
            else return undefined;
          })
          .filter((x) => x !== undefined)
      : [];
  //  recentlyPlayedSongsData
  //   .map((song, index) => {
  //     if (index < 4 && song.artistsId) {
  //       const arr = [];
  //       window.api.getArtistData(song.artistsId[0]).then((res) => {
  //         if (res && !Array.isArray(res))
  //           arr.push(
  //             <Artist
  //               name={res.name}
  //               artworkPath={res.artworkPath}
  //               key={index}
  //             />
  //           );
  //       });
  //       return Artist;
  //     }
  //     return undefined;
  //   })
  //   .flat(1)
  //   .filter((artist) => artist !== undefined);

  return (
    <div className="main-container home-page">
      {songData.length > 0 && (
        <div className="main-container recently-added-songs-container">
          <div className="title-container">Recently Added Songs</div>
          <div className="songs-container">{newlyAddedSongs}</div>
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
      {recentlyPlayedSongs.length === 0 && songData.length === 0 && (
        <div className="no-songs-container">
          <img src={NoSongsImage} alt="" />
          <span>We couldn't find any songs in your system.</span>
          <button type="button" id="add-new-song-folder" onClick={addNewSongs}>
            <i className="fa-solid fa-plus"></i> Add Folder
          </button>
        </div>
      )}
      {recentlyPlayedSongs === undefined && (
        <div className="no-songs-container">
          <span>Fetching your songs...</span>
        </div>
      )}
    </div>
  );
};
