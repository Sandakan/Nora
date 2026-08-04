import SongTagsEditingPage from '@renderer/components/SongTagsEditingPage/SongTagsEditingPage';
import { queryClient } from '@renderer/index';
import { songQuery } from '@renderer/queries/songs';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/main-player/songs/$songId/edit')({
  component: SongTagsEditingPageRoute,
  loader: async (route) => {
    const songId = Number(route.params.songId);

    await queryClient.ensureQueryData(songQuery.singleSongInfo({ songId }));
  }
});

function SongTagsEditingPageRoute() {
  const { songId } = Route.useParams({ select: (params) => ({ songId: Number(params.songId) }) });

  return <SongTagsEditingPage routeParams={{ songId }} />;
}
