import { Trans, useTranslation } from 'react-i18next';
import toCapitalCase from 'renderer/utils/toCapitalCase';
import Hyperlink from '../Hyperlink';

interface LyricsSourceProp {
  source: string;
  link?: string;
  copyright?: string;
}

const LyricsSource = (props: LyricsSourceProp) => {
  const { t } = useTranslation();

  const { source, copyright, link } = props;
  return (
    <div className="source-name mt-12 flex flex-col items-center justify-center text-center text-[#ccc]">
      <div>
        {source !== 'IN_SONG_LYRICS' && (
          <Trans
            i18nKey="lyricsPage.lyricsProvidedBy"
            components={{
              Hyperlink: (
                <Hyperlink
                  link={link || '#'}
                  linkTitle={decodeURI(
                    link || t('common.unknownLyricsProvider'),
                  )}
                  label={toCapitalCase(decodeURI(source))}
                />
              ),
            }}
          />
        )}
      </div>
      {copyright && (
        <div className="text-balance text-sm text-font-color-dimmed">
          &copy; {copyright}
        </div>
      )}
    </div>
  );
};

export default LyricsSource;
