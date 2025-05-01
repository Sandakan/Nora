import SongInfoPage from '@renderer/components/SongInfoPage/SongInfoPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/main-player/songs/$id')({
  component: RouteComponent
});

function RouteComponent() {
  return <SongInfoPage />;
}

