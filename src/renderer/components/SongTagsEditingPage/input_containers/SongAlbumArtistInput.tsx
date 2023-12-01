/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import { useTranslation } from 'react-i18next';

import Button from 'renderer/components/Button';
import Img from 'renderer/components/Img';
import SongArtistInputResult from './SongArtistInputResult';

type Props = {
  songAlbum?: {
    title: string;
    albumId?: string | undefined;
    noOfSongs?: number | undefined;
    artists?: string[] | undefined;
    artworkPath?: string | undefined;
  };
  songAlbumArtists?: {
    artistId?: string | undefined;
    name: string;
    artworkPath?: string | undefined;
    onlineArtworkPaths?: OnlineArtistArtworks | undefined;
  }[];
  albumArtistKeyword: string;
  artistResults: {
    artistId?: string;
    name: string;
    artworkPath?: string;
    onlineArtworkPaths?: OnlineArtistArtworks;
  }[];
  updateSongInfo: (callback: (prevSongInfo: SongTags) => SongTags) => void;
  updateAlbumArtistKeyword: (keyword: string) => void;
};

const SongAlbumArtistsInput = (props: Props) => {
  const { t } = useTranslation();

  const {
    songAlbum,
    songAlbumArtists,
    updateSongInfo,
    albumArtistKeyword,
    artistResults,
    updateAlbumArtistKeyword,
  } = props;

  const albumArtistResultComponents = React.useMemo(() => {
    if (artistResults.length > 0)
      return artistResults.map((x) => (
        <SongArtistInputResult
          key={x.name}
          artistData={x}
          isAnAlbumArtist
          updateArtistKeyword={updateAlbumArtistKeyword}
          updateSongInfo={updateSongInfo}
        />
      ));
    return [];
  }, [artistResults, updateAlbumArtistKeyword, updateSongInfo]);

  const albumArtistComponents = React.useMemo(() => {
    if (songAlbumArtists)
      return songAlbumArtists.map((artist) => (
        <span
          key={artist.name}
          className="group mb-2 mr-2 flex w-fit items-center rounded-2xl bg-background-color-3 px-3 py-1 text-center text-font-color-black dark:bg-dark-background-color-3 dark:text-font-color-black"
        >
          <Button
            iconName="close"
            className="material-icons-round mr-2 !border-0 !p-[.125rem] opacity-0 outline-1 outline-offset-1 transition-[visibility,opacity] focus-visible:!outline group-focus-within:opacity-100 group-hover:opacity-100"
            iconClassName="leading-none dark:!text-font-color-black"
            clickHandler={() => {
              updateSongInfo((prevData) => {
                return {
                  ...prevData,
                  albumArtists: prevData.albumArtists?.filter(
                    (x) => x.name !== artist.name,
                  ),
                };
              });
            }}
          />
          <Img
            src={artist.onlineArtworkPaths?.picture_small}
            fallbackSrc={artist.artworkPath}
            className="!absolute mr-2 aspect-square w-6 rounded-full opacity-100 transition-[visibility,opacity]  group-focus-within:invisible group-focus-within:opacity-0 group-hover:invisible group-hover:opacity-0"
            alt=""
          />{' '}
          {artist.name}
        </span>
      ));
    return [];
  }, [songAlbumArtists, updateSongInfo]);

  return (
    <div className="tag-input flex min-w-[10rem] max-w-2xl flex-col">
      <label htmlFor="song-album-artists-id3-tag">
        {t('common.albumArtists')}
      </label>
      <div className="mt-2 w-[90%] rounded-xl border-2 border-background-color-2 p-2 dark:border-dark-background-color-2">
        <div className="artists-container flex flex-wrap p-2 empty:py-2 empty:after:h-full empty:after:w-full empty:after:text-center empty:after:text-[#ccc] empty:after:content-['No_artists_selected_for_this_song.'] dark:empty:after:text-[#ccc]">
          {albumArtistComponents}
          {albumArtistComponents.length === 0 &&
            songAlbum &&
            songAlbum?.albumId && (
              <p className="appear-from-bottom ml-2 mb-2 text-sm font-medium flex items-center text-font-color-highlight dark:text-dark-font-color-highlight">
                <span className="material-icons-round-outlined text-xl mr-2">
                  error
                </span>{' '}
                {t('songTagsEditingPage.albumArtistNotMentioned', {
                  title: songAlbum.title,
                  artists: songAlbum.artists?.join(', '),
                })}
              </p>
            )}
          {songAlbumArtists &&
            songAlbumArtists.length > 0 &&
            songAlbum?.artists &&
            !songAlbum.artists.every((artist) =>
              songAlbumArtists.some(
                (albumArtist) => albumArtist.name === artist,
              ),
            ) && (
              <p className="appear-from-bottom ml-2 mt-2 text-sm font-medium flex items-center text-font-color-highlight dark:text-dark-font-color-highlight">
                <span className="material-icons-round-outlined text-xl mr-2">
                  error
                </span>{' '}
                {t('songTagsEditingPage.songAlbumArtistMismatch', {
                  albumTitle: songAlbum.title,
                  albumArtists: songAlbum.artists?.join(', '),
                  songAlbumArtists: songAlbumArtists
                    .map((albumArtist) => albumArtist.name)
                    .join(', '),
                })}
              </p>
            )}
        </div>
        <input
          type="search"
          id="song-album-artists-id3-tag"
          className="mt-4 w-full rounded-xl border-2 border-transparent bg-background-color-2 p-2 transition-colors focus:border-font-color-highlight dark:bg-dark-background-color-2 dark:focus:border-dark-font-color-highlight"
          placeholder={t('songTagsEditingPage.searchForArtists')}
          value={albumArtistKeyword}
          onChange={(e) => {
            const { value } = e.target;
            updateAlbumArtistKeyword(value);
          }}
          onKeyDown={(e) => e.stopPropagation()}
        />
        {artistResults.length > 0 && (
          <div className="artists-results-container mt-4 rounded-xl border-2 border-background-color-2 dark:border-dark-background-color-2 max-h-60 overflow-y-auto">
            {albumArtistResultComponents}
          </div>
        )}
        {albumArtistKeyword.trim() && (
          <Button
            label={t('songTagsEditingPage.addNewArtist', {
              name: albumArtistKeyword,
            })}
            className="mt-4 !w-full !bg-background-color-2 hover:!bg-background-color-3 hover:text-font-color-black dark:!bg-dark-background-color-2 hover:dark:!bg-dark-background-color-3 hover:dark:text-font-color-black"
            clickHandler={() => {
              updateSongInfo((prevData) => {
                const albumArtists =
                  prevData.albumArtists?.filter(
                    (artist) => artist.name !== albumArtistKeyword,
                  ) ?? [];
                if (
                  artistResults.some(
                    (x) =>
                      albumArtistKeyword.toLowerCase() === x.name.toLowerCase(),
                  )
                ) {
                  for (let x = 0; x < artistResults.length; x += 1) {
                    const result = artistResults[x];
                    if (
                      albumArtistKeyword.toLowerCase() ===
                      result.name.toLowerCase()
                    )
                      albumArtists?.push({
                        name: result.name,
                        artistId: result.artistId,
                        artworkPath: result.artworkPath,
                        onlineArtworkPaths: result.onlineArtworkPaths,
                      });
                  }
                } else {
                  albumArtists?.push({
                    name: albumArtistKeyword,
                    artistId: undefined,
                  });
                }
                return {
                  ...prevData,
                  albumArtists,
                };
              });
              updateAlbumArtistKeyword('');
            }}
          />
        )}
      </div>
    </div>
  );
};

export default SongAlbumArtistsInput;
