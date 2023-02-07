import {
  createNewListeningDataInstance,
  getListeningData,
  setListeningData,
} from '../filesystem';
import log from '../log';
import { dataUpdateEvent } from '../main';

const incrementListeningDataProperties = (
  dataUpdateType: ListeningDataUpdateTypes,
  data = 0
) => {
  const value = dataUpdateType === 'increment' ? 1 : -1;
  if (data + value < 0) return 0;
  return data + value;
};

const updateSongListensArray = (
  updateType: ListeningDataUpdateTypes,
  listens: YearlyListeningRate[]
) => {
  const date = new Date();
  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth();
  const currentDate = date.getDate();

  const updateValue = updateType === 'increment' ? 1 : -1;

  if (listens.some((y) => y.year === currentYear)) {
    for (let i = 0; i < listens.length; i += 1) {
      if (
        listens[i].year === currentYear &&
        listens[i].months[currentMonth] !== undefined
      ) {
        if (
          typeof listens[i].months[currentMonth][currentDate - 1] === 'number'
        )
          listens[i].months[currentMonth][currentDate - 1] += updateValue;
        else if (listens[i].months[currentMonth].length < 31)
          listens[i].months[currentMonth][currentDate - 1] = 1;
      }
    }
  }
  return listens;
};

const updateListeningData = (
  dataType: ListeningDataTypes,
  listeningData: SongListeningData,
  updateType: ListeningDataUpdateTypes
) => {
  if (dataType === 'fullListens') {
    listeningData.fullListens = incrementListeningDataProperties(
      updateType,
      listeningData.fullListens
    );
  } else if (dataType === 'skips') {
    listeningData.skips = incrementListeningDataProperties(
      updateType,
      listeningData.skips
    );
  } else if (dataType === 'noOfPlaylists') {
    listeningData.inNoOfPlaylists = incrementListeningDataProperties(
      updateType,
      listeningData.inNoOfPlaylists
    );
  } else if (dataType === 'listens') {
    listeningData.listens = updateSongListensArray(
      updateType,
      listeningData.listens
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

  dataUpdateEvent(
    dataType === 'listens'
      ? 'songs/listeningData/listens'
      : dataType === 'fullListens'
      ? 'songs/listeningData/fullSongListens'
      : dataType === 'skips'
      ? 'songs/listeningData/skips'
      : 'songs/listeningData/inNoOfPlaylists',
    [listeningData.songId]
  );
  return listeningData;
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
        const updatedListeningData = updateListeningData(
          dataType,
          listeningData[i],
          updateType
        );
        return setListeningData(updatedListeningData);
      }
    }

    log(
      `No listening data found for songId ${songId}. Creating a new listening data instance.`
    );
    const newListeningData = createNewListeningDataInstance(songId);
    const updatedListeningData = updateListeningData(
      dataType,
      newListeningData,
      updateType
    );
    return setListeningData(updatedListeningData);
  }
  return log('Listening data array empty');
};

export default updateSongListeningData;
