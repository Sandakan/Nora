import {
  type ChangeEvent,
  type WheelEvent,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';
import { AppUpdateContext } from '../contexts/AppUpdateContext';
import calculateTime from '../utils/calculateTime';
import debounce from '../utils/debounce';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store';

type Props = {
  id: string;
  name: string;
  className?: string;
  sliderOpacity?: number;
  onSeek?: (currentPosition: number) => void;
};

const SeekBarSlider = (props: Props) => {
  const currentSongData = useStore(store, (state) => state.currentSongData);
  const preferences = useStore(store, (state) => state.localStorage.preferences);

  const { updateSongPosition } = useContext(AppUpdateContext);

  const { id, name, className, sliderOpacity, onSeek } = props;

  const [songPos, setSongPos] = useState(0);
  const isMouseDownRef = useRef(false);
  const isMouseScrollRef = useRef(false);
  const seekbarRef = useRef(null as HTMLInputElement | null);
  const lowResponseSongPositionRef = useRef(0);

  const seekBarCssProperties: any = {};
  seekBarCssProperties['--seek-before-width'] = `${
    (songPos /
      ((currentSongData.duration || 0) >= songPos ? currentSongData.duration || 0 : songPos)) *
    100
  }%`;
  if (sliderOpacity !== undefined) seekBarCssProperties['--slider-opacity'] = `${sliderOpacity}`;

  const handleSongPositionChange = useCallback((e: Event) => {
    if ('detail' in e && typeof e.detail === 'number') {
      const songPosition = e.detail as number;

      lowResponseSongPositionRef.current = songPosition;
    }
  }, []);

  useEffect(() => {
    document.addEventListener('player/positionChange', handleSongPositionChange);

    return () => document.removeEventListener('player/positionChange', handleSongPositionChange);
  }, [handleSongPositionChange]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (seekbarRef.current && !isMouseDownRef.current && !isMouseScrollRef.current) {
        setSongPos(lowResponseSongPositionRef.current);
        if (onSeek) onSeek(lowResponseSongPositionRef.current);
      }
    }, 500);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // useEffect(() => {
  //   if (
  //     seekbarRef.current &&
  //     !isMouseDownRef.current &&
  //     !isMouseScrollRef.current
  //   ) {
  //     setSongPos(songPosition);
  //     if (onSeek) onSeek(songPosition);
  //   }
  //   //  ? Adding onSeek as a dependency makes the slider unresponsive while sliding for short times.
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [songPosition]);

  useEffect(() => {
    const seekBar = seekbarRef.current;

    if (seekbarRef.current) {
      const handleSeekbarMouseDown = () => {
        isMouseDownRef.current = true;
      };
      const handleSeekbarMouseUp = () => {
        isMouseDownRef.current = false;
        updateSongPosition(seekbarRef.current?.valueAsNumber ?? 0);
      };
      seekbarRef.current.addEventListener('mousedown', () => handleSeekbarMouseDown());
      seekbarRef.current.addEventListener('mouseup', () => handleSeekbarMouseUp());
      return () => {
        seekBar?.removeEventListener('mouseup', handleSeekbarMouseUp);
        seekBar?.removeEventListener('mousedown', handleSeekbarMouseDown);
      };
    }
    return undefined;
  }, [updateSongPosition]);

  const currentSongPosition = calculateTime(songPos);

  const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    const pos = e.currentTarget.valueAsNumber;
    setSongPos(pos);
    if (onSeek) onSeek(pos);
  };

  const handleOnWheel = (e: WheelEvent<HTMLInputElement>) => {
    isMouseScrollRef.current = true;

    const max = parseInt(e.currentTarget.max);
    const scrollIncrement = preferences.seekbarScrollInterval;

    const incrementValue = e.deltaY > 0 ? -scrollIncrement : scrollIncrement;
    let value = (songPos || 0) + incrementValue;

    if (value > max) value = max;
    if (value < 0) value = 0;
    if (onSeek) onSeek(value);
    setSongPos(value);

    debounce(() => {
      isMouseScrollRef.current = false;
      updateSongPosition(value);
    }, 250);
  };

  return (
    <input
      type="range"
      name={name}
      id={id}
      className={
        className ||
        "seek-bar-slider relative float-left m-0 h-6 w-full appearance-none bg-[transparent] p-0 outline-none outline-1 outline-offset-1 before:absolute before:left-0 before:top-1/2 before:h-1 before:w-[var(--seek-before-width)] before:-translate-y-1/2 before:cursor-pointer before:rounded-3xl before:bg-seekbar-background-color/75 before:transition-[width,background] before:content-[''] hover:before:bg-font-color-highlight focus-visible:!outline dark:before:bg-dark-seekbar-background-color/75 dark:hover:before:bg-dark-font-color-highlight"
      }
      min={0}
      max={(currentSongData.duration || 0) >= songPos ? currentSongData.duration || 0 : songPos}
      value={songPos || 0}
      onChange={handleOnChange}
      onWheel={handleOnWheel}
      ref={seekbarRef}
      style={seekBarCssProperties}
      title={`${currentSongPosition.minutes}:${currentSongPosition.seconds}`}
    />
  );
};

export default SeekBarSlider;
