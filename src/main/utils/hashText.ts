import { type BinaryToTextEncoding, createHash } from 'crypto';

type HashingAlgorithm = 'md5' | 'sha256' | 'sha512';

function hashText(
  content: string,
  algo: HashingAlgorithm = 'md5',
  digestEncoding: BinaryToTextEncoding = 'hex'
) {
  const hashFunc = createHash(algo);
  hashFunc.update(content);
  return hashFunc.digest(digestEncoding);
}

export default hashText;
