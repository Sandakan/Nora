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

const SeparateArtistsSuggestion = (props: Props) => {
  const { bodyBackgroundImage } = React.useContext(AppContext);
  const { addNewNotifications } = React.useContext(AppUpdateContext);
  const { name = '', artistId = '' } = props;

  const [isIgnored, setIsIgnored] = React.useState(false);
  const [isMessageVisible, setIsMessageVisible] = React.useState(true);

  const ignoredArtists = React.useMemo(
    () => storage.ignoredSeparateArtists.getIgnoredSeparateArtists(),
    []
  );

  React.useEffect(() => {
    if (ignoredArtists.length > 0)
      setIsIgnored(ignoredArtists.includes(artistId));
  }, [artistId, ignoredArtists]);

  const separateArtists = React.useMemo(() => {
    const artists = name.split(/( and )|&|,|;|·|\||\/|\\/gm);
    const filterArtists = artists.filter(
      (x) => x !== undefined && x.trim() !== ''
    );
    const trimmedArtists = filterArtists.map((x) => x.trim());

    return [...new Set(trimmedArtists)];
  }, [name]);

  const artistComponents = React.useMemo(() => {
    if (separateArtists.length > 0) {
      const artists = separateArtists.map((artist, i, arr) => {
        return (
          <>
            <span className="text-font-color-highlight dark:text-dark-font-color-highlight">
              {artist}
            </span>
            {i !== arr.length - 1 && (
              <span>{i === arr.length - 2 ? ' and ' : ', '}</span>
            )}
          </>
        );
      });

      return artists;
    }
    return [];
  }, [separateArtists]);

  return (
    <>
      {separateArtists.length > 1 && !isIgnored && (
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
            <Button
              id="toggleSuggestionBox"
              className="!m-0 !border-0 !p-0 outline-1 outline-offset-1 hover:bg-background-color-1/50 focus-visible:!outline hover:dark:bg-dark-background-color-1/50"
              iconClassName="!leading-none !text-3xl"
              iconName={isMessageVisible ? 'arrow_drop_up' : 'arrow_drop_down'}
              tooltipLabel={
                isMessageVisible ? 'Hide suggestion' : 'Show suggestion'
              }
              clickHandler={() => setIsMessageVisible((state) => !state)}
            />
          </label>
          {isMessageVisible && (
            <div>
              <div>
                <p className="mt-2 text-sm">
                  Are {artistComponents} {separateArtists.length} separate
                  artists?
                </p>
                <p className="mt-2 text-sm">
                  If they are, you can organize them by selecting them as
                  separate artists, or you can ignore this suggestion.
                </p>
              </div>
              <div className="mt-3 flex">
                <Button
                  className="!border-0 bg-background-color-1/50 !px-4 !py-2 outline-1 transition-colors hover:bg-background-color-1 hover:!text-font-color-highlight focus-visible:!outline dark:bg-dark-background-color-1/50 dark:hover:bg-dark-background-color-1 dark:hover:!text-dark-font-color-highlight"
                  iconName="verified"
                  iconClassName="material-icons-round-outlined"
                  label={`Separate as ${separateArtists.length} artists`}
                  clickHandler={() => true}
                />
                {/* <Button
                  className="!border-0 bg-background-color-1/50 !px-4 !py-2 transition-colors hover:bg-background-color-1 hover:!text-font-color-highlight dark:bg-dark-background-color-1/50 dark:hover:bg-dark-background-color-1 dark:hover:!text-dark-font-color-highlight outline-1 focus-visible:!outline"
                  iconName="edit"
                  iconClassName="material-icons-round-outlined"
                  label="Edit in metadata page"
                  clickHandler={() => true}
                /> */}
                <Button
                  className="!mr-0 !border-0 bg-background-color-1/50 !px-4 !py-2 outline-1 transition-colors hover:bg-background-color-1 hover:!text-font-color-highlight focus-visible:!outline dark:bg-dark-background-color-1/50 dark:hover:bg-dark-background-color-1 dark:hover:!text-dark-font-color-highlight"
                  iconName="do_not_disturb_on"
                  iconClassName="material-icons-round-outlined"
                  label="Ignore"
                  clickHandler={() => {
                    storage.ignoredSeparateArtists.setIgnoredSeparateArtists([
                      artistId,
                    ]);
                    setIsIgnored(true);
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
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default SeparateArtistsSuggestion;
