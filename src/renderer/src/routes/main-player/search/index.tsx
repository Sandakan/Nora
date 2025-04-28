import SearchPage from '@renderer/components/SearchPage/SearchPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/main-player/search/')({
  component: RouteComponent
});

function RouteComponent() {
  return <SearchPage />;
}

