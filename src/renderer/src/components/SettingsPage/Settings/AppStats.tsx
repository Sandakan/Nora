import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { valueRounder } from '../../../utils/valueRounder';
import { useQuery } from '@tanstack/react-query';
import { otherQuery } from '@renderer/queries/other';
import SuspenseLoader from '@renderer/components/SuspenseLoader';

const AppStats = () => {
  const { t } = useTranslation();

  const { data: stats, isLoading } = useQuery(otherQuery.databaseMetrics);
  const statComponents = useMemo(
    () =>
      stats
        ? Object.entries(stats).map(([key, value]) => {
            const statKey = key as keyof typeof stats;
            let keyName;

            switch (statKey) {
              case 'songCount':
                keyName = t(`common.song`, { count: value });
                break;
              case 'artistCount':
                keyName = t(`common.artist`, { count: value });
                break;
              case 'albumCount':
                keyName = t(`common.album`, { count: value });
                break;
              case 'playlistCount':
                keyName = t(`common.playlist`, { count: value });
                break;
              case 'genreCount':
                keyName = t(`common.genre`, { count: value });
                break;

              default:
                break;
            }

            return (
              <span
                className="border-background-color-2 dark:border-dark-background-color-2 flex flex-col items-center border-[3px] border-t-0 border-r-0 border-b-0 py-4 text-lg first:border-l-0"
                title={`${value} ${statKey}`}
                key={`${value}-${statKey}`}
              >
                <span className="text-font-color-highlight dark:text-dark-font-color-highlight text-xl font-medium">
                  {valueRounder(value)}
                </span>
                <span className="lowercase opacity-75">{keyName}</span>
              </span>
            );
          })
        : undefined,
    [stats, t]
  );

  return isLoading ? (
    <SuspenseLoader />
  ) : (
    <div className="border-background-color-2 dark:border-dark-background-color-2 mx-auto my-8 grid max-w-4xl grid-cols-5 rounded-lg border-[3px]">
      {statComponents}
    </div>
  );
};

export default AppStats;
