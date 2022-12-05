import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';

interface SongArtistProp {
  artistId: string;
  name: string;
  isFromKnownSource?: boolean;
  className?: string;
}

function SongArtist(props: SongArtistProp) {
  const { updateContextMenuData, changeCurrentActivePage } =
    React.useContext(AppUpdateContext);
  const { currentlyActivePage, currentSongData } = React.useContext(AppContext);
  const { artistId, name, className = '', isFromKnownSource = true } = props;

  const showArtistInfoPage = (artistName: string, id: string) =>
    currentSongData.artists &&
    (currentlyActivePage.pageTitle === 'ArtistInfo' &&
    currentlyActivePage.data.artistName === artistName
      ? changeCurrentActivePage('Home')
      : changeCurrentActivePage('ArtistInfo', {
          artistName,
          artistId: id,
        }));

  return (
    <span
      className={`m-0 w-fit cursor-pointer ${
        isFromKnownSource && 'hover:underline'
      } ${className}`}
      key={artistId}
      title={name}
      onClick={() => isFromKnownSource && showArtistInfoPage(name, artistId)}
      onKeyDown={() => isFromKnownSource && showArtistInfoPage(name, artistId)}
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
      role="button"
      tabIndex={0}
    >
      {name}
    </span>
  );
}

export default SongArtist;
