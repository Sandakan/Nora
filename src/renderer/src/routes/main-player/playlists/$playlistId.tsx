import PlaylistInfoPage from '@renderer/components/PlaylistsInfoPage/PlaylistsInfoPage';
import { baseInfoPageSearchParamsSchema } from '@renderer/utils/zod/baseInfoPageSearchParamsSchema';
import { createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';

export const Route = createFileRoute('/main-player/playlists/$playlistId')({
  validateSearch: zodValidator(baseInfoPageSearchParamsSchema),
  component: RouteComponent
});

function RouteComponent() {
  const { playlistId } = Route.useParams();
  const { scrollTopOffset } = Route.useSearch();

  return <PlaylistInfoPage playlistId={playlistId} scrollTopOffset={scrollTopOffset} />;
}
