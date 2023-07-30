import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { ParsedSimilarTrack } from '../../../@types/last_fm_similar_tracks_api';
import OpenLinkConfirmPrompt from '../OpenLinkConfirmPrompt';

const UnAvailableTrack = (
  props: Omit<ParsedSimilarTrack, 'songData' | 'match'>,
) => {
  const { changePromptMenuData } = React.useContext(AppUpdateContext);
  const { title, artists = [], url } = props;

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
      className="bg-background-color-2 dark:bg-dark-background-color-2 mr-3 last:mr-0 mb-2 dark:text-font-color-white flex items-center px-4 py-1 rounded-3xl"
      title={`View '${title}' in Last.Fm`}
      onClick={handleButtonClick}
    >
      <span className="material-icons-round-outlined mr-2 text-lg text-font-color-highlight dark:text-dark-font-color-highlight">
        open_in_new
      </span>
      <p className="text-sm">
        <span className="title">{title}</span>
        {artists.length > 0 && (
          <>
            <span className="text-font-color-highlight dark:text-dark-font-color-highlight">
              {' '}
              by{' '}
            </span>
            <span>{artists.join(', ')}</span>
          </>
        )}
      </p>
    </button>
  );
};

export default UnAvailableTrack;
