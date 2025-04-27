import Preloader from '@renderer/components/Preloader/Preloader';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: RouteComponent
});

function RouteComponent() {
  return <Preloader />;
}

