import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/main-player/genres/$genreId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/main-player/genres/$genreId"!</div>
}
