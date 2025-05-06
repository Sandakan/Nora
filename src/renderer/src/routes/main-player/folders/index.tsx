import MusicFoldersPage from '@renderer/components/MusicFoldersPage/MusicFoldersPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/main-player/folders/')({
  component: RouteComponent
});

function RouteComponent() {
  return <MusicFoldersPage />;
}
