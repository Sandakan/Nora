import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { app } from 'electron';
import path from 'path';

import * as schema from '@db/schema';
import logger from '@main/logger';
import type { Logger } from 'drizzle-orm';
import { PGlite } from '@electric-sql/pglite';

const DB_PATH = app.getPath('userData') + '/database.db';
const migrationsFolder = path.resolve(import.meta.dirname, '../../resources/drizzle/');
logger.debug(`Migrations folder: ${migrationsFolder}`);

class MyLogger implements Logger {
  logQuery(query: string, params: unknown[]): void {
    logger.verbose('SQL Query:', { query, params });
  }
}

const instance = await PGlite.create(DB_PATH, { debug: 5 });
export const db = drizzle(instance, { schema, logger: new MyLogger() });

// await migrate(db, { migrationsFolder });
