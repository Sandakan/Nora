import { useCallback, useEffect, useState } from 'react';
import { type LyricsLineData } from './LyricsEditingPage';

type Props = {
  isPlaying: boolean;
  wordData: LyricsLineData;
};
const TRANSITION_DURATION = 0;

const EditingLyricWord = (props: Props) => {
  const { isPlaying, wordData } = props;
  const {
    text: wordText,
    end: wordEnd = 0,
    start: wordStart = 0,
    isActive: isWordActive
  } = wordData;
  const [isWordInRange, setIsWordInRange] = useState(false);

  const handleSongPositionChange = useCallback(
    (e: Event) => {
      if ('detail' in e && !Number.isNaN(e.detail)) {
        const songPosition = e.detail as number;

        const position = songPosition - TRANSITION_DURATION;
        setIsWordInRange(
          wordStart !== 0 && wordEnd !== 0 && wordStart < position && wordEnd > position
        );
      }
    },
    [wordEnd, wordStart]
  );

  useEffect(() => {
    if (isWordActive) {
      document.addEventListener('player/positionChange', handleSongPositionChange);
    } else {
      document.removeEventListener('player/positionChange', handleSongPositionChange);
    }

    return () => document.removeEventListener('player/positionChange', handleSongPositionChange);
  }, [handleSongPositionChange, isWordActive]);

  return (
    <div
      className={`mr-3 flex flex-col items-start opacity-50 hover:opacity-100 ${
        ((isPlaying && isWordInRange) || (!isPlaying && isWordActive)) && 'opacity-100!'
      }`}
    >
      <span className="text-xs">{wordStart}</span>
      <span>{wordText}</span>
    </div>
  );
};

export default EditingLyricWord;
