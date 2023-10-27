import toCapitalCase from 'renderer/utils/toCapitalCase';
import Hyperlink from '../Hyperlink';

interface LyricsSourceProp {
  source: string;
  link?: string;
  copyright?: string;
}

const LyricsSource = (props: LyricsSourceProp) => {
  const { source, copyright, link } = props;
  return (
    <div className="source-name mt-12 flex flex-col items-center justify-center text-center text-[#ccc]">
      <div>
        {source !== 'IN_SONG_LYRICS' && (
          <>
            Lyrics provided by{' '}
            <Hyperlink
              link={link || '#'}
              linkTitle={decodeURI(link || 'Unknown lyrics provider')}
              label={toCapitalCase(decodeURI(source))}
            />
            .
          </>
        )}
      </div>
      {copyright && (
        <div className="text-sm text-font-color-dimmed [text-wrap:balance]">
          &copy; {copyright}
        </div>
      )}
    </div>
  );
};

export default LyricsSource;
