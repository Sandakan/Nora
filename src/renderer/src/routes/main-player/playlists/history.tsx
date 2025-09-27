import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/main-player/playlists/history')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/main-player/playlists/history"!</div>
}
