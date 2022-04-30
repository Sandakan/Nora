/* eslint-disable react/no-array-index-key */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/require-default-props */
/* eslint-disable no-underscore-dangle */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/self-closing-comp */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
// import React from 'react';

interface SongCardProp {
  songId: string;
  artworkPath: string;
  path: string;
  title: string;
  artists: string[];
  duration: number;
  palette?: {
    DarkVibrant: {
      _rgb?: any;
      rgb?: any;
    };
    LightVibrant: {
      _rgb?: any;
      rgb?: any;
    };
  };
  playSong: (x: string) => void;
  updateContextMenuData: (
    isVisible: boolean,
    menuItems: ContextMenuItem[],
    pageX?: number,
    pageY?: number
  ) => void;
  currentlyActivePage: { pageTitle: string; data?: any };
  changeCurrentActivePage: (pageTitle: string, data?: any) => void;
}

export const SongCard = (props: SongCardProp) => {
  // console.log(props);
  const [r, g, b] = props.palette
    ? props.palette.LightVibrant._rgb || props.palette.LightVibrant.rgb
    : [47, 49, 55];
  const [fr, fg, fb] = props.palette
    ? props.palette.DarkVibrant._rgb || props.palette.DarkVibrant.rgb
    : [222, 220, 217];

  const background = `linear-gradient(90deg,rgba(${r},${g},${b},1) 0%,rgba(${r},${g},${b},1) 50%,rgba(${r},${g},${b},0.6) 70%,rgba(${r},${g},${b},0) 100%)`;
  const fontColor = `rgba(${fr},${fg},${fb},1)`;
  return (
    <div
      className={`song ${props.songId}`}
      data-song-id={props.songId}
      onContextMenu={(e) => {
        e.preventDefault();
        props.updateContextMenuData(
          true,
          [
            {
              label: 'Play',
              handlerFunction: () => props.playSong(props.songId),
            },
            {
              label: 'Reveal in File Explorer',
              class: 'reveal-file-explorer',
              handlerFunction: () =>
                window.api.revealSongInFileExplorer(props.songId),
            },
          ],
          e.pageX,
          e.pageY
        );
      }}
    >
      <div className="song-cover-container">
        <img
          src={`otoMusic://localFiles/${props.artworkPath}`}
          loading="lazy"
          alt=""
        />
      </div>
      <div
        className="song-info-and-play-btn-container"
        data-song-id={props.songId}
        style={{ background }}
      >
        <div className="song-info-container" style={{ color: fontColor }}>
          <div className="song-title" title={props.title}>
            {props.title}
          </div>
          <div
            className="song-artists"
            title={props.artists.join(', ')}
            data-song-id={props.songId}
          >
            {props.artists.map((artist, index) => (
              <span
                className="artist"
                key={artist}
                onClick={() =>
                  props.currentlyActivePage.pageTitle === 'ArtistInfo' &&
                  props.currentlyActivePage.data.artistName === artist
                    ? props.changeCurrentActivePage('Home')
                    : props.changeCurrentActivePage('ArtistInfo', {
                        artistName: artist,
                      })
                }
              >
                {artist}
                {index === props.artists.length - 1 ? '' : ', '}
              </span>
            ))}
          </div>
        </div>
        <div className="play-btn-container">
          <i
            className="fa-solid fa-circle-play"
            onClick={() => props.playSong(props.songId)}
          ></i>
        </div>
      </div>
    </div>
  );
};
