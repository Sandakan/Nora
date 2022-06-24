/* eslint-disable no-console */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import Button from '../Button';
import DefaultSongArtwork from '../../../../assets/images/song_cover_default.png';

function SongTagsEditingPage() {
  const { updateNotificationPanelData, currentlyActivePage } =
    React.useContext(AppContext);
  const [songInfo, setSongInfo] = React.useState({
    title: '',
  } as SongId3Tags);
  const { songId, songPath, songArtworkPath } =
    currentlyActivePage.data.songTagsEditor;

  React.useEffect(() => {
    if (songId && songPath)
      window.api
        .getSongId3Tags(songPath)
        .then((res) => {
          if (res)
            return setSongInfo({
              ...res,
              title: res.title ?? 'unknown title',
            });
          return undefined;
        })
        .catch((err) => console.error(err));
  }, [songId, songPath]);

  return (
    songId &&
    songInfo.title && (
      <div className="main-container appear-from-bottom id3-tags-updater-container">
        <div className="title-container">
          Editing &apos;{songInfo.title}&apos;
        </div>
        <div className="song-information-container">
          <div className="song-artwork-container">
            <img
              src={
                songArtworkPath
                  ? `otomusic://localFiles/${songArtworkPath}`
                  : DefaultSongArtwork
              }
              alt="Song Artwork"
              className="song-artwork"
            />
            <Button
              className="artwork-update-btn"
              iconName="edit"
              clickHandler={() => true}
            />
          </div>
          <div className="song-info-container">
            <div className="song-title">{songInfo.title}</div>
            <div className="song-artists">{songInfo.artist}</div>
            <div className="song-album">{songInfo.album}</div>
          </div>
        </div>
        <div className="inputs-container">
          <div className="tag-input">
            <label htmlFor="song-name-id3-tag">Song Name</label>
            <input
              type="text"
              id="song-name-id3-tag"
              name="song-name"
              placeholder="Song Name"
              value={songInfo.title}
              onChange={(e) => {
                const title = e.currentTarget.value;
                setSongInfo((prevData) => ({ ...prevData, title }));
              }}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
          <div className="tag-input">
            <label htmlFor="song-artists-id3-tag">Song Artists</label>
            <input
              id="song-artists-id3-tag"
              type="text"
              name="song-artists"
              placeholder="Song Artists"
              value={songInfo.artist}
              onKeyDown={(e) => e.stopPropagation()}
              onChange={(e) => {
                const artist = e.currentTarget.value;
                setSongInfo((prevData) => ({ ...prevData, artist }));
              }}
            />
          </div>
          <div className="tag-input">
            <label htmlFor="song-album-id3-tag">Album Name</label>
            <input
              type="text"
              id="song-album-id3-tag"
              name="song-album-name"
              placeholder="Album Name"
              value={songInfo.album}
              onKeyDown={(e) => e.stopPropagation()}
              onChange={(e) => {
                const album = e.currentTarget.value;
                setSongInfo((prevData) => ({ ...prevData, album }));
              }}
            />
          </div>
          <div className="tag-input">
            <label htmlFor="song-year-id3-tag">Released Year</label>
            <input
              type="text"
              id="song-year-id3-tag"
              name="song-year"
              placeholder="Released Year"
              value={songInfo.year}
              onKeyDown={(e) => e.stopPropagation()}
              onChange={(e) => {
                const year = e.currentTarget.value;
                setSongInfo((prevData) => ({ ...prevData, year }));
              }}
            />
          </div>
          <div className="tag-input">
            <label htmlFor="song-genres-id3-tag">Genres</label>
            <input
              type="text"
              id="song-genres-id3-tag"
              name="song-genres"
              placeholder="Genres"
              value={songInfo.genres}
              onKeyDown={(e) => e.stopPropagation()}
              onChange={(e) => {
                const genres = e.currentTarget.value;
                setSongInfo((prevData) => ({ ...prevData, genres }));
              }}
            />
          </div>
          <div className="tag-input">
            <label htmlFor="song-composer-id3-tag">Composer</label>
            <input
              type="text"
              id="song-composer-id3-tag"
              name="song-composer"
              placeholder="Composer"
              value={songInfo.composer}
              onKeyDown={(e) => e.stopPropagation()}
              onChange={(e) => {
                const composer = e.currentTarget.value;
                setSongInfo((prevData) => ({ ...prevData, composer }));
              }}
            />
          </div>
        </div>
        <Button
          label="Save Tags"
          iconName="done"
          className="update-song-tags-btn"
          clickHandler={() =>
            window.api
              .updateSongId3Tags(songId, songInfo)
              .then((res) => {
                console.log(
                  'successfully updated the song.',
                  `result : ${res}`
                );
                return updateNotificationPanelData(
                  5000,
                  <span>Successfully updated the song.</span>,
                  <span className="material-icons-round icon">done</span>
                );
              })
              .catch((err) => console.error(err))
          }
        />
      </div>
    )
  );
}

export default SongTagsEditingPage;
