import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './resources/drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  driver: 'pglite',
  casing: 'snake_case',
  dbCredentials: {
    url: process.env.DATABASE_PATH!
  }
});

