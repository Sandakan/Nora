import React from 'react';
import { AppContext, AppUpdateContext } from 'renderer/contexts/AppContext';

interface SongArtistProp {
  artistId: string;
  name: string;
  // eslint-disable-next-line react/require-default-props
  className?: string;
}

function SongArtist(props: SongArtistProp) {
  const { updateContextMenuData, changeCurrentActivePage } =
    React.useContext(AppUpdateContext);
  const { currentlyActivePage, currentSongData } = React.useContext(AppContext);
  const { artistId, name, className } = props;

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
      className={`w-fit cursor-pointer m-0 hover:underline ${className ?? ''}`}
      key={artistId}
      title={name}
      onClick={() => showArtistInfoPage(name, artistId)}
      onKeyDown={() => showArtistInfoPage(name, artistId)}
      onContextMenu={(e) => {
        e.stopPropagation();
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
      }}
      role="button"
      tabIndex={0}
    >
      {name}
    </span>
  );
}

export default SongArtist;
