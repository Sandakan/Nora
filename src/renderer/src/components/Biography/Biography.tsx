import { useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import Hyperlink from '../Hyperlink';
import HashTag from './HashTag';
import type { Tag } from '../../../../types/last_fm_artist_info_api';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store/store';

type Props = {
  bioUserName?: string;
  bio?: string;
  hyperlinkData: {
    label?: string;
    labelTitle?: string;
  };
  tags?: Tag[];
};

const Biography = (props: Props) => {
  const bodyBackgroundImage = useStore(store, (state) => state.bodyBackgroundImage);

  const { t } = useTranslation();

  const {
    bio,
    bioUserName = '',
    hyperlinkData: {
      label = t('biography.readMore'),
      labelTitle = t('biography.readMoreInLastFm')
    },
    tags = []
  } = props;

  const { bioUrl, sanitizedBio } = useMemo(() => {
    if (bio) {
      const bioAnchor = bio.match(/<a .*<\/a>/gm);
      const bioAnchorUrl = bioAnchor ? bioAnchor[0].match(/".*"/gm) : [''];
      const filteredBioUrl = bioAnchorUrl ? bioAnchorUrl[0].replace(/"/gm, '') : '';
      const sanitizedBioText = bio.replace(/<a .*<\/a>/gm, '');

      return { sanitizedBio: sanitizedBioText, bioUrl: filteredBioUrl };
    }
    return { sanitizedBio: '', bioUrl: '' };
  }, [bio]);

  const tagComponents = useMemo(
    () => tags.map((tag) => <HashTag key={tag.url} {...tag} />),
    [tags]
  );

  return (
    <div
      className={`"bio-container appear-from-bottom text-font-color-black dark:text-font-color-white relative z-10 m-4 rounded-lg p-4 shadow-md ${
        bodyBackgroundImage
          ? `bg-background-color-2/70 dark:bg-dark-background-color-2/70 backdrop-blur-md`
          : `bg-background-color-2 dark:bg-dark-background-color-2`
      }`}
    >
      <h3 className="text-font-color-highlight dark:text-dark-font-color-highlight mb-2 text-xl font-medium">
        <Trans
          i18nKey="biography.aboutName"
          components={{
            span: <span className="font-semibold">{bioUserName}</span>
          }}
        />
      </h3>
      {bio && (
        <div>
          <p className="artist-bio z-10">
            {sanitizedBio} <Hyperlink label={label} linkTitle={labelTitle} link={bioUrl} />
          </p>
        </div>
      )}
      {tagComponents.length > 0 && <div className="mt-4">{tagComponents}</div>}
    </div>
  );
};

export default Biography;
