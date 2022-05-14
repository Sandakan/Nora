/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/require-default-props */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/self-closing-comp */
/* eslint-disable import/prefer-default-export */
import DefaultArtistCover from '../../../../assets/images/song_cover_default.png';

interface ArtistProp {
  name: string;
  artworkPath?: string;
  currentlyActivePage: { pageTitle: PageTitles; data?: any };
  changeCurrentActivePage: (pageTitle: PageTitles, data?: any) => void;
}

export const Artist = (props: ArtistProp) => {
  const handleArtistClick = () => {
    return props.currentlyActivePage.pageTitle === 'ArtistInfo' &&
      props.currentlyActivePage.data.artistName === props.name
      ? props.changeCurrentActivePage('Home')
      : props.changeCurrentActivePage('ArtistInfo', {
          artistName: props.name,
        });
  };
  return (
    <div className="artist">
      <div className="artist-img-container">
        <img
          src={
            `otomusic://localFiles/${props.artworkPath}` || DefaultArtistCover
          }
          alt="Default song cover"
          onClick={handleArtistClick}
        />
      </div>
      <div className="artist-info-container">
        <div
          className="name-container"
          title={props.name === '' ? 'Unknown Artist' : props.name}
          onClick={handleArtistClick}
        >
          {props.name === '' ? 'Unknown Artist' : props.name}
        </div>
      </div>
    </div>
  );
};
