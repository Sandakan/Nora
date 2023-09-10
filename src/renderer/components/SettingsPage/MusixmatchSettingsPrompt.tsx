import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import log from 'renderer/utils/log';

import Button from '../Button';
import Hyperlink from '../Hyperlink';

const MusixmatchSettingsPrompt = () => {
  const { userData } = React.useContext(AppContext);
  const { updateUserData } = React.useContext(AppUpdateContext);
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
        Musixmatch Settings
      </div>
      <ul className="list-inside list-disc font-light">
        <li>
          Musixmatch requires a user token to provide its service properly.
        </li>
        <li>
          Musixmatch can sometimes fail to show lyrics due to prolonged use of
          the service from the same token.
        </li>
        <li>
          Follow the guide from{' '}
          <Hyperlink
            label="Spicetify Wiki"
            linkTitle="Spicetify WiKi"
            link="https://spicetify.app/docs/faq#sometimes-popup-lyrics-andor-lyrics-plus-seem-to-not-work"
          />{' '}
          to get a new Musixmatch token.
        </li>
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
          tooltipLabel={showToken ? 'Hide Token' : 'Show Token'}
          className="!m-0 !border-0 !p-0"
          clickHandler={() => setShowToken((prevState) => !prevState)}
          isDisabled={token === '' || !!userData?.customMusixmatchUserToken}
        />
        <Button
          label="Update Token"
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

      <ul className="empty:mt-0 ml-4 mt-4 list-disc text-sm font-medium text-font-color-crimson">
        {successState === 'success' && (
          <li className="flex text-green-500">
            <span className="material-icons-round mr-2 text-xl">done</span>{' '}
            Token updated successfully.
          </li>
        )}
        {successState === 'failure' && (
          <li className="flex text-font-color-crimson">
            <span className="material-icons-round mr-2 text-xl">error</span>{' '}
            Failed to update the token.
          </li>
        )}
        {token.trim().length !== 54 && token.trim().length !== 0 && (
          <li>
            TOKEN should be a string with{' '}
            <span className="font-semibold uppercase">54 characters</span>. (
            {54 - token.trim().length} more characters required.)
          </li>
        )}
        {/\W/gm.test(token.trim()) && (
          <li>TOKEN should only contain alpha-numeric characters.</li>
        )}
      </ul>

      {isSavedTokenAvailable && (
        <div className="mt-2 text-green-500">
          <p className="flex uppercase font-semibold items-center">
            <span className="material-icons-round-outlined text-xl mr-2">
              done
            </span>{' '}
            A saved token available.
          </p>
          <p className="text-sm">
            A valid Musixmatch token saved by the user is already available in
            Nora.
          </p>
          <p className="text-sm">
            You only need to change the token if the service is not functioning
            properly.
          </p>
        </div>
      )}
    </div>
  );
};

export default MusixmatchSettingsPrompt;
