import Preloader from '@renderer/components/Preloader/Preloader';
import { createFileRoute, Navigate } from '@tanstack/react-router';
import { queryClient, router } from '..';
import { settingsQuery } from '@renderer/queries/settings';

export const Route = createFileRoute('/')({
  component: RouteComponent,
  pendingComponent: () => <Preloader />,
  loader: async () => {
    await Promise.all([
      queryClient.ensureQueryData(settingsQuery.all),
      router.preloadRoute({ to: '/main-player/home' })
    ]);
  },
  // override pendingMs to 0 to show preloader immediately
  pendingMs: 0,
  // ensure preloader shows for at least 1000ms
  pendingMinMs: 1000
});

function RouteComponent() {
  return <Navigate to="/main-player/home" />;
}
