import { type ReactNode, useContext } from 'react';
import { AppUpdateContext } from '../contexts/AppUpdateContext';

import Button, { type ButtonProps } from './Button';

interface SensitiveActionConfrimPromptProp {
  title: string;
  content: ReactNode;
  confirmButton: ButtonProps;
  closePromptOnButtonClick?: boolean;
}

const SensitiveActionConfirmPrompt = (props: SensitiveActionConfrimPromptProp) => {
  const { changePromptMenuData } = useContext(AppUpdateContext);
  const { title, confirmButton, content, closePromptOnButtonClick = true } = props;
  return (
    <>
      <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mt-1 mb-8 flex items-center pr-4 text-3xl font-medium">
        {title}
      </div>
      <div className="description">{content}</div>
      <div className="buttons-container flex items-center justify-end">
        <Button
          label={confirmButton.label}
          iconName={confirmButton.iconName}
          className={`remove-song-from-library-btn danger-btn bg-font-color-crimson! text-font-color-white hover:border-font-color-crimson dark:bg-font-color-crimson! dark:text-font-color-white dark:hover:border-font-color-crimson float-right mt-8 h-10 w-48 cursor-pointer rounded-lg outline-hidden ease-in-out ${confirmButton.className}`}
          clickHandler={(e, setIsDisabled, setIsPending) => {
            if (closePromptOnButtonClick) changePromptMenuData(false);
            return confirmButton.clickHandler(e, setIsDisabled, setIsPending);
          }}
        />
      </div>
    </>
  );
};

export default SensitiveActionConfirmPrompt;
