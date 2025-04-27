import App from '@renderer/App';
import { createRootRoute } from '@tanstack/react-router';

export const Route = createRootRoute({
  component: () => <App />
});
