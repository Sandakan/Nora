import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import Button from '../Button';

interface SongArtistProp {
  artistId: string;
  name: string;
  isFromKnownSource?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

function SongArtist(props: SongArtistProp) {
  const { updateContextMenuData, changeCurrentActivePage } =
    React.useContext(AppUpdateContext);
  const { currentSongData } = React.useContext(AppContext);
  const {
    artistId,
    name,
    className = '',
    isFromKnownSource = true,
    style,
  } = props;

  const showArtistInfoPage = React.useCallback(
    (artistName: string, id: string) =>
      currentSongData.artists &&
      changeCurrentActivePage('ArtistInfo', {
        artistName,
        artistId: id,
      }),
    [changeCurrentActivePage, currentSongData.artists]
  );

  return (
    <Button
      className={`!m-0 inline !rounded-none !border-0 !p-0 text-xs font-normal outline-1 -outline-offset-1 focus-visible:!outline ${
        isFromKnownSource && 'hover:underline'
      } ${className}`}
      key={artistId}
      label={name}
      style={style}
      clickHandler={() =>
        isFromKnownSource && showArtistInfoPage(name, artistId)
      }
      onContextMenu={(e) => {
        e.stopPropagation();
        if (isFromKnownSource) {
          updateContextMenuData(
            true,
            [
              {
                label: 'Info',
                iconName: 'info',
                handlerFunction: () => showArtistInfoPage(name, artistId),
              },
            ],
            e.pageX,
            e.pageY
          );
        }
      }}
    />
  );
}

export default SongArtist;
