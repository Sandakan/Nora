import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import Button from '../Button';
import Hyperlink from '../Hyperlink';

const MusixmatchSettingsPrompt = () => {
  const { userData } = React.useContext(AppContext);
  const { updateUserData } = React.useContext(AppUpdateContext);
  const [token, setToken] = React.useState(
    userData?.customMusixmatchUserToken || ''
  );
  const [showToken, setShowToken] = React.useState(false);
  const isAValidToken =
    token.trim().length === 54 && !/\W/gm.test(token.trim());
  return (
    <div>
      <div className="title-container mb-4 text-2xl font-medium uppercase text-font-color-black dark:text-font-color-white">
        Musixmatch Settings
      </div>
      <ul className="list-inside list-disc font-light">
        <li>
          Musixmatch can sometimes not show lyrics properly due to prolonged use
          of the service from the same token.
        </li>
        <li>
          Musixmatch requires a user token to provide its service properly.
        </li>
        <li>
          Follow the guide from{' '}
          <Hyperlink
            label="Spicetify Wiki"
            linkTitle="Spicetify WiKi"
            link="https://spicetify.app/docs/faq#sometimes-popup-lyrics-andor-lyrics-plus-seem-to-not-work"
          />{' '}
          to get a new Musixmatch usertoken.
        </li>
      </ul>

      <br />

      <div className="controls-container ml-2 flex items-center">
        <input
          type={showToken ? 'text' : 'password'}
          className="mr-4 w-full max-w-[50%] rounded-xl bg-background-color-2 p-2 text-sm dark:bg-dark-background-color-2"
          placeholder="Enter Musixmatch User Token"
          value={token}
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
          isDisabled={token === ''}
        />
        <Button
          label="Update Token"
          className="ml-4"
          isDisabled={!isAValidToken}
          clickHandler={(_e, setIsDisabled, setIsPending) => {
            if (isAValidToken) {
              setIsDisabled(true);
              setIsPending(true);
              return window.api
                .saveUserData('customMusixmatchUserToken', token)
                .then(() =>
                  updateUserData((prevUserData) => ({
                    ...prevUserData,
                    customMusixmatchUserToken: token,
                  }))
                )
                .finally(() => {
                  setIsDisabled(false);
                  setIsPending(false);
                });
            }
            return undefined;
          }}
        />
      </div>

      <ul className="mt-4 ml-4 list-inside list-disc text-sm font-medium text-font-color-crimson">
        {token.trim().length !== 54 && token.trim().length !== 0 && (
          <li>
            user token should be a string with{' '}
            <span className="font-semibold uppercase">54 characters</span>. (
            {54 - token.trim().length} more characters required.)
          </li>
        )}
        {/\W/gm.test(token.trim()) && (
          <li>string should only contain alpha-numeric characters.</li>
        )}
      </ul>
    </div>
  );
};

export default MusixmatchSettingsPrompt;
