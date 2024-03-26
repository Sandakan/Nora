import { customAlphabet } from 'nanoid';

export const generateRandomId = () => {
  const id = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);
  return id();
};
