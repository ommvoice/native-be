import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import type { AppConfig } from '../config/app-config';

export interface TableStackProps extends cdk.StackProps {
  config: AppConfig;
}

/** All DynamoDB tables — named from config.tableNames so no value is hardcoded. */
export class TableStack extends cdk.Stack {
  readonly tables: Record<string, dynamodb.Table>;

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

    // NOTE: interestCategories, skills, skillLevels, facilities, the legacy
    // opportunityVenues/Events/Clubs/Routes tables, their V2 counterparts, and
    // opportunityThemes/opportunityThemeVariants have all been migrated to
    // static assets (app/shared/assets/*.json) — see AssetsService. Their
    // tables are intentionally no longer provisioned here.

    // ── Driving legs ──────────────────────────────────────────────────────────

    const drivingLegs = t('DrivingLegs', tableNames.drivingLegs, 'typeId');
    gsi(drivingLegs, 'parentId-index', 'parentId');

    // ── Wishlists ─────────────────────────────────────────────────────────────

    const wishlists = t('Wishlists', tableNames.wishlists, 'id');
    gsi(wishlists, 'parentId-index', 'parentId');

    const wishlistItems = t('WishlistItems', tableNames.wishlistItems, 'id');
    gsi(wishlistItems, 'wishlistId-index', 'wishlistId');

    this.tables = {
      users,
      parents,
      children,
      drivingLegs,
      wishlists,
      wishlistItems,
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
