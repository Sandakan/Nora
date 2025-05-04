import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/main-player/search/all/albums',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/main-player/search/all-search-results/albums"!</div>
}
