/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-console */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import { AppContext, AppUpdateContext } from 'renderer/contexts/AppContext';
import Button from '../Button';
import DefaultArtistCover from '../../../../assets/images/png/default_artist_cover.png';
import DefaultSongArtwork from '../../../../assets/images/png/song_cover_default.png';
import MainContainer from '../MainContainer';

function SongTagsEditingPage() {
  const { currentlyActivePage } = React.useContext(AppContext);
  const { updateNotificationPanelData, changePromptMenuData } =
    React.useContext(AppUpdateContext);

  const [songInfo, setSongInfo] = React.useState({
    title: '',
  } as SongTags);
  const { songId, songArtworkPath } = React.useMemo(
    () => currentlyActivePage.data.songTagsEditor,
    [currentlyActivePage.data.songTagsEditor]
  );
  const defaultValuesRef = React.useRef({} as SongTags);

  React.useEffect(() => {
    if (songId)
      window.api
        .getSongId3Tags(songId)
        .then((res) => {
          if (res) {
            console.log(res);
            const data = {
              ...res,
              title: res.title ?? 'unknown title',
            };
            defaultValuesRef.current = data;
            setSongInfo(data);
          }
          return undefined;
        })
        .catch((err) => console.error(err));
  }, [songId]);

  const [artistKeyword, setArtistKeyword] = React.useState('');
  const [artistsResults, setArtsitsResults] = React.useState(
    [] as {
      artistId?: string;
      name: string;
      artworkPath?: string;
      onlineArtworkPaths?: OnlineArtistArtworks;
    }[]
  );

  const [albumKeyword, setAlbumKeyword] = React.useState('');
  const [albumResults, setAlbumResults] = React.useState(
    [] as {
      title: string;
      albumId?: string;
      noOfSongs?: number;
      artists?: string[];
      artworkPath?: string;
    }[]
  );

  const [genreKeyword, setGenreKeyword] = React.useState('');
  const [genreResults, setGenreResults] = React.useState(
    [] as { genreId?: string; name: string; artworkPath?: string }[]
  );

  React.useEffect(() => {
    if (artistKeyword.trim()) {
      window.api
        .search('Artists', artistKeyword, false)
        .then((res) => {
          console.log(res);
          if (res.artists.length > 0)
            setArtsitsResults(
              res.artists
                .filter((_, index) => index < 5)
                .map((artist) => ({
                  name: artist.name,
                  artistId: artist.artistId,
                  artworkPath: artist.artworkPath,
                  onlineArtworkPaths: artist.onlineArtworkPaths,
                }))
            );
          else setArtsitsResults([]);
          return undefined;
        })
        .catch((err) => console.error(err));
    } else setArtsitsResults([]);
  }, [artistKeyword]);

  React.useEffect(() => {
    if (albumKeyword.trim()) {
      window.api
        .search('Albums', albumKeyword, false)
        .then((res) => {
          console.log(res);
          if (res.albums.length > 0)
            setAlbumResults(
              res.albums
                .filter((_, index) => index < 5)
                .map((album) => ({
                  title: album.title,
                  albumId: album.albumId,
                  noOfSongs: album.songs.length,
                  artworkPath: album.artworkPath,
                }))
            );
          else setAlbumResults([]);
          return undefined;
        })
        .catch((err) => console.error(err));
    } else setAlbumResults([]);
  }, [albumKeyword]);

  React.useEffect(() => {
    if (genreKeyword.trim()) {
      window.api
        .search('Genres', genreKeyword, false)
        .then((res) => {
          console.log(res);
          if (res.genres.length > 0)
            setGenreResults(
              res.genres
                .filter((_, index) => index < 5)
                .map((genre) => ({
                  name: genre.name,
                  genreId: genre.genreId,
                  artworkPath: genre.artworkPath,
                }))
            );
          else setGenreResults([]);
          return undefined;
        })
        .catch((err) => console.error(err));
    } else setGenreResults([]);
  }, [genreKeyword]);

  const fetchSongDataFromNet = React.useCallback(() => {
    if (songInfo.title) {
      window.api
        .fetchSongInfoFromNet(
          songInfo.title,
          songInfo.artists ? songInfo.artists.map((artist) => artist.name) : []
        )
        .then((res) => {
          if (res && res.track) {
            const { name, album, artist, toptags } = res.track;
            console.log(res.track);
            setSongInfo((prevData) => ({ ...prevData, title: name }));
            setArtistKeyword(artist.name);
            if (album) setAlbumKeyword(album.title);
            if (Array.isArray(toptags?.tag) && toptags.tag.length > 0)
              setGenreKeyword(toptags.tag[0].name);
          }
          return undefined;
        })
        .catch((res) => console.error(res));
    }
  }, [songInfo.title, songInfo.artists]);

  /** Returns an object containing the properties of the input objects and and a boolean as a value stating whether those properties have changed or not.
   *@param oldObj Old object to be compared to
   *@param newObj New object to be compared to
   */
  const hasDataChanged = React.useCallback(
    (oldObj: Record<string, any>, newObj: Record<string, any>) => {
      const entries = Object.keys(newObj);
      const comp = {} as Record<string, any>;
      for (let i = 0; i < entries.length; i += 1) {
        const entry = entries[i];
        if (`${entry}` in oldObj) {
          if (typeof newObj[entry] === 'object') {
            // if (Array.isArray(newObj[entry])) {
            //   // todo = arrays are not being handled properly
            //   const dataArr = (newObj[entry] as any[]).map(
            //     (_, index: number) => {
            //       return hasDataChanged(
            //         oldObj[entry][`${index}`],
            //         newObj[entry][`${index}`]
            //       );
            //     }
            //   );
            //   console.log(dataArr);
            // }
            const data = hasDataChanged(oldObj[entry], newObj[entry]);
            comp[entry] = Object.values(data).every((x: boolean) => x);

            // if (Array.isArray(newObj[entry])) {
            // 	comp[entry] = Object.entries(data).map((x) => x[1]);
            // } else comp[entry] = data;
          } else if (newObj[entry] === oldObj[entry]) {
            comp[entry] = true;
          } else comp[entry] = false;
        } else comp[entry] = false;
      }
      return comp;
    },
    []
  );

  return (
    songId &&
    songInfo.title && (
      <MainContainer className="main-container appear-from-bottom id3-tags-updater-container">
        <>
          <div className="title-container mt-1 pr-4 mb-8 text-font-color-black text-3xl font-medium dark:text-font-color-white">
            Editing &apos;{songInfo.title}&apos;
          </div>
          <div className="song-information-container text-font-color-black dark:text-font-color-white flex mb-12 bl-4">
            <div className="song-artwork-container w-40  overflow-hidden relative mr-8">
              <img
                src={
                  songInfo.artworkPath
                    ? `otomusic://localFiles/${songInfo.artworkPath}`
                    : songArtworkPath
                    ? `otomusic://localFiles/${songArtworkPath}`
                    : DefaultSongArtwork
                }
                alt="Song Artwork"
                className="song-artwork w-full object-cover object-center aspect-square rounded-xl"
              />
              <Button
                className="artwork-update-btn absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 !bg-[hsla(0,0%,0%,0.6)] dark:!bg-[hsla(0,0%,0%,0.6)] border-none rounded-full aspect-square transition-[background] hover:!bg-[hsla(0,0%,0%,0.8)] dark:hover:!bg-[hsla(0,0%,0%,0.8)]"
                iconName="edit"
                iconClassName="text-font-color-white dark:text-font-color-white mr-0"
                clickHandler={() =>
                  window.api
                    .getImgFileLocation()
                    .then((res) =>
                      setSongInfo((prevData) => ({
                        ...prevData,
                        artworkPath: res,
                        album: prevData.album
                          ? { ...prevData.album, artworkPath: res }
                          : undefined,
                      }))
                    )
                    .catch((err) => console.error(err))
                }
              />
            </div>
            <div className="song-info-container flex flex-col justify-center w-[70%]">
              <div className="song-title text-4xl mb-2">{songInfo.title}</div>
              <div className="song-artists">
                {songInfo.artists && songInfo.artists.length > 0
                  ? songInfo.artists.map((x) => x.name).join(', ')
                  : 'Unknown Artist'}
              </div>
              <div className="song-album">{songInfo.album?.title}</div>
              <Button
                label="Download Data from LastFM"
                iconName="download"
                iconClassName="mr-2"
                className="download-data-from-lastfm-btn w-fit mt-4"
                clickHandler={fetchSongDataFromNet}
              />
            </div>
          </div>
          <div className="inputs-container flex flex-wrap justify-around text-font-color-black dark:text-font-color-white">
            <div className="tag-input min-w-[10rem] flex flex-col mb-6 w-[45%]">
              <label htmlFor="song-name-id3-tag">Song Name</label>
              <input
                type="text"
                id="song-name-id3-tag"
                className="w-[90%] mt-2 mr-2 py-3 px-4 border-[.15rem] border-background-color-2 dark:border-dark-background-color-2 rounded-3xl bg-background-color-1 dark:bg-dark-background-color-1 text-font-color-black dark:text-font-color-white"
                name="song-name"
                placeholder="Song Name"
                value={songInfo.title}
                onChange={(e) => {
                  const title = e.currentTarget.value;
                  setSongInfo((prevData) => ({ ...prevData, title }));
                }}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
            <div className="tag-input min-w-[10rem] flex flex-col mb-6 w-[45%]">
              <label htmlFor="song-year-id3-tag">Released Year</label>
              <input
                type="number"
                max={4}
                id="song-year-id3-tag"
                className="w-[90%] mt-2 mr-2 py-3 px-4 border-[.15rem] border-background-color-2 dark:border-dark-background-color-2 rounded-3xl bg-background-color-1 dark:bg-dark-background-color-1 text-font-color-black dark:text-font-color-white"
                name="song-year"
                placeholder="Released Year"
                value={songInfo.releasedYear}
                onKeyDown={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const year = e.currentTarget.value;
                  setSongInfo((prevData) => ({ ...prevData, year }));
                }}
              />
            </div>
            {/* ? SONG ARTSITS */}
            <div className="tag-input min-w-[10rem] flex flex-col mb-6 w-[45%]">
              <label htmlFor="song-artists-id3-tag">Song Artists</label>
              <div className="border-2 border-background-color-2 dark:border-dark-background-color-2 w-[90%] rounded-xl p-2 mt-2">
                <div className="artists-container flex flex-wrap p-2 empty:py-2 empty:after:content-['No_artists_for_this_song.'] empty:after:w-full empty:after:h-full empty:after:text-center empty:after:text-[#ccc] dark:empty:after:text-[#ccc]">
                  {songInfo.artists &&
                    songInfo.artists.map((artist) => (
                      <span
                        key={artist.name}
                        className="group w-fit bg-background-color-3 dark:bg-dark-background-color-3 text-font-color-black dark:text-font-color-black px-3 py-1 rounded-2xl text-center flex items-center mr-2 mb-2"
                      >
                        <span
                          className="material-icons-round px-1 mr-2 cursor-pointer !hidden group-hover:!inline-block"
                          onClick={() => {
                            setSongInfo((prevData) => {
                              return {
                                ...prevData,
                                artists: prevData.artists?.filter(
                                  (x) => x.name !== artist.name
                                ),
                              };
                            });
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          close
                        </span>
                        <img
                          src={
                            navigator.onLine && artist.onlineArtworkPaths
                              ? artist.onlineArtworkPaths.picture_small
                              : artist.artworkPath
                              ? `otomusic://localFiles/${artist.artworkPath}`
                              : DefaultArtistCover
                          }
                          className="rounded-full w-6 aspect-square mr-2 group-hover:invisible group-hover:absolute"
                          alt=""
                        />{' '}
                        {artist.name}
                      </span>
                    ))}
                </div>
                <input
                  type="search"
                  className="w-full bg-background-color-2 dark:bg-dark-background-color-2 p-2 rounded-xl mt-4"
                  placeholder="Search for artists here."
                  value={artistKeyword}
                  onChange={(e) => {
                    const { value } = e.target;
                    setArtistKeyword(value);
                  }}
                  onKeyDown={(e) => e.stopPropagation()}
                />
                {artistsResults.length > 0 && (
                  <ol className="artists-results-container mt-4 border-2 border-background-color-2 dark:border-dark-background-color-2 rounded-xl ">
                    {artistsResults.map((x) => (
                      <li
                        key={x.artistId ?? x.name}
                        className="font-light border-b-[1px] border-background-color-2 dark:border-dark-background-color-2 only:border-b-0 last:border-b-0 box-content hover:bg-background-color-2 dark:hover:bg-dark-background-color-2 cursor-pointer px-4 py-2 flex"
                        onClick={() => {
                          setSongInfo((prevData) => {
                            const artists = prevData.artists?.filter(
                              (artist) => artist.name !== x.name
                            );
                            artists?.push({
                              name: x.name,
                              artistId: x.artistId,
                              artworkPath: x.artworkPath,
                              onlineArtworkPaths: x.onlineArtworkPaths,
                            });
                            return {
                              ...prevData,
                              artists,
                            };
                          });
                          setArtistKeyword('');
                        }}
                      >
                        <img
                          src={
                            navigator.onLine && x.onlineArtworkPaths
                              ? x.onlineArtworkPaths.picture_small
                              : x.artworkPath
                              ? `otomusic://localFiles/${x.artworkPath}`
                              : DefaultArtistCover
                          }
                          className="rounded-full w-6 aspect-square mr-4"
                          alt=""
                        />
                        {x.name}
                      </li>
                    ))}
                  </ol>
                )}
                {artistKeyword.trim() && (
                  <Button
                    label={`Add new artist '${artistKeyword}'`}
                    className="!w-full mt-4 !bg-background-color-2 dark:!bg-dark-background-color-2 hover:!bg-background-color-3 hover:dark:!bg-dark-background-color-3 hover:text-font-color-black hover:dark:text-font-color-black"
                    clickHandler={() => {
                      setSongInfo((prevData) => {
                        const artists = prevData.artists?.filter(
                          (artist) => artist.name !== artistKeyword
                        );
                        artists?.push({
                          name: artistKeyword,
                          artistId: undefined,
                        });
                        return {
                          ...prevData,
                          artists,
                        };
                      });
                      setArtistKeyword('');
                    }}
                  />
                )}
              </div>
            </div>
            {/* ALBUM NAME */}
            <div className="tag-input min-w-[10rem] flex flex-col mb-6 w-[45%]">
              <label htmlFor="song-album-name-id3-tag">Album Name</label>
              <div className="border-2 border-background-color-2 dark:border-dark-background-color-2 w-[90%] rounded-xl p-2 mt-2">
                <div className="album-names-container p-2 empty:py-2 empty:after:content-['No_album_for_this_song.'] empty:after:w-full empty:after:block  empty:after:text-center empty:after:text-[#ccc] dark:empty:after:text-[#ccc]">
                  {songInfo.album && (
                    <div
                      key={songInfo.album.title}
                      className="bg-background-color-3 dark:bg-dark-background-color-3 text-font-color-black dark:text-font-color-black pl-2 pr-4 py-1 rounded-lg text-center flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <img
                          src={
                            songInfo.album?.artworkPath
                              ? `otomusic://localFiles/${songInfo.album.artworkPath}`
                              : songInfo.artworkPath
                              ? `otomusic://localFiles/${songInfo.artworkPath}`
                              : songArtworkPath
                              ? `otomusic://localFiles/${songArtworkPath}`
                              : DefaultSongArtwork
                          }
                          className="w-16 aspect-square rounded-lg"
                          alt=""
                        />
                        <div className="ml-4 flex flex-col text-left">
                          <span className="font-medium">
                            {songInfo.album.title}
                          </span>
                          <span className="text-xs">{`${
                            songInfo.album.noOfSongs ?? 0
                          } songs (including current song)`}</span>
                        </div>
                      </div>
                      <span
                        className="material-icons-round mr-2 cursor-pointer float-right"
                        onClick={() => {
                          setSongInfo((prevData) => {
                            return {
                              ...prevData,
                              album: undefined,
                            };
                          });
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        close
                      </span>
                    </div>
                  )}
                </div>
                <input
                  type="search"
                  className="w-full bg-background-color-2 dark:bg-dark-background-color-2 p-2 rounded-xl mt-4"
                  placeholder="Search for albums here."
                  value={albumKeyword}
                  onChange={(e) => {
                    const { value } = e.target;
                    setAlbumKeyword(value);
                  }}
                  onKeyDown={(e) => e.stopPropagation()}
                />
                {albumResults.length > 0 && (
                  <ol className="album-results-container mt-4 border-2 border-background-color-2 dark:border-dark-background-color-2 rounded-xl ">
                    {albumResults.map((x) => (
                      <li
                        key={x.albumId ?? x.title}
                        className="font-light border-b-[1px] border-background-color-2 dark:border-dark-background-color-2 only:border-b-0 last:border-b-0 box-content hover:bg-background-color-2 dark:hover:bg-dark-background-color-2 cursor-pointer pr-4 pl-6 py-2"
                        onClick={() => {
                          setSongInfo((prevData) => {
                            return {
                              ...prevData,
                              album: {
                                title: x.title,
                                albumId: x.albumId,
                                noOfSongs: x.noOfSongs ? x.noOfSongs + 1 : 1,
                                artworkPath: x.artworkPath,
                              },
                            };
                          });
                          setAlbumKeyword('');
                        }}
                      >
                        {x.title}
                      </li>
                    ))}
                  </ol>
                )}
                {albumKeyword.trim() && (
                  <Button
                    label={`Add new album '${albumKeyword}'`}
                    className="!w-full mt-4 !bg-background-color-2 dark:!bg-dark-background-color-2 hover:!bg-background-color-3 hover:dark:!bg-dark-background-color-3 hover:text-font-color-black hover:dark:text-font-color-black"
                    clickHandler={() => {
                      setSongInfo((prevData) => {
                        return {
                          ...prevData,
                          album: {
                            title: albumKeyword,
                            noOfSongs: 1,
                            albumId: undefined,
                          },
                        };
                      });
                      setAlbumKeyword('');
                    }}
                  />
                )}
              </div>
            </div>
            <div className="tag-input min-w-[10rem] flex flex-col mb-6 w-[45%]">
              <label htmlFor="song-genres-id3-tag">Genres</label>
              <div className="border-2 border-background-color-2 dark:border-dark-background-color-2 w-[90%] rounded-xl p-2 mt-2">
                <div className="genres-container flex flex-wrap p-2 empty:py-2 empty:after:content-['No_genres_for_this_song.'] empty:after:w-full empty:after:h-full empty:after:text-center empty:after:text-[#ccc] dark:empty:after:text-[#ccc]">
                  {songInfo.genres &&
                    songInfo.genres.map((genre) => (
                      <span
                        key={genre.name}
                        className="w-fit bg-background-color-3 dark:bg-dark-background-color-3 text-font-color-black dark:text-font-color-black px-3 py-1 rounded-2xl text-center flex items-center mr-2 mb-2"
                        onClick={() => {
                          setSongInfo((prevData) => {
                            return {
                              ...prevData,
                              genres: prevData.genres?.filter(
                                (x) => x.name !== genre.name
                              ),
                            };
                          });
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <span className="material-icons-round mr-2 cursor-pointer">
                          close
                        </span>{' '}
                        {genre.name}
                      </span>
                    ))}
                </div>
                <input
                  type="search"
                  className="w-full bg-background-color-2 dark:bg-dark-background-color-2 p-2 rounded-xl mt-4"
                  placeholder="Search for genres here."
                  value={genreKeyword}
                  onChange={(e) => {
                    const { value } = e.target;
                    setGenreKeyword(value);
                  }}
                  onKeyDown={(e) => e.stopPropagation()}
                />
                {genreResults.length > 0 && (
                  <ol className="genres-results-container mt-4 border-2 border-background-color-2 dark:border-dark-background-color-2 rounded-xl ">
                    {genreResults.map((x) => (
                      <li
                        key={x.genreId ?? x.name}
                        className="font-light border-b-[1px] border-background-color-2 dark:border-dark-background-color-2 only:border-b-0 last:border-b-0 box-content hover:bg-background-color-2 dark:hover:bg-dark-background-color-2 cursor-pointer pr-4 pl-6 py-2"
                        onClick={() => {
                          setSongInfo((prevData) => {
                            const genres = prevData.genres?.filter(
                              (genre) => genre.name !== x.name
                            );
                            genres?.push({ name: x.name, genreId: x.genreId });
                            return {
                              ...prevData,
                              genres,
                            };
                          });
                          setGenreKeyword('');
                        }}
                      >
                        {x.name}
                      </li>
                    ))}
                  </ol>
                )}
                {genreKeyword.trim() && (
                  <Button
                    label={`Add new genre '${genreKeyword}'`}
                    className="!w-full mt-4 !bg-background-color-2 dark:!bg-dark-background-color-2 hover:!bg-background-color-3 hover:dark:!bg-dark-background-color-3 hover:text-font-color-black hover:dark:text-font-color-black"
                    clickHandler={() => {
                      setSongInfo((prevData) => {
                        const genres = prevData.genres?.filter(
                          (genre) => genre.name !== genreKeyword
                        );
                        genres?.push({
                          name: genreKeyword,
                          genreId: undefined,
                        });
                        return {
                          ...prevData,
                          genres,
                        };
                      });
                      setGenreKeyword('');
                    }}
                  />
                )}
              </div>
            </div>
            <div className="tag-input min-w-[10rem] flex flex-col mb-6 w-[45%]">
              <label htmlFor="song-composer-id3-tag">Composer</label>
              <input
                type="text"
                id="song-composer-id3-tag"
                className="w-[90%] mt-2 mr-2 py-3 px-4 border-[.15rem] border-background-color-2 dark:border-dark-background-color-2 rounded-3xl bg-background-color-1 dark:bg-dark-background-color-1 text-font-color-black dark:text-font-color-white"
                name="song-composer"
                placeholder="Composer"
                value={songInfo.composer}
                onKeyDown={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const composer = e.currentTarget.value;
                  setSongInfo((prevData) => ({ ...prevData, composer }));
                }}
              />
            </div>
            <div className="horizontal-rule w-[95%] h-[0.1rem] bg-background-color-2 dark:bg-dark-background-color-2 my-8" />
            <div className="song-lyrics-editor-container w-[95%] flex items-center justify-between">
              <div className="tag-input min-w-[10rem] flex flex-col mb-6 w-[65%] h-full">
                <label htmlFor="song-lyrics-id3-tag">Lyrics</label>
                <textarea
                  id="song-lyrics-id3-tag"
                  className="min-h-[12rem] max-h-80 bg-background-color-1 dark:bg-dark-background-color-1 border-[0.15rem] border-background-color-2 dark:border-dark-background-color-2 rounded-2xl p-4 mt-4"
                  name="lyrics"
                  placeholder="Lyrics"
                  value={songInfo.lyrics ?? ''}
                  onKeyDown={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const lyrics = e.currentTarget.value;
                    setSongInfo((prevData) => ({
                      ...prevData,
                      lyrics,
                    }));
                  }}
                />
              </div>
              <div className="song-lyrics-buttons flex h-full flex-wrap flex-row items-start justify-center py-8 w-1/3">
                <Button
                  label="Download Lyrics"
                  iconName="download"
                  iconClassName="mr-2"
                  className="download-lyrics-btn"
                  clickHandler={() => {
                    window.api
                      .fetchSongLyricsFromNet(
                        songInfo.title,
                        songInfo.artists?.map((artist) => artist.name)
                      )
                      .then((res) => {
                        if (res)
                          setSongInfo((prevData) => ({
                            ...prevData,
                            lyrics: res.lyrics,
                          }));
                        return undefined;
                      })
                      .catch((err) => console.error(err));
                  }}
                />
              </div>
            </div>
          </div>
          <div className="id3-control-buttons-container p-4 flex">
            <Button
              label="Save Tags"
              iconName="done"
              className="update-song-tags-btn w-40 justify-around !bg-background-color-3 dark:!bg-dark-background-color-3 text-font-color-black dark:text-font-color-black"
              clickHandler={() => {
                console.log(songInfo);
                window.api
                  .updateSongId3Tags(songId, songInfo)
                  .then((res) => {
                    console.log(
                      'successfully updated the song.',
                      `result : ${res}`
                    );
                    return updateNotificationPanelData(
                      5000,
                      <span>Successfully updated the song.</span>,
                      <span className="material-icons-round icon">done</span>
                    );
                  })
                  .catch((err) => console.error(err));
              }}
            />
            <Button
              label="Reset to Defaults"
              iconName="restart_alt"
              className="update-song-tags-btn w-52 justify-around"
              clickHandler={() => {
                const data = hasDataChanged(defaultValuesRef.current, songInfo);
                const entries = Object.entries(data);
                if (!Object.values(data).every((x: boolean) => x)) {
                  changePromptMenuData(
                    true,
                    <div>
                      <div className="title-container mt-1 pr-4 flex items-center mb-8 text-font-color-black text-3xl font-medium dark:text-font-color-white">
                        Confrim Before Resetting Song Data to Default
                      </div>
                      <div className="description">
                        Are you sure you want to reset the song data. You will
                        lose the data you edited on this screen.
                      </div>
                      <div className="pl-4 mt-4">
                        {entries
                          .filter((x) => !x[1])
                          .map(([x]) => (
                            <div>
                              {x.toUpperCase()} :
                              <span className="ml-2 text-foreground-color-1 font-medium">
                                CHANGED
                              </span>
                            </div>
                          ))}
                      </div>
                      <div className="flex justify-end mt-6">
                        <Button
                          label="Cancel"
                          className="w-32"
                          clickHandler={() => changePromptMenuData(false)}
                        />
                        <Button
                          label="Reset to Default"
                          className="!bg-background-color-3 dark:!bg-dark-background-color-3 text-font-color-black dark:text-font-color-black rounded-md w-[12rem] hover:border-background-color-3 dark:hover:border-background-color-3"
                          clickHandler={() => {
                            changePromptMenuData(false);
                            setSongInfo(defaultValuesRef.current);
                            setAlbumKeyword('');
                            setAlbumResults([]);
                            setArtistKeyword('');
                            setArtsitsResults([]);
                            setGenreKeyword('');
                            setGenreResults([]);
                          }}
                        />
                      </div>
                    </div>
                  );
                } else {
                  updateNotificationPanelData(
                    5000,
                    <span>You didn't change any song data.</span>
                  );
                }
              }}
            />
          </div>
        </>
      </MainContainer>
    )
  );
}

export default SongTagsEditingPage;
