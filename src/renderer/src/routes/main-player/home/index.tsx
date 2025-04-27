import HomePage from '@renderer/components/HomePage/HomePage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/main-player/home/')({
  component: RouteComponent
});

function RouteComponent() {
  return <HomePage />;
}

