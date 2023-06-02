import React from 'react';

import Button from 'renderer/components/Button';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';

import packageFile from '../../../package.json';

type Props = { filePath: string };

const isLetterAVowel = (letter: string) => /^[aeiou]/gm.test(letter);
const { supportedMusicExtensions } = packageFile.appPreferences;

const supportedExtensionComponents = supportedMusicExtensions.map((ext) => (
  <span className="mx-2">
    &bull; <span className="hover:underline">{ext}</span>
  </span>
));

const UnsupportedFileMessagePrompt = (props: Props) => {
  const { changePromptMenuData } = React.useContext(AppUpdateContext);
  const { filePath } = props;
  const fileType = filePath.split('.').at(-1)?.replace('.', '') ?? filePath;

  return (
    <div>
      <div className="title-container mb-4 text-3xl font-medium">
        Unsupported Audio File
      </div>
      <div className="description">
        You are trying to open {isLetterAVowel(fileType[0]) ? 'an' : 'a'}{' '}
        <span className="underline">{fileType}</span> file which is not
        supported by this app.
        <br />
        Currently we only support following audio formats.
        <div className="mt-1">{supportedExtensionComponents}</div>
      </div>
      <div className="buttons-container mt-12 flex justify-end">
        <Button
          label="OK"
          className="ok-btn w-[10rem] rounded-md !bg-background-color-3 !text-font-color-black hover:border-background-color-3 dark:!bg-dark-background-color-3 dark:!text-font-color-black dark:hover:border-background-color-3"
          clickHandler={() => {
            changePromptMenuData(false);
          }}
        />
      </div>
    </div>
  );
};

export default UnsupportedFileMessagePrompt;
