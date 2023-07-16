export interface LastFMArtistDataApi {
  artist: {
    name: string;
    url: string;
    image: {
      '#text': string;
      size: 'small' | 'medium' | 'large' | 'extralarge' | 'mega';
    }[];
    tags: {
      tag: {
        name: string;
      }[];
    };
    bio: {
      summary: string;
      content: string;
    };
  };
  error?: number;
  message?: string;
}

export interface LastFMTrackInfoApi {
  track?: LastFMTrackData;
  message?: string;
  error?: number;
}

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

export interface LastFMAlbumInfoAPI {
  album: Album;
  message?: string;
  error?: number;
}

interface Album {
  artist: string;
  mbid: string;
  tags: Tags;
  playcount: string;
  image: Image[];
  tracks: Tracks;
  url: string;
  name: string;
  listeners: string;
  wiki: Wiki;
}

interface Image {
  size: string;
  '#text': string;
}

interface Tags {
  tag: Tag[];
}

interface Tag {
  url: string;
  name: string;
}

interface Tracks {
  track: Track[];
}

interface Track {
  streamable: Streamable;
  duration: number;
  url: string;
  name: string;
  '@attr': Attr;
  artist: ArtistClass;
}

interface Attr {
  rank: number;
}

interface ArtistClass {
  url: string;
  name: string;
  mbid: string;
}

interface Streamable {
  fulltrack: string;
  '#text': string;
}

interface Wiki {
  published: string;
  summary: string;
  content: string;
}
