import 'dotenv/config';
import { exec } from 'child_process';
import * as readline from 'readline';
import { existsSync } from 'fs';

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
    rl.question('Are you sure you want to drop the database? (yes/no) ', (answer) => {
      if (answer.toLowerCase() === 'yes') {
        executeDrop();
      } else {
        console.log('Database drop canceled.');
        rl.close();
      }
    });
  }
};

const executeDrop = () => {
  exec(`rm -rf "${DATABASE_PATH}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error removing folder: ${stderr}`);
      process.exit(1);
    }
    console.log(`Folder removed successfully: ${stdout}`);
    rl.close();
  });
};

// Start the script
dropDatabase();

