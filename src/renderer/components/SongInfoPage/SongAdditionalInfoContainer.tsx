import React from 'react';
import SongAdditionalInfoItem from './SongAdditionalInfoItem';
import Button from '../Button';

type Props = { songInfo: SongData; songDurationStr: string };

const SongAdditionalInfoContainer = (props: Props) => {
  const { songInfo, songDurationStr } = props;

  const [isDataVisible, setIsDataVisible] = React.useState(false);

  return (
    <div className="other-cards appear-from-bottom mr-4 w-full max-w-[60rem] rounded-xl bg-background-color-2/70 p-4 backdrop-blur-sm dark:bg-dark-background-color-2/70 dark:text-font-color-white">
      <label
        htmlFor="toggleSuggestionBox"
        className="title-container flex cursor-pointer items-center justify-between font-medium text-font-color-highlight dark:text-dark-font-color-highlight"
      >
        <div className="flex items-center">
          <span className="material-icons-round-outlined mr-2 text-2xl">
            info
          </span>{' '}
          Additional Song Information
        </div>
        <div className="flex items-center">
          <Button
            id="toggleSuggestionBox"
            className="!m-0 !border-0 !p-0 outline-1 outline-offset-1 hover:bg-background-color-1/50 focus-visible:!outline hover:dark:bg-dark-background-color-1/50"
            iconClassName="!leading-none !text-3xl"
            iconName={isDataVisible ? 'arrow_drop_up' : 'arrow_drop_down'}
            tooltipLabel={isDataVisible ? 'Hide suggestion' : 'Show suggestion'}
            clickHandler={(e) => {
              e.preventDefault();
              setIsDataVisible((state) => !state);
            }}
          />
        </div>
      </label>

      {isDataVisible && (
        <div className="info-items-container">
          <SongAdditionalInfoItem label="Song Title" value={songInfo.title} />
          <SongAdditionalInfoItem label="Duration" value={songDurationStr} />
          {Array.isArray(songInfo.artists) && songInfo.artists.length > 0 && (
            <SongAdditionalInfoItem
              label="Artists"
              value={songInfo.artists.map((artist) => artist.name).join(', ')}
            />
          )}
          {songInfo.album && (
            <SongAdditionalInfoItem
              label="Album"
              value={songInfo.album?.name}
            />
          )}
          {Array.isArray(songInfo.genres) && songInfo.genres.length > 0 && (
            <SongAdditionalInfoItem
              label="Genres"
              value={songInfo.genres.map((genre) => genre.name).join(', ')}
            />
          )}
          {songInfo.trackNo && (
            <SongAdditionalInfoItem
              label="Album Track Number"
              value={songInfo.trackNo.toString()}
            />
          )}
          {songInfo.year && (
            <SongAdditionalInfoItem
              label="Released Year"
              value={songInfo.year.toString()}
            />
          )}
          <SongAdditionalInfoItem
            label="Song Added On"
            value={new Date(songInfo.addedDate).toUTCString()}
          />
          {songInfo.modifiedDate && (
            <SongAdditionalInfoItem
              label="Last Modified On"
              value={new Date(songInfo.modifiedDate).toUTCString()}
            />
          )}
          {songInfo.sampleRate && (
            <SongAdditionalInfoItem
              label="Sample Rate"
              value={`${songInfo.sampleRate} Hz`}
            />
          )}
          {songInfo.bitrate && (
            <SongAdditionalInfoItem
              label="Bit Rate"
              value={`${Math.floor(songInfo.bitrate / 1000)} Kbps`}
            />
          )}
          {songInfo.noOfChannels && (
            <SongAdditionalInfoItem
              label="Number of Audio Channels"
              value={`${songInfo.noOfChannels} Channels (${
                songInfo.noOfChannels === 1 ? 'Mono' : 'Stereo'
              })`}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default SongAdditionalInfoContainer;
