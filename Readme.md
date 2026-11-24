# native-be

Serverless REST API for the Native Family app: **API Gateway + Lambda + DynamoDB + Cognito**, deployed with **AWS CDK** (TypeScript).

---

## Where it runs

The same code is deployed to two AWS accounts, each with a `uat` and a `prod` stage. A target is `<account>:<stage>`, and you pick it by the npm script you run (for example `npm run deploy:technit:uat`).

| Target | AWS account | Region | AWS profile | API URL (used by the app) |
|---|---|---|---|---|
| `technit:uat` | 664876795774 | eu-west-3 | `cdk_profile_fo9` | `https://api-family-uat.reporting-tool.co.uk` (app dev builds) |
| `native:uat` | 437039341434 | us-east-1 | `cdk_profile_native` | `https://api-family-uat.api.native-app.com` (app release builds) |
| `technit:prod` | 664876795774 | eu-west-3 | `cdk_profile_fo9` | `https://api-family-prod.reporting-tool.co.uk` (not deployed yet) |
| `native:prod` | 437039341434 | us-east-1 | `cdk_profile_native` | `https://api-family-prod.api.native-app.com` (not deployed yet) |

[cdk/cdk.json](cdk/cdk.json) groups the context by account, then stage: `{ "technit": { "uat": {…}, "prod": {…} }, "native": { "uat": {…}, "prod": {…} } }`. Each stage block has its own account, profile, region, domain, certificate, sender email and `enableWaf` setting. The prod blocks start as copies of uat with `"environment": "prod"` and WAF on.

> **Keep `"environment": "uat"` in both uat blocks.** It names every AWS resource: stacks `native-be-uat-*`, tables `native-be-uat-*`, the user pool and the keys secret. If you change it, CDK builds a new, empty backend with a new user pool, and users can no longer log in to the app.

The custom domains above are mapped to each API by hand in API Gateway; CDK doesn't manage them. The default `execute-api` URL is disabled.

---

## Architecture

```
API Gateway (REST, stage "uat")  ── optional AWS WAF (enableWaf in cdk.json)
  └── Lambda per route            ← app/lambdas/   (routes + permissions: cdk/lib/config/lambda-registry.ts)
        ├── Services              ← app/services/
        └── Repositories          ← app/repositories/  →  DynamoDB

cdk/ (4 stacks, deployed in this order)
  ├── native-be-uat-cognito-stack   User Pool + app client (IDs injected into Lambdas)
  ├── native-be-uat-table-stack     DynamoDB tables + uploads S3 bucket
  ├── native-be-uat-lambda-stack    every Lambda + the shared layer (layers/)
  └── native-be-uat-api-stack       API Gateway routes, throttling, WAF
```

- **Third-party API keys** (Mapbox, WeatherAPI, Google Maps) live in **AWS Secrets Manager** as `native-be/uat/third-party` in each account. They aren't stored in `cdk.json` or as Lambda environment variables. See [One-time setup](#one-time-setup-per-account).
- **DynamoDB permissions** are worked out automatically for each Lambda from the code it imports ([cdk/lib/utils/table-usage.ts](cdk/lib/utils/table-usage.ts)).
- **API reference:** the routes are in [cdk/lib/config/lambda-registry.ts](cdk/lib/config/lambda-registry.ts), and [native-be.postman_collection.json](native-be.postman_collection.json) has example requests.

---

## Prerequisites

| Tool | Notes |
|---|---|
| Node.js 20+ | Lambdas run on Node 22 |
| AWS CLI v2 | With the profiles `cdk_profile_fo9` and `cdk_profile_native` in `~/.aws/credentials` |
| **Docker Desktop (running)** | Required to deploy: the shared Lambda layer is built in a container |

Install everything (root, `cdk/` and `layers/`):

```bash
npm run install:all
```

---

## One-time setup per account

You only do these steps once per account, not on every deploy. They're already done for both accounts except where noted.

**1. Bootstrap CDK** (already done in both accounts):

```bash
npm run cdk:bootstrap:technit
npm run cdk:bootstrap:native
```

Bootstrap is per account and region, so a new stage in the same account doesn't need it.

**2. Store the third-party API keys in Secrets Manager.** Create `cdk/secrets.local.json`. It's gitignored, so never commit it:

