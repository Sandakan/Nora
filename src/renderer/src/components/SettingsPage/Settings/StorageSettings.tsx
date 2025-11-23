import { useMemo, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../Button';
import calculateElapsedTime from '../../../utils/calculateElapsedTime';
import parseByteSizes from '../../../utils/parseByteSizes';
import { useQuery } from '@tanstack/react-query';
import { settingsQuery } from '@renderer/queries/settings';
import CollapsibleSection from "./CollapsibleSection";

const StorageSettings = () => {
  const { t } = useTranslation();

  const {
    data: storageMetrics,
    isFetching,
    isError,
    refetch: refetchStorageMetrics
  } = useQuery(settingsQuery.storageMetrics);

  const appStorageBarWidths = useMemo(() => {
    if (storageMetrics) {
      const { appDataSizes, totalSize, appFolderSize, rootSizes } = storageMetrics;
      const {
        // appDataSize,
        artworkCacheSize,
        tempArtworkCacheSize,
        // totalArtworkCacheSize,
        logSize,
        databaseSize
        // totalKnownItemsSize,
        // otherSize,
      } = appDataSizes;
      return {
        artworkCacheSizeWidth: (artworkCacheSize / rootSizes.size) * 100,
        tempArtworkCacheSizeWidth: (tempArtworkCacheSize / rootSizes.size) * 100,
        logSizeWidth: (logSize / rootSizes.size) * 100,
        databaseSizeWidth: (databaseSize / rootSizes.size) * 100,
        appFolderSizeWidth: (appFolderSize / rootSizes.size) * 100,
        otherApplicationSizesWidth:
          ((rootSizes.size - rootSizes.freeSpace - totalSize) / rootSizes.size) * 100
      };
    }
    return undefined;
  }, [storageMetrics]);

  const appStorageBarCssProperties: CSSProperties = {};

  appStorageBarCssProperties['--other-applications-size-storage-bar-width'] =
    `${appStorageBarWidths?.otherApplicationSizesWidth || 0}%`;
  appStorageBarCssProperties['--app-folder-size-storage-bar-width'] = `${
    appStorageBarWidths?.appFolderSizeWidth || 0
  }%`;
  appStorageBarCssProperties['--artwork-cache-size-storage-bar-width'] = `${
    appStorageBarWidths?.artworkCacheSizeWidth || 0
  }%`;
  appStorageBarCssProperties['--temp-artwork-cache-size-storage-bar-width'] =
    `${appStorageBarWidths?.tempArtworkCacheSizeWidth || 0}%`;
  appStorageBarCssProperties['--database-size-storage-bar-width'] = `${
    appStorageBarWidths?.databaseSizeWidth || 0
  }%`;
  appStorageBarCssProperties['--log-size-storage-bar-width'] = `${
    appStorageBarWidths?.logSizeWidth || 0
  }%`;

  return (
    <li className="main-container storage-settings-container mb-4" id="storage-settings-container">
    <CollapsibleSection
      defaultOpen={false}
      title={
      <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight flex items-center text-2xl font-medium">
        <span className="material-icons-round-outlined mr-2">hard_drive</span>
        {t('settingsPage.storage')}
      </div>
      }
    >
      <p>{t('settingsPage.storageDescription')}</p>

      {storageMetrics && (
        <div>
          <div className="mx-auto mt-6 w-4/5">
            <div className="flex items-center justify-between text-sm uppercase opacity-50">
              <span> {t('settingsPage.fullStorageSpace')}</span>{' '}
              <span>
                {t('settingsPage.fullStorageOutOfUsage', {
                  value: parseByteSizes(storageMetrics?.totalSize)?.size,
                  total: parseByteSizes(storageMetrics?.rootSizes.size)?.size
                })}
              </span>
            </div>

            <div
              className="bg-background-color-2 dark:bg-dark-background-color-2/75 mt-2 flex h-4 overflow-hidden rounded-md"
              style={appStorageBarCssProperties}
              title={t('settingsPage.freeSpace')}
            >
              <div
                className="h-full! w-[var(--other-applications-size-storage-bar-width)] cursor-pointer bg-[#ffbe76] opacity-75 transition-opacity hover:opacity-100"
                title={t('settingsPage.otherApplications')}
              />
              <div
                className="h-full! w-[var(--artwork-cache-size-storage-bar-width)] cursor-pointer bg-[#55efc4] opacity-75 transition-opacity hover:opacity-100"
                title={t('settingsPage.artworkCache')}
              />
              <div
                className="h-full! w-[var(--temp-artwork-cache-size-storage-bar-width)] cursor-pointer bg-[#00b894] opacity-75 transition-opacity hover:opacity-100"
                title={t('settingsPage.tempArtworkCache')}
              />
              <div
                className="h-full! w-[var(--database-size-storage-bar-width)] cursor-pointer bg-[#00cec9] opacity-75 transition-opacity hover:opacity-100"
                title={t('settingsPage.databaseData')}
              />
              <div
                className="h-full! w-[var(--log-size-storage-bar-width)] cursor-pointer bg-[#e84393] opacity-75 transition-opacity hover:opacity-100"
                title={t('settingsPage.appLogs')}
              />
              <div
                className="h-full! w-[var(--app-folder-size-storage-bar-width)] cursor-pointer bg-[#4834d4] opacity-75 transition-opacity hover:opacity-100"
                title={t('settingsPage.internalAppFiles')}
              />
            </div>
          </div>

          <ul className="mt-10 flex flex-wrap items-center justify-center px-8">
            <li className="mr-8 mb-4 flex items-center">
              <div className="mr-4 h-4 w-4 rounded-full bg-[#ffbe76]" />
              {t('settingsPage.otherAppFiles')} :{' '}
              <span className="text-font-color-highlight dark:text-dark-font-color-highlight ml-2">
                {
                  parseByteSizes(
                    storageMetrics.rootSizes.size -
                      storageMetrics.rootSizes.freeSpace -
                      storageMetrics.totalSize
                  )?.size
                }
              </span>
            </li>
            <li className="mr-8 mb-4 flex items-center">
              <div className="mr-4 h-4 w-4 rounded-full bg-[#4834d4]" />
              {t('settingsPage.internalAppFiles')} :{' '}
              <span className="text-font-color-highlight dark:text-dark-font-color-highlight ml-2">
                {parseByteSizes(storageMetrics?.appFolderSize)?.size}
              </span>
            </li>
            <li className="mr-8 mb-4 flex items-center">
              <div className="mr-4 h-4 w-4 rounded-full bg-[#55efc4]" />
              {t('settingsPage.artworkCache')} :{' '}
              <span className="text-font-color-highlight dark:text-dark-font-color-highlight ml-2">
                {parseByteSizes(storageMetrics?.appDataSizes.artworkCacheSize)?.size}
              </span>
            </li>
            <li className="mr-8 mb-4 flex items-center">
              <div className="mr-4 h-4 w-4 rounded-full bg-[#00b894]" />
              {t('settingsPage.tempArtworkCache')} :{' '}
              <span className="text-font-color-highlight dark:text-dark-font-color-highlight ml-2">
                {parseByteSizes(storageMetrics?.appDataSizes.tempArtworkCacheSize)?.size}
              </span>
            </li>
            <li className="mr-8 mb-4 flex items-center">
              <div className="mr-4 h-4 w-4 rounded-full bg-[#00cec9]" />
              {t('settingsPage.databaseData')}{' '}
              <span className="text-font-color-highlight dark:text-dark-font-color-highlight ml-2">
                {parseByteSizes(storageMetrics?.appDataSizes.databaseSize)?.size}
              </span>
            </li>
            <li className="mr-8 mb-4 flex items-center">
              <div className="mr-4 h-4 w-4 rounded-full bg-[#e84393]" />
              {t('settingsPage.appLogs')}{' '}
              <span className="text-font-color-highlight dark:text-dark-font-color-highlight ml-2">
                {parseByteSizes(storageMetrics?.appDataSizes.logSize)?.size}
              </span>
            </li>
          </ul>

          <div className="group flex items-center justify-center py-4 text-xs uppercase opacity-50">
            <span title={`Generated on ${storageMetrics.generatedDate}.`}>
              {t('settingsPage.generated')}{' '}
              <span>{calculateElapsedTime(storageMetrics.generatedDate)?.elapsedString}</span>
            </span>
            <span className="mx-2">&bull;</span>
            <Button
              pendingAnimationOnDisabled
              isDisabled={isFetching}
              className="m-0! rounded-none! border-0! p-0! text-xs! uppercase outline-offset-2 hover:underline focus-visible:outline!"
              label={t('settingsPage.generateStorageMetricsAgain')}
              clickHandler={(_, setIsDisabled, setIsPending) => {
                setIsDisabled(true);
                setIsPending(true);
                refetchStorageMetrics()
                  .finally(() => {
                    setIsDisabled(false);
                    setIsPending(false);
                  })
                  .catch((err) => console.error(err));
              }}
            />
          </div>
        </div>
      )}

      {storageMetrics === undefined && (
        <div className="flex flex-col items-center justify-center pt-12">
          <span className="material-icons-round-outlined mr-2 text-4xl opacity-50">hard_drive</span>
          <p className="mt-4 opacity-50">{t('settingsPage.generateStorageMetricsAgain')}</p>
          <p className="mt-1 px-8 text-center text-sm font-light opacity-50">
            {t('settingsPage.storageMetricsGenerationDisclaimer')}
          </p>
          <Button
            isDisabled={isFetching}
            pendingAnimationOnDisabled
            className="mt-4 mr-0!"
            label={t('settingsPage.generateStorageMetrics')}
            iconName="hourglass_empty"
            clickHandler={(_, setIsDisabled, setIsPending) => {
              setIsDisabled(true);
              setIsPending(true);
              refetchStorageMetrics()
                .finally(() => {
                  setIsDisabled(false);
                  setIsPending(false);
                })
                .catch((err) => console.error(err));
            }}
          />
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center pt-12 opacity-50">
          <span className="material-icons-round text-4xl">running_with_errors</span>
          <p className="mt-4">{t('settingsPage.storageMetricsGenerationError')}</p>
          <Button
            isDisabled={isFetching}
            pendingAnimationOnDisabled
            className="mt-4 mr-0! rounded-none! border-0! p-0! text-xs! uppercase outline-offset-2 hover:underline focus-visible:outline!"
            label={t('settingsPage.generateStorageMetricsAgain')}
            clickHandler={(_, setIsDisabled, setIsPending) => {
              setIsDisabled(true);
              setIsPending(true);
              refetchStorageMetrics()
                .finally(() => {
                  setIsDisabled(false);
                  setIsPending(false);
                })
                .catch((err) => console.error(err));
            }}
          />
        </div>
      )}
    </CollapsibleSection>
    </li>
  );
};

export default StorageSettings;
