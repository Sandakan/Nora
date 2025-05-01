import AlbumInfoPage from '@renderer/components/AlbumInfoPage/AlbumInfoPage';
import { baseInfoPageSearchParamsSchema } from '@renderer/utils/zod/baseInfoPageSearchParamsSchema';
import { createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';

export const Route = createFileRoute('/main-player/albums/$albumId')({
  validateSearch: zodValidator(baseInfoPageSearchParamsSchema),
  component: RouteComponent
});

function RouteComponent() {
  const { albumId } = Route.useParams();
  const { scrollTopOffset } = Route.useSearch();

  return <AlbumInfoPage albumId={albumId} scrollTopOffset={scrollTopOffset} />;
}

