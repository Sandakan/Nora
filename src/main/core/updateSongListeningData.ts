import { getListeningData, setListeningData } from '../filesystem';
import log from '../log';
import { dataUpdateEvent } from '../main';

const updateListeningData = (
  dataUpdateType: ListeningDataUpdateTypes,
  data = 0
) => {
  const value = dataUpdateType === 'increment' ? 1 : -1;
  if (data + value < 0) return 0;
  return data + value;
};

const updateSongListeningData = (
  songId: string,
  dataType: ListeningDataTypes,
  updateType: ListeningDataUpdateTypes
) => {
  log(
    `Requested to ${updateType} ${dataType} of the '${songId}' song's listening data.`
  );
  const listeningData = getListeningData([songId]);

  if (listeningData.length > 0) {
    for (let i = 0; i < listeningData.length; i += 1) {
      if (listeningData[i].songId === songId) {
        if (dataType === 'fullListens') {
          listeningData[i].fullListens = updateListeningData(
            updateType,
            listeningData[i].fullListens
          );
        } else if (dataType === 'skips') {
          listeningData[i].skips = updateListeningData(
            updateType,
            listeningData[i].skips
          );
        } else if (dataType === 'noOfPlaylists') {
          listeningData[i].inNoOfPlaylists = updateListeningData(
            updateType,
            listeningData[i].inNoOfPlaylists
          );
        } else {
          log(
            `Requested to update song listening data with unknown data type of ${dataType}.`,
            undefined,
            'WARN'
          );
          throw new Error(
            `Requested to update song listening data with unknown data type of ${dataType}.`
          );
        }
        // if (dataType === 'listens') {
        //  listeningData[i].fullListens = updateListeningData(
        //     updateType,
        //     listeningData[i].fullListens
        //   );
        // }

        dataUpdateEvent(
          dataType === 'fullListens'
            ? 'songs/listeningData/fullSongListens'
            : dataType === 'skips'
            ? 'songs/listeningData/skips'
            : 'songs/listeningData/inNoOfPlaylists',
          songId
        );
        return setListeningData(listeningData[i]);
      }
    }
  }
  return log('Listening data empty');
};

export default updateSongListeningData;
