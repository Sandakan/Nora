import Img from 'renderer/components/Img';

import DefaultArtistArtwork from '../../../../../assets/images/webp/artist_cover_default.webp';

type Props = {
  artistData: {
    artistId?: string | undefined;
    name: string;
    artworkPath?: string | undefined;
    onlineArtworkPaths?: OnlineArtistArtworks | undefined;
  };
  updateSongInfo: (callback: (prevData: SongTags) => SongTags) => void;
  updateArtistKeyword: (keyword: string) => void;
};

const SongArtistInputResult = (props: Props) => {
  const { artistData, updateSongInfo, updateArtistKeyword } = props;
  return (
    <button
      type="button"
      key={artistData.artistId ?? artistData.name}
      className="flex w-full cursor-pointer border-b-[1px] border-background-color-2 px-4 py-2 font-light outline-1 outline-offset-1 last:border-b-0 only:border-b-0 hover:bg-background-color-2 focus-visible:!outline dark:border-dark-background-color-2 dark:hover:bg-dark-background-color-2"
      onClick={() => {
        updateSongInfo((prevData) => {
          const artists =
            prevData.artists?.filter(
              (artist) => artist.name !== artistData.name
            ) ?? [];
          artists?.push({
            name: artistData.name,
            artistId: artistData.artistId,
            artworkPath: artistData.artworkPath,
            onlineArtworkPaths: artistData.onlineArtworkPaths,
          });
          return {
            ...prevData,
            artists,
          };
        });
        updateArtistKeyword('');
      }}
    >
      <Img
        src={
          artistData.onlineArtworkPaths?.picture_small || artistData.artworkPath
        }
        fallbackSrc={DefaultArtistArtwork}
        className="mr-4 aspect-square w-6 rounded-full"
        alt=""
      />
      {artistData.name}
    </button>
  );
};

export default SongArtistInputResult;
