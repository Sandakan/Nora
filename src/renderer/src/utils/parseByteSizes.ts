import i18n from '../i18n';
import roundTo from './roundTo';

type ParsedByteSizes = {
  bytes: number;
  kiloBytes: number;
  megaBytes: number;
  gigaBytes: number;
  size: string;
};

const parseByteSizes = (bytes: number, roundToVal = 3) => {
  const sizes: ParsedByteSizes = {
    bytes,
    kiloBytes: 0,
    megaBytes: 0,
    gigaBytes: 0,
    size: '0 KB'
  };

  if (typeof bytes !== 'number') return sizes;

  sizes.kiloBytes = roundTo(bytes / 1024, roundToVal);
  sizes.megaBytes = roundTo(sizes.kiloBytes / 1024, roundToVal);
  sizes.gigaBytes = roundTo(sizes.megaBytes / 1024, roundToVal);

  if (bytes >= 0 && bytes < 2 ** 10) {
    sizes.size = i18n.t('data.byteWithCount', { count: bytes });
  } else if (bytes >= 2 ** 10 && bytes < 2 ** 20) {
    sizes.size = `${sizes.kiloBytes} KB`;
  } else if (bytes >= 2 ** 20 && bytes < 2 ** 30) {
    sizes.size = `${sizes.megaBytes} MB`;
  } else if (bytes >= 2 ** 30 && bytes < 2 ** 40) {
    sizes.size = `${sizes.gigaBytes} GB`;
  } else sizes.size = i18n.t('data.byteWithCount', { count: 0 });

  return sizes;
};

export default parseByteSizes;
