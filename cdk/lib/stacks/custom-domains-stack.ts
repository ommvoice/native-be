import { Construct } from 'constructs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import {
	BasePathMapping,
	DomainName,
	EndpointType,
	RestApi,
	SecurityPolicy,
} from 'aws-cdk-lib/aws-apigateway';
import { ARecord, CnameRecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { ApiGatewayDomain } from 'aws-cdk-lib/aws-route53-targets';
import { AppConfig } from '../config/app-config';

export interface CustomDomainsStackProps {
	appConfig: AppConfig
	restApi: RestApi;
	stage?: string;
	aRecordSkip?: boolean
}

export class CustomDomainsConstruct extends Construct {
	constructor(scope: Construct, props: CustomDomainsStackProps) {
		const appConfig = props.appConfig;
		const stage = props.stage || appConfig.prefix('api');
		super(scope, appConfig.prefix('CustomDomainsConstruct'));

		const certificate = Certificate.fromCertificateArn(
			this,
			`${appConfig.prefix('Certificate')}`,
			appConfig.certificateArn
		);

		const domain = new DomainName(this, stage, {
			domainName: `${stage}.${appConfig.domain}`,
			certificate,
			securityPolicy: SecurityPolicy.TLS_1_2,
			endpointType: EndpointType.REGIONAL,
		});

		new BasePathMapping(this, `${appConfig.prefix('BASE_PATH_MAPPING')}`, {
			domainName: domain,
			restApi: props.restApi,
		});

		const hostedZone = HostedZone.fromHostedZoneAttributes(this, `${appConfig.prefix('HOSTED_ZONES')}`, {
			hostedZoneId: appConfig.hostedZoneId,
			zoneName: appConfig.domain,
		});

		new CnameRecord(this, `${appConfig.prefix('CNAME_RECORD')}`, {
			recordName: stage,
			zone: hostedZone,
			domainName: domain.domainNameAliasDomainName,
		});

		if (!props.aRecordSkip) {
			new ARecord(this, `${appConfig.prefix('ANAME_RECORD')}`, {
				zone: hostedZone,
				target: RecordTarget.fromAlias(new ApiGatewayDomain(domain)),
			});
		}
	}
}
