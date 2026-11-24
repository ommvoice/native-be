/**
 * Creates / updates the Secrets Manager secret that deployed Lambdas read their third-party API keys
 * from (see app/shared/config/secrets.ts and cdk/lib/stacks/lambda-stack.ts).
 *
 *   npx tsx scripts/push-third-party-secret.ts technit:uat   (or technit:prod, native:uat, native:prod)
 *
 * Values come from cdk/secrets.local.json (gitignored, never committed). Keys per account are shared
 * by its stages; a stage block overrides them:
 *   { "technit": { "mapboxAccessToken": "...", "weatherApiKey": "...", "googleMapsApiKey": "...",
 *                  "prod": { "googleMapsApiKey": "..." } } }
 * Secret name: context.<account>.<stage>.thirdPartySecretName in cdk/cdk.json,
 * default "<appName>/<environment>/third-party" (e.g. native-be/uat/third-party).
 * Key values are never printed.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveCdkTarget } from '../seed/config/cdk-target.js';
import {
  SecretsManagerClient,
  CreateSecretCommand,
  PutSecretValueCommand,
  ResourceNotFoundException,
} from '@aws-sdk/client-secrets-manager';

const KEYS = ['mapboxAccessToken', 'weatherApiKey', 'googleMapsApiKey'] as const;

async function main() {
  const arg = process.argv[2];
  if (!arg) throw new Error('Usage: tsx scripts/push-third-party-secret.ts <account>:<stage>  (e.g. technit:uat)');

  const cdkDir = join(import.meta.dirname, '..', 'cdk');
  const ctx = resolveCdkTarget(arg);
  const env = ctx.target;

  const all = JSON.parse(readFileSync(join(cdkDir, 'secrets.local.json'), 'utf8'));
  const accountKeys = all[ctx.account] ?? {};
  const local = { ...accountKeys, ...(accountKeys[ctx.stage] ?? {}) };
  const missing = KEYS.filter((k) => !local[k]);
  if (missing.length) throw new Error(`cdk/secrets.local.json is missing ${missing.join(', ')} for ${env} (under "${ctx.account}" or "${ctx.account}.${ctx.stage}")`);

  const name: string = ctx.thirdPartySecretName || `${ctx.appName}/${ctx.environment}/third-party`;
  const SecretString = JSON.stringify(Object.fromEntries(KEYS.map((k) => [k, local[k]])));
  // Use the context's own profile + region so a native push can never land in the technit account.
  const client = new SecretsManagerClient({ region: ctx.awsProfileRegion, profile: ctx.awsProfileName });

  try {
    await client.send(new PutSecretValueCommand({ SecretId: name, SecretString }));
    console.log(`Updated secret "${name}" (${ctx.awsProfileRegion}).`);
  } catch (err) {
    if (!(err instanceof ResourceNotFoundException)) throw err;
    await client.send(new CreateSecretCommand({
      Name: name,
      Description: `${ctx.appName} ${env} — Mapbox / WeatherAPI / Google Maps keys for Lambdas`,
      SecretString,
    }));
    console.log(`Created secret "${name}" (${ctx.awsProfileRegion}).`);
  }
  console.log(`Redeploy (npm run deploy:${env}) so Lambdas pick up THIRD_PARTY_SECRET_ID; new key values are read on the next cold start.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
