import Img from '../../Img';

import DefaultAlbumArtwork from '../../../assets/images/webp/album_cover_default.webp';

type Props = {
  albumData: SongTagsAlbumData;
  updateSongInfo: (callback: (prevData: SongTags) => SongTags) => void;
  updateAlbumKeyword: (keyword: string) => void;
};

const SongAlbumInputResult = (props: Props) => {
  const { albumData, updateAlbumKeyword, updateSongInfo } = props;
  return (
    <button
      type="button"
      key={albumData.albumId ?? albumData.title}
      className="border-background-color-2 hover:bg-background-color-2 dark:border-dark-background-color-2 dark:hover:bg-dark-background-color-2 flex w-full cursor-pointer border-b px-4 py-2 text-left font-light outline-offset-1 last:border-b-0 only:border-b-0 focus-visible:outline!"
      onClick={() => {
        updateSongInfo((prevData) => {
          return {
            ...prevData,
            album: {
              title: albumData.title,
              albumId: albumData.albumId,
              noOfSongs: albumData.noOfSongs ? albumData.noOfSongs + 1 : 1,
              artworkPath: albumData.artworkPath
            }
          };
        });
        updateAlbumKeyword('');
      }}
    >
      <Img
        src={albumData?.artworkPath}
        fallbackSrc={DefaultAlbumArtwork}
        className="mr-4 aspect-square w-6 rounded-xs"
        alt=""
      />
      {albumData.title}
    </button>
  );
};

export default SongAlbumInputResult;
