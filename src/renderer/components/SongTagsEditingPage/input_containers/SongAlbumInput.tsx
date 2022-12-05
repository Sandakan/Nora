/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/label-has-associated-control */
import Button from 'renderer/components/Button';
import Img from 'renderer/components/Img';
import DefaultSongArtwork from '../../../../../assets/images/png/song_cover_default.png';

type Props = {
  songAlbum?: {
    title: string;
    albumId?: string | undefined;
    noOfSongs?: number | undefined;
    artists?: string[] | undefined;
    artworkPath?: string | undefined;
  };
  albumKeyword: string;
  albumResults: {
    title: string;
    albumId?: string;
    noOfSongs?: number;
    artists?: string[];
    artworkPath?: string;
  }[];
  songArtworkPath?: string;
  updateSongInfo: (callback: (prevSongInfo: SongTags) => SongTags) => void;
  updateAlbumKeyword: (keyword: string) => void;
};

const SongAlbumInput = (props: Props) => {
  const {
    albumKeyword,
    albumResults,
    songAlbum,
    songArtworkPath,
    updateAlbumKeyword,
    updateSongInfo,
  } = props;
  return (
    <div className="tag-input mb-6 flex w-[45%] min-w-[10rem] flex-col">
      <label htmlFor="song-album-name-id3-tag">Album Name</label>
      <div className="mt-2 w-[90%] rounded-xl border-2 border-background-color-2 p-2 dark:border-dark-background-color-2">
        <div className="album-names-container p-2 empty:py-2 empty:after:block empty:after:w-full empty:after:text-center  empty:after:text-[#ccc] empty:after:content-['No_album_for_this_song.'] dark:empty:after:text-[#ccc]">
          {songAlbum && (
            <div
              key={songAlbum.title}
              className="flex items-center justify-between rounded-lg bg-background-color-3 py-1 pl-2 pr-4 text-center text-font-color-black dark:bg-dark-background-color-3 dark:text-font-color-black"
            >
              <div className="flex items-center">
                <Img
                  src={
                    songArtworkPath
                      ? /(^$|(http(s)?:\/\/)([\w-]+\.)+[\w-]+([\w- ;,./?%&=]*))/gm.test(
                          songArtworkPath
                        )
                        ? songArtworkPath
                        : `nora://localFiles/${songArtworkPath}`
                      : DefaultSongArtwork
                    // : songArtworkPath
                    // ? `nora://localFiles/${songArtworkPath}`
                  }
                  className="aspect-square w-16 rounded-lg"
                  alt=""
                />
                <div className="ml-4 flex flex-col text-left">
                  <span className="font-medium">{songAlbum.title}</span>
                  <span className="text-xs">{`${
                    songAlbum.noOfSongs ?? 0
                  } songs (including current song)`}</span>
                </div>
              </div>
              <span
                className="material-icons-round float-right mr-2 cursor-pointer"
                onClick={() => {
                  updateSongInfo((prevData) => {
                    return {
                      ...prevData,
                      album: undefined,
                    };
                  });
                }}
                role="button"
                tabIndex={0}
              >
                close
              </span>
            </div>
          )}
        </div>
        <input
          type="search"
          className="mt-4 w-full rounded-xl bg-background-color-2 p-2 dark:bg-dark-background-color-2"
          placeholder="Search for albums here."
          value={albumKeyword}
          onChange={(e) => {
            const { value } = e.target;
            updateAlbumKeyword(value);
          }}
          onKeyDown={(e) => e.stopPropagation()}
        />
        {albumResults.length > 0 && (
          <ol className="album-results-container mt-4 rounded-xl border-2 border-background-color-2 dark:border-dark-background-color-2 ">
            {albumResults.map((x) => (
              <li
                key={x.albumId ?? x.title}
                className="box-content cursor-pointer border-b-[1px] border-background-color-2 py-2 pr-4 pl-6 font-light last:border-b-0 only:border-b-0 hover:bg-background-color-2 dark:border-dark-background-color-2 dark:hover:bg-dark-background-color-2"
                onClick={() => {
                  updateSongInfo((prevData) => {
                    return {
                      ...prevData,
                      album: {
                        title: x.title,
                        albumId: x.albumId,
                        noOfSongs: x.noOfSongs ? x.noOfSongs + 1 : 1,
                        artworkPath: x.artworkPath,
                      },
                    };
                  });
                  updateAlbumKeyword('');
                }}
              >
                {x.title}
              </li>
            ))}
          </ol>
        )}
        {albumKeyword.trim() && (
          <Button
            label={`Add new album '${albumKeyword}'`}
            className="mt-4 !w-full !bg-background-color-2 hover:!bg-background-color-3 hover:text-font-color-black dark:!bg-dark-background-color-2 hover:dark:!bg-dark-background-color-3 hover:dark:text-font-color-black"
            clickHandler={() => {
              updateSongInfo((prevData) => {
                if (
                  albumResults.some(
                    (x) => albumKeyword.toLowerCase() === x.title.toLowerCase()
                  )
                ) {
                  for (let x = 0; x < albumResults.length; x += 1) {
                    const result = albumResults[x];
                    if (
                      albumKeyword.toLowerCase() === result.title.toLowerCase()
                    ) {
                      return {
                        ...prevData,
                        album: {
                          title: result.title,
                          albumId: result.albumId,
                          noOfSongs: result.noOfSongs
                            ? result.noOfSongs + 1
                            : 1,
                          artworkPath: result.artworkPath,
                        },
                      };
                    }
                  }
                } else {
                  return {
                    ...prevData,
                    album: {
                      title: albumKeyword,
                      noOfSongs: 1,
                      albumId: undefined,
                    },
                  };
                }
                return prevData;
              });
              updateAlbumKeyword('');
            }}
          />
        )}
      </div>
    </div>
  );
};

export default SongAlbumInput;
