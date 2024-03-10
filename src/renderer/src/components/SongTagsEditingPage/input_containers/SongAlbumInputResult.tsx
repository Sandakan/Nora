import Img from '../../Img';

import DefaultAlbumArtwork from '../../../assets/images/webp/album_cover_default.webp';

type Props = {
  albumData: {
    title: string;
    albumId?: string | undefined;
    noOfSongs?: number | undefined;
    artists?: string[] | undefined;
    artworkPath?: string | undefined;
  };
  updateSongInfo: (callback: (prevData: SongTags) => SongTags) => void;
  updateAlbumKeyword: (keyword: string) => void;
};

const SongAlbumInputResult = (props: Props) => {
  const { albumData, updateAlbumKeyword, updateSongInfo } = props;
  return (
    <button
      type="button"
      key={albumData.albumId ?? albumData.title}
      className="flex w-full cursor-pointer border-b-[1px] border-background-color-2 px-4 py-2 text-left font-light outline-1 outline-offset-1 last:border-b-0 only:border-b-0 hover:bg-background-color-2 focus-visible:!outline dark:border-dark-background-color-2 dark:hover:bg-dark-background-color-2"
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
        className="mr-4 aspect-square w-6 rounded-sm"
        alt=""
      />
      {albumData.title}
    </button>
  );
};

export default SongAlbumInputResult;
