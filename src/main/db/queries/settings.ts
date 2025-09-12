import { db } from '../db';
import { userSettings } from '../schema';

export const getAllSettings = async () => {
  const settings = await db.query.userSettings.findFirst();

  if (!settings) throw new Error('User settings not found');

  return settings;
};

export const saveUserThemeSettings = async (
  isDarkMode: boolean,
  useSystemTheme: boolean,
  trx: DB | DBTransaction = db
) => {
  await trx.update(userSettings).set({ isDarkMode, useSystemTheme, updatedAt: new Date() });
};
