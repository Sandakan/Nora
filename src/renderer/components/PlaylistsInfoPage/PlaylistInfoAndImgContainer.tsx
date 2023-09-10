import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import calculateTimeFromSeconds from 'renderer/utils/calculateTimeFromSeconds';
import Img from '../Img';

import MultipleArtworksCover from '../PlaylistsPage/MultipleArtworksCover';
import DefaultPlaylistCover from '../../../../assets/images/webp/playlist_cover_default.webp';

type Props = {
  playlist: Playlist;
  songs: SongData[];
};

const PlaylistInfoAndImgContainer = (props: Props) => {
  const { localStorageData } = React.useContext(AppContext);
  const { playlist, songs } = props;

  const totalPlaylistDuration = React.useMemo(() => {
    const { hours, minutes, seconds } = calculateTimeFromSeconds(
      songs.reduce((prev, current) => prev + current.duration, 0),
    );
    return `${
      hours >= 1 ? `${hours} hour${hours === 1 ? '' : 's'} ` : ''
    }${minutes} minute${minutes === 1 ? '' : 's'} ${seconds} second${
      seconds === 1 ? '' : 's'
    }`;
  }, [songs]);

  return (
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <>
      {playlist?.songs && (
        <div className="playlist-img-and-info-container mb-8 flex flex-row items-center justify-start">
          <div className="playlist-cover-container mt-2 overflow-hidden">
            {localStorageData?.preferences.enableArtworkFromSongCovers &&
            playlist.songs.length > 1 ? (
              <div className="relative h-60 w-60">
                <MultipleArtworksCover
                  songIds={playlist.songs}
                  className="h-60 w-60"
                  type={1}
                />
                <Img
                  src={playlist.artworkPaths.artworkPath}
                  alt="Playlist Cover"
                  loading="eager"
                  className="!absolute bottom-4 right-4 h-16 w-16 !rounded-lg"
                />
              </div>
            ) : (
              <Img
                src={
                  playlist.artworkPaths
                    ? playlist.artworkPaths.artworkPath
                    : DefaultPlaylistCover
                }
                className="w-52 rounded-xl lg:w-48"
                alt="Playlist Cover"
              />
            )}
          </div>
          <div className="playlist-info-container ml-8 text-font-color-black dark:text-font-color-white">
            <div className="font-semibold tracking-wider opacity-50">
              PLAYLIST
            </div>
            <div className="playlist-name mb-2 w-full overflow-hidden text-ellipsis whitespace-nowrap text-5xl text-font-color-highlight dark:text-dark-font-color-highlight">
              {playlist.name}
            </div>
            <div className="playlist-no-of-songs w-full overflow-hidden text-ellipsis whitespace-nowrap text-base">
              {`${playlist.songs.length} song${
                playlist.songs.length === 1 ? '' : 's'
              }`}
            </div>
            {songs.length > 0 && (
              <div className="playlist-total-duration">
                {totalPlaylistDuration}
              </div>
            )}
            <div className="playlist-created-date">
              {`Created on ${new Date(playlist.createdDate).toUTCString()}`}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PlaylistInfoAndImgContainer;
