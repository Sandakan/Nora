import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';

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
  const {
    artistId,
    name,
    className = '',
    isFromKnownSource = true,
    style,
  } = props;

  const showArtistInfoPage = React.useCallback(
    (artistName: string, id: string) =>
      changeCurrentActivePage('ArtistInfo', {
        artistName,
        artistId: id,
      }),
    [changeCurrentActivePage],
  );

  return (
    <span
      className={`text-xs font-normal outline-1 -outline-offset-1 focus-visible:!outline ${
        isFromKnownSource && 'hover:underline'
      } ${className}`}
      key={artistId}
      title={name}
      style={style}
      onClick={() => isFromKnownSource && showArtistInfoPage(name, artistId)}
      onKeyDown={(e) =>
        e.key === 'Enter' &&
        isFromKnownSource &&
        showArtistInfoPage(name, artistId)
      }
      role="button"
      tabIndex={0}
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
            e.pageY,
          );
        }
      }}
    >
      {name}
    </span>
  );
}

export default SongArtist;
