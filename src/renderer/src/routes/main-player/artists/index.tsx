import ArtistPage from '@renderer/components/ArtistPage/ArtistPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/main-player/artists/')({
  component: RouteComponent
});

function RouteComponent() {
  return <ArtistPage />;
}

