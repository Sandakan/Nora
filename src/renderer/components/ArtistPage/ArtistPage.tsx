/* eslint-disable no-nested-ternary */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import sortArtists from 'renderer/utils/sortArtists';
import { Artist } from './Artist';
// import DefaultArtistCover from '../../../../assets/images/song_cover_default.png';

interface ArtistPageProp {
  currentlyActivePage: { pageTitle: string; data?: any };
  changeCurrentActivePage: (pageTitle: string, data?: any) => void;
}

export const ArtistPage = (props: ArtistPageProp) => {
  const [artists, setArtists] = React.useState([] as Artist[]);
  const [sortingOrder, setSortingOrder] = React.useState(
    'aToZ' as ArtistSortTypes
  );

  React.useEffect(() => {
    window.api.getArtistData('*').then((res) => {
      if (res && Array.isArray(res)) {
        setArtists(sortArtists(res, sortingOrder));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(
    () => setArtists((prevData) => sortArtists(prevData, sortingOrder)),
    [sortingOrder]
  );

  const artistComponenets =
    artists.length > 0 &&
    artists.map((artist) => (
      <Artist
        name={artist.name}
        artworkPath={artist.artworkPath}
        key={artist.artistId}
        changeCurrentActivePage={props.changeCurrentActivePage}
        currentlyActivePage={props.currentlyActivePage}
      />
    ));

  return (
    <div className="main-container artists-list-container">
      <div className="title-container">
        Artists
        <select
          name="sortingOrderDropdown"
          id="sortingOrderDropdown"
          value={sortingOrder}
          onChange={(e) =>
            setSortingOrder(e.currentTarget.value as 'aToZ' | 'noOfSongs')
          }
        >
          <option value="aToZ">A to Z</option>
          <option value="noOfSongs">No. of Songs</option>
        </select>
      </div>
      <div className="artists-container">{artistComponenets}</div>
    </div>
  );
};
