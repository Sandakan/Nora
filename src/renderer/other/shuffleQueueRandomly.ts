const shuffleQueueRandomly = (songIds: string[], currentSongIndex?: number) => {
  const positions: number[] = [];
  const initialQueue = songIds.slice(0);
  const currentSongId =
    typeof currentSongIndex === 'number'
      ? songIds.splice(currentSongIndex, 1)[0]
      : undefined;

  for (let i = songIds.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [songIds[i], songIds[randomIndex]] = [songIds[randomIndex], songIds[i]];
  }

  if (currentSongId) songIds.unshift(currentSongId);

  for (let i = 0; i < initialQueue.length; i += 1) {
    positions.push(songIds.indexOf(initialQueue[i]));
  }

  return { shuffledQueue: songIds, positions };
};

export default shuffleQueueRandomly;
