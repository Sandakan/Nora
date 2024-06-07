import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SongAdditionalInfoItem from './SongAdditionalInfoItem';
import Button from '../Button';

type Props = { songInfo: SongData; songDurationStr: string };

const SongAdditionalInfoContainer = (props: Props) => {
  const { t } = useTranslation();

  const { songInfo, songDurationStr } = props;

  const [isDataVisible, setIsDataVisible] = useState(false);

  return (
    <div className="other-cards appear-from-bottom mr-4 mt-4 w-full max-w-full rounded-xl bg-background-color-2/70 p-4 backdrop-blur-sm dark:bg-dark-background-color-2/70 dark:text-font-color-white">
      <label
        htmlFor="songAdditionalInfo"
        className="title-container flex cursor-pointer items-center justify-between font-medium text-font-color-highlight dark:text-dark-font-color-highlight"
      >
        <div className="flex items-center">
          <span className="material-icons-round-outlined mr-2 text-2xl">info</span>{' '}
          {t('songInfoPage.additionalSongInfo')}
        </div>
        <div className="flex items-center">
          <Button
            id="songAdditionalInfo"
            className="!m-0 !border-0 !p-0 outline-1 outline-offset-1 hover:bg-background-color-1/50 focus-visible:!outline hover:dark:bg-dark-background-color-1/50"
            iconClassName="!leading-none !text-3xl"
            iconName={isDataVisible ? 'arrow_drop_up' : 'arrow_drop_down'}
            tooltipLabel={t(`common.${isDataVisible ? 'hideSuggestion' : 'showSuggestion'}`)}
            clickHandler={(e) => {
              e.preventDefault();
              setIsDataVisible((state) => !state);
            }}
          />
        </div>
      </label>

      {isDataVisible && (
        <div className="info-items-container">
          <SongAdditionalInfoItem label={t('common.songTitle')} value={songInfo.title} />
          <SongAdditionalInfoItem label={t('common.duration')} value={songDurationStr} />
          {Array.isArray(songInfo.artists) && songInfo.artists.length > 0 && (
            <SongAdditionalInfoItem
              label={t('common.artist_other')}
              value={songInfo.artists.map((artist) => artist.name).join(', ')}
            />
          )}
          {songInfo.album && (
            <SongAdditionalInfoItem label={t('common.album_one')} value={songInfo.album?.name} />
          )}
          {songInfo?.albumArtists && (
            <SongAdditionalInfoItem
              label={t('common.albumArtists')}
              value={songInfo.albumArtists.map((artist) => artist.name).join(', ')}
            />
          )}
          {Array.isArray(songInfo.genres) && songInfo.genres.length > 0 && (
            <SongAdditionalInfoItem
              label={t('common.genre_other')}
              value={songInfo.genres.map((genre) => genre.name).join(', ')}
            />
          )}
          {songInfo.trackNo && (
            <SongAdditionalInfoItem
              label={t('common.albumTrackNo')}
              value={songInfo.trackNo.toString()}
            />
          )}
          {songInfo.year && (
            <SongAdditionalInfoItem
              label={t('common.releasedYear')}
              value={songInfo.year.toString()}
            />
          )}
          <SongAdditionalInfoItem
            label={t('common.songAddedOn')}
            value={new Date(songInfo.addedDate).toUTCString()}
          />
          {songInfo.modifiedDate && (
            <SongAdditionalInfoItem
              label={t('common.lastModifiedOn')}
              value={new Date(songInfo.modifiedDate).toUTCString()}
            />
          )}
          {songInfo.sampleRate && (
            <SongAdditionalInfoItem
              label={t('common.sampleRate')}
              value={`${songInfo.sampleRate} Hz`}
            />
          )}
          {songInfo.bitrate && (
            <SongAdditionalInfoItem
              label={t('common.bitRate')}
              value={`${Math.floor(songInfo.bitrate / 1000)} Kbps`}
            />
          )}
          {songInfo.noOfChannels && (
            <SongAdditionalInfoItem
              label={t('common.noOfAudioChannels')}
              value={t('common.channelWithCount', {
                count: songInfo.noOfChannels
              })}
            />
          )}
          <SongAdditionalInfoItem label={t('common.songLocation')} value={songInfo.path} />
        </div>
      )}
    </div>
  );
};

export default SongAdditionalInfoContainer;
