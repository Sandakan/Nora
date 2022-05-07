/* eslint-disable no-plusplus */
/* eslint-disable import/prefer-default-export */
import nanoid from 'nanoid';

export const generateRandomId = () => {
  const id = nanoid.customAlphabet(
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
    10
  );
  return id();
  // const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(
  //   ''
  // );
  // let tempName = '';
  // for (let x = 0; x < 30; x++) {
  //   const val = Math.floor(Math.random() * (alphabet.length - 1) + 0);
  //   tempName += alphabet[val];
  // }
  // return tempName;
};
