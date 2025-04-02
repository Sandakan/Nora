// Generated by https://quicktype.io

import { LastFMError } from './last_fm_api';

export type LastFMSimilarTracksAPI =
  | {
      similartracks: Similartracks;
    }
  | LastFMError;

export interface Similartracks {
  track: SimilarTrack[];
  '@attr': Attr;
}

export interface Attr {
  artist: string;
}

export interface SimilarTrack {
  name: string;
  playcount: number;
  match: number;
  url: string;
  streamable: Streamable;
  artist: Artist;
  image: Image[];
}

export interface ParsedSimilarTrack {
  songData?: AudioInfo;
  title: string;
  artists?: string[];
  match: number;
  url: string;
}

export interface Artist {
  name: string;
  mbid?: string;
  url: string;
}

export enum Size {
  Empty = '',
  Extralarge = 'extralarge',
  Large = 'large',
  Medium = 'medium',
  Mega = 'mega',
  Small = 'small'
}
export interface Image {
  '#text': string;
  size: Size;
}

export interface Streamable {
  '#text': string;
  fulltrack: string;
}

export type SimilarTracksOutput =
  | {
      sortedAvailTracks: ParsedSimilarTrack[];
      sortedUnAvailTracks: ParsedSimilarTrack[];
    }
  | undefined;
