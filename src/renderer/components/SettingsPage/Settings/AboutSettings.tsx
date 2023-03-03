/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';

import calculateElapsedTime from 'renderer/utils/calculateElapsedTime';

import { version, author, homepage, bugs } from '../../../../../package.json';
import openSourceLicenses from '../../../../../open_source_licenses.txt';
import appLicense from '../../../../../LICENSE.txt';
import localReleaseNotes from '../../../../../release-notes.json';

import AppIcon from '../../../../../assets/images/webp/logo_light_mode.webp';
import SLFlag from '../../../../../assets/images/webp/sl-flag.webp';
import Img from '../../Img';
import ReleaseNotesPrompt from '../../ReleaseNotesPrompt/ReleaseNotesPrompt';
import Hyperlink from '../../Hyperlink';
import Button from '../../Button';
import ResetAppConfirmationPrompt from '../../HomePage/ResetAppConfirmationPrompt';
import SensitiveActionConfirmPrompt from '../../SensitiveActionConfirmPrompt';
import AppShortcutsPrompt from '../AppShortcutsPrompt';
import AppStats from './AppStats';

const AboutSettings = () => {
  const { changePromptMenuData, addNewNotifications } =
    React.useContext(AppUpdateContext);

  const currentVersionReleasedDate = React.useMemo(() => {
    const { versions } = localReleaseNotes;

    for (let i = 0; i < versions.length; i += 1) {
      if (versions[i].version === version) {
        return versions[i].releaseDate;
      }
    }
    return undefined;
  }, []);

  const elapsed = React.useMemo(() => {
    if (currentVersionReleasedDate) {
      return calculateElapsedTime(currentVersionReleasedDate);
    }
    return undefined;
  }, [currentVersionReleasedDate]);

  return (
    <>
      <div className="title-container mt-1 mb-4 flex items-center text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        <span className="material-icons-round-outlined mr-2">info</span>
        About
      </div>
      <div className="pl-2">
        <div className="mb-2 flex p-2 text-lg">
          <Img
            src={AppIcon}
            className="aspect-square max-h-12 rounded-md shadow-md"
            alt=""
          />
          <div className="ml-4 flex flex-col">
            <span className="block">Nora</span>
            <span className="text-sm font-light">
              v{version}{' '}
              {elapsed ? (
                <>
                  &bull;{' '}
                  <span
                    title={
                      currentVersionReleasedDate
                        ? `Released on ${currentVersionReleasedDate}`
                        : undefined
                    }
                  >
                    ({elapsed.elapsed} {elapsed.type}
                    {elapsed.elapsed === 1 ? '' : 's'} ago)
                  </span>
                </>
              ) : (
                ''
              )}
            </span>
          </div>
        </div>
        <ul className="mb-4 list-disc pl-4 text-sm">
          <li>
            Nora is an elegant music player built using Electron and React.
          </li>
          <li>
            Inspired by{' '}
            <Hyperlink
              label="Oto Music for Android"
              linkTitle="Oto Music for Android on PlayStore"
              link="https://play.google.com/store/apps/details?id=com.piyush.music&gl=us"
            />{' '}
            by Piyush Mamidwar.
          </li>
          <li>
            This product is licensed under the{' '}
            <Button
              className="show-app-licence-btn about-link !inline w-fit cursor-pointer !border-0 !p-0 text-sm text-font-color-highlight-2 hover:underline dark:!text-dark-font-color-highlight-2"
              label="MIT licence."
              clickHandler={() =>
                changePromptMenuData(
                  true,
                  <>
                    <div className="mb-4 w-full text-center text-3xl font-medium">
                      App License
                    </div>
                    <pre className="relative max-h-full w-full overflow-y-auto px-4">
                      {appLicense}
                    </pre>
                  </>,
                  'flex flex-col'
                )
              }
            />
          </li>
        </ul>
        <div>
          <Button
            className="release-notes-prompt-btn about-link block w-fit cursor-pointer !border-0 !p-0 !text-base text-font-color-highlight-2 no-underline hover:!underline dark:!text-dark-font-color-highlight-2"
            label="Release Notes"
            clickHandler={() =>
              changePromptMenuData(
                true,
                <ReleaseNotesPrompt />,
                'release-notes px-8 py-4'
              )
            }
          />
          <Button
            className="open-source-licenses-btn about-link block w-fit cursor-pointer !border-0 !p-0 !text-base text-font-color-highlight-2 hover:underline dark:!text-dark-font-color-highlight-2"
            label="Open source licences"
            clickHandler={() =>
              changePromptMenuData(
                true,
                <>
                  <div className="mb-4 w-full text-center text-3xl font-medium">
                    Open Source Licenses
                  </div>
                  <pre className="relative max-h-full w-full overflow-y-auto px-4">
                    {openSourceLicenses}
                  </pre>
                </>,
                'flex flex-col'
              )
            }
          />
          <Button
            className="about-link block w-fit cursor-pointer !border-0 !p-0 !text-base text-font-color-highlight-2 hover:underline dark:!text-dark-font-color-highlight-2"
            label="Open Log file"
            clickHandler={() => window.api.openLogFile()}
          />
          <Hyperlink
            label="Github repository"
            link={homepage}
            linkTitle="Nora Github Repository"
          />
        </div>

        <AppStats />

        <div className="about-buttons-container mb-4 flex flex-wrap justify-center">
          <Button
            label="Reset App"
            iconName="auto_mode"
            className="mb-4 rounded-2xl"
            clickHandler={() =>
              changePromptMenuData(
                true,
                <ResetAppConfirmationPrompt />,
                'confirm-app-reset'
              )
            }
          />
          <Button
            label="Open Devtools"
            iconName="code"
            className="mb-4 rounded-2xl"
            clickHandler={() => window.api.openDevtools()}
          />
          <Button
            label="Resync Library"
            iconName="sync"
            className="mb-4 rounded-2xl"
            clickHandler={() => window.api.resyncSongsLibrary()}
          />
          <Button
            label="Clear History"
            iconName="clear"
            className="mb-4 rounded-2xl"
            clickHandler={() => {
              changePromptMenuData(
                true,
                <SensitiveActionConfirmPrompt
                  title="Confrim the action to clear Song History"
                  content={
                    <div>
                      You wouldn't be able to see what you have listened
                      previously if you decide to continue this action.
                    </div>
                  }
                  confirmButton={{
                    label: 'Clear History',
                    clickHandler: () => {
                      window.api
                        .clearSongHistory()
                        .then((res) => {
                          if (res.success) {
                            addNewNotifications([
                              {
                                id: 'songHistoryCleared',
                                delay: 5000,
                                content: (
                                  <span>
                                    Cleared the song history successfully.
                                  </span>
                                ),
                              },
                            ]);
                          }
                          return changePromptMenuData(false);
                        })
                        .catch((err) => console.error(err));
                    },
                  }}
                />
              );
            }}
          />
          <Button
            label="App Shortcuts"
            iconName="trail_length_short"
            className="mb-4 rounded-2xl"
            iconClassName="material-icons-round-outlined"
            clickHandler={() =>
              changePromptMenuData(true, <AppShortcutsPrompt />)
            }
          />
        </div>
        <div className="about-description mt-4">
          <div>
            If you have any feedback about bugs, feature requests etc. about the
            app, please{' '}
            <Hyperlink
              label="create an issue"
              link={`${bugs.url}/new/choose`}
              linkTitle="Create An Issue On Nora's Github Repository"
            />{' '}
            on Nora's Github Repository.
          </div>
          <Hyperlink
            label="Contact me through my email."
            link="mailto:sandakannipunajith@gmail.com?subject=Regarding Nora&body=If you found a bug in the app, please try to attach the log file of the app with a detailed explanation of the bug.%0d%0a%0d%0aYou can get to it by going to  Settings > About > Open Log File."
            linkTitle="Email"
            noValidityCheck
          />
          <br />
          <div className="mt-4 text-center text-sm font-light">
            Made with{' '}
            <span className="heart text-font-color-crimson dark:text-font-color-crimson">
              &#10084;
            </span>{' '}
            by{' '}
            <Hyperlink
              label="Sandakan Nipunajith"
              link={author.url}
              linkTitle="Sandakan's Github Profile"
              className="mr-1 font-normal"
            />
            .
            <br />
            <Hyperlink
              label={
                <>
                  #VisitSriLanka{' '}
                  <Img
                    src={SLFlag}
                    alt=""
                    className="ml-1 inline w-[24px] hover:underline"
                  />
                </>
              }
              className="font-normal"
              link="https://www.google.com/search?q=beautiful+sri+lanka"
              linkTitle="Beautiful Sri Lanka"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutSettings;
