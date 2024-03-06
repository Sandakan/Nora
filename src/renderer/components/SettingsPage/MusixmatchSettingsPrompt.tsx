import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { AppContext } from '../../contexts/AppContext';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import log from '../../utils/log';

import Button from '../Button';
import Hyperlink from '../Hyperlink';

const MusixmatchSettingsPrompt = () => {
  const { userData } = React.useContext(AppContext);
  const { updateUserData } = React.useContext(AppUpdateContext);
  const { t } = useTranslation();

  const [token, setToken] = React.useState('');
  const [showToken, setShowToken] = React.useState(false);
  const [successState, setSuccessState] = React.useState<
    'unknown' | 'success' | 'failure'
  >('unknown');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const isAValidToken =
    token.trim().length === 54 && !/\W/gm.test(token.trim());

  const isSavedTokenAvailable = React.useMemo(
    () => !!userData?.customMusixmatchUserToken,
    [userData?.customMusixmatchUserToken],
  );

  return (
    <div>
      <div className="title-container mb-4 text-2xl font-medium uppercase text-font-color-black dark:text-font-color-white">
        {t('musixmatchSettingsPrompt.title')}
      </div>
      <ul className="list-inside list-disc font-light">
        <Trans
          i18nKey="musixmatchSettingsPrompt.message"
          components={{
            li: <li />,
            Hyperlink: (
              <Hyperlink link="https://spicetify.app/docs/faq#sometimes-popup-lyrics-andor-lyrics-plus-seem-to-not-work" />
            ),
          }}
        />
      </ul>

      <br />

      <div className="controls-container ml-2 flex items-center">
        <input
          type={showToken ? 'text' : 'password'}
          className="mr-4 w-full max-w-[50%] rounded-xl bg-background-color-2 p-2 text-sm dark:bg-dark-background-color-2"
          placeholder="Enter Musixmatch User Token"
          value={token}
          ref={inputRef}
          onCopy={(e) =>
            userData?.customMusixmatchUserToken === e.currentTarget.value &&
            e.preventDefault()
          }
          onChange={(e) => {
            const { value } = e.target;
            setToken(value);
          }}
          onKeyDown={(e) => e.stopPropagation()}
        />
        <Button
          iconName={showToken ? 'visibility_off' : 'visibility'}
          tooltipLabel={t(
            `musixmatchSettingsPrompt.${showToken ? 'hideToken' : 'showToken'}`,
          )}
          className="!m-0 !border-0 !p-0"
          clickHandler={() => setShowToken((prevState) => !prevState)}
          isDisabled={token === '' || !!userData?.customMusixmatchUserToken}
        />
        <Button
          label={t('musixmatchSettingsPrompt.updateToken')}
          className="ml-4"
          isDisabled={!isAValidToken || successState === 'success'}
          clickHandler={(_e, setIsDisabled, setIsPending) => {
            if (isAValidToken) {
              setIsDisabled(true);
              setIsPending(true);
              return window.api.userData
                .saveUserData('customMusixmatchUserToken', token)
                .then(() => {
                  updateUserData((prevUserData) => ({
                    ...prevUserData,
                    customMusixmatchUserToken: token,
                  }));
                  return setSuccessState('success');
                })
                .catch((err) => {
                  log(err, undefined, 'ERROR');
                  setSuccessState('failure');
                })
                .finally(() => {
                  setIsDisabled(false);
                  setIsPending(false);
                });
            }
            return undefined;
          }}
        />
      </div>

      <br />

      <ul className="ml-4 mt-4 list-disc text-sm font-medium text-font-color-crimson empty:mt-0">
        {successState === 'success' && (
          <li className="flex text-green-500">
            <span className="material-icons-round mr-2 text-xl">done</span>{' '}
            {t('musixmatchSettingsPrompt.tokenUpdateSuccess')}
          </li>
        )}
        {successState === 'failure' && (
          <li className="flex text-font-color-crimson">
            <span className="material-icons-round mr-2 text-xl">error</span>{' '}
            {t('musixmatchSettingsPrompt.tokenUpdateFailed')}
          </li>
        )}
        {token.trim().length !== 54 && token.trim().length !== 0 && (
          <li>
            {t('musixmatchSettingsPrompt.tokenMissingCharacters', {
              count: 54 - token.trim().length,
            })}
          </li>
        )}
        {/\W/gm.test(token.trim()) && (
          <li> {t('musixmatchSettingsPrompt.tokenIncorrectCharacters')}</li>
        )}
      </ul>

      {isSavedTokenAvailable && (
        <div className="mt-2 text-green-500">
          <Trans
            i18nKey="musixmatchSettingsPrompt.savedTokenAvailableMessage"
            components={{
              Title: (
                <p className="flex items-center font-semibold uppercase" />
              ),
              span: (
                <span className="material-icons-round-outlined mr-2 text-xl">
                  done
                </span>
              ),
              p: <p className="text-sm" />,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default MusixmatchSettingsPrompt;
