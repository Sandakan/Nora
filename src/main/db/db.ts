import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { app } from 'electron';
import path from 'path';
import { mkdirSync, rmSync } from 'fs';

import * as schema from '@db/schema';
import logger from '@main/logger';
import { pgDump } from '@electric-sql/pglite-tools/pg_dump';
import { PGlite } from '@electric-sql/pglite';
import { seedDatabase } from './seed';

const DB_NAME = 'nora.pglite.db';
export const DB_PATH = app.getPath('userData') + '/' + DB_NAME;
const migrationsFolder = path.resolve(import.meta.dirname, '../../resources/drizzle/');
logger.debug(`Migrations folder: ${migrationsFolder}`);

mkdirSync(DB_PATH, { recursive: true });

const pgliteInstance = await PGlite.create(DB_PATH, { debug: 5 });
pgliteInstance.onNotification((notification) => {
  logger.info('Database notification:', { notification });
});

export const db = drizzle(pgliteInstance, {
  schema
});

export const closeDatabaseInstance = async () => {
  if (pgliteInstance.closed) return logger.debug('Database instance already closed.');

  await pgliteInstance.close();
  logger.debug('Database instance closed.');
};

await migrate(db, { migrationsFolder });
await seedDatabase();

export const exportDatabase = async () => {
  // TODO: Temporary solution until https://github.com/electric-sql/pglite/issues/606 is resolved
  const newPgliteInstance = await pgliteInstance.clone();

  const dump = await pgDump({ pg: newPgliteInstance as PGlite });
  const dumpText = await dump.text();

  await newPgliteInstance.close();

  return dumpText;
};

/**
 * Imports a database by executing the provided SQL query after resetting the database file.
 *
 * This function closes the current database instance, deletes the database file,
 * reinitializes the database, and executes the given SQL query.
 * Useful for restoring or reinitializing the database from a dump or migration.
 *
 * @param query - The SQL query or migration to execute after reset.
 * @returns A promise that resolves to true when the import is successful.
 */
export const importDatabase = async (query: string) => {
  await closeDatabaseInstance();

  // Delete the existing database file
  rmSync(DB_PATH);

  logger.info('Database folder deleted. Reinitializing database...');

  // Recreate the database instance
  const newPgliteInstance = await PGlite.create(DB_PATH, { debug: 5 });
  await newPgliteInstance.exec(query);

  await newPgliteInstance.close();

  logger.info('Database imported successfully.');
  return true;
};