```json
{
  "technit": { "mapboxAccessToken": "sk....", "weatherApiKey": "...", "googleMapsApiKey": "..." },
  "native":  { "mapboxAccessToken": "sk....", "weatherApiKey": "...", "googleMapsApiKey": "...",
               "prod": { "googleMapsApiKey": "..." } }
}
```

Keys under an account are used by all of its stages. An optional `"uat"` / `"prod"` block inside it overrides individual keys for that stage.

Then push it for each target (key values are never printed). Every stage has its own secret (`native-be/uat/third-party`, `native-be/prod/third-party`):

```bash
npm run secrets:push:technit:uat
npm run secrets:push:native:uat
npm run secrets:push:native:prod      # before the first prod deploy
```

Run the push again only when a key changes, for example after a rotation. Lambdas read the secret when they start, so running instances keep the old key until AWS restarts them; to switch straight away, deploy.

> If the secret is missing, **the deploy still succeeds**, but weather, routing and postcode lookups fail at runtime. Always push it before the first deploy to a new account.

**3. Verify the sender email in SES** (same region as the target). Cognito sends password-reset codes from the `fromEmail` set in `cdk.json`. While SES is in sandbox mode it delivers only to verified addresses, so request SES production access before going live.

---

## Deploy

Do this on every release. Make sure Docker is running, then:

```bash
# 1. Preview what will change (optional, recommended)
npm run cdk:diff:technit:uat

# 2. Deploy all 4 stacks (about 5–10 min)
npm run deploy:technit:uat
```

For the client account, use `npm run cdk:diff:native:uat` and `npm run deploy:native:uat`. Prod deploys (`deploy:<account>:prod`) stop and ask before any IAM or security-group change.

After the deploy:

