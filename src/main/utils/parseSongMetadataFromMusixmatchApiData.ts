import logger from '../logger';
import type {
  MusixmatchLyricsAPI,
  MusixmatchLyricsMetadata
} from '../../types/musixmatch_lyrics_api';
import fetchSongArtworksFromSpotify from './fetchSongArtworksFromSpotify';

async function parseSongMetadataFromMusixmatchApiData(
  data: MusixmatchLyricsAPI,
  spotifyArtworks = false
) {
  if (data.message.body.macro_calls['matcher.track.get'].message.header.status_code === 200) {
    const metadata = {} as MusixmatchLyricsMetadata;
    const trackData = data.message.body.macro_calls['matcher.track.get'].message.body.track;
    // Track name
    if (trackData.track_name) {
      metadata.title = trackData.track_name;
    }
    // Artist(s) name(s)
    if (trackData.artist_name) {
      metadata.artist = trackData.artist_name;
    }
    // Album name
    if (trackData.album_name) {
      metadata.album = trackData.album_name;
    }
    // Track length
    if (trackData.track_length) {
      metadata.duration = trackData.track_length;
    }
    // Track album cover art
    metadata.album_artwork_urls = [];
    if (trackData.album_coverart_800x800)
      metadata.album_artwork_urls.push(trackData.album_coverart_800x800);
    if (spotifyArtworks && trackData.track_spotify_id) {
      const artworks = await fetchSongArtworksFromSpotify(trackData.track_spotify_id);

      if (artworks) {
        const { highResArtworkUrl, lowResArtworkUrl } = artworks;
        metadata.album_artwork_urls.push(lowResArtworkUrl, highResArtworkUrl);
      }
    }

    // Link to Track lyrics on Musixmatch
    if (trackData.track_share_url) metadata.link = trackData.track_share_url.split(/[?#]/)[0];

    return metadata;
  }
  logger.warn('No song metadata found.');
  return undefined;
}

export default parseSongMetadataFromMusixmatchApiData;
