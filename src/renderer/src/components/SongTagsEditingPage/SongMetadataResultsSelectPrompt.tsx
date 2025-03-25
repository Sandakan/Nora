/* eslint-disable jsx-a11y/label-has-associated-control */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import Button from '../Button';
import SongMetadataResult from './SongMetadataResult';

interface SongMetadataResultsSelectPageProp {
  songTitle: string;
  songArtists: string[];
  updateSongInfo: (callback: (prevData: SongTags) => SongTags) => void;
}

type DataLoadingStates = 'PENDING' | 'SUCCESS' | 'EMPTY' | 'FAILED' | 'FETCH_START';

const SongMetadataResultsSelectPage = (props: SongMetadataResultsSelectPageProp) => {
  const { t } = useTranslation();

  const { songTitle, songArtists, updateSongInfo } = props;

  const [songData, setSongData] = useState({
    songTitle: '',
    songArtists: ''
  });
  const [loadingStates, setLoadingStates] = useState('FETCH_START' as DataLoadingStates);
  const [songResults, setSongResults] = useState([] as SongMetadataResultFromInternet[]);

  const fetchSongResults = useCallback((title: string, artists: string[]) => {
    setLoadingStates('PENDING');
    if (title) {
      window.api.songDataFromInternet
        .searchSongMetadataResultsInInternet(title, artists)
        .then((res) => {
          setLoadingStates(res.length === 0 ? 'EMPTY' : 'SUCCESS');
          setSongResults(res);
          return console.table(res);
        })
        .catch((err) => {
          setLoadingStates('FAILED');
          console.error(err);
        });
    }
  }, []);

  useEffect(() => {
    setSongData({ songTitle, songArtists: songArtists.join(', ') });
    fetchSongResults(songTitle, songArtists);
  }, [songTitle, songArtists, fetchSongResults]);

  const songResultComponents = useMemo(() => {
    return songResults.length > 0
      ? songResults.map((x) => (
          <SongMetadataResult
            key={`${x.title}-${x.sourceId}`}
            title={x.title}
            artists={x.artists}
            genres={x.genres}
            artworkPaths={x.artworkPaths}
            album={x.album}
            lyrics={x.lyrics}
            releasedYear={x.releasedYear}
            updateSongInfo={updateSongInfo}
          />
        ))
      : [];
  }, [songResults, updateSongInfo]);

  return (
    <div className="relative">
      <div className="title-container mb-4 w-full text-2xl font-medium">
        <Trans
          i18nKey="songMetadataResultSelectPrompt.title"
          components={{
            span: (
              <span className="text-font-color-highlight dark:text-dark-font-color-highlight">
                "{songTitle}"
              </span>
            )
          }}
        />
      </div>
      <div className="query-editing-inputs-container my-2 flex items-center justify-between">
        <div>
          <label htmlFor="songTitleInput">{t('common.title')} : </label>
          <input
            type="text"
            id="songTitleInput"
            className="mr-8 h-10 w-80 rounded-md bg-background-color-2 px-2 py-1 dark:bg-dark-background-color-2"
            value={songData.songTitle}
            onChange={(e) => {
              setSongData((prevData) => ({
                ...prevData,
                songTitle: e.target?.value
              }));
            }}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="Song Title"
          />
          <label htmlFor="songArtistsInput">{t('common.artist_other')} : </label>
          <input
            type="text"
            id="songArtistsInput"
            className="h-10 w-80 rounded-md bg-background-color-2 px-2 py-1 dark:bg-dark-background-color-2"
            value={songData.songArtists}
            onChange={(e) => {
              setSongData((prevData) => ({
                ...prevData,
                songArtists: e.target.value
              }));
            }}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder={`Artists (split using ',')`}
          />
        </div>
        <Button
          label={t('common.search')}
          clickHandler={() =>
            fetchSongResults(songData.songTitle, songData.songArtists.split(', '))
          }
          className="w-32! bg-background-color-3! px-8 text-lg text-font-color-black! hover:border-background-color-3 dark:bg-dark-background-color-3! dark:hover:border-background-color-3"
        />
      </div>

      <div
        className={`song-results-container flex min-h-[15rem] flex-col items-center justify-center overflow-y-auto ${
          // eslint-disable-next-line no-nested-ternary
          loadingStates === 'PENDING'
            ? `after:absolute after:h-5 after:w-5 after:animate-spin-ease after:rounded-full after:border-2 after:border-[transparent] after:border-t-font-color-black after:content-[''] dark:after:border-t-font-color-white`
            : loadingStates === 'EMPTY'
              ? `flex items-center justify-center text-font-color-dimmed after:absolute after:content-["We_couldn't_find_any_results."]`
              : ''
        }`}
      >
        {songResultComponents.length > 0 && loadingStates === 'SUCCESS' && songResultComponents}
      </div>
    </div>
  );
};

export default SongMetadataResultsSelectPage;
