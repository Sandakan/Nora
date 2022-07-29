/* eslint-disable react/require-default-props */
import React from 'react';
import { AppContext, AppUpdateContext } from 'renderer/contexts/AppContext';

import Button from './Button';
import Checkbox from './Checkbox';

interface OpenLinkConfirmPromptProps {
  link: string;
  title?: string;
  buttonClassName?: string;
}

const OpenLinkConfirmPrompt = (props: OpenLinkConfirmPromptProps) => {
  const { title, link, buttonClassName } = props;
  const { userData } = React.useContext(AppContext);
  const { changePromptMenuData } = React.useContext(AppUpdateContext);
  const [checkboxState, setCheckboxState] = React.useState(
    (userData && userData.preferences.doNotVerifyWhenOpeningLinks) ?? false
  );

  return (
    <div>
      <div className="title-container text-3xl font-medium mb-4">{title}</div>
      <div className="description">
        You are trying to open a link that will take you to{' '}
        <span
          className="font-normal dark:text-[#a29bfe] text-[#6c5ce7] hover:underline cursor-pointer"
          onClick={() => {
            changePromptMenuData(false);
            window.api.openInBrowser(link);
          }}
          onKeyDown={() => {
            changePromptMenuData(false);
            window.api.openInBrowser(link);
          }}
          role="link"
          tabIndex={0}
        >
          &apos;{link}&apos;
        </span>
        .
        <br />
        This link will be opened from your default browser.
      </div>
      <Checkbox
        id="doNotVerifyWhenOpeningLinks"
        isChecked={checkboxState}
        checkedStateUpdateFunction={(state) => setCheckboxState(state)}
        labelContent="Do not verify when trying to open a link."
      />
      <div className="buttons-container mt-12 flex justify-end">
        <Button
          label="Cancel"
          className={`remove-song-from-library-btn text-font-color-black dark:text-font-color-white rounded-md w-[10rem] hover:border-background-color-3 dark:hover:border-background-color-3 ${buttonClassName}`}
          clickHandler={() => {
            changePromptMenuData(false);
          }}
        />
        <Button
          label="Open Link"
          className={`remove-song-from-library-btn !bg-background-color-3 dark:!bg-dark-background-color-3 text-font-color-black dark:text-font-color-black rounded-md w-[10rem] hover:border-background-color-3 dark:hover:border-background-color-3 ${buttonClassName}`}
          clickHandler={() => {
            window.api.saveUserData(
              'preferences.doNotVerifyWhenOpeningLinks',
              checkboxState
            );
            window.api.openInBrowser(link);
            changePromptMenuData(false);
          }}
        />
      </div>
    </div>
  );
};

export default OpenLinkConfirmPrompt;
