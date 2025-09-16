import { createFileRoute } from '@tanstack/react-router';
import CurrentQueuePage from '@renderer/components/CurrentQueuePage/CurrentQueuePage';

export const Route = createFileRoute('/main-player/queue/')({
  component: RouteComponent
});

function RouteComponent() {
  return <CurrentQueuePage />;
}
