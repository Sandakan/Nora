import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { app } from 'electron';
import path from 'path';

import * as schema from '@db/schema';

const DB_PATH = app.getPath('userData') + '/database.db';

export const db = drizzle(DB_PATH, { schema });
migrate(db, { migrationsFolder: path.resolve(import.meta.dirname, '../../../resources/drizzle/') });
