import Img from '../../Img';

import DefaultArtistArtwork from '../../../assets/images/webp/artist_cover_default.webp';

type Props = {
  artistData: {
    artistId?: number | undefined;
    name: string;
    artworkPath?: string | undefined;
    onlineArtworkPaths?: OnlineArtistArtworks | undefined;
  };
  isAnAlbumArtist?: boolean;
  updateSongInfo: (callback: (prevData: SongTags) => SongTags) => void;
  updateArtistKeyword: (keyword: string) => void;
};

const SongArtistInputResult = (props: Props) => {
  const { artistData, updateSongInfo, updateArtistKeyword, isAnAlbumArtist = false } = props;
  return (
    <button
      type="button"
      key={artistData.artistId ?? artistData.name}
      className="border-background-color-2 odd:bg-background-color-2/10 hover:bg-background-color-2 dark:border-dark-background-color-2 dark:odd:bg-dark-background-color-2/10 dark:hover:bg-dark-background-color-2 flex w-full cursor-pointer border-b-[1px] px-4 py-2 font-light outline-offset-1 last:border-b-0 only:border-b-0 focus-visible:outline!"
      onClick={() => {
        updateSongInfo((prevData) => {
          if (isAnAlbumArtist) {
            const albumArtists =
              prevData.albumArtists?.filter((artist) => artist.name !== artistData.name) ?? [];
            albumArtists?.push({
              name: artistData.name,
              artistId: artistData.artistId,
              artworkPath: artistData.artworkPath,
              onlineArtworkPaths: artistData.onlineArtworkPaths
            });
            return {
              ...prevData,
              albumArtists
            };
          }
          const artists =
            prevData.artists?.filter((artist) => artist.name !== artistData.name) ?? [];
          artists?.push({
            name: artistData.name,
            artistId: artistData.artistId,
            artworkPath: artistData.artworkPath,
            onlineArtworkPaths: artistData.onlineArtworkPaths
          });
          return {
            ...prevData,
            artists
          };
        });
        updateArtistKeyword('');
      }}
    >
      <Img
        src={artistData.onlineArtworkPaths?.picture_small || artistData.artworkPath}
        fallbackSrc={DefaultArtistArtwork}
        className="mr-4 aspect-square w-6 rounded-full"
        alt=""
      />
      {artistData.name}
    </button>
  );
};

export default SongArtistInputResult;
