import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';

import Button from '../Button';

type Props = {
  dataEntries: [string, any][];
  resetButtonHandler: () => void;
};

const ResetTagsToDefaultPrompt = (props: Props) => {
  const { changePromptMenuData } = React.useContext(AppUpdateContext);
  const { resetButtonHandler, dataEntries } = props;

  const entries = (dataEntries.filter((x) => x[1]) ?? []).map(([x]) => (
    <div>
      {x.toUpperCase()} :
      <span className="ml-2 font-medium text-font-color-crimson">CHANGED</span>
    </div>
  ));

  return (
    <div>
      <div className="title-container mb-8 mt-1 flex items-center pr-4 text-3xl font-medium text-font-color-black dark:text-font-color-white">
        Confrim Before Resetting Song Data to Default
      </div>
      <div className="description">
        Are you sure you want to reset the song data. You will lose the data you
        edited on this screen.
      </div>
      <div className="mt-4 pl-4">{entries}</div>
      <div className="mt-6 flex justify-end">
        <Button
          label="Cancel"
          className="w-32"
          clickHandler={() => changePromptMenuData(false)}
        />
        <Button
          label="Reset to Default"
          className="w-[12rem] !bg-background-color-3 !text-font-color-black hover:border-background-color-3 dark:!bg-dark-background-color-3 dark:text-font-color-black dark:hover:border-background-color-3"
          clickHandler={resetButtonHandler}
        />
      </div>
    </div>
  );
};

export default ResetTagsToDefaultPrompt;
