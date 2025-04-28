import PlaylistsPage from '@renderer/components/PlaylistsPage/PlaylistsPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/main-player/playlists/')({
  component: RouteComponent
});

function RouteComponent() {
  return <PlaylistsPage />;
}

