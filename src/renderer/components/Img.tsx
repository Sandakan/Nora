/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import DefaultImage from '../../../assets/images/webp/song_cover_default.webp';

type Props = {
  src?: string;
  fallbackSrc?: string;
  alt?: string;
  noFallbacks?: boolean;
  className?: string;
  onClick?: (_e: React.MouseEvent<HTMLImageElement, MouseEvent>) => void;
  loading?: 'eager' | 'lazy';
  onContextMenu?: (_e: React.MouseEvent<HTMLImageElement, MouseEvent>) => void;
  showImgPropsOnTooltip?: boolean;
  tabIndex?: number;
  showAltAsTooltipLabel?: boolean;
};

interface ImgProps {
  width: number;
  height: number;
}

/* <picture
  className={`outline-1 outline-offset-4 focus-visible:!outline ${className}`}
  tabIndex={tabIndex}
>
  <source srcSet={src} />
  {fallbackSrc && <source srcSet={fallbackSrc} />}
  <img
    onContextMenu={onContextMenu}
    onClick={onClick}
    src={DefaultImage}
    alt="Default placeholder artwork"
    loading={loading}
    className={className}
    onLoad={(e) => {
      if (showImgPropsOnTooltip) {
        const img = new Image();
        img.onload = () => {
          if (img?.width && img?.height)
            imgPropsRef.current = {
              width: img.width,
              height: img.height,
            };
        };
        img.src = e.currentTarget.src;
      }
    }}
    title={
      showImgPropsOnTooltip && imgPropsRef.current
        ? `Quality : ${
            imgPropsRef.current?.width >= 1000 ||
            imgPropsRef.current?.height >= 1000
              ? 'HIGH QUALITY'
              : imgPropsRef.current?.width >= 500 ||
                imgPropsRef.current?.height >= 500
              ? 'MEDIUM QUALITY'
              : 'LOW QUALITY'
          }\nImage width : ${imgPropsRef.current?.width}px\nImage height : ${
            imgPropsRef.current?.height
          }px`
        : showAltAsTooltipLabel
        ? alt
        : undefined
    }
  />
</picture>; */

const Img = (props: Props) => {
  const {
    src,
    alt = '',
    className,
    fallbackSrc = DefaultImage,
    noFallbacks = false,
    onClick = () => true,
    loading = 'eager',
    onContextMenu,
    showImgPropsOnTooltip = false,
    tabIndex = -1,
    showAltAsTooltipLabel = false,
  } = props;

  const imgPropsRef = React.useRef<ImgProps>();

  return (
    <img
      src={src || fallbackSrc}
      alt={alt}
      className={`outline-1 outline-offset-4 focus-visible:!outline ${className}`}
      onError={(e) => {
        if (!noFallbacks && e.currentTarget.src !== fallbackSrc)
          e.currentTarget.src = fallbackSrc;
        else e.currentTarget.src = DefaultImage;
      }}
      onClick={onClick}
      title={
        showImgPropsOnTooltip && imgPropsRef.current
          ? `Quality : ${
              imgPropsRef.current?.width >= 1000 ||
              imgPropsRef.current?.height >= 1000
                ? 'HIGH QUALITY'
                : imgPropsRef.current?.width >= 500 ||
                  imgPropsRef.current?.height >= 500
                ? 'MEDIUM QUALITY'
                : 'LOW QUALITY'
            }\nImage width : ${imgPropsRef.current?.width}px\nImage height : ${
              imgPropsRef.current?.height
            }px`
          : showAltAsTooltipLabel
          ? alt
          : undefined
      }
      loading={loading}
      onContextMenu={onContextMenu}
      onLoad={(e) => {
        if (showImgPropsOnTooltip) {
          const img = new Image();
          img.onload = () => {
            imgPropsRef.current = {
              width: img?.width,
              height: img?.height,
            };
          };
          img.src = e.currentTarget.src;
        }
      }}
      tabIndex={tabIndex}
    />
  );
};

export default Img;
