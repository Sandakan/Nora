import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import OpenLinkConfirmPrompt from './OpenLinkConfirmPrompt';

interface HyperlinkProp {
  link: string;
  linkTitle?: string;
  noValidityCheck?: boolean;
  children?: string | React.ReactElement;
  label?: string | React.ReactElement;
  className?: string;
}

const Hyperlink = (props: HyperlinkProp) => {
  const { localStorageData } = React.useContext(AppContext);
  const { changePromptMenuData } = React.useContext(AppUpdateContext);
  const {
    link,
    children,
    label = children,
    linkTitle = label,
    className,
    noValidityCheck,
  } = props;

  const openLinkConfirmPrompt = React.useCallback(() => {
    if (
      noValidityCheck ||
      localStorageData?.preferences.doNotVerifyWhenOpeningLinks
    ) {
      window.api.settingsHelpers.openInBrowser(link);
    } else
      changePromptMenuData(
        true,
        <OpenLinkConfirmPrompt
          link={link}
          title={typeof linkTitle === 'string' ? linkTitle : undefined}
        />,
        'confirm-link-direct',
      );
  }, [
    changePromptMenuData,
    link,
    linkTitle,
    localStorageData?.preferences.doNotVerifyWhenOpeningLinks,
    noValidityCheck,
  ]);

  return (
    <span
      className={`about-link w-fit cursor-pointer text-font-color-highlight-2 outline-1 outline-offset-1 hover:underline focus:!outline dark:text-dark-font-color-highlight-2 ${className}`}
      title={link}
      onClick={openLinkConfirmPrompt}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && openLinkConfirmPrompt()}
    >
      {label}
    </span>
  );
};

Hyperlink.defaultProps = {
  noValidityCheck: false,
};

export default Hyperlink;
