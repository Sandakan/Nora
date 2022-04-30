/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import { Artist } from './Artist';
import DefaultArtistCover from '../../../../assets/images/song_cover_default.png';

interface ArtistPageProp {
  currentlyActivePage: { pageTitle: string; data?: any };
  changeCurrentActivePage: (pageTitle: string, data?: any) => void;
}

export const ArtistPage = (props: ArtistPageProp) => {
  const [artists, setArtists] = React.useState([
    {
      artistId: '1',
      name: 'unknown artist',
      artworkPath: DefaultArtistCover,
    },
  ] as Artist[]);

  React.useEffect(() => {
    window.api.getArtistData('*').then((res) => {
      if (res && Array.isArray(res)) {
        // console.log(res);
        setArtists(res);
      }
    });
  }, []);

  const artistComponenets = artists.map((artist) => (
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
      <div className="title-container">Artists</div>
      <div className="artists-container">{artistComponenets}</div>
    </div>
  );
};
