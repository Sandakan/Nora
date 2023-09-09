import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import Biography from '../Biography/Biography';
import { LastFMAlbumInfo } from '../../../@types/last_fm_album_info_api';
import TitleContainer from '../TitleContainer';
import UnAvailableTrack from '../SongInfoPage/UnAvailableTrack';

type Props = {
  albumTitle: string;
  otherAlbumData?: LastFMAlbumInfo;
};

const OnlineAlbumInfoContainer = (props: Props) => {
  const { bodyBackgroundImage } = React.useContext(AppContext);
  const { albumTitle: title, otherAlbumData } = props;

  const unAvailableAlbumTrackComponents = React.useMemo(() => {
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
            title="Unavailable Tracks of this Album"
            titleClassName="!text-2xl text-font-color-black !font-normal dark:text-font-color-white"
            className={`title-container ${
              bodyBackgroundImage
                ? 'text-font-color-white'
                : 'text-font-color-black dark:text-font-color-white'
            } mb-4 mt-1 text-2xl pr-4`}
          />
          <div className="flex flex-wrap my-2">
            {unAvailableAlbumTrackComponents}
          </div>
        </>
      )}
      <Biography
        bioUserName={title}
        bio={otherAlbumData?.wiki}
        tags={otherAlbumData?.tags}
        hyperlinkData={{
          labelTitle: `Read More about ${title}`,
        }}
      />
    </div>
  );
};

export default OnlineAlbumInfoContainer;
