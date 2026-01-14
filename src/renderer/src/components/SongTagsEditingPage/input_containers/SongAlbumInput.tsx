import { useTranslation } from 'react-i18next';

import Button from '../../Button';
import Img from '../../Img';
import SongAlbumInputResult from './SongAlbumInputResult';

import DefaultSongArtwork from '../../../assets/images/webp/song_cover_default.webp';

type Props = {
  songAlbum?: SongTagsAlbumData;
  albumKeyword: string;
  albumResults: SongTagsAlbumData[];
  updateSongInfo: (callback: (prevSongInfo: SongTags) => SongTags) => void;
  updateAlbumKeyword: (keyword: string) => void;
};

const SongAlbumInput = (props: Props) => {
  const { t } = useTranslation();

  const { albumKeyword, albumResults, songAlbum, updateAlbumKeyword, updateSongInfo } = props;
  return (
    <div className="tag-input flex max-w-2xl min-w-40 flex-col">
      <label htmlFor="songAlbumNameId3Tag">{t('songTagsEditingPage.albumName')}</label>
      <div className="border-background-color-2 dark:border-dark-background-color-2 mt-2 w-[90%] rounded-xl border-2 p-2">
        <div className="album-names-container p-2 empty:py-2 empty:after:block empty:after:w-full empty:after:text-center empty:after:text-[#ccc] empty:after:content-['No_album_selected_for_this_song.'] dark:empty:after:text-[#ccc]">
          {songAlbum && (
            <div
              key={songAlbum.title}
              className="bg-background-color-3 text-font-color-black dark:bg-dark-background-color-3 dark:text-font-color-black flex items-center justify-between rounded-lg py-1 pr-4 pl-2 text-center"
            >
              <div className="flex items-center">
                <Img
                  src={
                    songAlbum.artworkPath
                      ? /(^$|(http(s)?:\/\/)([\w-]+\.)+[\w-]+([\w- ;,./?%&=]*))/gm.test(
                          songAlbum.artworkPath
                        )
                        ? songAlbum.artworkPath
                        : `nora://localfiles/${songAlbum.artworkPath}`
                      : DefaultSongArtwork
                    // : songArtworkPath
                    // ? `nora://localfiles/${songArtworkPath}`
                  }
                  className="aspect-square w-16 rounded-lg"
                  alt=""
                />
                <div className="ml-4 flex flex-col text-left leading-none">
                  <span className="font-medium">{songAlbum.title}</span>
                  <span>
                    <span className="text-xs font-medium">
                      {songAlbum.artists?.join(', ') || t('common.unknownArtist')}
                    </span>
                    <span className="mx-1">&bull;</span>
                    <span className="text-xs">
                      {t('common.songWithCount', {
                        count: songAlbum.noOfSongs ?? 0
                      })}
                    </span>
                  </span>
                </div>
              </div>
              <Button
                iconName="close"
                iconClassName="leading-none dark:text-font-color-black!"
                className="float-right mr-0! border-0! p-1! outline-offset-1 focus-visible:outline!"
                clickHandler={() => {
                  updateSongInfo((prevData) => {
                    return {
                      ...prevData,
                      album: undefined
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
          className="bg-background-color-2 focus:border-font-color-highlight dark:bg-dark-background-color-2 dark:focus:border-dark-font-color-highlight mt-4 w-full rounded-xl border-2 border-transparent p-2 transition-colors"
          placeholder={t('songTagsEditingPage.searchForAlbums')}
          value={albumKeyword}
          onChange={(e) => {
            const { value } = e.target;
            updateAlbumKeyword(value);
          }}
          onKeyDown={(e) => e.stopPropagation()}
        />
        {albumResults.length > 0 && (
          <div className="album-results-container border-background-color-2 dark:border-dark-background-color-2 mt-4 max-h-60 overflow-y-auto rounded-xl border-2">
            {albumResults.map((x) => (
              <SongAlbumInputResult
                key={x.albumId}
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
            className="bg-background-color-2! hover:bg-background-color-3! hover:text-font-color-black dark:bg-dark-background-color-2! dark:hover:bg-dark-background-color-3! dark:hover:text-font-color-black mt-4 w-full!"
            clickHandler={() => {
              updateSongInfo((prevData) => {
                if (
                  albumResults.some((x) => albumKeyword.toLowerCase() === x.title.toLowerCase())
                ) {
                  for (let x = 0; x < albumResults.length; x += 1) {
                    const result = albumResults[x];
                    if (albumKeyword.toLowerCase() === result.title.toLowerCase()) {
                      return {
                        ...prevData,
                        album: {
                          title: result.title,
                          albumId: result.albumId,
                          noOfSongs: result.noOfSongs ? result.noOfSongs + 1 : 1,
                          artworkPath: result.artworkPath
                        }
                      };
                    }
                  }
                } else {
                  return {
                    ...prevData,
                    album: {
                      title: albumKeyword,
                      noOfSongs: 1,
                      albumId: undefined
                    }
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
