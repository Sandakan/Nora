import { db } from '../db';
import { userSettings } from '../schema';

export const getUserSettings = async () => {
  const settings = await db.query.userSettings.findFirst();

  if (!settings) throw new Error('User settings not found');

  return settings;
};

export const saveUserSettings = async (
  settings: typeof userSettings.$inferInsert,
  trx: DB | DBTransaction = db
) => {
  await trx.update(userSettings).set({ ...settings, updatedAt: new Date() });
};
