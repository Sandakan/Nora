import SettingsPage from '@renderer/components/SettingsPage/SettingsPage';
import { queryClient } from '@renderer/index';
import { settingsQuery } from '@renderer/queries/settings';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/main-player/settings/')({
  component: RouteComponent,
  loader: async () => {
    await queryClient.ensureQueryData(settingsQuery.all);
  }
});

function RouteComponent() {
  return <SettingsPage />;
}
