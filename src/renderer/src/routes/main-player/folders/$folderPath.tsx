import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/main-player/folders/$folderPath')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/main-player/folders/$folderPath"!</div>
}
