import dataSource from '../data-source';
import { DEMO_EMAILS, DEMO_PASSWORD, seedDemoData } from './demo.seed';

async function run(): Promise<void> {
  await dataSource.initialize();

  try {
    await seedDemoData(dataSource);
    console.log('Demo data seeded successfully.');
    console.log(
      `Accounts: ${Object.values(DEMO_EMAILS).join(', ')} | Password: ${DEMO_PASSWORD}`,
    );
  } finally {
    await dataSource.destroy();
  }
}

void run().catch((error: unknown) => {
  console.error('Failed to seed demo data:', error);
  process.exitCode = 1;
});