1. **Smoke-test** the API URL for that target from the table above. For example, log in through the app or Postman and load the Today screen.
2. **If you changed opportunity data**, reseed it (see [Opportunity data](#opportunity-data)).
3. **Deploy the backend before you release an app build that needs it.** The API keeps working with older app builds, so this order is always safe.

**Recommended order for a change:** deploy `technit:uat` → test with an app dev build → deploy `native:uat` → ship the app release.

**First deploy of a prod stage:** push its secret, verify its `fromEmail` in SES, check the certificate covers `api-family-prod.<domain>`, deploy, then map the custom domain in API Gateway to the new API's `prod` stage.

---

## Opportunity data

Venues, events, clubs and routes come from a spreadsheet, go through generated seed files, and become JSON assets in `app/shared/assets/`. They are then loaded into DynamoDB, and the live API reads them from there.

```bash
npm run merge:opportunities      # merge an admin-sheet export into the seed files
npm run export:data-json         # seed files → app/shared/assets/*.json
APP_ENV=technit:uat npm run seed:opportunities
APP_ENV=native:uat  npm run seed:opportunities
```

> `seed:opportunities` **wipes and refills** all four opportunity tables. The app shows no opportunities for the minute or so it takes, so run it against `native:uat` or a prod target at a quiet time.

Full regeneration from the spreadsheet (rarely needed; it loses manual fixes in the seed files): `generate:enums` → `parse:venues-data` / `parse:events-data` / `parse:clubs-data` / `parse:routes-data` → `export:data-json`.

Other data commands:

```bash
APP_ENV=technit:uat npm run seed:community                        # demo community provider (hub screen)
APP_ENV=native:uat  npm run backfill:email-verified -- --dry-run  # list Cognito users that can't reset their password
APP_ENV=native:uat  npm run backfill:email-verified               # …and fix them (idempotent)
npm run images:optimize -- <folder>                               # resize opportunity photos before upload
```

`APP_ENV` is the target, `<account>:<stage>` (default `technit:uat`; a bare `technit` also means `technit:uat`). The data scripts use that target's AWS profile automatically. If your `.env` has `APP_ENV="uat"`, change it to a full target such as `technit:uat` or delete the line.

---

## Destroy — read this first

```bash
npm run destroy:technit:uat
npm run destroy:native:uat
npm run destroy:technit:prod    # asks for confirmation
npm run destroy:native:prod     # asks for confirmation
```

**The uat targets are not protected.** Destroy permanently deletes the DynamoDB tables (all users, families and children) and the Cognito user pool (all logins), without asking. Never run `destroy:native:uat`: that account holds the live app's data.

Prod destroy asks for confirmation, and the prod tables and user pool are kept (RETAIN) even after their stacks are deleted.

---

## All npm commands

| Command | What it does |
|---|---|
| `npm test` / `npm run test:watch` | Unit tests (vitest) |
| `npm run install:all` | Install root + `cdk/` + `layers/` |
| `npm run deploy:<target>` | Deploy all stacks (prod asks before IAM/security changes) |
| `npm run cdk:diff:<target>` | Show what a deploy would change |
| `npm run cdk:synth:<target>` | Generate the CloudFormation templates only |
| `npm run secrets:push:<target>` | Create or update the third-party keys secret |
| `npm run cdk:bootstrap:<account>` | One-time CDK bootstrap of an account (`technit` / `native`) |
| `npm run destroy:<target>` | Delete everything, including uat data (see above) |
| `npm run seed:opportunities` | Reload opportunity tables (`APP_ENV=<target>`) |
| `npm run seed:community` | Seed demo community provider (`APP_ENV=<target>`) |
| `npm run backfill:email-verified` | Fix users who can't reset their password (`APP_ENV=<target>`) |
| `npm run merge:opportunities` / `export:data-json` | Opportunity data pipeline |
| `npm run generate:enums` / `parse:*-data` | Full regeneration from the spreadsheet |
| `npm run images:optimize` | Resize/re-encode opportunity images |
| `npm run test:recommendations` / `test:recommendationsV3` | Run the scoring locally against live tables |
| `npm run explain:opportunity` | Explain why one opportunity scores/filters the way it does |
| `npm run audit:schedule` / `audit:weather` | Check every opportunity against the schedule/weather rules |

`<target>` is `technit:uat`, `technit:prod`, `native:uat` or `native:prod`.

---

## Adding another account

1. Add a profile for the account to `~/.aws/credentials`.
2. In [cdk/cdk.json](cdk/cdk.json), copy an account block (for example `"native"` with its `uat` / `prod` stages) under a new name and set `awsAccountId`, `awsProfileName`, `awsProfileRegion`, `domain`, `hostedZoneId`, `certificateArn` and `fromEmail` in each stage.
3. Copy the `…:native…` scripts in [package.json](package.json), replacing `native` with the new name and the profile.
4. Add the new name to `cdk/secrets.local.json`.
5. Run `cdk:bootstrap:<name>`, then `secrets:push:<name>:uat`, then `deploy:<name>:uat`.
6. Create the custom domain in API Gateway and map it to the new API's stage (`uat` or `prod`).

A new stage (for example `"dev"`) is a new block inside an account plus its scripts. The block's key is also its `environment` unless the block sets one. A new name means new, empty resources.

> An environment named `prod` makes CDK keep (RETAIN) the tables and user pool when you run destroy.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Cannot connect to the Docker daemon` during deploy | Start Docker Desktop |
| `Need to perform AWS calls for account …, but the current credentials are for …` | The profile doesn't match the target. Use the npm scripts, which pass the right `--profile` |
| `Context variable missing on CDK command` | You ran `cdk` directly. Use the npm scripts, which pass `--context config=<account>:<stage>` |
| Weather/directions return 500 after deploy | The keys secret is missing in that account. Run `npm run secrets:push:<target>` |
| `No CDK context "…" in cdk/cdk.json` from a data script | Set `APP_ENV=technit:uat` (or another target). `"uat" is a stage, not an account` means `.env` still has `APP_ENV="uat"` |
| Password-reset email never arrives | Verify the sender in SES (region of the target), or request SES production access |

---

## Project structure

```
native-be-lambda-v0/
├── app/
│   ├── lambdas/        one folder per API area (auth, parents, children, plan, wishlists, …)
│   ├── services/       business logic
│   ├── repositories/   DynamoDB access
│   ├── schemas/        yup request validation
│   └── shared/         auth helpers, config (env, secrets), db, middleware, JSON assets
├── cdk/
│   ├── bin/app.ts      CDK entry point
│   ├── lib/config/     app-config, lambda-registry (routes), cognito/api/lambda settings
│   ├── lib/stacks/     cognito, table, lambda, api stacks
│   ├── cdk.json        targets: technit / native → uat / prod
│   └── secrets.local.json   third-party keys — gitignored, never commit
├── layers/             shared Lambda layer dependencies
├── scripts/            seed, data pipeline, audits, secret push
└── seed/               generated opportunity seed data + seed config
```
