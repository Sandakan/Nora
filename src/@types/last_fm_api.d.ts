/* eslint-disable no-shadow */
export type LastFMTrackInfoApi =
  | {
      track: LastFMTrackData;
    }
  | LastFMError;

interface LastFMTrackData {
  name: string;
  url: string;
  duration: string;
  streamable: LastFMTrackStreamable;
  listeners: string;
  playcount: string;
  artist: LastFMTrackArtist;
  album: LastFMTrackAlbum;
  toptags: {
    tag: LastFMTrackTag[];
  };
  wiki?: LastFMTrackWiki;
}

interface LastFMTrackAlbum {
  artist: string;
  title: string;
  url: string;
  image: LastFMTrackAlbumImage[];
}

interface LastFMTrackAlbumImage {
  '#text': string;
  size: string;
}

interface LastFMTrackArtist {
  name: string;
  mbid?: string;
  url: string;
}

interface LastFMTrackStreamable {
  '#text': string;
  fulltrack: string;
}

interface LastFMTrackTag {
  name: string;
  url: string;
}

interface LastFMTrackWiki {
  published: string;
  summary: string;
  content: string;
}

export interface LastFMHitCache {
  id: string;
  data: SongMetadataResultFromInternet;
}

type LastFMError = { message: string; error: number };

export type LastFMSessionData = {
  name: string;
  key: string;
};

export type LastFMSessionGetResponse = { session: LastFMSessionData } | LastFMError;

export interface updateNowPlayingParams {
  artist: string;
  track: string;
  album?: string;
  trackNumber?: number;
  mbid?: string;
  albumArtist?: string;
  duration?: number;
}

export enum ChosenByUserInput {
  chosenByUser = 1,
  notChosenByUser = 0
}

export interface ScrobbleParams extends updateNowPlayingParams {
  timestamp: number;
  chosenByUser?: ChosenByUserInput;
}

export type LoveParams = { artist: string; track: string };

export type LastFMScrobblePostResponse =
  | {
      scrobbles: {
        scrobble: {
          artist: { corrected: string; '#text': string };
          album: { corrected: string };
          track: { corrected: string; '#text': string };
          ignoredMessage: { code: string; '#text': string };
          albumArtist: { corrected: string; '#text': string };
          timestamp: string;
        };
        '@attr': { ignored: number; accepted: number };
      };
    }
  | LastFMError;

export type LastFMLoveUnlovePostResponse = {} | LastFMError;

export type AuthData = {
  LAST_FM_API_KEY: string;
  LAST_FM_SHARED_SECRET: string;
  SESSION_KEY: string;
};
