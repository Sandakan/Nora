/* eslint-disable react/require-default-props */
/* eslint-disable no-unused-vars */
import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import Button from '../Button';
import Img from '../Img';
import CustomizeSelectedMetadataPrompt from './CustomizeSelectedMetadataPrompt';
import DefaultSongImage from '../../../../assets/images/png/song_cover_default.png';
import { MetadataKeywords } from './SongTagsEditingPage';

interface SongMetadataResultProp {
  title: string;
  artists: string[];
  genres?: string[];
  album?: string;
  releasedYear?: number;
  lyrics?: string;
  artworkPaths?: string[];
  updateSongInfo: (callback: (prevData: SongTags) => SongTags) => void;
  updateMetadataKeywords: (metadataKeywords: MetadataKeywords) => void;
}

function SongMetadataResult(props: SongMetadataResultProp) {
  const { changePromptMenuData } = React.useContext(AppUpdateContext);
  const {
    title,
    artists,
    genres,
    artworkPaths,
    album,
    lyrics,
    releasedYear,
    updateSongInfo,
    updateMetadataKeywords,
  } = props;

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
    <div className="mb-2 flex h-32 min-h-[5rem] w-full cursor-pointer items-center justify-between rounded-md bg-background-color-2/70 p-1 backdrop-blur-md hover:bg-background-color-2 dark:bg-dark-background-color-2/70 dark:hover:bg-dark-background-color-2">
      <div className="flex h-full max-w-[70%]">
        <div className="img-container m-1 mr-4 overflow-hidden rounded-md">
          <Img
            src={artworkPaths?.at(-1)}
            fallbackSrc={DefaultSongImage}
            className="aspect-square h-full max-w-full object-cover"
            alt=""
          />
        </div>
        <div className="song-result-info-container flex max-w-[75%] flex-col justify-center text-font-color-black dark:text-font-color-white">
          <p className="song-result-title relative w-full overflow-hidden text-ellipsis whitespace-nowrap text-xl">
            {title}
          </p>
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
      <div className="buttons-container flex items-center">
        <Button
          label="Add to Metadata"
          className="h-fit !bg-background-color-3 px-8 text-lg text-font-color-black hover:border-background-color-3 dark:!bg-dark-background-color-3 dark:!text-font-color-black dark:hover:border-background-color-3"
          clickHandler={() => {
            updateSongInfo((prevData) => {
              changePromptMenuData(false, undefined, '');
              return {
                ...prevData,
                title: title || prevData.title,
                releasedYear: releasedYear || prevData.releasedYear,
                lyrics: lyrics || prevData.lyrics,
                artworkPath:
                  Array.isArray(artworkPaths) && artworkPaths.length > 0
                    ? artworkPaths.at(-1) || artworkPaths[0]
                    : prevData.artworkPath,
                album: prevData.album
                  ? { ...prevData?.album, artworkPaths }
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
        <Button
          key={0}
          className="more-options-btn text-sm dark:border-dark-background-color-1 md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
          iconName="tune"
          clickHandler={() => {
            changePromptMenuData(
              true,
              <CustomizeSelectedMetadataPrompt
                title={title}
                artists={artists}
                album={album}
                artworkPaths={artworkPaths}
                genres={genres}
                lyrics={lyrics}
                releasedYear={releasedYear}
                updateSongInfo={updateSongInfo}
                updateMetadataKeywords={updateMetadataKeywords}
              />
            );
          }}
          tooltipLabel="Customize Metadata"
        />
      </div>
    </div>
  );
}
export default SongMetadataResult;
