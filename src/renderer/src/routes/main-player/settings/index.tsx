import SettingsPage from '@renderer/components/SettingsPage/SettingsPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/main-player/settings/')({
  component: RouteComponent
});

function RouteComponent() {
  return <SettingsPage />;
}
