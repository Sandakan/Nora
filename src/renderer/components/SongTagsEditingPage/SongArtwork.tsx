import Button from '../Button';
import Img from '../Img';

import DefaultSongArtwork from '../../../../assets/images/png/song_cover_default.png';

type Props = {
  artworkPath?: string;
  updateSongInfo: (callback: (prevData: SongTags) => SongTags) => void;
};

const SongArtwork = (props: Props) => {
  const { artworkPath, updateSongInfo } = props;
  return (
    <div className="song-artwork-container relative mr-8 h-40 w-40 overflow-hidden">
      <Img
        src={
          artworkPath
            ? /(^$|(http(s)?:\/\/)([\w-]+\.)+[\w-]+([\w- ;,./?%&=]*))/gm.test(
                artworkPath
              )
              ? artworkPath
              : `nora://localFiles/${artworkPath}`
            : DefaultSongArtwork
          // : songArtworkPath
          // ? `nora://localFiles/${songArtworkPath}`
        }
        alt="Song Artwork"
        className="song-artwork aspect-square w-full rounded-xl object-cover object-center"
      />
      <div className="absolute top-1/2 left-1/2 flex w-full -translate-x-1/2 -translate-y-1/2 justify-around px-4">
        <Button
          key={0}
          className="artwork-update-btn mr-0 aspect-square rounded-full border-none !bg-[hsla(0,0%,0%,0.5)] transition-[background] hover:!bg-[hsla(0,0%,0%,0.8)] dark:!bg-[hsla(0,0%,0%,0.5)] dark:hover:!bg-[hsla(0,0%,0%,0.8)]"
          iconName="edit"
          iconClassName="text-font-color-white dark:text-font-color-white mr-0"
          clickHandler={() =>
            window.api
              .getImgFileLocation()
              .then((res) =>
                updateSongInfo((prevData) => ({
                  ...prevData,
                  artworkPath: res,
                  album: prevData.album
                    ? { ...prevData.album, artworkPath: res }
                    : undefined,
                }))
              )
              .catch((err) => console.error(err))
          }
        />
        {artworkPath && (
          <Button
            key={1}
            className="artwork-delete-btn mr-0 aspect-square rounded-full border-none !bg-[hsla(0,0%,0%,0.5)] transition-[background] hover:!bg-[hsla(0,0%,0%,0.8)] dark:!bg-[hsla(0,0%,0%,0.5)] dark:hover:!bg-[hsla(0,0%,0%,0.8)]"
            iconName="delete"
            iconClassName="text-font-color-white dark:text-font-color-white mr-0"
            clickHandler={() =>
              updateSongInfo((prevData) => ({
                ...prevData,
                artworkPath: undefined,
                album: prevData.album
                  ? { ...prevData.album, artworkPath: undefined }
                  : undefined,
              }))
            }
          />
        )}
      </div>
    </div>
  );
};

export default SongArtwork;
