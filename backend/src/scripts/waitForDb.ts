import 'dotenv/config';
import { Client } from 'pg';

const WAIT_INTERVAL_MS = 1000;
const MAX_ATTEMPTS = 30;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const main = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const client = new Client({ connectionString });
      await client.connect();
      await client.end();
      console.log('Database is ready');
      return;
    } catch {
      console.log(`Waiting for database (attempt ${attempt}/${MAX_ATTEMPTS})`);
      await wait(WAIT_INTERVAL_MS);
    }
  }

  console.error('Could not connect to database');
  process.exit(1);
};

main();
