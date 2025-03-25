import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Biography from '../Biography/Biography';
import TitleContainer from '../TitleContainer';
import UnAvailableTrack from '../SongInfoPage/UnAvailableTrack';
import type { LastFMAlbumInfo } from 'src/types/last_fm_album_info_api';
import { useStore } from '@tanstack/react-store';
import { store } from '../../store';

type Props = {
  albumTitle: string;
  otherAlbumData?: LastFMAlbumInfo;
};

const OnlineAlbumInfoContainer = (props: Props) => {
  const bodyBackgroundImage = useStore(store, (state) => state.bodyBackgroundImage);
  const { t } = useTranslation();

  const { albumTitle: title, otherAlbumData } = props;

  const unAvailableAlbumTrackComponents = useMemo(() => {
    if (otherAlbumData) {
      return otherAlbumData.sortedUnAvailAlbumTracks.map((track) => (
        <UnAvailableTrack
          key={track.url}
          index={track.rank}
          title={track.title}
          artists={track.artists}
          url={track.url}
        />
      ));
    }
    return [];
  }, [otherAlbumData]);

  return (
    <div className="mt-6">
      {unAvailableAlbumTrackComponents.length > 0 && (
        <>
          <TitleContainer
            title={t('albumInfoPage.unavailableTracks')}
            titleClassName="text-2xl! text-font-color-black font-normal! dark:text-font-color-white"
            className={`title-container ${
              bodyBackgroundImage
                ? 'text-font-color-white'
                : 'text-font-color-black dark:text-font-color-white'
            } mb-4 mt-1 pr-4 text-2xl`}
          />
          <div className="my-2 flex flex-wrap">{unAvailableAlbumTrackComponents}</div>
        </>
      )}
      <Biography
        bioUserName={title}
        bio={otherAlbumData?.wiki}
        tags={otherAlbumData?.tags}
        hyperlinkData={{
          labelTitle: t('common.readMoreAboutTitle', { title })
        }}
      />
    </div>
  );
};

export default OnlineAlbumInfoContainer;
