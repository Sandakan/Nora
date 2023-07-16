import React from 'react';
import calculateTimeFromSeconds from 'renderer/utils/calculateTimeFromSeconds';
import Img from '../Img';
import SongArtist from '../SongsPage/SongArtist';

type Props = { albumData: Album; songsData: SongData[] };

const AlbumImgAndInfoContainer = (props: Props) => {
  const { albumData, songsData } = props;

  const calculateTotalTime = React.useCallback(() => {
    const { hours, minutes, seconds } = calculateTimeFromSeconds(
      songsData.reduce((prev, current) => prev + current.duration, 0)
    );
    return `${
      hours >= 1 ? `${hours} hour${hours === 1 ? '' : 's'} ` : ''
    }${minutes} minute${minutes === 1 ? '' : 's'} ${seconds} second${
      seconds === 1 ? '' : 's'
    }`;
  }, [songsData]);

  const albumArtistComponents = React.useMemo(() => {
    const { artists } = albumData;
    if (Array.isArray(artists) && artists.length > 0)
      return artists
        .map((artist, i) => {
          const arr = [
            <SongArtist
              key={artist.artistId}
              artistId={artist.artistId}
              name={artist.name}
              className="!text-lg"
            />,
          ];

          if ((artists?.length ?? 1) - 1 !== i)
            arr.push(<span className="mr-1">,</span>);

          return arr;
        })
        .flat();
    return <span className="text-xs font-normal">Unknown Artist</span>;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [albumData?.artists]);

  return (
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <>
      {albumData && (
        <div className="album-img-and-info-container flex flex-row items-center">
          <div className="album-cover-container mr-8">
            {albumData.artworkPaths && (
              <Img
                src={albumData.artworkPaths.artworkPath}
                className="w-52 rounded-xl"
                loading="eager"
                alt="Album Cover"
              />
            )}{' '}
          </div>
          {albumData.title &&
            albumData.artists &&
            albumData.artists.length > 0 && (
              <div className="album-info-container max-w-[70%] text-font-color-black dark:text-font-color-white">
                <div className="font-semibold tracking-wider opacity-50">
                  ALBUM
                </div>
                <div className="album-title h-fit w-full overflow-hidden text-ellipsis whitespace-nowrap py-2 text-5xl text-font-color-highlight dark:text-dark-font-color-highlight">
                  {albumData.title}
                </div>
                <div className="album-artists m-0 flex h-[unset] w-full cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap text-xl">
                  {albumArtistComponents}
                </div>
                {songsData.length > 0 && (
                  <div className="album-songs-total-duration">
                    {calculateTotalTime()}
                  </div>
                )}
                <div className="album-no-of-songs w-full overflow-hidden text-ellipsis whitespace-nowrap text-base">{`${
                  albumData.songs.length
                } song${albumData.songs.length === 1 ? '' : 's'}`}</div>
                {albumData.year && (
                  <div className="album-year">{albumData.year}</div>
                )}
              </div>
            )}
        </div>
      )}
    </>
  );
};

export default AlbumImgAndInfoContainer;
