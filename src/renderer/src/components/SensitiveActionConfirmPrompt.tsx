import { ReactNode, useContext } from 'react';
import { AppUpdateContext } from '../contexts/AppUpdateContext';

import Button, { ButtonProps } from './Button';

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
      <div className="title-container mb-8 mt-1 flex items-center pr-4 text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        {title}
      </div>
      <div className="description">{content}</div>
      <div className="buttons-container flex items-center justify-end">
        <Button
          label={confirmButton.label}
          iconName={confirmButton.iconName}
          className={`remove-song-from-library-btn danger-btn float-right mt-8 h-10 w-48 cursor-pointer rounded-lg !bg-font-color-crimson text-font-color-white outline-none ease-in-out hover:border-font-color-crimson dark:!bg-font-color-crimson dark:text-font-color-white dark:hover:border-font-color-crimson ${confirmButton.className}`}
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
