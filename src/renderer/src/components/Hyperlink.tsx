import { type ReactElement, lazy, useCallback, useContext } from 'react';
import { AppUpdateContext } from '../contexts/AppUpdateContext';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store';

const OpenLinkConfirmPrompt = lazy(() => import('./OpenLinkConfirmPrompt'));

interface HyperlinkProp {
  link: string;
  linkTitle?: string;
  noValidityCheck?: boolean;
  children?: string | ReactElement;
  label?: string | ReactElement;
  className?: string;
}

const Hyperlink = (props: HyperlinkProp) => {
  const preferences = useStore(store, (state) => state.localStorage.preferences);
  const { changePromptMenuData } = useContext(AppUpdateContext);
  const {
    link,
    children,
    label = children,
    linkTitle = label,
    className,
    noValidityCheck = false
  } = props;

  const openLinkConfirmPrompt = useCallback(() => {
    if (noValidityCheck || preferences.doNotVerifyWhenOpeningLinks) {
      window.api.settingsHelpers.openInBrowser(link);
    } else
      changePromptMenuData(
        true,
        <OpenLinkConfirmPrompt
          link={link}
          title={typeof linkTitle === 'string' ? linkTitle : undefined}
        />,
        'confirm-link-direct'
      );
  }, [
    changePromptMenuData,
    link,
    linkTitle,
    preferences.doNotVerifyWhenOpeningLinks,
    noValidityCheck
  ]);

  return (
    <span
      className={`about-link w-fit cursor-pointer font-medium text-font-color-highlight-2 underline outline-1 outline-offset-1 focus:outline! dark:text-dark-font-color-highlight-2 ${className}`}
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

export default Hyperlink;
