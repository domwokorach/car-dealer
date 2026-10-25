import 'reflect-metadata';
import { networkInterfaces } from 'node:os';
import { Logger } from '@nestjs/common';
import { createApp } from './bootstrap';
import { ENV } from './config/config.module';
import { authConfigured, storageConfigured, type Env } from './config/env';

/** IPv4 addresses other devices on the network can use to reach this machine. */
function lanAddresses(): string[] {
  return Object.values(networkInterfaces())
    .flat()
    .filter((i): i is NonNullable<typeof i> => !!i && i.family === 'IPv4' && !i.internal)
    .map((i) => i.address);
}

async function main() {
  const app = await createApp();
  const env = app.get<Env>(ENV);
  await app.listen(env.API_PORT, env.API_HOST);

  const log = new Logger('Bootstrap');
  if (!authConfigured(env)) log.warn('Supabase auth is NOT configured: all sign-ins are rejected (public endpoints still work). Set SUPABASE_* in .env.');
  if (!storageConfigured(env)) log.warn('Supabase storage is NOT configured: image uploads are disabled.');
  log.log(`API listening on ${env.API_HOST}:${env.API_PORT}`);
  if (env.API_HOST === '0.0.0.0' && env.NODE_ENV !== 'production') {
    for (const ip of lanAddresses()) log.log(`  reachable from your phone at http://${ip}:${env.API_PORT}`);
    log.log(`  Android emulator: http://10.0.2.2:${env.API_PORT}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
