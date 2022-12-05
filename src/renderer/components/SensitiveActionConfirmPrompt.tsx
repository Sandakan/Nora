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
      <div className="title-container mt-1 mb-8 flex items-center pr-4 text-3xl font-medium text-font-color-black dark:text-font-color-white">
        {title}
      </div>
      <div className="description">{content}</div>
      <Button
        label={confirmButton.label}
        iconName={confirmButton.iconName}
        className={`remove-song-from-library-btn danger-btn float-right mt-8 h-10 w-48 cursor-pointer rounded-lg border-[transparent] !bg-font-color-crimson text-font-color-white outline-none transition-[background] ease-in-out hover:border-font-color-crimson dark:!bg-font-color-crimson dark:text-font-color-white dark:hover:border-font-color-crimson ${confirmButton.className}`}
        clickHandler={confirmButton.clickHandler}
      />
    </>
  );
};

export default SensitiveActionConfirmPrompt;
