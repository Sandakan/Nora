import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/main-player/search/all/artists',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/main-player/search/all-search-results/artists"!</div>
}
