/* eslint-disable no-nested-ternary */
export default <T extends MusicFolder[]>(data: T, sortType: GenreSortTypes) => {
  if (data.length > 0) {
    if (sortType === 'aToZ')
      return data.sort((a, b) =>
        a.folderData.path > b.folderData.path
          ? 1
          : a.folderData.path < b.folderData.path
          ? -1
          : 0
      );
    if (sortType === 'zToA')
      return data.sort((a, b) =>
        a.folderData.path < b.folderData.path
          ? 1
          : a.folderData.path > b.folderData.path
          ? -1
          : 0
      );
    if (sortType === 'noOfSongsDescending')
      return data
        .sort((a, b) =>
          a.folderData.path > b.folderData.path
            ? 1
            : a.folderData.path < b.folderData.path
            ? -1
            : 0
        )
        .sort((a, b) =>
          a.songIds.length < b.songIds.length
            ? 1
            : a.songIds.length > b.songIds.length
            ? -1
            : 0
        );
    if (sortType === 'noOfSongsAscending')
      return data
        .sort((a, b) =>
          a.folderData.path > b.folderData.path
            ? 1
            : a.folderData.path < b.folderData.path
            ? -1
            : 0
        )
        .sort((a, b) =>
          a.songIds.length > b.songIds.length
            ? 1
            : a.songIds.length < b.songIds.length
            ? -1
            : 0
        );
  }
  return data;
};
