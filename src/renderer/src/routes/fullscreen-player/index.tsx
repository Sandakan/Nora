import FullScreenPlayer from '@renderer/components/FullScreenPlayer/FullScreenPlayer';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/fullscreen-player/')({
  component: RouteComponent
});

function RouteComponent() {
  return <FullScreenPlayer />;
}
