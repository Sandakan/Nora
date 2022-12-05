/* eslint-disable react/require-default-props */
import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import Button from '../Button';
import Img from '../Img';
import { MetadataKeywords } from './SongTagsEditingPage';

interface SongMetadataResultProp {
  title: string;
  artists: string[];
  genres?: string[];
  album?: string;
  releasedYear?: number;
  lyrics?: string;
  artworkPath?: string;
  updateSongInfo: (callback: (prevData: SongTags) => SongTags) => void;
  updateMetadataKeywords: (metadataKeywords: MetadataKeywords) => void;
}

const SongMetadataResult = (props: SongMetadataResultProp) => {
  const { changePromptMenuData } = React.useContext(AppUpdateContext);
  const {
    title,
    artists,
    genres,
    artworkPath,
    album,
    lyrics,
    releasedYear,
    updateSongInfo,
    updateMetadataKeywords,
  } = props;
  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
    <div className="mb-2 flex h-32 min-h-[5rem] w-full cursor-pointer items-center justify-between rounded-md bg-background-color-2/70 p-1 backdrop-blur-md hover:bg-background-color-2 dark:bg-dark-background-color-2/70 dark:hover:bg-dark-background-color-2">
      <div className="flex h-full">
        <div className="img-container mr-4 overflow-hidden rounded-md">
          <Img
            src={artworkPath}
            className="aspect-square h-full max-w-full object-cover"
            alt=""
          />
        </div>
        <div className="song-result-info-container flex flex-col justify-center text-font-color-black dark:text-font-color-white">
          <p className="song-result-title text-xl">{title}</p>
          <p className="song-result-artists font-light text-opacity-75">
            {artists.join(', ')}
          </p>
          {album && (
            <p className="song-result-album text-sm font-light text-opacity-75">
              {album}
            </p>
          )}
          <span className="song-result-album flex text-sm font-light text-opacity-75">
            {releasedYear && <span>{releasedYear}</span>}
            {releasedYear && <span className="mx-2">&bull;</span>}
            {lyrics && (
              <span className="flex items-center">
                <span className="material-icons-round-outlined mr-2 text-font-color-highlight dark:text-dark-font-color-highlight">
                  verified
                </span>{' '}
                {lyrics && 'lyrics included'}
              </span>
            )}
          </span>
        </div>
      </div>
      <Button
        label="Add to Metadata"
        className="h-fit"
        clickHandler={() => {
          updateSongInfo((prevData) => {
            changePromptMenuData(false, undefined, '');
            return {
              ...prevData,
              title,
              releasedYear,
              lyrics,
              artworkPath: artworkPath ?? prevData.artworkPath,
              album: prevData.album
                ? { ...prevData?.album, artworkPath }
                : undefined,
            } as SongTags;
          });
          updateMetadataKeywords({
            albumKeyword: album,
            artistKeyword: artists?.join(';'),
            genreKeyword: genres?.join(';'),
          });
        }}
      />
    </div>
  );
};
export default SongMetadataResult;
