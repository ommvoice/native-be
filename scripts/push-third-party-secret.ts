/**
 * Creates / updates the Secrets Manager secret that deployed Lambdas read their third-party API keys
 * from (see app/shared/config/secrets.ts and cdk/lib/stacks/lambda-stack.ts).
 *
 *   npx tsx scripts/push-third-party-secret.ts technit   (or: native)
 *
 * Values come from cdk/secrets.local.json (gitignored, never committed):
 *   { "technit": { "mapboxAccessToken": "...", "weatherApiKey": "...", "googleMapsApiKey": "..." } }
 * Secret name: context.<env>.thirdPartySecretName in cdk/cdk.json, default "<appName>/<env>/third-party".
 * Key values are never printed.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  SecretsManagerClient,
  CreateSecretCommand,
  PutSecretValueCommand,
  ResourceNotFoundException,
} from '@aws-sdk/client-secrets-manager';

const KEYS = ['mapboxAccessToken', 'weatherApiKey', 'googleMapsApiKey'] as const;

async function main() {
  const env = process.argv[2];
  if (!env) throw new Error('Usage: tsx scripts/push-third-party-secret.ts <env>');

  const cdkDir = join(import.meta.dirname, '..', 'cdk');
  const cdkJson = JSON.parse(readFileSync(join(cdkDir, 'cdk.json'), 'utf8'));
  const ctx = cdkJson.context?.[env];
  if (!ctx) throw new Error(`No context "${env}" in cdk/cdk.json`);

  const local = JSON.parse(readFileSync(join(cdkDir, 'secrets.local.json'), 'utf8'))[env] ?? {};
  const missing = KEYS.filter((k) => !local[k]);
  if (missing.length) throw new Error(`cdk/secrets.local.json is missing ${env}.${missing.join(`, ${env}.`)}`);

  const name: string = ctx.thirdPartySecretName || `${ctx.appName}/${ctx.environment}/third-party`;
  const SecretString = JSON.stringify(Object.fromEntries(KEYS.map((k) => [k, local[k]])));
  // Use the context's own profile + region so a "native" push can never land in the uat account.
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
  console.log('Redeploy (npm run deploy:<env>) so Lambdas pick up THIRD_PARTY_SECRET_ID; new key values are read on the next cold start.');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
