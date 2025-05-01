import ArtistInfoPage from '@renderer/components/ArtistInfoPage/ArtistInfoPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/main-player/artists/$artistId')({
  component: RouteComponent
});

function RouteComponent() {
  const { artistId } = Route.useParams();

  return <ArtistInfoPage artistId={artistId} />;
}

