/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';

import calculateElapsedTime from 'renderer/utils/calculateElapsedTime';
import storage from 'renderer/utils/localStorage';

import OpenLinkConfirmPrompt from 'renderer/components/OpenLinkConfirmPrompt';
import {
  version,
  author,
  homepage,
  bugs,
  urls,
} from '../../../../../package.json';
import openSourceLicenses from '../../../../../open_source_licenses.txt';
import appLicense from '../../../../../LICENSE.txt';
import localReleaseNotes from '../../../../../release-notes.json';

import AppIcon from '../../../../../assets/images/webp/logo_light_mode.webp';
import GithubDarkIcon from '../../../../../assets/images/svg/github.svg';
import GithubLightIcon from '../../../../../assets/images/svg/github-white.svg';
import DiscordDarkIcon from '../../../../../assets/images/svg/discord_light_mode.svg';
import DiscordLightIcon from '../../../../../assets/images/svg/discord_dark_mode.svg';
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
  const { isDarkMode } = React.useContext(AppContext);
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
    <li className="main-container about-container">
      <div className="title-container mb-4 mt-1 flex items-center text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        <span className="material-icons-round-outlined mr-2">info</span>
        About
      </div>
      <div className="pl-2">
        <div className="mb-2 flex items-center justify-between p-2 text-lg">
          <div className="flex items-center">
            <Img
              src={AppIcon}
              className="aspect-square max-h-12 rounded-md shadow-md"
              alt=""
            />
            <div className="ml-4 flex flex-col">
              <span className="block">Nora</span>
              <span className="text-sm font-light">
                v{version}{' '}
                {elapsed && (
                  <>
                    &bull;{' '}
                    <span
                      title={
                        currentVersionReleasedDate
                          ? `Released on ${new Date(
                              currentVersionReleasedDate
                            ).toLocaleDateString()}`
                          : undefined
                      }
                    >
                      ({elapsed.elapsedString})
                    </span>
                  </>
                )}
              </span>
            </div>
          </div>
          <div className="flex items-center">
            <Button
              className="about-link !mr-6 block w-fit cursor-pointer !rounded-none !border-0 !p-0 outline-1 outline-offset-2 focus-visible:!outline"
              iconName="language"
              iconClassName="!text-2xl"
              tooltipLabel="Nora's Website (Under Development)"
              clickHandler={() =>
                window.api.settingsHelpers.openInBrowser('nora:')
              }
              isDisabled
            />
            <Img
              src={isDarkMode ? DiscordLightIcon : DiscordDarkIcon}
              className="mr-6 w-6 cursor-pointer opacity-70 transition-opacity hover:opacity-100"
              alt="Nora's Official Discord Server"
              showAltAsTooltipLabel
              onClick={() =>
                changePromptMenuData(
                  true,
                  <OpenLinkConfirmPrompt
                    link={urls.discord_invite_url}
                    title="Nora's Official Discord Server"
                  />,
                  'flex flex-col'
                )
              }
              tabIndex={0}
            />
            <Img
              src={isDarkMode ? GithubLightIcon : GithubDarkIcon}
              className="w-6 cursor-pointer opacity-80 transition-opacity hover:opacity-100"
              alt="Nora's Github Repository"
              showAltAsTooltipLabel
              onClick={() =>
                changePromptMenuData(
                  true,
                  <OpenLinkConfirmPrompt
                    link={homepage}
                    title="Nora's Github Repository"
                  />,
                  'flex flex-col'
                )
              }
              tabIndex={0}
            />
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
              link="https://play.google.com/store/apps/details?id=com.piyush.music"
            />{' '}
            by Piyush Mamidwar.
          </li>
          <li>
            This product is licensed under the{' '}
            <Button
              className="show-app-licence-btn about-link !inline w-fit cursor-pointer !rounded-none !border-0 !p-0 text-sm text-font-color-highlight-2 !outline-1 outline-offset-1 hover:underline focus:!outline dark:!text-dark-font-color-highlight-2"
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
        <div className="mt-12 flex flex-wrap items-center justify-center px-8">
          <Button
            iconName="new_releases"
            iconClassName="material-icons-round-outlined"
            className="release-notes-prompt-btn mb-4"
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
            iconName="receipt_long"
            className="open-source-licenses-btn mb-4"
            label="Open source licences"
            clickHandler={() =>
              changePromptMenuData(
                true,
                <>
                  <div className="mb-4 w-full text-center text-3xl font-medium">
                    Open Source Licenses
                  </div>
                  <div className="relative max-h-full w-full overflow-y-auto whitespace-pre-wrap px-4 text-center text-sm">
                    {openSourceLicenses}
                  </div>
                </>,
                'flex flex-col'
              )
            }
          />
          <Button
            iconName="description"
            iconClassName="material-icons-round-outlined"
            className="about-link mb-4 block w-fit cursor-pointer"
            label="Open Log file"
            clickHandler={() => window.api.log.openLogFile()}
          />
          <Button
            label="Open Devtools"
            iconName="code"
            className="mb-4 rounded-2xl"
            clickHandler={() => window.api.settingsHelpers.openDevtools()}
          />
          <Button
            label="Resync Library"
            iconName="sync"
            className="mb-4 rounded-2xl"
            clickHandler={() =>
              window.api.audioLibraryControls.resyncSongsLibrary()
            }
          />
          <Button
            label="Generate Palettes"
            iconName="temp_preferences_custom"
            className="mb-4 rounded-2xl"
            clickHandler={() =>
              window.api.audioLibraryControls.generatePalettes()
            }
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
            label="Clear History"
            iconName="clear"
            className="mb-4 rounded-2xl"
            clickHandler={() => {
              changePromptMenuData(
                true,
                <SensitiveActionConfirmPrompt
                  title="Confirm the action to clear Song History"
                  content={
                    <div>
                      You wouldn't be able to see what you have listened
                      previously if you decide to continue this action.
                    </div>
                  }
                  confirmButton={{
                    label: 'Clear History',
                    clickHandler: () => {
                      window.api.audioLibraryControls
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
            label="Export App Data"
            iconName="file_upload"
            className="mb-4 rounded-2xl"
            clickHandler={(_, setIsDisabled, setIsPending) => {
              setIsDisabled(true);
              setIsPending(true);

              return window.api.settingsHelpers
                .exportAppData(JSON.stringify(storage.getAllItems()))
                .finally(() => {
                  setIsDisabled(false);
                  setIsPending(false);
                })
                .catch((err) => console.error(err));
            }}
          />

          <Button
            label="Import App Data"
            iconName="publish"
            className="mb-4 rounded-2xl"
            clickHandler={(_, setIsDisabled, setIsPending) => {
              setIsDisabled(true);
              setIsPending(true);

              return window.api.settingsHelpers
                .importAppData()
                .then((res) => {
                  if (res) storage.setAllItems(res);
                  return undefined;
                })
                .finally(() => {
                  setIsDisabled(false);
                  setIsPending(false);
                })
                .catch((err) => console.error(err));
            }}
          />
        </div>
        <div className="about-description mt-4 text-sm font-light">
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
          <div className="mt-6 text-sm">
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
    </li>
  );
};

export default AboutSettings;
