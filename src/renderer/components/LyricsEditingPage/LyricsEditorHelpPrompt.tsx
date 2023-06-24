import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';

import Button from '../Button';
import ShortcutButton from '../SettingsPage/ShortcutButton';
import AppShortcutsPrompt from '../SettingsPage/AppShortcutsPrompt';

const LyricsEditorHelpPrompt = () => {
  const { changePromptMenuData } = React.useContext(AppUpdateContext);
  return (
    <div>
      <div className="title-container mb-4 flex items-center text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        <span className="material-icons-round-outlined mr-2 text-4xl">
          help
        </span>{' '}
        How to use Nora's Lyrics Editor
      </div>
      <dl>
        <dt className="text-xl font-medium">How to start using the editor?</dt>
        <dd className="mb-6 py-2 pl-4">
          <ol className="list-outside list-decimal pl-4">
            <li className="mb-2">
              Play the song that you are trying to edit lyrics of. (If you are
              not in the correct song, app will prevent adding incorrect
              metadata to lyrics lines.)
            </li>
            <li className="mb-2">
              Click on the page area to get focus to the page. (Page focus is
              required for the page-specific keyboard shortcuts to work.)
            </li>
            <li className="mb-2">
              Start the song from the begining. If you want more control over
              the playback, set to repeat the current song.
            </li>
            <li className="mb-2">
              When the voice of the song is saying the lyrics line, press{' '}
              <ShortcutButton shortcutKey="Enter" className="!mr-1 !inline" />{' '}
              to highlight the next lyrics line and add the current time to
              start tag.
            </li>
            <li className="mb-2">Continue until the last lyrics line.</li>
          </ol>
        </dd>

        <dt className="text-xl font-medium">
          What are the keyboard shortcuts I can use in the Lyrics Editor?
        </dt>
        <dd className="mb-6 py-2 pl-4">
          <p>
            Go to the{' '}
            <Button
              label="Shortcuts Prompt"
              className="!mr-0 !inline !border-0 !p-0 !text-base !text-font-color-highlight-2 hover:underline dark:!text-dark-font-color-highlight-2"
              clickHandler={() =>
                changePromptMenuData(true, <AppShortcutsPrompt />)
              }
            />{' '}
            to see the relevant shortcuts that can be used in the Lyrics Editor.
          </p>
        </dd>

        <dt className="text-xl font-medium">I missed a lyrics line?</dt>
        <dd className="mb-6 py-2 pl-4">
          <ol className="list-outside list-decimal pl-4">
            <li className="mb-2">Pause the song.</li>
            <li className="mb-2">Locate the relevant lyrics line.</li>
            <li className="mb-2">
              Click the{' '}
              <ShortcutButton shortcutKey="Edit" className="!mr-1 !inline" />{' '}
              button below that line and make the necessary modifications.
            </li>
            <li className="mb-2">
              After the modifications, click{' '}
              <ShortcutButton
                shortcutKey="Finish Editing"
                className="!mr-1 !inline"
              />{' '}
              to complete the modifications.
            </li>
          </ol>
        </dd>

        <dt className="text-xl font-medium">
          I added wrong data to the wrong line?
        </dt>
        <dd className="mb-6 py-2 pl-4">
          <ol className="list-outside list-decimal pl-4">
            <li className="mb-2">Pause the song.</li>
            <li className="mb-2">Locate the relevant lyrics line.</li>
            <li className="mb-2">
              Click the{' '}
              <ShortcutButton shortcutKey="Edit" className="!mr-1 !inline" />{' '}
              button below that line and make the necessary modifications.
            </li>
            <li className="mb-2">
              After the modifications, click{' '}
              <ShortcutButton
                shortcutKey="Finish Editing"
                className="!mr-1 !inline"
              />{' '}
              to complete the modifications.
            </li>
          </ol>
        </dd>
      </dl>
    </div>
  );
};

export default LyricsEditorHelpPrompt;
