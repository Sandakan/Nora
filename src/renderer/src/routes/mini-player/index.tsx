import MiniPlayer from '@renderer/components/MiniPlayer/MiniPlayer';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/mini-player/')({
  component: RouteComponent
});

function RouteComponent() {
  return (
    <MiniPlayer
    //   className={`${
    //     isReducedMotion
    //       ? 'reduced-motion animate-none transition-none duration-0! [&.dialog-menu]:backdrop-blur-none!'
    //       : ''
    //   }`}
    />
  );
}

