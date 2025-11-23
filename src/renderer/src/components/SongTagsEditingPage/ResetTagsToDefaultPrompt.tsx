import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { AppUpdateContext } from '../../contexts/AppUpdateContext';

import Button from '../Button';

type Props = {
  dataEntries: [string, unknown][];
  resetButtonHandler: () => void;
};

const ResetTagsToDefaultPrompt = (props: Props) => {
  const { changePromptMenuData } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { resetButtonHandler, dataEntries } = props;

  const entries = (dataEntries.filter((x) => x[1]) ?? []).map(([x], i) => (
    <div key={i}>
      {x.toUpperCase()} :
      <span className="text-font-color-crimson ml-2 font-medium uppercase">
        {t('resetTagsToDefaultPrompt.changed')}
      </span>
    </div>
  ));

  return (
    <div>
      <div className="title-container text-font-color-black dark:text-font-color-white mt-1 mb-8 flex items-center pr-4 text-3xl font-medium">
        {t('resetTagsToDefaultPrompt.title')}
      </div>
      <div className="description">{t('resetTagsToDefaultPrompt.description')}</div>
      <div className="mt-4 pl-4">{entries}</div>
      <div className="mt-6 flex justify-end">
        <Button
          label={t('common.cancel')}
          className="w-32"
          clickHandler={() => changePromptMenuData(false)}
        />
        <Button
          label={t('resetTagsToDefaultPrompt.resetToDefault')}
          className="bg-background-color-3! text-font-color-black! hover:border-background-color-3 dark:bg-dark-background-color-3! dark:text-font-color-black dark:hover:border-background-color-3 w-[12rem]"
          clickHandler={resetButtonHandler}
        />
      </div>
    </div>
  );
};

export default ResetTagsToDefaultPrompt;
