/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/require-default-props */
/* eslint-disable react/self-closing-comp */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
// import React from 'react';

interface MostRelevantResultProp {
  resultType: string;
  title: string;
  id: string;
  infoType1?: any;
  infoType2?: any;
  artworkPath?: string;
  playSong?: (songId: string) => void;
}

export const MostRelevantResult = (props: MostRelevantResultProp) => {
  return (
    <div
      className={`result most-relevant-${props.resultType.toLowerCase()} active`}
    >
      <div className="result-img-container">
        {props.resultType.toLowerCase() !== 'artist' && (
          <i
            title="Play Song"
            className="fa-solid fa-circle-play"
            onClick={() => props.playSong && props.playSong(props.id)}
          ></i>
        )}{' '}
        <img
          src={`otomusic://localFiles/${props.artworkPath}`}
          loading="lazy"
          alt=""
        />
      </div>
      <div className="result-info-container">
        <div className="title">{props.title}</div>
        {props.infoType1 && (
          <div className="info-type-1">{props.infoType1}</div>
        )}
        {props.infoType2 && (
          <div className="info-type-2">{props.infoType2}</div>
        )}
        <div className="result-type">{props.resultType.toUpperCase()}</div>
      </div>
    </div>
  );
};
