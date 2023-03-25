/* eslint-disable no-unused-vars */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/label-has-associated-control */
import Button from 'renderer/components/Button';
import Img from 'renderer/components/Img';

type Props = {
  songArtists?: {
    artistId?: string | undefined;
    name: string;
    artworkPath?: string | undefined;
    onlineArtworkPaths?: OnlineArtistArtworks | undefined;
  }[];
  artistKeyword: string;
  artistResults: {
    artistId?: string;
    name: string;
    artworkPath?: string;
    onlineArtworkPaths?: OnlineArtistArtworks;
  }[];
  updateSongInfo: (callback: (prevSongInfo: SongTags) => SongTags) => void;
  updateArtistKeyword: (keyword: string) => void;
};

const SongArtistsInput = (props: Props) => {
  const {
    songArtists,
    updateSongInfo,
    artistKeyword,
    artistResults,
    updateArtistKeyword,
  } = props;
  return (
    <div className="tag-input mb-6 flex w-[45%] min-w-[10rem] flex-col">
      <label htmlFor="song-artists-id3-tag">Song Artists</label>
      <div className="mt-2 w-[90%] rounded-xl border-2 border-background-color-2 p-2 dark:border-dark-background-color-2">
        <div className="artists-container flex flex-wrap p-2 empty:py-2 empty:after:h-full empty:after:w-full empty:after:text-center empty:after:text-[#ccc] empty:after:content-['No_artists_selected_for_this_song.'] dark:empty:after:text-[#ccc]">
          {songArtists &&
            songArtists.map((artist) => (
              <span
                key={artist.name}
                className="group mr-2 mb-2 flex w-fit items-center rounded-2xl bg-background-color-3 px-3 py-1 text-center text-font-color-black dark:bg-dark-background-color-3 dark:text-font-color-black"
              >
                <Button
                  iconName="close"
                  className="material-icons-round mr-2 !border-0 !p-[.125rem] opacity-0 outline-1 outline-offset-1 transition-[visibility,opacity] focus-visible:!outline group-focus-within:opacity-100 group-hover:opacity-100"
                  iconClassName="leading-none dark:!text-font-color-black"
                  clickHandler={() => {
                    updateSongInfo((prevData) => {
                      return {
                        ...prevData,
                        artists: prevData.artists?.filter(
                          (x) => x.name !== artist.name
                        ),
                      };
                    });
                  }}
                />
                <Img
                  src={artist.onlineArtworkPaths?.picture_small}
                  fallbackSrc={artist.artworkPath}
                  className="absolute mr-2 aspect-square w-6 rounded-full opacity-100 transition-[visibility,opacity]  group-focus-within:invisible group-focus-within:opacity-0 group-hover:invisible group-hover:opacity-0"
                  alt=""
                />{' '}
                {artist.name}
              </span>
            ))}
        </div>
        <input
          type="search"
          className="mt-4 w-full rounded-xl border-2 border-transparent bg-background-color-2 p-2 transition-colors focus:border-font-color-highlight dark:bg-dark-background-color-2 dark:focus:border-dark-font-color-highlight"
          placeholder="Search for artists here."
          value={artistKeyword}
          onChange={(e) => {
            const { value } = e.target;
            updateArtistKeyword(value);
          }}
          onKeyDown={(e) => e.stopPropagation()}
        />
        {artistResults.length > 0 && (
          <ol className="artists-results-container mt-4 rounded-xl border-2 border-background-color-2 dark:border-dark-background-color-2 ">
            {artistResults.map((x) => (
              <li
                key={x.artistId ?? x.name}
                className="box-content flex cursor-pointer border-b-[1px] border-background-color-2 px-4 py-2 font-light last:border-b-0 only:border-b-0 hover:bg-background-color-2 dark:border-dark-background-color-2 dark:hover:bg-dark-background-color-2"
                onClick={() => {
                  updateSongInfo((prevData) => {
                    const artists =
                      prevData.artists?.filter(
                        (artist) => artist.name !== x.name
                      ) ?? [];
                    artists?.push({
                      name: x.name,
                      artistId: x.artistId,
                      artworkPath: x.artworkPath,
                      onlineArtworkPaths: x.onlineArtworkPaths,
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
                  src={x.onlineArtworkPaths?.picture_small}
                  fallbackSrc={x.artworkPath}
                  className="mr-4 aspect-square w-6 rounded-full"
                  alt=""
                />
                {x.name}
              </li>
            ))}
          </ol>
        )}
        {artistKeyword.trim() && (
          <Button
            label={`Add new artist '${artistKeyword}'`}
            className="mt-4 !w-full !bg-background-color-2 hover:!bg-background-color-3 hover:text-font-color-black dark:!bg-dark-background-color-2 hover:dark:!bg-dark-background-color-3 hover:dark:text-font-color-black"
            clickHandler={() => {
              updateSongInfo((prevData) => {
                const artists =
                  prevData.artists?.filter(
                    (artist) => artist.name !== artistKeyword
                  ) ?? [];
                if (
                  artistResults.some(
                    (x) => artistKeyword.toLowerCase() === x.name.toLowerCase()
                  )
                ) {
                  for (let x = 0; x < artistResults.length; x += 1) {
                    const result = artistResults[x];
                    if (
                      artistKeyword.toLowerCase() === result.name.toLowerCase()
                    )
                      artists?.push({
                        name: result.name,
                        artistId: result.artistId,
                        artworkPath: result.artworkPath,
                        onlineArtworkPaths: result.onlineArtworkPaths,
                      });
                  }
                } else {
                  artists?.push({
                    name: artistKeyword,
                    artistId: undefined,
                  });
                }
                return {
                  ...prevData,
                  artists,
                };
              });
              updateArtistKeyword('');
            }}
          />
        )}
      </div>
    </div>
  );
};

export default SongArtistsInput;
