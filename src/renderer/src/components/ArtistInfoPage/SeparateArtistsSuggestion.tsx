import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import storage from '../../utils/localStorage';

import Button from '../Button';
import splitFeaturingArtists from '../../utils/splitFeaturingArtists';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store/store';
import { useNavigate } from '@tanstack/react-router';

type Props = {
  name?: string;
  artistId?: number;
};

const SeparateArtistsSuggestion = (props: Props) => {
  const navigate = useNavigate();

  const bodyBackgroundImage = useStore(store, (state) => state.bodyBackgroundImage);
  const currentSongData = useStore(store, (state) => state.currentSongData);

  const { addNewNotifications, updateCurrentSongData } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { name = '', artistId } = props;

  const [isIgnored, setIsIgnored] = useState(false);
  const [isMessageVisible, setIsMessageVisible] = useState(true);

  const ignoredArtists = useMemo(
    () => storage.ignoredSeparateArtists.getIgnoredSeparateArtists(),
    []
  );

  useEffect(() => {
    if (ignoredArtists.length > 0 && artistId !== undefined)
      setIsIgnored(ignoredArtists.includes(artistId));
  }, [artistId, ignoredArtists]);

  const separatedArtistsNames = useMemo(() => {
    const artists = splitFeaturingArtists(name);
    const filterArtists = artists.filter((x) => x !== undefined && x.trim() !== '');
    const trimmedArtists = filterArtists.map((x) => x.trim());

    return [...new Set(trimmedArtists)];
  }, [name]);

  const artistComponents = useMemo(() => {
    if (separatedArtistsNames.length > 0) {
      const artists = separatedArtistsNames.map((artist, i, arr) => {
        return (
          <>
            <span
              className="text-font-color-highlight dark:text-dark-font-color-highlight"
              key={artist}
            >
              {artist}
            </span>
            {i !== arr.length - 1 && (
              <span key={`${arr[i]}=>${arr[i + 1]}`}>
                {i === arr.length - 2 ? ` ${t('common.and')} ` : ', '}
              </span>
            )}
          </>
        );
      });

      return artists;
    }
    return [];
  }, [separatedArtistsNames, t]);

  const separateArtists = useCallback(
    (setIsDisabled: (_state: boolean) => void, setIsPending: (_state: boolean) => void) => {
      setIsDisabled(true);
      setIsPending(true);

      if (artistId === undefined) return;

      window.api.suggestions
        .resolveSeparateArtists(artistId, separatedArtistsNames)
        .then((res) => {
          if (res?.updatedData && currentSongData.songId === res.updatedData.songId) {
            updateCurrentSongData((prevData) => ({
              ...prevData,
              ...res.updatedData
            }));
          }
          setIsIgnored(true);
          navigate({ to: '/main-player/home' });

          return addNewNotifications([
            {
              content: t('common.artistConflictResolved'),
              iconName: 'done',
              duration: 5000,
              id: 'ArtistDuplicateSuggestion'
            }
          ]);
        })
        .finally(() => {
          setIsDisabled(false);
          setIsPending(false);
        })
        .catch((err) => console.error(err));
    },
    [
      addNewNotifications,
      artistId,
      currentSongData.songId,
      separatedArtistsNames,
      t,
      updateCurrentSongData
    ]
  );

  return (
    <>
      {separatedArtistsNames.length > 1 && !isIgnored && (
        <div
          className={`appear-from-bottom mx-auto mb-6 w-[90%] rounded-lg p-4 text-black shadow-md transition-[width,height] dark:text-white ${
            bodyBackgroundImage
              ? 'bg-background-color-2/75 dark:bg-dark-background-color-2/75 backdrop-blur-xs'
              : 'bg-background-color-2 dark:bg-dark-background-color-2'
          } `}
        >
          <label
            htmlFor="toggleSuggestionBox"
            className="title-container text-font-color-highlight dark:text-dark-font-color-highlight flex cursor-pointer items-center justify-between font-medium"
          >
            <div className="flex items-center">
              <span className="material-icons-round-outlined mr-2 text-2xl">help</span>{' '}
              {t('common.suggestion')}{' '}
            </div>
            <div className="flex items-center">
              <span
                className="material-icons-round-outlined mr-4 text-xl"
                title="This feature is still in the experimental state."
              >
                science
              </span>
              <Button
                id="toggleSuggestionBox"
                className="hover:bg-background-color-1/50 dark:hover:bg-dark-background-color-1/50 m-0! border-0! p-0! outline-offset-1 focus-visible:outline!"
                iconClassName="leading-none! text-3xl!"
                iconName={isMessageVisible ? 'arrow_drop_up' : 'arrow_drop_down'}
                tooltipLabel={`common.${isMessageVisible ? 'hideSuggestion' : 'showSuggestion'}`}
                clickHandler={(e) => {
                  e.preventDefault();
                  setIsMessageVisible((state) => !state);
                }}
              />
            </div>
          </label>
          {isMessageVisible && (
            <div>
              <Trans
                i18nKey="separateArtistsSuggestion.message"
                values={{ count: separatedArtistsNames.length }}
                components={{
                  div: <div />,
                  span: <span>{artistComponents}</span>,
                  p: <p className="mt-2 text-sm" />
                }}
              />
              <div className="mt-3 flex items-center">
                <Button
                  className="bg-background-color-1/50 hover:bg-background-color-1 hover:text-font-color-highlight! dark:bg-dark-background-color-1/50 dark:hover:bg-dark-background-color-1 dark:hover:text-dark-font-color-highlight! border-0! px-4! py-2! transition-colors focus-visible:outline!"
                  iconName="verified"
                  iconClassName="material-icons-round-outlined"
                  label={t('separateArtistsSuggestion.separateAsArtists', {
                    count: separatedArtistsNames.length
                  })}
                  clickHandler={(_, setIsDisabled, setIsPending) =>
                    separateArtists(setIsDisabled, setIsPending)
                  }
                />
                <Button
                  className="bg-background-color-1/50 hover:bg-background-color-1 hover:text-font-color-highlight! dark:bg-dark-background-color-1/50 dark:hover:bg-dark-background-color-1 dark:hover:text-dark-font-color-highlight! mr-0! border-0! px-4! py-2! transition-colors focus-visible:outline!"
                  iconName="do_not_disturb_on"
                  iconClassName="material-icons-round-outlined"
                  label="Ignore"
                  clickHandler={() => {
                    if (artistId !== undefined)
                      storage.ignoredSeparateArtists.setIgnoredSeparateArtists([artistId]);
                    setIsIgnored(true);
                    addNewNotifications([
                      {
                        id: 'suggestionIgnored',
                        iconName: 'do_not_disturb_on',
                        iconClassName: 'material-icons-round-outlined',
                        duration: 5000,
                        content: t('notifications.suggestionIgnored')
                      }
                    ]);
                  }}
                />
                <span
                  className="material-icons-round-outlined ml-4 cursor-pointer text-xl opacity-80 transition-opacity hover:opacity-100"
                  title="Keep in mind that seperating artists will update the library as well as metadata in songs linked these artists."
                >
                  info
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default SeparateArtistsSuggestion;
