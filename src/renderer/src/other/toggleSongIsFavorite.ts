const toggleSongIsFavorite = async (
  songId: number,
  isCurrentSongAFavorite: boolean,
  isFavorite?: boolean,
  onlyChangeCurrentSongData = false
) => {
  const newFavorite = isFavorite ?? !isCurrentSongAFavorite;

  if (isCurrentSongAFavorite !== newFavorite && !onlyChangeCurrentSongData) {
    const res = await window.api.playerControls.toggleLikeSongs([songId], newFavorite);
    if (res && res.likes.length + res.dislikes.length > 0) {
      return newFavorite;
    }
  }
  if (typeof isFavorite === 'boolean') {
    return isFavorite;
  }
  return undefined;
};

export default toggleSongIsFavorite;
