import { Trans, useTranslation } from 'react-i18next';
import toCapitalCase from '../../utils/toCapitalCase';
import Hyperlink from '../Hyperlink';

interface LyricsSourceProp {
  source: string;
  link?: string;
  copyright?: string;
  className?: string;
  textClassName?: string;
  isTranslated?: boolean;
}

const LyricsMetadata = (props: LyricsSourceProp) => {
  const { t } = useTranslation();

  const { source, copyright, link, className, textClassName, isTranslated } = props;
  return (
    <div
      className={`source-name text-font-color-dimmed mt-12 flex flex-col items-center justify-center gap-2 text-center ${className}`}
    >
      {source !== 'IN_SONG_LYRICS' && (
        <div>
          <Trans
            i18nKey="lyricsPage.lyricsProvidedBy"
            components={{
              Hyperlink: (
                <Hyperlink
                  link={link || '#'}
                  linkTitle={decodeURI(link || t('common.unknownLyricsProvider'))}
                  label={toCapitalCase(decodeURI(source))}
                />
              )
            }}
          />
        </div>
      )}
      {copyright && (
        <div className={`text-font-color-dimmed text-sm text-balance ${textClassName}`}>
          &copy; {copyright}
        </div>
      )}
      {isTranslated && (
        <div className={`text-font-color-dimmed text-sm text-balance ${textClassName}`}>
          <Trans i18nKey="lyricsPage.lyricsTranslatedBy" />
        </div>
      )}
    </div>
  );
};

export default LyricsMetadata;
