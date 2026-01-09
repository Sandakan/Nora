import { useTranslation } from 'react-i18next';

import Button from '../Button';
import Img from '../Img';

import DefaultSongArtwork from '../../assets/images/webp/song_cover_default.webp';

type Props = {
  artworkPath?: string;
  updateSongInfo: (callback: (prevData: SongTags) => SongTags) => void;
};

const SongArtwork = (props: Props) => {
  const { t } = useTranslation();

  const { artworkPath, updateSongInfo } = props;
  return (
    <div className="song-artwork-container relative mr-8 h-40 w-40 overflow-hidden">
      <Img
        src={
          artworkPath
            ? /(^$|(http(s)?:\/\/)([\w-]+\.)+[\w-]+([\w- ;,./?%&=]*))/gm.test(artworkPath)
              ? artworkPath
              : `nora://localfiles/${artworkPath}`
            : DefaultSongArtwork
          // : songArtworkPath
          // ? `nora://localfiles/${songArtworkPath}`
        }
        alt="Song Artwork"
        className="song-artwork aspect-square w-full rounded-xl object-cover object-center"
      />
      <div className="absolute top-1/2 left-1/2 flex w-full -translate-x-1/2 -translate-y-1/2 justify-around px-4">
        <Button
          key={0}
          tooltipLabel={t('songTagsEditingPage.editArtwork')}
          className="artwork-update-btn mr-0 aspect-square rounded-full border-none bg-[hsla(0,0%,0%,0.5)]! outline-offset-1 transition-[background]! hover:bg-[hsla(0,0%,0%,0.8)]! focus-visible:outline! dark:bg-[hsla(0,0%,0%,0.5)]! dark:hover:bg-[hsla(0,0%,0%,0.8)]!"
          iconName="edit"
          iconClassName="text-font-color-white dark:text-font-color-white mr-0"
          clickHandler={() =>
            window.api.songUpdates
              .getImgFileLocation()
              .then((res) =>
                updateSongInfo((prevData) => ({
                  ...prevData,
                  artworkPath: res,
                  albums: prevData.albums ? [{ ...prevData.albums[0], artworkPath: res }] : undefined
                }))
              )
              .catch((err) => console.error(err))
          }
        />
        {artworkPath && (
          <Button
            key={1}
            tooltipLabel={t('songTagsEditingPage.removeArtwork')}
            className="artwork-delete-btn mr-0! aspect-square rounded-full border-none bg-[hsla(0,0%,0%,0.5)]! outline-offset-1 transition-[background]! hover:bg-[hsla(0,0%,0%,0.8)]! focus-visible:outline! dark:bg-[hsla(0,0%,0%,0.5)]! dark:hover:bg-[hsla(0,0%,0%,0.8)]!"
            iconName="delete"
            iconClassName="text-font-color-white dark:text-font-color-white mr-0"
            clickHandler={() =>
              updateSongInfo((prevData) => ({
                ...prevData,
                artworkPath: undefined,
                albums: prevData.albums ? [{ ...prevData.albums[0], artworkPath: undefined }] : undefined
              }))
            }
          />
        )}
      </div>
    </div>
  );
};

export default SongArtwork;
