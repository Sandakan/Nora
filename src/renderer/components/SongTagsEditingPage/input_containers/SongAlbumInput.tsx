/* eslint-disable jsx-a11y/label-has-associated-control */
import { useTranslation } from 'react-i18next';

import Button from 'renderer/components/Button';
import Img from 'renderer/components/Img';
import SongAlbumInputResult from './SongAlbumInputResult';

import DefaultSongArtwork from '../../../../../assets/images/webp/song_cover_default.webp';

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
  updateSongInfo: (callback: (prevSongInfo: SongTags) => SongTags) => void;
  updateAlbumKeyword: (keyword: string) => void;
};

const SongAlbumInput = (props: Props) => {
  const { t } = useTranslation();

  const {
    albumKeyword,
    albumResults,
    songAlbum,
    updateAlbumKeyword,
    updateSongInfo,
  } = props;
  return (
    <div className="tag-input flex min-w-[10rem] max-w-2xl flex-col">
      <label htmlFor="songAlbumNameId3Tag">
        {t('songTagsEditingPage.albumName')}
      </label>
      <div className="mt-2 w-[90%] rounded-xl border-2 border-background-color-2 p-2 dark:border-dark-background-color-2">
        <div className="album-names-container p-2 empty:py-2 empty:after:block empty:after:w-full empty:after:text-center  empty:after:text-[#ccc] empty:after:content-['No_album_selected_for_this_song.'] dark:empty:after:text-[#ccc]">
          {songAlbum && (
            <div
              key={songAlbum.title}
              className="flex items-center justify-between rounded-lg bg-background-color-3 py-1 pl-2 pr-4 text-center text-font-color-black dark:bg-dark-background-color-3 dark:text-font-color-black"
            >
              <div className="flex items-center">
                <Img
                  src={
                    songAlbum.artworkPath
                      ? /(^$|(http(s)?:\/\/)([\w-]+\.)+[\w-]+([\w- ;,./?%&=]*))/gm.test(
                          songAlbum.artworkPath,
                        )
                        ? songAlbum.artworkPath
                        : `nora://localFiles/${songAlbum.artworkPath}`
                      : DefaultSongArtwork
                    // : songArtworkPath
                    // ? `nora://localFiles/${songArtworkPath}`
                  }
                  className="aspect-square w-16 rounded-lg"
                  alt=""
                />
                <div className="ml-4 flex flex-col text-left leading-none">
                  <span className="font-medium">{songAlbum.title}</span>
                  <span>
                    <span className="font-medium text-xs">
                      {songAlbum.artists?.join(', ') ||
                        t('common.unknownArtist')}
                    </span>
                    <span className="mx-1">&bull;</span>
                    <span className="text-xs">
                      {t('common.songWithCount', {
                        count: songAlbum.noOfSongs ?? 0,
                      })}
                    </span>
                  </span>
                </div>
              </div>
              <Button
                iconName="close"
                iconClassName="leading-none dark:!text-font-color-black"
                className="float-right !mr-0 !border-0 !p-1 outline-1 outline-offset-1 focus-visible:!outline"
                clickHandler={() => {
                  updateSongInfo((prevData) => {
                    return {
                      ...prevData,
                      album: undefined,
                    };
                  });
                }}
              />
            </div>
          )}
        </div>
        <input
          type="search"
          id="songAlbumNameId3Tag"
          className="mt-4 w-full rounded-xl border-2 border-transparent bg-background-color-2 p-2 transition-colors focus:border-font-color-highlight dark:bg-dark-background-color-2 dark:focus:border-dark-font-color-highlight"
          placeholder={t('songTagsEditingPage.searchForAlbums')}
          value={albumKeyword}
          onChange={(e) => {
            const { value } = e.target;
            updateAlbumKeyword(value);
          }}
          onKeyDown={(e) => e.stopPropagation()}
        />
        {albumResults.length > 0 && (
          <div className="album-results-container mt-4 rounded-xl border-2 border-background-color-2 dark:border-dark-background-color-2 max-h-60 overflow-y-auto">
            {albumResults.map((x) => (
              <SongAlbumInputResult
                albumData={x}
                updateAlbumKeyword={updateAlbumKeyword}
                updateSongInfo={updateSongInfo}
              />
            ))}
          </div>
        )}
        {albumKeyword.trim() && (
          <Button
            label={t('songTagsEditingPage.addNewAlbum', { name: albumKeyword })}
            className="mt-4 !w-full !bg-background-color-2 hover:!bg-background-color-3 hover:text-font-color-black dark:!bg-dark-background-color-2 hover:dark:!bg-dark-background-color-3 hover:dark:text-font-color-black"
            clickHandler={() => {
              updateSongInfo((prevData) => {
                if (
                  albumResults.some(
                    (x) => albumKeyword.toLowerCase() === x.title.toLowerCase(),
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
