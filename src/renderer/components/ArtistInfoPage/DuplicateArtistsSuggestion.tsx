/* eslint-disable react/jsx-no-useless-fragment */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import storage from 'renderer/utils/localStorage';

import Button from '../Button';

type Props = {
  name?: string;
  artistId?: string;
};

const DuplicateArtistsSuggestion = (props: Props) => {
  const { bodyBackgroundImage, currentlyActivePage, currentSongData } =
    React.useContext(AppContext);
  const {
    addNewNotifications,
    changeCurrentActivePage,
    updateCurrentSongData,
  } = React.useContext(AppUpdateContext);

  const { name = '', artistId = '' } = props;

  const [isVisible, setIsVisible] = React.useState(true);
  const [duplicateArtists, setDuplicateArtists] = React.useState<Artist[]>([]);
  const [isMessageVisible, setIsMessageVisible] = React.useState(true);

  const ignoredDuplicateArtists = React.useMemo(
    () => storage.ignoredDuplicates.getIgnoredDuplicates('artists'),
    []
  );

  React.useEffect(() => {
    const isIgnored =
      ignoredDuplicateArtists.length > 0 &&
      ignoredDuplicateArtists.some((x) => x.includes(name));

    if (isIgnored) setIsVisible(false);

    if (name?.trim() && !isIgnored) {
      window.api
        .getArtistDuplicates(name)
        .then((res) => setDuplicateArtists(res))
        .catch((err) => console.error(err));
    }
  }, [ignoredDuplicateArtists, name]);

  const duplicateArtistComponents = React.useMemo(() => {
    if (duplicateArtists.length > 0) {
      const artists = duplicateArtists.map((artist, i, arr) => {
        return (
          <>
            <Button
              className={`!m-0 !inline-flex !border-0 !p-0 !text-font-color-highlight dark:!text-dark-font-color-highlight ${
                artistId !== artist.artistId
                  ? 'hover:underline'
                  : '!cursor-default'
              }`}
              label={artist.name}
              clickHandler={() =>
                artistId !== artist.artistId &&
                changeCurrentActivePage('ArtistInfo', {
                  artistName: artist.name,
                  artistId: artist.artistId,
                })
              }
            />
            {i !== arr.length - 1 && (
              <span>{i === arr.length - 2 ? ' and ' : ', '}</span>
            )}
          </>
        );
      });

      return artists;
    }
    return [];
  }, [artistId, changeCurrentActivePage, duplicateArtists]);

  const linkToArtist = React.useCallback(
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

      window.api
        .resolveArtistDuplicates(selectedId, duplicateIds)
        .then((res) => {
          if (
            res?.updatedData &&
            currentSongData.songId === res.updatedData.songId
          ) {
            updateCurrentSongData((prevData) => ({
              ...prevData,
              ...res.updatedData,
            }));
          }
          setIsVisible(false);
          if (duplicateIds.includes(currentlyActivePage.data?.artistId))
            changeCurrentActivePage('Home');
          return addNewNotifications([
            {
              content: 'Artist conflict resolved successfully.',
              delay: 5000,
              id: 'ArtistDuplicateSuggestion',
            },
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
      currentlyActivePage.data?.artistId,
      duplicateArtists,
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
              <span className="material-icons-round-outlined mr-2 text-2xl">
                help
              </span>{' '}
              Suggestion
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
                iconName={
                  isMessageVisible ? 'arrow_drop_up' : 'arrow_drop_down'
                }
                tooltipLabel={
                  isMessageVisible ? 'Hide suggestion' : 'Show suggestion'
                }
                clickHandler={() => setIsMessageVisible((state) => !state)}
              />
            </div>
          </label>
          {isMessageVisible && (
            <div>
              <div>
                <p className="mt-2 text-sm">
                  Are {duplicateArtistComponents} the same artist?
                </p>
                <p className="mt-2 text-sm">
                  If they are, you can link content of them into a single
                  artist, or you can ignore this suggestion.
                </p>
              </div>
              <div className="mt-3 flex items-center">
                {duplicateArtists.map((artist) => (
                  <Button
                    key={artist.name}
                    className="!border-0 bg-background-color-1/50 !px-4 !py-2 outline-1 transition-colors hover:bg-background-color-1 hover:!text-font-color-highlight focus-visible:!outline dark:bg-dark-background-color-1/50 dark:hover:bg-dark-background-color-1 dark:hover:!text-dark-font-color-highlight"
                    iconName="verified"
                    iconClassName="material-icons-round-outlined"
                    label={`Link to '${artist.name}'`}
                    clickHandler={(_, setIsDisabled, setIsPending) =>
                      linkToArtist(artist.artistId, setIsDisabled, setIsPending)
                    }
                  />
                ))}
                <Button
                  className="!mr-0 !border-0 bg-background-color-1/50 !px-4 !py-2 outline-1 transition-colors hover:bg-background-color-1 hover:!text-font-color-highlight focus-visible:!outline dark:bg-dark-background-color-1/50 dark:hover:bg-dark-background-color-1 dark:hover:!text-dark-font-color-highlight"
                  iconName="do_not_disturb_on"
                  iconClassName="material-icons-round-outlined"
                  label="Ignore"
                  clickHandler={() => {
                    storage.ignoredSeparateArtists.setIgnoredSeparateArtists([
                      artistId,
                    ]);
                    setIsVisible(true);
                    addNewNotifications([
                      {
                        id: 'suggestionIgnored',
                        icon: (
                          <span className="material-icons-round-outlined">
                            do_not_disturb_on
                          </span>
                        ),
                        delay: 5000,
                        content: <span>Suggestion ignored.</span>,
                      },
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
