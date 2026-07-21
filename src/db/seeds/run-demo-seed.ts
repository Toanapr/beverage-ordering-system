import { cp, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import dataSource from '../data-source';
import { DEMO_EMAILS, DEMO_PASSWORD, seedDemoData } from './demo.seed';

async function installDemoImages(): Promise<void> {
  const source = resolve(process.cwd(), 'seed-assets', 'products');
  const uploadRoot = resolve(process.env.UPLOAD_DIR ?? './uploads');
  const destination = join(uploadRoot, 'products');

  await mkdir(destination, { recursive: true });
  await cp(source, destination, { recursive: true, force: true });
}

async function run(): Promise<void> {
  await dataSource.initialize();

  try {
    await installDemoImages();
    await seedDemoData(dataSource);
    console.log('Demo product images installed successfully.');
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
