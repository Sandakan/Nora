import SongsPage from '@renderer/components/SongsPage/SongsPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/main-player/songs/')({
  component: RouteComponent
});

function RouteComponent() {
  return <SongsPage />;
}

