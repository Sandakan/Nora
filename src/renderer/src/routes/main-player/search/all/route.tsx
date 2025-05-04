import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/main-player/search/all')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/main-player/search/all"!</div>
}
