/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import log from 'renderer/utils/log';
import DefaultImage from '../../../assets/images/webp/song_cover_default.webp';

interface ImgProperties {
  width: number;
  height: number;
  quality: string;
}

type ImgProps = {
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
  draggable?: boolean;
  enableImgFadeIns?: boolean;
};

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

const Img = React.memo((props: ImgProps) => {
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
    draggable = false,
    enableImgFadeIns = true,
  } = props;

  const imgRef = React.useRef<HTMLImageElement>(null);
  const imgPropsRef = React.useRef<ImgProperties>();
  const errorCountRef = React.useRef(0);
  const isFirstTimeRef = React.useRef(true);

  return (
    // <div className="inline-block relative">
    <img
      src={src || fallbackSrc}
      alt={alt}
      ref={imgRef}
      className={`relative outline-1 outline-offset-4 focus-visible:!outline ${
        enableImgFadeIns && isFirstTimeRef.current
          ? 'opacity-0 transition-opacity delay-[250ms]'
          : '!opacity-100 !transition-none'
      } ${className}`}
      draggable={draggable}
      onError={(e) => {
        if (errorCountRef.current < 3) {
          errorCountRef.current += 1;
          if (!noFallbacks && e.currentTarget.src !== fallbackSrc)
            e.currentTarget.src = fallbackSrc;
          else e.currentTarget.src = DefaultImage;
        } else {
          log(
            'maximum img fetch error count reached.',
            { src, fallbackSrc, props: imgPropsRef.current },
            'WARN',
          );
          e.currentTarget.src = DefaultImage;
        }
      }}
      onClick={onClick}
      title={
        showImgPropsOnTooltip && imgPropsRef.current
          ? `Quality : ${imgPropsRef.current.quality}\nImage width : ${imgPropsRef.current?.width}px\nImage height : ${imgPropsRef.current?.height}px`
          : showAltAsTooltipLabel
            ? alt
            : undefined
      }
      loading={loading}
      onContextMenu={onContextMenu}
      onLoad={(e) => {
        if (isFirstTimeRef.current) {
          isFirstTimeRef.current = false;
        }
        e.currentTarget.classList.add('!opacity-100');
        if (showImgPropsOnTooltip) {
          const img = new Image();
          img.onload = () => {
            const width = img?.width;
            const height = img?.height;
            const imgProp: ImgProperties = {
              width,
              height,
              quality:
                width >= 1000 || height >= 1000
                  ? 'HIGH QUALITY'
                  : width >= 500 || height >= 500
                    ? 'MEDIUM QUALITY'
                    : 'LOW QUALITY',
            };
            imgPropsRef.current = imgProp;
            if (imgRef.current !== null && 'dataset' in imgRef.current) {
              const { dataset } = imgRef.current;
              dataset.width = imgProp.width.toString();
              dataset.height = imgProp.height.toString();
              dataset.quality = imgProp.quality;
            }
          };
          img.src = e.currentTarget.src;
        }
      }}
      tabIndex={tabIndex}
    />
    // </div>
  );
});

Img.displayName = 'Img';
export default Img;
