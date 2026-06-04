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
    mapboxAccessToken: getContextProperty(context, 'mapboxAccessToken'),
    weatherApiKey: getContextProperty(context, 'weatherApiKey'),
  };

  return buildConfig;
};

export { getAppContext };
