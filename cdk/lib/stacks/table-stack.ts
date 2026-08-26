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
