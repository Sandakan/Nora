// Generated by https://quicktype.io

export interface MusixmatchLyricsAPI {
  message: MusixmatchLyricsAPIMessage;
}

export interface MusixmatchLyricsAPIMessage {
  header: IndigoHeader;
  body: PurpleBody;
}

export interface PurpleBody {
  macro_calls: MacroCalls;
}

export interface MacroCalls {
  'track.lyrics.get': TrackLyricsGet;
  'track.snippet.get': TrackSnippetGet;
  'track.subtitles.get': TrackSubtitlesGet;
  'matcher.track.get': MatcherTrackGet;
  'userblob.get': UserblobGet;
}

export interface MatcherTrackGet {
  message: MatcherTrackGetMessage;
}

export interface MatcherTrackGetMessage {
  header: PurpleHeader;
  body: FluffyBody;
}

export interface FluffyBody {
  track: Track;
}

export interface Track {
  track_id: number;
  track_mbid: string;
  track_isrc: string;
  commontrack_isrcs: Array<string[]>;
  track_spotify_id: string;
  commontrack_spotify_ids: string[];
  track_soundcloud_id: number;
  track_xboxmusic_id: string;
  track_name: string;
  track_name_translation_list: string[];
  track_rating: number;
  track_length: number;
  commontrack_id: number;
  instrumental: number;
  explicit: number;
  has_lyrics: number;
  has_lyrics_crowd: number;
  has_subtitles: number;
  has_richsync: number;
  has_track_structure: number;
  num_favourite: number;
  lyrics_id: number;
  subtitle_id: number;
  album_id: number;
  album_name: string;
  artist_id: number;
  artist_mbid: string;
  artist_name: string;
  album_coverart_100x100: string;
  album_coverart_350x350: string;
  album_coverart_500x500: string;
  album_coverart_800x800: string;
  track_share_url: string;
  track_edit_url: string;
  commontrack_vanity_id: string;
  restricted: number;
  first_release_date: string;
  updated_time: string;
  primary_genres: AryGenres;
  secondary_genres: AryGenres;
}

export interface AryGenres {
  music_genre_list: MusicGenreList[];
}

export interface MusicGenreList {
  music_genre: MusicGenre;
}

export interface MusicGenre {
  music_genre_id: number;
  music_genre_parent_id: number;
  music_genre_name: string;
  music_genre_name_extended: string;
  music_genre_vanity: string;
}

export interface PurpleHeader {
  status_code: number;
  execute_time: number;
  confidence: number;
  mode: string;
  cached: number;
}

export interface TrackLyricsGet {
  message: TrackLyricsGetMessage;
}

export interface TrackLyricsGetMessage {
  header: FluffyHeader;
  body: TentacledBody;
}

export interface TentacledBody {
  lyrics: Lyrics;
}

export interface Lyrics {
  lyrics_id: number;
  can_edit: number;
  locked: number;
  published_status: number;
  action_requested: string;
  verified: number;
  restricted: number;
  instrumental: number;
  explicit: number;
  lyrics_body: string;
  lyrics_language: string;
  lyrics_language_description: string;
  script_tracking_url: string;
  pixel_tracking_url: string;
  html_tracking_url: string;
  lyrics_copyright: string;
  writer_list: string[];
  publisher_list: string[];
  backlink_url: string;
  updated_time: string;
}

export interface FluffyHeader {
  status_code: number;
  execute_time: number;
}

export interface TrackSnippetGet {
  message: TrackSnippetGetMessage;
}

export interface TrackSnippetGetMessage {
  header: FluffyHeader;
  body: StickyBody;
}

export interface StickyBody {
  snippet: Snippet;
}

export interface Snippet {
  snippet_id: number;
  snippet_language: string;
  restricted: number;
  instrumental: number;
  snippet_body: string;
  script_tracking_url: string;
  pixel_tracking_url: string;
  html_tracking_url: string;
  updated_time: string;
}

export interface TrackSubtitlesGet {
  message: TrackSubtitlesGetMessage;
}

export interface TrackSubtitlesGetMessage {
  header: TentacledHeader;
  body: [] | IndigoBody;
}

export interface IndigoBody {
  subtitle_list: SubtitleList[];
}

export interface SubtitleList {
  subtitle: Subtitle;
}

export interface Subtitle {
  subtitle_id: number;
  restricted: number;
  published_status: number;
  subtitle_body: string;
  subtitle_avg_count: number;
  lyrics_copyright: string;
  subtitle_length: number;
  subtitle_language: string;
  subtitle_language_description: string;
  script_tracking_url: string;
  pixel_tracking_url: string;
  html_tracking_url: string;
  writer_list: string[];
  publisher_list: string[];
  updated_time: string;
}

export interface TentacledHeader {
  status_code: number;
  available: number;
  execute_time: number;
  instrumental: number;
}

export interface UserblobGet {
  message: UserblobGetMessage;
  meta: Meta;
}

export interface UserblobGetMessage {
  header: StickyHeader;
}

export interface StickyHeader {
  status_code: number;
}

export interface Meta {
  status_code: number;
  last_updated: string;
}

export interface IndigoHeader {
  status_code: number;
  execute_time: number;
  pid: number;
  surrogate_key_list: string[];
}

export interface MusixmatchLyricsLine {
  text: string;
  time: Time;
}

export interface Time {
  total: number;
  minutes: number;
  seconds: number;
  hundredths: number;
}

export interface MusixmatchLyricsMetadata {
  title: string;
  artist: string;
  album?: string;
  duration: number;
  copyright?: string;
  lang: string;
  album_artwork_urls: string[];
  link: string;
}

export interface MusixmatchLyrics {
  metadata: MusixmatchLyricsMetadata;
  /** Musixmatch Lyrics in LRC format. */
  lyrics: string;
  lyricsType: LyricsTypes;
}

export interface MusixmatchHitCache {
  id: string;
  data: SongMetadataResultFromInternet;
}
