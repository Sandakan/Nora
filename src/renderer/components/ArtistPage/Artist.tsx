/* eslint-disable react/require-default-props */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/self-closing-comp */
/* eslint-disable import/prefer-default-export */
import DefaultArtistCover from '../../../../assets/images/song_cover_default.png';

interface ArtistProp {
  name: string;
  artworkPath?: string;
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
        <div className="name-container" title={props.name}>
          {props.name}
        </div>
      </div>
    </div>
  );
};
