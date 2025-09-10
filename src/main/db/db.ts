import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { app } from 'electron';
import path from 'path';
import { mkdirSync } from 'fs';

import * as schema from '@db/schema';
import logger from '@main/logger';
// import type { Logger } from 'drizzle-orm';
import { PGlite } from '@electric-sql/pglite';
// import { seedDatabase } from './seed';

const DB_PATH = app.getPath('userData') + '/database.db';
const migrationsFolder = path.resolve(import.meta.dirname, '../../resources/drizzle/');
logger.debug(`Migrations folder: ${migrationsFolder}`);

mkdirSync(DB_PATH, { recursive: true });
const instance = await PGlite.create(DB_PATH, { debug: 5 });
instance.onNotification((notification) => {
  logger.info('Database notification:', { notification });
});

export const db = drizzle(instance, {
  schema
});

export const closeDatabaseInstance = async () => {
  if (instance.closed) return logger.debug('Database instance already closed.');

  await instance.close();
  logger.debug('Database instance closed.');
};

await migrate(db, { migrationsFolder });
// await seedDatabase();
