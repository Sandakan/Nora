/* eslint-disable react/jsx-no-useless-fragment */
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { AppContext } from '../../contexts/AppContext';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import storage from '../../utils/localStorage';

import Button from '../Button';

type Props = {
  name?: string;
  artistId?: string;
};

const DuplicateArtistsSuggestion = (props: Props) => {
  const { bodyBackgroundImage, currentlyActivePage, currentSongData } = useContext(AppContext);
  const { addNewNotifications, changeCurrentActivePage, updateCurrentSongData } =
    useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { name = '', artistId = '' } = props;

  const [isVisible, setIsVisible] = useState(true);
  const [duplicateArtists, setDuplicateArtists] = useState<Artist[]>([]);
  const [isMessageVisible, setIsMessageVisible] = useState(true);

  const ignoredDuplicateArtists = useMemo(
    () => storage.ignoredDuplicates.getIgnoredDuplicates('artists'),
    []
  );

  useEffect(() => {
    const isIgnored =
      ignoredDuplicateArtists.length > 0 && ignoredDuplicateArtists.some((x) => x.includes(name));

    if (isIgnored) setIsVisible(false);

    if (name?.trim() && !isIgnored) {
      window.api.suggestions
        .getArtistDuplicates(name)
        .then((res) => setDuplicateArtists(res))
        .catch((err) => console.error(err));
    }
  }, [ignoredDuplicateArtists, name]);

  const duplicateArtistComponents = useMemo(() => {
    if (duplicateArtists.length > 0) {
      const artists = duplicateArtists.map((artist, i, arr) => {
        return (
          <>
            <Button
              className={`!m-0 !inline-flex !border-0 !p-0 !text-font-color-highlight dark:!text-dark-font-color-highlight ${
                artistId !== artist.artistId ? 'hover:underline' : '!cursor-default'
              }`}
              label={artist.name}
              clickHandler={() =>
                artistId !== artist.artistId &&
                changeCurrentActivePage('ArtistInfo', {
                  artistName: artist.name,
                  artistId: artist.artistId
                })
              }
            />
            {i !== arr.length - 1 && (
              <span>{i === arr.length - 2 ? ` ${t('common.and')} ` : ', '}</span>
            )}
          </>
        );
      });

      return artists;
    }
    return [];
  }, [artistId, changeCurrentActivePage, duplicateArtists, t]);

  const linkToArtist = useCallback(
    (
      selectedId: string,
      setIsDisabled: (_state: boolean) => void,
      setIsPending: (_state: boolean) => void
    ) => {
      setIsDisabled(true);
      setIsPending(true);

      const duplicateIds = duplicateArtists
        .map((x) => x.artistId)
        .filter((id) => id !== selectedId);

      window.api.suggestions
        .resolveArtistDuplicates(selectedId, duplicateIds)
        .then((res) => {
          if (res?.updatedData && currentSongData.songId === res.updatedData.songId) {
            updateCurrentSongData((prevData) => ({
              ...prevData,
              ...res.updatedData
            }));
          }
          setIsVisible(false);
          if (duplicateIds.includes(currentlyActivePage.data?.artistId))
            changeCurrentActivePage('Home');
          return addNewNotifications([
            {
              content: t('common.artistConflictResolved'),
              iconName: 'done',
              delay: 5000,
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
      changeCurrentActivePage,
      currentSongData.songId,
      currentlyActivePage.data?.artistId,
      duplicateArtists,
      t,
      updateCurrentSongData
    ]
  );

  return (
    <>
      {duplicateArtists.length > 1 && isVisible && (
        <div
          className={`appear-from-bottom mx-auto mb-6 w-[90%] rounded-lg p-4 text-black shadow-md transition-[height] dark:text-white ${
            bodyBackgroundImage
              ? 'bg-background-color-2/75 backdrop-blur-sm dark:bg-dark-background-color-2/75'
              : 'bg-background-color-2 dark:bg-dark-background-color-2'
          } `}
        >
          <label
            htmlFor="toggleSuggestionBox"
            className="title-container flex cursor-pointer items-center justify-between font-medium text-font-color-highlight dark:text-dark-font-color-highlight"
          >
            <div className="flex items-center">
              <span className="material-icons-round-outlined mr-2 text-2xl">help</span>{' '}
              {t('common.suggestion')}
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
                className="!m-0 !border-0 !p-0 outline-1 outline-offset-1 hover:bg-background-color-1/50 focus-visible:!outline hover:dark:bg-dark-background-color-1/50"
                iconClassName="!leading-none !text-3xl"
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
                i18nKey="duplicateArtistsSuggestion.message"
                components={{
                  div: <div />,
                  span: <span>{duplicateArtistComponents}</span>,
                  p: <p className="mt-2 text-sm" />
                }}
              />
              <div className="mt-3 flex items-center">
                {duplicateArtists.map((artist) => (
                  <Button
                    key={artist.name}
                    className="!border-0 bg-background-color-1/50 !px-4 !py-2 outline-1 transition-colors hover:bg-background-color-1 hover:!text-font-color-highlight focus-visible:!outline dark:bg-dark-background-color-1/50 dark:hover:bg-dark-background-color-1 dark:hover:!text-dark-font-color-highlight"
                    iconName="verified"
                    iconClassName="material-icons-round-outlined"
                    label={t('duplicateArtistsSuggestion.linkToArtist', {
                      name: artist.name
                    })}
                    clickHandler={(_, setIsDisabled, setIsPending) =>
                      linkToArtist(artist.artistId, setIsDisabled, setIsPending)
                    }
                  />
                ))}
                <Button
                  className="!mr-0 !border-0 bg-background-color-1/50 !px-4 !py-2 outline-1 transition-colors hover:bg-background-color-1 hover:!text-font-color-highlight focus-visible:!outline dark:bg-dark-background-color-1/50 dark:hover:bg-dark-background-color-1 dark:hover:!text-dark-font-color-highlight"
                  iconName="do_not_disturb_on"
                  iconClassName="material-icons-round-outlined"
                  label={t('common.ignore')}
                  clickHandler={() => {
                    storage.ignoredDuplicates.setIgnoredDuplicates('artists', [artistId]);
                    setIsVisible(true);
                    addNewNotifications([
                      {
                        id: 'suggestionIgnored',
                        iconClassName: '!material-icons-round-outlined',
                        iconName: 'do_not_disturb_on',
                        delay: 5000,
                        content: t('notifications.suggestionIgnored')
                      }
                    ]);
                  }}
                />
                <span
                  className="material-icons-round-outlined ml-4 cursor-pointer text-xl opacity-80 transition-opacity hover:opacity-100"
                  title="Keep in mind that linking artists will update the library as well as metadata in songs linked these artists."
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

export default DuplicateArtistsSuggestion;
