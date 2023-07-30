import { Tag } from '../../../@types/last_fm_artist_info_api';
import Hyperlink from '../Hyperlink';

const HashTag = (props: Tag) => {
  const { name, url } = props;

  return (
    <Hyperlink
      label={`#${name}`}
      linkTitle={`Go to '${name}' tag in LastFM`}
      link={url}
      className="mr-4 last:mr-0"
    />
  );
};

export default HashTag;
