import { queryClient } from '@renderer/index';
import { recommendationQuery } from '@renderer/queries/recommendations';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Button from '../Button';
import SongAdditionalInfoItem from './SongAdditionalInfoItem';

type Props = {
  songId: number;
};

const SongAcousticInfoContainer = ({ songId }: Props) => {
  const { t } = useTranslation();
  const [isDataVisible, setIsDataVisible] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: features, isLoading } = useQuery({
    ...recommendationQuery.songFeatures({ songId }),
    enabled: isDataVisible
  });

  const handleAnalyze = async () => {
    try {
      setIsAnalyzing(true);
      await window.api.recommendations.analyzeSong(songId);
      await queryClient.invalidateQueries({
        queryKey: recommendationQuery.songFeatures({ songId }).queryKey
      });
    } catch (err) {
      console.error('Failed to analyze song audio features:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatBrightness = (centroid: number | null): string => {
    if (centroid === null || centroid === undefined) return '—';
    const hz = Math.round(centroid);
    if (hz > 3000) return `${hz} Hz (${t('songInfoPage.brightnessBright', 'Bright & Shimmering')})`;
    if (hz > 1800) return `${hz} Hz (${t('songInfoPage.brightnessBalanced', 'Balanced & Warm')})`;
    return `${hz} Hz (${t('songInfoPage.brightnessWarm', 'Deep & Bass-heavy')})`;
  };

  const formatPulseClarity = (pulse: number | null): string => {
    if (pulse === null || pulse === undefined) return '—';
    const pct = Math.round(pulse * 100);
    let desc = t('songInfoPage.pulseSoft', 'Soft rhythm');
    if (pulse >= 0.7) desc = t('songInfoPage.pulseStrong', 'Strong groove');
    else if (pulse >= 0.4) desc = t('songInfoPage.pulseModerate', 'Moderate pulse');
    return `${pct}% (${desc})`;
  };

  const formatDynamicRange = (crest: number | null): string => {
    if (crest === null || crest === undefined) return '—';
    const val = crest.toFixed(1);
    let desc = t('songInfoPage.dynamicsCompressed', 'Compressed / Loud');
    if (crest > 8) desc = t('songInfoPage.dynamicsHigh', 'Wide dynamic range');
    else if (crest > 4) desc = t('songInfoPage.dynamicsModerate', 'Moderate dynamics');
    return `${val} (${desc})`;
  };

  return (
    <div className="other-cards appear-from-bottom bg-background-color-2/70 dark:bg-dark-background-color-2/70 dark:text-font-color-white mt-4 mr-4 w-full max-w-full rounded-xl p-4 backdrop-blur-xs">
      <label
        htmlFor="songAcousticInfo"
        className="title-container text-font-color-highlight dark:text-dark-font-color-highlight flex cursor-pointer items-center justify-between font-medium"
      >
        <div className="flex items-center">
          <span className="material-icons-round-outlined mr-2 text-2xl">graphic_eq</span>
          {t('songInfoPage.acousticDspAnalysis', 'Acoustic & DSP Analysis')}
          {features && (
            <span className="bg-background-color-1/60 dark:bg-dark-background-color-1/60 text-font-color-highlight dark:text-dark-font-color-highlight ml-3 rounded-full px-2.5 py-0.5 text-xs font-normal">
              v{features.featureVersion}
            </span>
          )}
        </div>
        <div className="flex items-center">
          <Button
            id="songAcousticInfo"
            className="hover:bg-background-color-1/50 dark:hover:bg-dark-background-color-1/50 m-0! border-0! p-0! outline-offset-1 focus-visible:outline!"
            iconClassName="leading-none! text-3xl!"
            iconName={isDataVisible ? 'arrow_drop_up' : 'arrow_drop_down'}
            tooltipLabel={t(`common.${isDataVisible ? 'hideSuggestion' : 'showSuggestion'}`)}
            clickHandler={(e) => {
              e.preventDefault();
              setIsDataVisible((state) => !state);
            }}
          />
        </div>
      </label>

      {isDataVisible && (
        <div className="info-items-container mt-3">
          {isLoading ? (
            <div className="text-font-color-dimmed dark:text-dark-font-color-dimmed py-4 text-center text-sm">
              {t('common.loading', 'Loading...')}
            </div>
          ) : !features ? (
            <div className="bg-background-color-1/25 dark:bg-dark-background-color-1/25 flex flex-col items-start rounded-lg p-4">
              <p className="text-font-color-dimmed dark:text-dark-font-color-dimmed mb-3 text-sm">
                {t(
                  'songInfoPage.songNotIndexedDesc',
                  'This song has not been acoustically analyzed yet. Acoustic features help Nora provide sound-matching recommendations and radio queues.'
                )}
              </p>
              <Button
                label={
                  isAnalyzing
                    ? t('songInfoPage.analyzingSong', 'Analyzing...')
                    : t('songInfoPage.analyzeSong', 'Analyze Song')
                }
                iconName="insights"
                isDisabled={isAnalyzing}
                pendingAnimationOnDisabled={isAnalyzing}
                className="bg-background-color-3! text-font-color-black hover:border-background-color-3 dark:bg-dark-background-color-3! dark:text-font-color-black! dark:hover:border-background-color-3 px-4 py-2"
                clickHandler={handleAnalyze}
              />
            </div>
          ) : (
            <div>
              <SongAdditionalInfoItem
                label={t('songInfoPage.estimatedTempo', 'Tempo & Pace')}
                value={`${Math.round(features.estimatedBpm ?? 0)} BPM`}
                technicalLabel="Estimated BPM"
                tooltip="Detected beats per minute via onset energy peak detection"
              />

              <SongAdditionalInfoItem
                label={t('songInfoPage.rhythmClarity', 'Rhythm & Beat Clarity')}
                value={formatPulseClarity(features.pulseClarity)}
                technicalLabel="Pulse Clarity (0.0 – 1.0)"
                tooltip="Strength and predictability of the rhythmic pulse and beat clarity"
              />

              <SongAdditionalInfoItem
                label={t('songInfoPage.soundBrightness', 'Sound Brightness')}
                value={formatBrightness(features.spectralCentroid)}
                technicalLabel="Spectral Centroid (Hz)"
                tooltip="Center of mass of the frequency spectrum; higher values indicate brighter acoustic tone"
              />

              <SongAdditionalInfoItem
                label={t('songInfoPage.dynamicRange', 'Dynamic Range')}
                value={formatDynamicRange(features.crestFactor)}
                technicalLabel="Crest Factor"
                tooltip="Ratio of waveform peak amplitude to root-mean-square (RMS) level"
              />

              <SongAdditionalInfoItem
                label={t('songInfoPage.frequencySpectrum', 'Frequency Spectrum')}
                value={`Low: ${Math.round((features.lowEnergyRatio ?? 0) * 100)}% • Mid: ${Math.round((features.midEnergyRatio ?? 0) * 100)}% • High: ${Math.round((features.highEnergyRatio ?? 0) * 100)}%`}
                technicalLabel="Sub-band Energy Ratios"
                tooltip="Energy distribution across Bass (below 250Hz), Mids (250Hz–4kHz), and Treble (above 4kHz)"
              />

              <SongAdditionalInfoItem
                label={t('songInfoPage.acousticLoudness', 'Acoustic Loudness')}
                value={`RMS: ${(features.rmsEnergy ?? 0).toFixed(3)}`}
                technicalLabel="RMS Energy"
                tooltip="Root Mean Square energy of the acoustic waveform"
              />

              <SongAdditionalInfoItem
                label={t('songInfoPage.percussiveness', 'Percussiveness & Transients')}
                value={`ZCR: ${(features.zeroCrossingRate ?? 0).toFixed(3)}`}
                technicalLabel="Zero-Crossing Rate (ZCR)"
                tooltip="Rate of sign-changes along the waveform; correlates with percussive noise and attack sharpness"
              />

              {(features.globalListeners !== null || features.globalPlaycount !== null) && (
                <SongAdditionalInfoItem
                  label={t('songInfoPage.globalPopularity', 'Global Popularity')}
                  value={`${(features.globalListeners ?? 0).toLocaleString()} ${t('songInfoPage.listeners', 'listeners')} • ${(features.globalPlaycount ?? 0).toLocaleString()} ${t('songInfoPage.plays', 'plays')}`}
                  technicalLabel="Last.fm Global Scrobble Statistics"
                  tooltip="Global listener count and total playcount synced from the Last.fm community database"
                />
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-background-color-1/30 dark:border-dark-background-color-1/30 pt-3">
                <div className="text-font-color-dimmed dark:text-dark-font-color-dimmed flex items-center text-xs">
                  <span className="material-icons-round-outlined mr-1.5 text-base leading-none">
                    fingerprint
                  </span>
                  <span>
                    {t('songInfoPage.fingerprintDetails', 'Fingerprint')}: v{features.featureVersion}
                    {features.updatedAt && (
                      <>
                        {' • '}
                        {t('songInfoPage.indexedOn', 'Indexed on')}{' '}
                        {new Date(features.updatedAt).toLocaleDateString()}
                      </>
                    )}
                  </span>
                </div>
                <Button
                  label={
                    isAnalyzing
                      ? t('songInfoPage.analyzingSong', 'Analyzing...')
                      : t('songInfoPage.reanalyzeSong', 'Re-analyze')
                  }
                  iconName="refresh"
                  isDisabled={isAnalyzing}
                  pendingAnimationOnDisabled={isAnalyzing}
                  className="bg-background-color-3! text-font-color-black! hover:border-background-color-3 dark:bg-dark-background-color-3! dark:text-font-color-black! dark:hover:border-background-color-3 px-4 py-2 text-sm"
                  clickHandler={handleAnalyze}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SongAcousticInfoContainer;
