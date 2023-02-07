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
  const { currentlyActivePage, currentSongData } = React.useContext(AppContext);
  const {
    artistId,
    name,
    className = '',
    isFromKnownSource = true,
    style,
  } = props;

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
    <Button
      className={`!m-0 inline !border-0 !p-0 text-xs font-normal ${
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
