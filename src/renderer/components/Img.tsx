import DefaultImage from '../../../assets/images/png/song_cover_default.png';

type Props = {
  src?: string;
  fallbackSrc?: string;
  alt?: string;
  noFallbacks?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => void;
  loading?: 'eager' | 'lazy';
  onContextMenu?: (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => void;
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
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
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
