export const manageAlbumData = (
  albumData: Album[],
  album?: string,
  songArtwork?: string
): SongTagsAlbumData | undefined => {
  if (albumData.length > 0)
    return {
      title: albumData[0].title,
      albumId: albumData[0].albumId,
      artists: albumData[0].artists?.map((x) => x.name),
      artworkPath: albumData[0].artworkPaths.artworkPath,
      noOfSongs: albumData[0].songs.length
    };

  if (album) return { title: album, artworkPath: songArtwork, noOfSongs: 1 };
  return undefined;
};

export const manageArtistsData = (
  artistData: Artist[],
  artists: string[]
): SongTagsArtistData[] | undefined => {
  const artistsInfo: SongTagsArtistData[] = artistData.map((data) => ({
    name: data.name,
    artistId: data.artistId,
    artworkPath: data.artworkPaths.optimizedArtworkPath,
    onlineArtworkPaths: data.onlineArtworkPaths
  }));

  for (const artistName of artists) {
    if (!artistsInfo.some((x) => x.name === artistName)) artistsInfo.push({ name: artistName });
  }

  return artistsInfo;
};

export const manageGenresData = (
  genreData: Genre[],
  genres?: string[]
): SongTagsGenreData[] | undefined => {
  if (genres) {
    const genresInfo: SongTagsGenreData[] = genreData.map((data) => ({
      name: data.name,
      genreId: data.genreId,
      artworkPath: data.artworkPaths.optimizedArtworkPath
    }));

    for (const genreName of genres) {
      if (!genresInfo.some((x) => x.name === genreName)) genresInfo.push({ name: genreName });
    }

    return genresInfo;
  }
  return undefined;
};

export const manageArtworks = (prevData: SongTags, artworkPaths?: string[]) =>
  Array.isArray(artworkPaths) && artworkPaths.length > 0
    ? artworkPaths.at(-1) || artworkPaths[0]
    : prevData.artworkPath;
