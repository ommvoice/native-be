/// <reference types="node" />
import "dotenv/config";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// ── DynamoDB client ────────────────────────────────────────────────────────────

const client = new DynamoDBClient({
  region: process.env.AWS_REGION ?? "eu-west-2",
  ...(process.env.DYNAMODB_ENDPOINT ? { endpoint: process.env.DYNAMODB_ENDPOINT } : {}),
});

export const db = DynamoDBDocumentClient.from(client, {
  marshallOptions:   { removeUndefinedValues: true },
  unmarshallOptions: { wrapNumbers: false },
});

export default db;

// ── Table name resolution ──────────────────────────────────────────────────────
//
// Priority order:
//   1. DYNAMODB_TABLE_PREFIX env var (backward-compat, e.g. "native-be")
//   2. APP_NAME + APP_ENV (CDK naming: "{APP_NAME}-{APP_ENV}-{table}")
//
// Set in .env:
//   APP_NAME=native-be
//   APP_ENV=dev              # matches CDK --context env=dev
//   # OR legacy:
//   DYNAMODB_TABLE_PREFIX=native-be-dev

const APP_NAME = process.env.APP_NAME ?? "native-be";
const APP_ENV  = process.env.APP_ENV  ?? "dev";
const PREFIX   = `${APP_NAME}-${APP_ENV}`;

const t = (name: string) => `${PREFIX}-${name}`;

export const TABLES = {
  users:                    t("users"),
  parents:                  t("parents"),
  children:                 t("children"),
  interestCategories:       t("interest-categories"),
  skills:                   t("skills"),
  skillLevels:              t("skill-levels"),
  facilities:               t("facilities"),
  opportunityVenues:        t("opportunity-venues"),
  opportunityEvents:        t("opportunity-events"),
  opportunityClubs:         t("opportunity-clubs"),
  opportunityRoutes:        t("opportunity-routes"),
  drivingLegs:              t("driving-legs"),
  wishlists:                t("wishlists"),
  wishlistItems:            t("wishlist-items"),
  opportunityClubsV2:       t("opportunity-clubs-v2"),
  opportunityEventsV2:      t("opportunity-events-v2"),
  opportunityVenuesV2:      t("opportunity-venues-v2"),
  opportunityRoutesV2:      t("opportunity-routes-v2"),
  opportunityThemes:        t("opportunity-themes"),
  opportunityThemeVariants: t("opportunity-theme-variants"),
} as const;

// ── Shared types ───────────────────────────────────────────────────────────────

export type OpportunityRecordType = "venue" | "event" | "club" | "route";
export type FacilityType          = "GENERAL" | "PARENT" | "KID" | "DOG";
