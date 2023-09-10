import nanoid from 'nanoid';

export const generateRandomId = () => {
  const id = nanoid.customAlphabet(
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
    10,
  );
  return id();
};
