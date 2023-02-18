/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import DefaultImage from '../../../assets/images/png/song_cover_default.png';

type Props = {
  src?: string;
  fallbackSrc?: string;
  alt?: string;
  noFallbacks?: boolean;
  className?: string;
  onClick?: (_e: React.MouseEvent<HTMLImageElement, MouseEvent>) => void;
  loading?: 'eager' | 'lazy';
  onContextMenu?: (_e: React.MouseEvent<HTMLImageElement, MouseEvent>) => void;
};

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
  } = props;

  return (
    <img
      src={src || fallbackSrc}
      alt={alt}
      className={`${className}`}
      onError={(e) => {
        if (!noFallbacks) e.currentTarget.src = fallbackSrc;
      }}
      onClick={onClick}
      loading={loading}
      onContextMenu={onContextMenu}
    />
  );
};

export default Img;
