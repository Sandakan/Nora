import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { ParsedSimilarTrack } from '../../../@types/last_fm_similar_tracks_api';
import OpenLinkConfirmPrompt from '../OpenLinkConfirmPrompt';

type Props = Omit<ParsedSimilarTrack, 'songData' | 'match'> & {
  index?: number;
};

const UnAvailableTrack = (props: Props) => {
  const { changePromptMenuData } = React.useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { title, artists = [], url, index } = props;

  const handleButtonClick = React.useCallback(() => {
    return changePromptMenuData(
      true,
      <OpenLinkConfirmPrompt link={url} title={`View '${title}' in Last.Fm`} />,
      'confirm-link-direct',
    );
  }, [changePromptMenuData, title, url]);

  return (
    <button
      type="button"
      className="mb-2 mr-3 flex items-center rounded-3xl bg-background-color-2 px-4 py-1 last:mr-0 dark:bg-dark-background-color-2 dark:text-font-color-white"
      title={t('artistInfoPage.viewInLastFm', { name: title })}
      onClick={handleButtonClick}
    >
      <span className="material-icons-round-outlined mr-2 text-lg text-font-color-highlight dark:text-dark-font-color-highlight">
        open_in_new
      </span>
      <p className="text-sm">
        {index && (
          <span className="index text-font-color-highlight dark:text-dark-font-color-highlight">
            {index}.{' '}
          </span>
        )}
        <span className="title">{title}</span>
        {artists.length > 0 && (
          <Trans
            i18nKey="songInfoPage.byArtists"
            values={{ val: artists }}
            components={{
              By: (
                <span className="text-font-color-highlight dark:text-dark-font-color-highlight" />
              ),
              span: <span />,
            }}
          />
        )}
      </p>
    </button>
  );
};

export default UnAvailableTrack;
