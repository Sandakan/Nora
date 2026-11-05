import DisplayModePlayer from '@renderer/components/DisplayModePlayer/DisplayModePlayer';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/display-player/')({
  component: DisplayModePlayer
});
