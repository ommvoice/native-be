import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

/**
 * Third-party API keys (Mapbox, WeatherAPI, Google Maps).
 *
 * Deployed Lambdas get only THIRD_PARTY_SECRET_ID (the Secrets Manager secret name) — never the key
 * values — so keys don't appear in the Lambda console, CloudFormation templates, cdk.out or CI logs.
 * The secret is a JSON object: { "mapboxAccessToken": "...", "weatherApiKey": "...", "googleMapsApiKey": "..." }.
 * It's fetched once per cold start and cached for the life of the container.
 *
 * Local scripts / tests / mock mode (no THIRD_PARTY_SECRET_ID) fall back to the plain env vars
 * MAPBOX_ACCESS_TOKEN / WEATHER_API_KEY / GOOGLE_MAPS_API_KEY.
 */
export interface ThirdPartySecrets {
  mapboxAccessToken: string;
  weatherApiKey: string;
  googleMapsApiKey: string;
}

let cached: Promise<ThirdPartySecrets> | undefined;

function fromEnv(): ThirdPartySecrets {
  return {
    mapboxAccessToken: process.env['MAPBOX_ACCESS_TOKEN'] ?? '',
    weatherApiKey:     process.env['WEATHER_API_KEY'] ?? '',
    googleMapsApiKey:  process.env['GOOGLE_MAPS_API_KEY'] ?? '',
  };
}

async function load(): Promise<ThirdPartySecrets> {
  const secretId = process.env['THIRD_PARTY_SECRET_ID'];
  if (!secretId) return fromEnv();

  const client = new SecretsManagerClient({});
  const res = await client.send(new GetSecretValueCommand({ SecretId: secretId }));
  if (!res.SecretString) throw new Error('Third-party secret has no SecretString');
  const parsed = JSON.parse(res.SecretString) as Partial<ThirdPartySecrets>;
  return {
    mapboxAccessToken: parsed.mapboxAccessToken ?? '',
    weatherApiKey:     parsed.weatherApiKey ?? '',
    googleMapsApiKey:  parsed.googleMapsApiKey ?? '',
  };
}

export function thirdPartySecrets(): Promise<ThirdPartySecrets> {
  if (!cached) {
    // Don't cache a failure — the next invocation retries.
    cached = load().catch((err) => {
      cached = undefined;
      throw err;
    });
  }
  return cached;
}

/** Test hook. */
export function resetThirdPartySecretsCache(): void {
  cached = undefined;
}
