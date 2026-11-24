import { Construct } from 'constructs';

const getContextProperty = (
  object: { [name: string]: any },
  propName: string
): string => {
  if (!object[propName] || object[propName].trim().length === 0)
    throw new Error(`ensureString: ${propName} does not exist or is empty`);

  return object[propName];
};

/**
 * cdk.json context is grouped by AWS account, then stage:
 *   { "technit": { "uat": {...}, "prod": {...} }, "native": { "uat": {...}, "prod": {...} } }
 * Pick one with `--context config=<account>:<stage>` (e.g. config=technit:uat — the npm scripts do
 * this). A bare account (config=technit) means its "uat" stage, which is what it meant before the split.
 */
const DEFAULT_STAGE = 'uat';

const resolveTarget = (app: Construct): { target: string; context: { [name: string]: any } } => {
  const raw = app.node.tryGetContext('config');
  if (!raw || typeof raw !== 'string') {
    throw new Error('Context variable missing on CDK command — pass --context config=<account>:<stage> (e.g. technit:uat)');
  }
  const [account, stage = DEFAULT_STAGE, ...rest] = raw.trim().split(':');
  const accountBlock = account ? app.node.tryGetContext(account) : undefined;
  const context = accountBlock?.[stage];
  if (rest.length || !context || typeof context !== 'object') {
    throw new Error(`No CDK context "${raw}" in cdk/cdk.json — use <account>:<stage>, e.g. technit:uat`);
  }
  // A stage block's "environment" names every resource (native-be-<environment>-…); it defaults to the stage key.
  return { target: `${account}:${stage}`, context: { environment: stage, ...context } };
};

const getAppContext = (app: Construct) => {
  const { target: env, context } = resolveTarget(app);

  let buildConfig = {
    awsAccountId: getContextProperty(context, 'awsAccountId'),
    awsProfileName: getContextProperty(context, 'awsProfileName'),
    awsProfileRegion: getContextProperty(context, 'awsProfileRegion'),

    appName: getContextProperty(context, 'appName'),
    version: getContextProperty(context, 'version'),
    environment: getContextProperty(context, 'environment'),
    build: getContextProperty(context, 'build'),
    certificateArn: getContextProperty(context, 'certificateArn'),
    domain: getContextProperty(context, 'domain'),
    hostedZoneId: getContextProperty(context, 'hostedZoneId'),
    fromEmail: getContextProperty(context, 'fromEmail'),
    toEmail: getContextProperty(context, 'toEmail'),
    // Third-party API keys live in AWS Secrets Manager, never in cdk.json / CloudFormation.
    // Secret JSON: { mapboxAccessToken, weatherApiKey, googleMapsApiKey } — see scripts/push-third-party-secret.ts.
    // AWS WAF on the API (≈ $10/month per env). Set "enableWaf": false in the context to skip.
    enableWaf: context['enableWaf'] !== false && context['enableWaf'] !== 'false',
    thirdPartySecretName:
      (typeof context['thirdPartySecretName'] === 'string' && context['thirdPartySecretName'].trim()) ||
      `${getContextProperty(context, 'appName')}/${getContextProperty(context, 'environment')}/third-party`,
  };

  // Never print the whole context (it used to dump API keys into terminal/CI logs).
  console.log('App context:', { env, appName: buildConfig.appName, environment: buildConfig.environment, region: buildConfig.awsProfileRegion });

  return buildConfig;
};

export { getAppContext };
