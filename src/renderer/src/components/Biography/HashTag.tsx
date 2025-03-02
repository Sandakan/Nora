import { useTranslation } from 'react-i18next';
import { type Tag } from '../../../../@types/last_fm_artist_info_api';
import Hyperlink from '../Hyperlink';

const HashTag = (props: Tag) => {
  const { t } = useTranslation();

  const { name, url } = props;

  return (
    <Hyperlink
      label={`#${name}`}
      linkTitle={t('biography.goToTagInLastFm', { name })}
      link={url}
      className="mr-4 last:mr-0"
    />
  );
};

export default HashTag;
