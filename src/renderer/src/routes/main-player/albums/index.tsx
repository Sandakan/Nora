import AlbumsPage from '@renderer/components/AlbumsPage/AlbumsPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/main-player/albums/')({
  component: RouteComponent
});

function RouteComponent() {
  return <AlbumsPage />;
}

