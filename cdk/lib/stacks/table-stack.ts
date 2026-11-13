import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import type { AppConfig } from '../config/app-config';

export interface TableStackProps extends cdk.StackProps {
  config: AppConfig;
}

/** All DynamoDB tables — named from config.tableNames so no value is hardcoded —
 *  plus the private S3 uploads bucket (user-submitted photos). */
export class TableStack extends cdk.Stack {
  readonly tables: Record<string, dynamodb.Table>;
  readonly uploadsBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: TableStackProps) {
    super(scope, id, props);

    const { tableNames } = props.config;
    const removal = props.config.env === 'prod'
      ? cdk.RemovalPolicy.RETAIN
      : cdk.RemovalPolicy.DESTROY;

    const t = (
      logicalId: string,
      tableName: string,
      pk: string,
      sk?: string,
      extraOptions?: Partial<dynamodb.TableProps>,
    ): dynamodb.Table => {
      const table = new dynamodb.Table(this, logicalId, {
        tableName,
        partitionKey: { name: pk, type: dynamodb.AttributeType.STRING },
        ...(sk ? { sortKey: { name: sk, type: dynamodb.AttributeType.STRING } } : {}),
        billingMode:    dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy:  removal,
        pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: props.config.env === 'prod' },
        ...extraOptions,
      });
      return table;
    };

    const gsi = (
      table: dynamodb.Table,
      indexName: string,
      pk: string,
      sk?: string,
    ) => {
      table.addGlobalSecondaryIndex({
        indexName,
        partitionKey: { name: pk, type: dynamodb.AttributeType.STRING },
        ...(sk ? { sortKey: { name: sk, type: dynamodb.AttributeType.STRING } } : {}),
        projectionType: dynamodb.ProjectionType.ALL,
      });
    };

    // ── Core tables ──────────────────────────────────────────────────────────

    const users = t('Users', tableNames.users, 'id');
    gsi(users, 'sub-index', 'sub');
    gsi(users, 'email-index', 'email');

    const parents = t('Parents', tableNames.parents, 'id');
    gsi(parents, 'userId-index', 'userId');

    const children = t('Children', tableNames.children, 'id');
    gsi(children, 'parentId-index', 'parentId');

    // NOTE: interestCategories, skills, skillLevels, facilities, and
    // opportunityThemes/opportunityThemeVariants remain migrated to static
    // assets (app/shared/assets/*.json) — see AssetsService. Their tables are
    // intentionally not provisioned here.

    // ── Opportunities (venues, events, clubs, routes) ───────────────────────────
    // Sourced from app/shared/assets/{venues,events,clubs,routes}.json, seeded
    // via scripts/seed-opportunities.ts. No GSIs — read via full scan, mirroring
    // the prior JSON-asset access pattern.

    const venues = t('Venues', tableNames.venues, 'id');
    const events = t('Events', tableNames.events, 'id');
    const clubs  = t('Clubs',  tableNames.clubs,  'id');
    const routes = t('Routes', tableNames.routes, 'id');

    // ── Driving legs ──────────────────────────────────────────────────────────

    const drivingLegs = t('DrivingLegs', tableNames.drivingLegs, 'typeId');
    gsi(drivingLegs, 'parentId-index', 'parentId');

    // ── Wishlists ─────────────────────────────────────────────────────────────

    const wishlists = t('Wishlists', tableNames.wishlists, 'id');
    gsi(wishlists, 'parentId-index', 'parentId');

    const wishlistItems = t('WishlistItems', tableNames.wishlistItems, 'id');
    gsi(wishlistItems, 'wishlistId-index', 'wishlistId');

    // ── Visit intentions ("Remind Me") + opportunity interactions (visited/not interested) ─────

    const visitIntentions = t('VisitIntentions', tableNames.visitIntentions, 'id');
    gsi(visitIntentions, 'parentId-index', 'parentId');

    const opportunityInteractions = t('OpportunityInteractions', tableNames.opportunityInteractions, 'id');
    gsi(opportunityInteractions, 'parentId-index', 'parentId');

    // ── Shared tips ("Share A Tip" submissions from parents) ────────────────────

    const sharedTips = t('SharedTips', tableNames.sharedTips, 'id');
    gsi(sharedTips, 'parentId-index', 'parentId');

    // ── Uploads bucket (private; objects reached via presigned URLs only) ───────

    this.uploadsBucket = new s3.Bucket(this, 'UploadsBucket', {
      bucketName:        props.config.uploadsBucketName,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption:        s3.BucketEncryption.S3_MANAGED,
      enforceSSL:        true,
      removalPolicy:     removal,
      autoDeleteObjects: props.config.env !== 'prod',
      // Browser/web clients PUT straight to S3 with a presigned URL (native apps don't need CORS).
      cors: [{
        allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET],
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
        maxAge:         3000,
      }],
      lifecycleRules: [{ abortIncompleteMultipartUploadAfter: cdk.Duration.days(1) }],
    });

    new cdk.CfnOutput(this, 'UploadsBucketName', {
      value:      this.uploadsBucket.bucketName,
      exportName: `${props.config.prefix('uploads')}-bucket-name`,
    });

    this.tables = {
      users,
      parents,
      children,
      venues,
      events,
      clubs,
      routes,
      drivingLegs,
      wishlists,
      wishlistItems,
      visitIntentions,
      opportunityInteractions,
      sharedTips,
    };

    // ── Outputs ───────────────────────────────────────────────────────────────

    Object.entries(this.tables).forEach(([key, table]) => {
      new cdk.CfnOutput(this, `Table${key}Name`, {
        value: table.tableName,
        exportName: `${props.config.prefix(key)}-table-name`,
      });
    });
  }
}
