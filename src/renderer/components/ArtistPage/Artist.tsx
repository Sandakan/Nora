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
  currentlyActivePage: { pageTitle: string; data?: any };
  changeCurrentActivePage: (pageTitle: string, data?: any) => void;
}

export const Artist = (props: ArtistProp) => {
  return (
    <div className="artist">
      <div className="artist-img-container">
        <img
          src={
            `otomusic://localFiles/${props.artworkPath}` || DefaultArtistCover
          }
          alt="Default song cover"
        />
      </div>
      <div className="artist-info-container">
        <div
          className="name-container"
          title={props.name}
          onClick={() =>
            props.currentlyActivePage.pageTitle === 'ArtistInfo' &&
            props.currentlyActivePage.data.artistName === props.name
              ? props.changeCurrentActivePage('Home')
              : props.changeCurrentActivePage('ArtistInfo', {
                  artistName: props.name,
                })
          }
        >
          {props.name}
        </div>
      </div>
    </div>
  );
};
