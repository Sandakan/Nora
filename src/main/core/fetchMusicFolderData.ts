import { getSongsData, getUserData } from 'main/filesystem';

const fetchMusicFolderData = () => {
  const userData = getUserData();
  const songs = getSongsData();

  if (userData) {
    const { musicFolders } = userData;
    const isSongsAvailable = songs.length > 0;
    if (Array.isArray(musicFolders) && musicFolders?.length) {
      const folders = musicFolders.map((folderData) => {
        let noOfSongs = 0;
        if (isSongsAvailable) {
          for (let i = 0; i < songs.length; i += 1) {
            const song = songs[i];

            if (song.path.includes(folderData.path)) noOfSongs += 1;
          }
        }
        return { noOfSongs };
      });

      return folders;
    }
  }
  return [];
};

export default fetchMusicFolderData;
