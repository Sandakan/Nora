import { existsSync, mkdirSync } from 'fs';
import path from 'path';

import * as schema from '@db/schema';
import { PGlite } from '@electric-sql/pglite';
import { pgDump } from '@electric-sql/pglite-tools/pg_dump';
import { citext } from '@electric-sql/pglite/contrib/citext';
import { cube } from '@electric-sql/pglite/contrib/cube';
// PostgreSQL Database extensions
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import logger from '@main/logger';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { app } from 'electron';

import logMemoryCheckpoint from '../utils/memoryProfiler';
import { seedDatabase } from './seed';

const DB_NAME = 'nora.pglite.db';
export const DB_PATH = app.getPath('userData') + '/' + DB_NAME;

const getMigrationsFolder = () => {
  const appPath = typeof app?.getAppPath === 'function' ? app.getAppPath() : process.cwd();
  const resourcesPath = process.resourcesPath;

  const rawCandidates: (string | undefined)[] = [
    resourcesPath ? path.resolve(resourcesPath, 'app.asar.unpacked', 'resources', 'drizzle') : undefined,
    appPath
      ? path.resolve(appPath.replace(/app\.asar[/\\]?$/, 'app.asar.unpacked'), 'resources', 'drizzle')
      : undefined,
    resourcesPath ? path.resolve(resourcesPath, 'resources', 'drizzle') : undefined,
    resourcesPath ? path.resolve(resourcesPath, 'drizzle') : undefined,
    appPath ? path.resolve(appPath, 'resources', 'drizzle') : undefined,
    typeof import.meta.dirname === 'string'
      ? path.resolve(import.meta.dirname, '../../../resources/drizzle')
      : undefined,
    typeof import.meta.dirname === 'string'
      ? path.resolve(import.meta.dirname, '../../resources/drizzle')
      : undefined
  ];

  const candidates = Array.from(new Set(rawCandidates.filter((c): c is string => Boolean(c))));

  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, 'meta/_journal.json'))) {
      logger.info(`Migrations folder resolved to: ${candidate}`);
      return candidate;
    }
  }

  const errorMsg = `Failed to locate drizzle migrations directory (meta/_journal.json not found)! Checked paths:\n${candidates.map((c) => ` - ${c}`).join('\n')}`;
  logger.error(errorMsg);
  throw new Error(errorMsg);
};

const migrationsFolder = getMigrationsFolder();

mkdirSync(DB_PATH, { recursive: true });

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

const postgresqlconf = [
  'shared_buffers = 16MB',
  'work_mem = 2MB',
  'temp_buffers = 2MB',
  'maintenance_work_mem = 8MB'
];

const pgliteInstance = await PGlite.create(DB_PATH, {
  debug: isDev ? 1 : 0,
  extensions: { pg_trgm, citext, cube },
  postgresqlconf
});

pgliteInstance.onNotification((notification) => {
  logger.info('Database notification:', { notification });
});

// Initialize extension types
await pgliteInstance.exec('CREATE EXTENSION IF NOT EXISTS citext;');
await pgliteInstance.exec('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
await pgliteInstance.exec('CREATE EXTENSION IF NOT EXISTS cube;');

// Initialize Drizzle ORM
export const db = drizzle(pgliteInstance, {
  schema
});

export const closeDatabaseInstance = async () => {
  if (pgliteInstance.closed) return logger.debug('Database instance already closed.');

  await pgliteInstance.close();
  logger.debug('Database instance closed.');
};

try {
  logger.info(`Applying database migrations from: ${migrationsFolder}`);
  await migrate(db, { migrationsFolder });
  logger.info('Database migrations applied successfully.');
} catch (error) {
  logger.error('Failed to apply database migrations:', { error, migrationsFolder });
  throw error;
}

await seedDatabase();
logMemoryCheckpoint('database-ready');

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
  const initialSearchPath = (
    await pgliteInstance.query<{ search_path: string }>('SHOW SEARCH_PATH;')
  ).rows[0].search_path;

  logger.debug('Current database search_path:', { initialSearchPath });

  const clonedPg = await pgliteInstance.clone();

  const dump = await pgDump({ pg: clonedPg as PGlite });

  const [, dumpTextPromise] = await Promise.allSettled([clonedPg.close(), dump.text()]);

  const sql = dumpTextPromise.status === 'fulfilled' ? dumpTextPromise.value : '';
  return sql;
};

/**
 * Imports a database by executing the provided SQL query after resetting the database file.
 *
 * This function closes the current database instance, deletes the database file, reinitializes the
 * database, and executes the given SQL query. Useful for restoring or reinitializing the database
 * from a dump or migration.
 *
 * @param query - The SQL query or migration to execute after reset.
 * @returns A promise that resolves to true when the import is successful.
 */
export const importDatabase = async (query: string) => {
  await pgliteInstance.exec(query);

  logger.info('Database imported successfully.');
  return true;
};
