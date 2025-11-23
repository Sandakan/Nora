import 'dotenv/config';
import * as readline from 'readline';
import { existsSync, rmSync } from 'fs';

const DATABASE_PATH = process.env.DATABASE_PATH;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const dropDatabase = () => {
  if (!DATABASE_PATH) {
    console.error('DATABASE_PATH is not defined in the environment variables.');
    process.exit(1);
  }

  const force = process.argv.includes('--force');

  console.log(`Database path: ${DATABASE_PATH}`); // Show the database path

  if (!existsSync(DATABASE_PATH)) {
    console.error(`Folder does not exist: ${DATABASE_PATH}`);
    rl.close();
    return;
  }

  if (force) {
    executeDrop();
  } else {
    rl.question('Are you sure you want to drop the database? (y/n) ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        executeDrop();
      } else {
        console.log('Database drop canceled.');
        rl.close();
      }
    });
  }
};

const executeDrop = () => {
  try {
    rmSync(DATABASE_PATH!, { recursive: true, force: true });
    console.log(`Database folder removed successfully: ${DATABASE_PATH}`);
  } catch (error) {
    console.error(`Error removing folder:`, error);
    process.exit(1);
  } finally {
    rl.close();
  }
};

// Start the script
dropDatabase();
