/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactElement } from 'react';
import Button, { ButtonProps } from './Button';

interface SensitiveActionConfrimPromptProp {
  title: string;
  content: ReactElement<any, any>;
  confirmButton: ButtonProps;
}

const SensitiveActionConfirmPrompt = (
  props: SensitiveActionConfrimPromptProp
) => {
  const { title, confirmButton, content } = props;
  return (
    <>
      <div className="title-container mt-1 pr-4 flex items-center mb-8 text-font-color-black text-3xl font-medium dark:text-font-color-white">
        {title}
      </div>
      <div className="description">{content}</div>
      <Button
        label={confirmButton.label}
        iconName={confirmButton.iconName}
        className={`remove-song-from-library-btn danger-btn w-48 h-10 mt-8 rounded-lg outline-none !bg-foreground-color-1 dark:!bg-foreground-color-1 text-font-color-white dark:text-font-color-white border-[transparent] float-right cursor-pointer hover:border-foreground-color-1 dark:hover:border-foreground-color-1 transition-[background] ease-in-out ${confirmButton.className}`}
        clickHandler={confirmButton.clickHandler}
      />
    </>
  );
};

export default SensitiveActionConfirmPrompt;
