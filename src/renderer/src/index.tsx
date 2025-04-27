import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Link, RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import App from './App';
import './i18n';

// Import the generated route tree
import { routeTree } from './routeTree.gen';

// Create a new router instance
export const queryClient = new QueryClient();
// Create a new router instance
export const router = createRouter({
  routeTree,
  notFoundMode: 'root',
  scrollRestoration: true,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  defaultPendingMs: 1000, // Show pending component if loader exceeds 1 second
  defaultPendingMinMs: 500, // Ensure pending component is shown for at least 500ms
  // hydrate: (dehydrated) => {
  //   hydrate(queryClient, dehydrated.queryClientState);
  // },
  // dehydrate: () => {
  //   return { dehydratedState: dehydrate(queryClient) };
  // },
  defaultPendingComponent: () => {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <span className="border-primary-button-background-color h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"></span>
      </div>
    );
  },
  defaultNotFoundComponent: () => {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <h1 className="text-3xl font-semibold">404 Not Found</h1>
        <Link
          to="/main-player/home"
          className="btn btn-primary bg-primary-button-background-color mt-4 rounded-md px-4 py-2"
        >
          Home
        </Link>
      </div>
    );
  }
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);

root.render(
  <StrictMode>
    {/* <App /> */}
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);
