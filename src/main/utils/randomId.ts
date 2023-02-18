/* eslint-disable no-plusplus */
/* eslint-disable import/prefer-default-export */
import nanoid from 'nanoid';

export const generateRandomId = () => {
  const id = nanoid.customAlphabet(
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
    10
  );
  return id();
};
