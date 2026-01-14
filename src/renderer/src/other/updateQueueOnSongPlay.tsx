const updateQueueOnSongPlay = (queue: Queue, songId: number, playAsCurrentSongIndex: boolean) => {
  if (queue.songIds.length > 0) {
    // check if songId exists in the queue
    if (queue.songIds.indexOf(songId) !== -1) {
      if (playAsCurrentSongIndex) {
        // if playAsCurrentSongIndex is enabled, songId will be removed from the position it previously was and put next to the currentSongIndex to avoid messing up the queue when playing arbitrary songs from different places in the queue, result in continuing playing from that position rather than playing from previous song's position.
        if (queue.currentSongIndex !== null) {
          // There is a currently playing song.
          const position = queue.currentSongIndex + 1;
          if (queue.songIds[position] !== songId) {
            queue.songIds = queue.songIds.filter((id) => id !== songId);
            queue.songIds.splice(position, 0, songId);
          }
          queue.currentSongIndex = position;
        } else queue.currentSongIndex = queue.songIds.indexOf(songId);
      } else queue.currentSongIndex = queue.songIds.indexOf(songId);
    } else {
      // songId not in the queue
      console.log(`song with id ${songId} is not present in the queue`);
      queue.songIds.push(songId);

      if (queue.currentSongIndex !== null) queue.currentSongIndex += 1;
      else queue.currentSongIndex = 0;
    }
  } else if (queue.songIds.length === 0) queue.songIds.push(songId);

  return queue;
};

export default updateQueueOnSongPlay;
