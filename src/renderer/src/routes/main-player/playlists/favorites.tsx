import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/main-player/playlists/favorites')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/main-player/playlists/favorites"!</div>
}
