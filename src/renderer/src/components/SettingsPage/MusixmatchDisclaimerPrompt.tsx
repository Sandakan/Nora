import { Trans, useTranslation } from 'react-i18next';

import Hyperlink from '../Hyperlink';

const MusixmatchDisclaimerPrompt = () => {
  const { t } = useTranslation();

  return (
    <div className="">
      <div className="mb-4 flex items-center text-3xl font-semibold uppercase">
        <span className="material-icons-round-outlined mr-2 text-4xl !leading-none">error</span>{' '}
        <p>{t('musixmatchDisclaimerPrompt.title')}</p>
      </div>
      <div className="description px-4">
        <ul className="list-disc">
          <Trans
            i18nKey="musixmatchDisclaimerPrompt.message"
            components={{
              li: <li />
            }}
          />
        </ul>

        <br />
        <p>
          <Trans
            i18nKey="musixmatchDisclaimerPrompt.contactAboutComplaints"
            components={{
              Hyperlink: (
                <Hyperlink
                  link="mailto:sandakannipunajith@gmail.com?subject=Regarding Nora"
                  linkTitle="Email"
                  noValidityCheck
                />
              )
            }}
          />
        </p>
      </div>
    </div>
  );
};

export default MusixmatchDisclaimerPrompt;
