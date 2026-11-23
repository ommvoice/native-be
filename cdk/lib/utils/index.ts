import { Construct } from 'constructs';

const getContextProperty = (
  object: { [name: string]: any },
  propName: string
): string => {
  if (!object[propName] || object[propName].trim().length === 0)
    throw new Error(`ensureString: ${propName} does not exist or is empty`);

  return object[propName];
};

const getAppContext = (app: Construct) => {
  let env = app.node.tryGetContext('config');

  if (!env) throw new Error('Context variable missing on CDK command');

  const context = app.node.tryGetContext(env);

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
