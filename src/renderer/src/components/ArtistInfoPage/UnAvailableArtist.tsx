import React from 'react';
import { useTranslation } from 'react-i18next';

import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import OpenLinkConfirmPrompt from '../OpenLinkConfirmPrompt';
import { SimilarArtist } from '../../../@types/last_fm_artist_info_api';

const UnAvailableArtist = (props: Omit<SimilarArtist, 'artistData'>) => {
  const { changePromptMenuData } = React.useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { name, url } = props;

  const handleButtonClick = React.useCallback(() => {
    return changePromptMenuData(
      true,
      <OpenLinkConfirmPrompt link={url} title={`View '${name}' in Last.Fm`} />,
      'confirm-link-direct'
    );
  }, [changePromptMenuData, name, url]);

  return (
    <button
      type="button"
      className="mb-2 mr-3 flex items-center rounded-3xl bg-background-color-2 px-4 py-1 last:mr-0 dark:bg-dark-background-color-2 dark:text-font-color-white"
      title={t('artistInfoPage.viewInLastFm', { name })}
      onClick={handleButtonClick}
    >
      <span className="material-icons-round-outlined mr-2 text-lg text-font-color-highlight dark:text-dark-font-color-highlight">
        open_in_new
      </span>
      <p className="text-sm">{name}</p>
    </button>
  );
};

export default UnAvailableArtist;
