import { type CSSProperties, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import NavLink from '../NavLink';
import { useNavigate } from '@tanstack/react-router';

interface SongArtistProp {
  artistId: number;
  name: string;
  isFromKnownSource?: boolean;
  className?: string;
  style?: CSSProperties;
}

function SongArtist(props: SongArtistProp) {
  const { updateContextMenuData } = useContext(AppUpdateContext);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { artistId, name, className = '', isFromKnownSource = true, style } = props;

  const showArtistInfoPage = useCallback(
    () =>
      navigate({ to: '/main-player/artists/$artistId', params: { artistId: String(artistId) } }),
    [artistId, navigate]
  );

  return (
    <NavLink
      to="/main-player/artists/$artistId"
      params={{ artistId: String(artistId) }}
      className={`text-xs font-normal -outline-offset-1 focus-visible:outline! ${
        isFromKnownSource && 'hover:underline'
      } ${className}`}
      disabled={!isFromKnownSource}
      key={artistId}
      title={name}
      style={style}
      onContextMenu={(e) => {
        e.stopPropagation();
        if (isFromKnownSource) {
          updateContextMenuData(
            true,
            [
              {
                label: t('common.info'),
                iconName: 'info',
                handlerFunction: () => showArtistInfoPage()
              }
            ],
            e.pageX,
            e.pageY
          );
        }
      }}
    >
      {name}
    </NavLink>
  );
}

export default SongArtist;
