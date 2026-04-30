import Img from '@renderer/components/Img';
import NavLink from '@renderer/components/NavLink';
import { AppUpdateContext } from '@renderer/contexts/AppUpdateContext';
import { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface SpecialPlaylistCardProps {
  playlistId: number;
  label: string;
  artworkPath: string;
  to: string;
  className?: string;
}

export default function SpecialPlaylistCard({
  playlistId,
  label,
  artworkPath,
  to,
  className = ''
}: SpecialPlaylistCardProps) {
  const { updateContextMenuData } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const contextMenus: ContextMenuItem[] = useMemo(
    () => [
      {
        label: t('playlist.exportPlaylist'),
        iconName: 'upload',
        handlerFunction: () => window.api.playlistsData.exportPlaylist(playlistId)
      }
    ],
    [playlistId, t]
  );

  const contextMenuItemData: ContextMenuAdditionalData = useMemo(
    () => ({
      title: label,
      artworkPath
    }),
    [label, artworkPath]
  );

  return (
    <NavLink
      to={to}
      className={`bg-background-color-2/70 hover:bg-background-color-2! dark:bg-dark-background-color-2/70 dark:hover:bg-dark-background-color-2! text-font-color dark:text-dark-font-color flex h-24 min-w-60 items-center gap-4 rounded-xl px-4 py-4 ${className}`}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        updateContextMenuData(true, contextMenus, e.pageX, e.pageY, contextMenuItemData);
      }}
    >
      <Img src={artworkPath} className="aspect-square h-full w-auto rounded-lg" />
      <span className="text-xl">{label}</span>
    </NavLink>
  );
}
