import GenresPage from '@renderer/components/GenresPage/GenresPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/main-player/genres/')({
  component: RouteComponent
});

function RouteComponent() {
  return <GenresPage />;
}

