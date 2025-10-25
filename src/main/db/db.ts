import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { app } from 'electron';
import path from 'path';
import { mkdirSync } from 'fs';

import * as schema from '@db/schema';
import logger from '@main/logger';
import { pgDump } from '@electric-sql/pglite-tools/pg_dump';
import { PGlite } from '@electric-sql/pglite';
import { seedDatabase } from './seed';

// PostgreSQL Database extensions
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { citext } from '@electric-sql/pglite/contrib/citext';

const DB_NAME = 'nora.pglite.db';
export const DB_PATH = app.getPath('userData') + '/' + DB_NAME;
const migrationsFolder = path.resolve(import.meta.dirname, '../../resources/drizzle/');
logger.debug(`Migrations folder: ${migrationsFolder}`);

mkdirSync(DB_PATH, { recursive: true });

const pgliteInstance = await PGlite.create(DB_PATH, { debug: 5, extensions: { pg_trgm, citext } });
pgliteInstance.onNotification((notification) => {
  logger.info('Database notification:', { notification });
});

// Initialize extension types
await pgliteInstance.exec('CREATE EXTENSION IF NOT EXISTS citext;');
await pgliteInstance.exec('CREATE EXTENSION IF NOT EXISTS pg_trgm;');

// Initialize Drizzle ORM
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

export const nukeDatabase = async () => {
  try {
    logger.debug('Performing complete database reset...');

    // Drop everything - public schema AND drizzle schema
    await db.execute('DROP SCHEMA IF EXISTS public CASCADE;');
    await db.execute('DROP SCHEMA IF EXISTS drizzle CASCADE;');

    // Recreate public schema
    await db.execute('CREATE SCHEMA public;');
    await db.execute('GRANT ALL ON SCHEMA public TO public;');

    logger.debug('Database completely reset');
  } catch (error) {
    logger.error('Failed to reset database:', { error });
    throw error;
  }
};

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
  await pgliteInstance.exec(query);

  logger.info('Database imported successfully.');
  return true;
};
