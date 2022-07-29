/* eslint-disable no-nested-ternary */
/* eslint-disable no-console */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import { AppContext, AppUpdateContext } from 'renderer/contexts/AppContext';
import Button from '../Button';
import DefaultSongArtwork from '../../../../assets/images/song_cover_default.png';
import MainContainer from '../MainContainer';

function SongTagsEditingPage() {
  const { currentlyActivePage } = React.useContext(AppContext);
  const { updateNotificationPanelData } = React.useContext(AppUpdateContext);

  const [songInfo, setSongInfo] = React.useState({
    title: '',
  } as SongId3Tags);
  const { songId, songPath, songArtworkPath } = React.useMemo(
    () => currentlyActivePage.data.songTagsEditor,
    [currentlyActivePage.data.songTagsEditor]
  );

  React.useEffect(() => {
    if (songPath)
      window.api
        .getSongId3Tags(songPath)
        .then((res) => {
          if (res) {
            console.log(res);
            return setSongInfo({
              ...res,
              title: res.title ?? 'unknown title',
            });
          }
          return undefined;
        })
        .catch((err) => console.error(err));
  }, [songPath]);

  React.useEffect(() => {
    if (songInfo.title) {
      window.api
        .fetchSongInfoFromNet(
          songInfo.title,
          songInfo.artist ? [songInfo.artist] : []
        )
        .then((res) => console.log(res))
        .catch((res) => console.log(res));
    }
  });

  return (
    songId &&
    songInfo.title && (
      <MainContainer className="main-container appear-from-bottom id3-tags-updater-container">
        <>
          <div className="title-container mt-1 pr-4 flex items-center mb-8 text-font-color-black text-3xl font-medium dark:text-font-color-white">
            Editing &apos;{songInfo.title}&apos;
          </div>
          <div className="song-information-container text-font-color-black dark:text-font-color-white flex mb-12 bl-4">
            <div className="song-artwork-container w-40 aspect-square rounded-3xl overflow-hidden relative mr-8">
              <img
                src={
                  songInfo.artworkPath
                    ? `otomusic://localFiles/${songInfo.artworkPath}`
                    : songArtworkPath
                    ? `otomusic://localFiles/${songArtworkPath}`
                    : DefaultSongArtwork
                }
                alt="Song Artwork"
                className="song-artwork w-full object-contain object-center"
              />
              <Button
                className="artwork-update-btn absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 !bg-[hsla(0,0%,0%,0.6)] dark:!bg-[hsla(0,0%,0%,0.6)] border-none rounded-full aspect-square transition-[background] hover:!bg-[hsla(0,0%,0%,0.8)] dark:hover:!bg-[hsla(0,0%,0%,0.8)]"
                iconName="edit"
                iconClassName="text-font-color-white dark:text-font-color-white mr-0"
                clickHandler={() =>
                  window.api
                    .getImgFileLocation()
                    .then((res) =>
                      setSongInfo((prevData) => ({
                        ...prevData,
                        artworkPath: res,
                      }))
                    )
                    .catch((err) => console.error(err))
                }
              />
            </div>
            <div className="song-info-container flex flex-col justify-center">
              <div className="song-title text-4xl mb-2">{songInfo.title}</div>
              <div className="song-artists">{songInfo.artist}</div>
              <div className="song-album">{songInfo.album}</div>
            </div>
          </div>
          <div className="inputs-container flex flex-wrap justify-around text-font-color-black dark:text-font-color-white">
            <div className="tag-input min-w-[10rem] flex flex-col mb-6 w-[45%]">
              <label htmlFor="song-name-id3-tag">Song Name</label>
              <input
                type="text"
                id="song-name-id3-tag"
                className="w-[90%] mt-2 mr-2 py-3 px-4 border-[.15rem] border-background-color-2 dark:border-dark-background-color-2 rounded-3xl bg-background-color-1 dark:bg-dark-background-color-1 text-font-color-black dark:text-font-color-white"
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
            <div className="tag-input min-w-[10rem] flex flex-col mb-6 w-[45%]">
              <label htmlFor="song-artists-id3-tag">Song Artists</label>
              <input
                id="song-artists-id3-tag"
                className="w-[90%] mt-2 mr-2 py-3 px-4 border-[.15rem] border-background-color-2 dark:border-dark-background-color-2 rounded-3xl bg-background-color-1 dark:bg-dark-background-color-1 text-font-color-black dark:text-font-color-white"
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
            <div className="tag-input min-w-[10rem] flex flex-col mb-6 w-[45%]">
              <label htmlFor="song-album-id3-tag">Album Name</label>
              <input
                type="text"
                id="song-album-id3-tag"
                className="w-[90%] mt-2 mr-2 py-3 px-4 border-[.15rem] border-background-color-2 dark:border-dark-background-color-2 rounded-3xl bg-background-color-1 dark:bg-dark-background-color-1 text-font-color-black dark:text-font-color-white"
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
            <div className="tag-input min-w-[10rem] flex flex-col mb-6 w-[45%]">
              <label htmlFor="song-year-id3-tag">Released Year</label>
              <input
                type="text"
                id="song-year-id3-tag"
                className="w-[90%] mt-2 mr-2 py-3 px-4 border-[.15rem] border-background-color-2 dark:border-dark-background-color-2 rounded-3xl bg-background-color-1 dark:bg-dark-background-color-1 text-font-color-black dark:text-font-color-white"
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
            <div className="tag-input min-w-[10rem] flex flex-col mb-6 w-[45%]">
              <label htmlFor="song-genres-id3-tag">Genres</label>
              <input
                type="text"
                id="song-genres-id3-tag"
                className="w-[90%] mt-2 mr-2 py-3 px-4 border-[.15rem] border-background-color-2 dark:border-dark-background-color-2 rounded-3xl bg-background-color-1 dark:bg-dark-background-color-1 text-font-color-black dark:text-font-color-white"
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
            <div className="tag-input min-w-[10rem] flex flex-col mb-6 w-[45%]">
              <label htmlFor="song-composer-id3-tag">Composer</label>
              <input
                type="text"
                id="song-composer-id3-tag"
                className="w-[90%] mt-2 mr-2 py-3 px-4 border-[.15rem] border-background-color-2 dark:border-dark-background-color-2 rounded-3xl bg-background-color-1 dark:bg-dark-background-color-1 text-font-color-black dark:text-font-color-white"
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
            <div className="horizontal-rule w-[95%] h-[0.1rem] bg-background-color-2 dark:bg-dark-background-color-2 my-8" />
            <div className="song-lyrics-editor-container w-[95%] flex items-center justify-between">
              <div className="tag-input min-w-[10rem] flex flex-col mb-6 w-[65%] h-full">
                <label htmlFor="song-lyrics-id3-tag">Lyrics</label>
                <textarea
                  id="song-lyrics-id3-tag"
                  className="min-h-[12rem] max-h-80 bg-background-color-1 dark:bg-dark-background-color-1 border-[0.15rem] border-background-color-2 dark:border-dark-background-color-2 rounded-2xl p-4 mt-4"
                  name="lyrics"
                  placeholder="Lyrics"
                  value={songInfo.unsynchronisedLyrics?.text ?? ''}
                  onKeyDown={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const lyrics = e.currentTarget.value;
                    setSongInfo((prevData) => ({
                      ...prevData,
                      unsynchronisedLyrics: {
                        language: 'english',
                        text: lyrics,
                      },
                    }));
                  }}
                />
              </div>
              <div className="song-lyrics-buttons flex h-full flex-wrap flex-row items-start justify-center py-8 w-1/3">
                <Button
                  label="Download Lyrics"
                  iconName="download"
                  iconClassName="mr-2"
                  className="download-lyrics-btn"
                  clickHandler={() => {
                    window.api
                      .fetchSongLyricsFromNet(
                        songInfo.title,
                        songInfo.artist?.split(',')
                      )
                      .then((res) => {
                        if (res)
                          setSongInfo((prevData) => ({
                            ...prevData,
                            unsynchronisedLyrics: {
                              language: '',
                              text: res.lyrics,
                            },
                          }));
                        return undefined;
                      })
                      .catch((err) => console.error(err));
                  }}
                />
              </div>
            </div>
          </div>
          <div className="id3-control-buttons-container p-4">
            <Button
              label="Save Tags"
              iconName="done"
              className="update-song-tags-btn w-40 justify-around !bg-background-color-3 dark:!bg-dark-background-color-3 text-font-color-black dark:text-font-color-black"
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
        </>
      </MainContainer>
    )
  );
}

export default SongTagsEditingPage;
