import { useContext, useMemo, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { AppUpdateContext } from '../../contexts/AppUpdateContext';

import Button from '../Button';
import Hyperlink from '../Hyperlink';

import log from '../../utils/log';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store/store';

const MusixmatchSettingsPrompt = () => {
  const userData = useStore(store, (state) => state.userData);

  const { updateUserData } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [successState, setSuccessState] = useState<'unknown' | 'success' | 'failure'>('unknown');
  const inputRef = useRef<HTMLInputElement>(null);

  const isAValidToken = token.trim().length === 54 && !/\W/gm.test(token.trim());

  const isSavedTokenAvailable = useMemo(
    () => !!userData?.customMusixmatchUserToken,
    [userData?.customMusixmatchUserToken]
  );

  return (
    <div>
      <div className="title-container text-font-color-black dark:text-font-color-white mb-4 text-2xl font-medium uppercase">
        {t('musixmatchSettingsPrompt.title')}
      </div>
      <ul className="list-inside list-disc font-light">
        <Trans
          i18nKey="musixmatchSettingsPrompt.message"
          components={{
            li: <li />,
            Hyperlink: (
              <Hyperlink link="https://spicetify.app/docs/faq#sometimes-popup-lyrics-andor-lyrics-plus-seem-to-not-work" />
            )
          }}
        />
      </ul>

      <br />

      <div className="controls-container ml-2 flex items-center">
        <input
          type={showToken ? 'text' : 'password'}
          className="bg-background-color-2 placeholder:text-font-color-dimmed dark:bg-dark-background-color-2 dark:placeholder:text-dark-font-color-dimmed mr-4 w-full max-w-[50%] rounded-xl p-2 text-sm"
          placeholder="Enter Musixmatch User Token"
          value={token}
          ref={inputRef}
          onCopy={(e) =>
            userData?.customMusixmatchUserToken === e.currentTarget.value && e.preventDefault()
          }
          onChange={(e) => {
            const { value } = e.target;
            setToken(value);
          }}
          onKeyDown={(e) => e.stopPropagation()}
        />
        <Button
          iconName={showToken ? 'visibility_off' : 'visibility'}
          tooltipLabel={t(`musixmatchSettingsPrompt.${showToken ? 'hideToken' : 'showToken'}`)}
          className="m-0! border-0! p-0!"
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
                    customMusixmatchUserToken: token
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

      <ul className="text-font-color-crimson mt-4 ml-4 list-disc text-sm font-medium empty:mt-0">
        {successState === 'success' && (
          <li className="flex text-green-500">
            <span className="material-icons-round mr-2 text-xl">done</span>{' '}
            {t('musixmatchSettingsPrompt.tokenUpdateSuccess')}
          </li>
        )}
        {successState === 'failure' && (
          <li className="text-font-color-crimson flex">
            <span className="material-icons-round mr-2 text-xl">error</span>{' '}
            {t('musixmatchSettingsPrompt.tokenUpdateFailed')}
          </li>
        )}
        {token.trim().length !== 54 && token.trim().length !== 0 && (
          <li>
            {t('musixmatchSettingsPrompt.tokenMissingCharacters', {
              count: 54 - token.trim().length
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
              Title: <p className="flex items-center font-semibold uppercase" />,
              span: <span className="material-icons-round-outlined mr-2 text-xl">done</span>,
              p: <p className="text-sm" />
            }}
          />
        </div>
      )}
    </div>
  );
};

export default MusixmatchSettingsPrompt;
