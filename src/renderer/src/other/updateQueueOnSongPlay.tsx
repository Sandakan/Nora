const updateQueueOnSongPlay = (queue: Queue, songId: string, playAsCurrentSongIndex: boolean) => {
  if (queue.queue.length > 0) {
    // check if songId exists in the queue
    if (queue.queue.indexOf(songId) !== -1) {
      if (playAsCurrentSongIndex) {
        // if playAsCurrentSongIndex is enabled, songId will be removed from the position it previously was and put next to the currentSongIndex to avoid messing up the queue when playing arbitrary songs from different places in the queue, result in continuing playing from that position rather than playing from previous song's position.
        if (queue.currentSongIndex !== null) {
          // There is a currently playing song.
          const position = queue.currentSongIndex + 1;
          if (queue.queue[position] !== songId) {
            queue.queue = queue.queue.filter((id) => id !== songId);
            queue.queue.splice(position, 0, songId);
          }
          queue.currentSongIndex = position;
        } else queue.currentSongIndex = queue.queue.indexOf(songId);
      } else queue.currentSongIndex = queue.queue.indexOf(songId);
    } else {
      // songId not in the queue
      console.log(`song with id ${songId} is not present in the queue`);
      queue.queue.push(songId);

      if (queue.currentSongIndex !== null) queue.currentSongIndex += 1;
      else queue.currentSongIndex = 0;
    }
  } else if (queue.queue.length === 0) queue.queue.push(songId);

  return queue;
};

export default updateQueueOnSongPlay;
