/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useTranslation } from 'react-i18next';

import Button from '../../Button';

type Props = {
  songGenres?: {
    genreId?: string | undefined;
    name: string;
    artworkPath?: string | undefined;
  }[];
  genreResults: { genreId?: string; name: string; artworkPath?: string }[];
  genreKeyword: string;
  updateSongInfo: (_callback: (_prevSongInfo: SongTags) => SongTags) => void;
  updateGenreKeyword: (_keyword: string) => void;
};

const SongGenresInput = (props: Props) => {
  const { t } = useTranslation();
  const { songGenres, genreResults, genreKeyword, updateSongInfo, updateGenreKeyword } = props;

  return (
    <div className="tag-input flex min-w-[10rem] max-w-2xl flex-col">
      <label htmlFor="song-genres-id3-tag">{t('common.genre_other')}</label>
      <div className="mt-2 w-[90%] rounded-xl border-2 border-background-color-2 p-2 dark:border-dark-background-color-2">
        <div className="genres-container flex flex-wrap p-2 empty:py-2 empty:after:h-full empty:after:w-full empty:after:text-center empty:after:text-[#ccc] empty:after:content-['No_genres_selected_for_this_song.'] dark:empty:after:text-[#ccc]">
          {songGenres &&
            songGenres.map((genre) => (
              <span
                key={genre.name}
                className="mb-2 mr-2 flex w-fit items-center rounded-2xl bg-background-color-3 px-3 py-1 text-center text-font-color-black dark:bg-dark-background-color-3 dark:text-font-color-black"
              >
                <Button
                  iconName="close"
                  className="material-icons-round !mr-[.375rem] !border-0 !p-[.125rem] outline-1 outline-offset-1 transition-[visibility,opacity] focus-visible:!outline"
                  iconClassName="leading-none dark:!text-font-color-black"
                  clickHandler={() => {
                    updateSongInfo((prevData) => {
                      return {
                        ...prevData,
                        genres: prevData.genres?.filter((x) => x.name !== genre.name) ?? []
                      };
                    });
                  }}
                />
                {genre.name}
              </span>
            ))}
        </div>
        <input
          type="search"
          id="song-genres-id3-tag"
          className="mt-4 w-full rounded-xl border-2 border-transparent bg-background-color-2 p-2 transition-colors focus:border-font-color-highlight dark:bg-dark-background-color-2 dark:focus:border-dark-font-color-highlight"
          placeholder={t('songTagsEditingPage.searchForGenres')}
          value={genreKeyword}
          onChange={(e) => {
            const { value } = e.target;
            updateGenreKeyword(value);
          }}
          onKeyDown={(e) => e.stopPropagation()}
        />
        {genreResults.length > 0 && (
          <ol className="genres-results-container mt-4 max-h-60 overflow-y-auto rounded-xl border-2 border-background-color-2 dark:border-dark-background-color-2">
            {genreResults.map((x) => (
              <li
                key={x.genreId ?? x.name}
                className="box-content cursor-pointer border-b-[1px] border-background-color-2 py-2 pl-6 pr-4 font-light last:border-b-0 only:border-b-0 hover:bg-background-color-2 dark:border-dark-background-color-2 dark:hover:bg-dark-background-color-2"
                onClick={() => {
                  updateSongInfo((prevData) => {
                    const genres = prevData.genres?.filter((genre) => genre.name !== x.name) ?? [];
                    genres?.push({
                      name: x.name,
                      genreId: x.genreId
                    });
                    return {
                      ...prevData,
                      genres
                    };
                  });
                  updateGenreKeyword('');
                }}
              >
                {x.name}
              </li>
            ))}
          </ol>
        )}
        {genreKeyword.trim() && (
          <Button
            label={t('songTagsEditingPage.addNewGenre')}
            className="mt-4 !w-full !bg-background-color-2 hover:!bg-background-color-3 hover:text-font-color-black dark:!bg-dark-background-color-2 hover:dark:!bg-dark-background-color-3 hover:dark:text-font-color-black"
            clickHandler={() => {
              updateSongInfo((prevData) => {
                const genres =
                  prevData.genres?.filter((genre) => genre.name !== genreKeyword) ?? [];
                if (genreResults.some((x) => genreKeyword.toLowerCase() === x.name.toLowerCase())) {
                  for (let x = 0; x < genreResults.length; x += 1) {
                    const result = genreResults[x];
                    if (genreKeyword.toLowerCase() === result.name.toLowerCase())
                      genres?.push({
                        name: result.name,
                        genreId: result.genreId
                      });
                  }
                } else {
                  genres?.push({
                    name: genreKeyword,
                    genreId: undefined
                  });
                }

                return {
                  ...prevData,
                  genres
                };
              });
              updateGenreKeyword('');
            }}
          />
        )}
      </div>
    </div>
  );
};

export default SongGenresInput;
