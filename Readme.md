# native-be

Serverless REST API for the Native Family app.
Built with **AWS Lambda + API Gateway + DynamoDB**, deployed via **AWS CDK** (TypeScript).

---

## Architecture

```
API Gateway (REST)
    └── Lambda per route   ← app/lambdas/
        ├── Middy middleware (auth, validation, error handling)
        ├── Services        ← app/services/
        └── Repositories    ← app/repositories/
            └── DynamoDB (20 tables)

Infrastructure as Code ← cdk/
    ├── CognitoStack – User Pool + Client (IDs auto-injected into Lambdas as env vars)
    ├── TableStack   – all DynamoDB tables
    ├── LambdaStack  – all Lambda functions + shared Layer
    └── ApiStack     – API Gateway routes

Seed scripts ← seed/
    └── runs against the deployed DynamoDB tables
```

All resource names are generated from `{appName}-{env}-{resource}` — nothing is hardcoded.

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | Runtime for CDK, seeds, and local dev |
| npm | 10+ | Package manager |
| AWS CLI | v2 | Credentials for CDK deployments |
| AWS CDK | (installed via `cdk/node_modules`) | Infrastructure deployment |
| Docker | optional | Run DynamoDB locally |

> **AWS credentials** must be configured before running any deploy command.
> Run `aws configure` or set `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` env vars.

---

## 1 — Install all dependencies (single command)

Installs packages in three locations: project root, `cdk/`, and `layers/`.

```bash
npm run install:all
```

This is equivalent to:
```bash
npm install            # root — seed scripts, dev tools, Lambda type definitions
npm install --prefix cdk     # CDK toolkit and constructs
npm install --prefix layers  # packages bundled into the Lambda shared layer
```

---

## 2 — Environment variables

Create a `.env` file in the project root:

```env
# ── AWS ────────────────────────────────────────────────────────────────────────
AWS_REGION=eu-west-2
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key

# ── App / CDK naming (must match --context values used in deploy commands) ─────
APP_NAME=native-be
APP_ENV=dev          # dev | staging | prod

# ── Auth (AWS Cognito) ─────────────────────────────────────────────────────────
# NOTE: COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID are NOT needed here.
# The CognitoStack creates the User Pool and Client automatically on deploy,
# and CDK injects both IDs directly into Lambda environment variables.
# After deploying you can look them up in CloudFormation Outputs if needed.

# ── External services ─────────────────────────────────────────────────────────
MAPBOX_ACCESS_TOKEN=pk.xxxxxx
WEATHER_API_KEY=xxxxxxxx

# ── Local DynamoDB (optional — omit to use real AWS DynamoDB) ─────────────────
# DYNAMODB_ENDPOINT=http://localhost:8000
```

> **Seed scripts** read `APP_NAME` + `APP_ENV` to compute table names, e.g.
> `APP_NAME=native-be APP_ENV=dev` → tables are `native-be-dev-users`, `native-be-dev-parents`, etc.
> These must match the `--context env=dev` used when deploying.

---

## 3 — Bootstrap CDK (one-time per AWS account/region)

CDK needs a bootstrap stack in your AWS account before the first deploy.
Only required once per account + region combination.

```bash
npm run cdk:bootstrap
```

---

## 4 — Deploy

Deploy all three stacks (tables → lambdas → API Gateway) with a single command.

```bash
# Development environment
npm run deploy:dev

# Staging
npm run deploy:staging

# Production
npm run deploy:prod
```

CDK will print the **API base URL** at the end of the deploy, e.g.:
```
Outputs:
native-be-dev-api-stack.ApiUrl = https://xxxxxxxxxx.execute-api.eu-west-2.amazonaws.com/dev/
```

---

## 5 — Seed data

After tables are created by the deploy, load all reference and opportunity data.

```bash
# Seed all data (reference data + opportunities + demo user) — run after deploy
APP_ENV=dev npm run seed:all
```

Individual seed commands (run in dependency order if seeding manually):

```bash
npm run seed:interests     # interest categories
npm run seed:facilities    # facility types
npm run seed:themes        # opportunity themes + variants (all 7 interest groups)
npm run seed:skills        # skills (depends on themes)
npm run seed:opp-themes    # opportunity themes legacy table
npm run seed:opp-v2:clubs  # opportunity clubs (v2)
npm run seed:opp-v2:events # opportunity events (v2)
npm run seed:opp-v2:routes # opportunity routes (v2)
npm run seed:opp-v2:venues # opportunity venues (v2)

# Optional demo / test data
npm run seed:demo-user     # demo parent + children (requires seed:all first)
npm run seed:demo-rec      # recommendation demo data
npm run seed:demo-swagger  # 50 corridor opportunities for Swagger testing
```

All seed scripts are **idempotent** — safe to re-run without creating duplicates.

---

## 6 — Deploy + seed in one command

```bash
npm run up:dev       # deploy:dev + seed:all (APP_ENV=dev)
npm run up:staging   # deploy:staging + seed:all (APP_ENV=staging)
npm run up:prod      # deploy:prod only (no auto-seed in production)
```

---

## 7 — Destroy

Tear down all three stacks in a single command.

```bash
npm run destroy:dev      # removes all native-be-dev-* resources
npm run destroy:staging
npm run destroy:prod     # use carefully — tables are RETAINED in prod
```

> Tables in `prod` have `removalPolicy: RETAIN` — they will **not** be deleted on destroy.
> Tables in `dev`/`staging` are deleted automatically.

---

## Project structure

```
native-be-lambda-v0/
├── app/                        # Lambda application code
│   ├── lambdas/                # Lambda handlers (one file per API operation)
│   │   ├── auth/               # register, login, me
│   │   ├── children/           # create, get, update, update-interests
│   │   ├── parents/            # get, update-search-radius, update-interests
│   │   ├── onboard-parents/    # onboard
│   │   ├── users/              # get-me
│   │   ├── interests/          # list-categories, list-sub-categories
│   │   ├── skills/             # list
│   │   ├── themes/             # list, list-variants
│   │   ├── facilities/         # list
│   │   ├── opportunity/        # venues-v2, events-v2, clubs-v2, routes-v2
│   │   ├── recommendations-v2/ # get, nearby
│   │   ├── wishlists/          # list, create
│   │   ├── search/             # search
│   │   └── weather/            # get
│   ├── repositories/           # DynamoDB data access
│   ├── services/               # Business logic
│   ├── schemas/                # Yup validation schemas
│   ├── dtos/                   # TypeScript types / interfaces
│   └── shared/
│       ├── config/env.ts       # Typed environment variable access
│       ├── db/                 # DynamoDB client, table names, helpers
│       ├── errors/             # AppError class
│       ├── middleware/         # Middy: auth, body-validator, error-handler
│       └── utils/              # response builder, logger
│
├── cdk/                        # AWS CDK infrastructure
│   ├── bin/app.ts              # CDK app entry point
│   ├── lib/
│   │   ├── config/app-config.ts   # Central config — all resource names
│   │   ├── constructs/            # Reusable ApiLambda construct
│   │   └── stacks/
│   │       ├── table-stack.ts     # 20 DynamoDB tables
│   │       ├── lambda-stack.ts    # ~35 Lambda functions + Layer
│   │       └── api-stack.ts       # REST API Gateway
│   └── cdk.json
│
├── layers/                     # Lambda shared layer
│   └── package.json            # @middy/*, yup, uuid, aws-jwt-verify, etc.
│
├── seed/                       # DynamoDB seed scripts
│   ├── config/db.ts            # DynamoDB client + table names for seeds
│   ├── lib/                    # Reusable seed helpers
│   ├── themes/                 # Theme seed files (7 interest groups)
│   ├── variants/               # Theme variant seed files
│   ├── opportunity/            # v2 opportunity data (clubs, events, routes, venues)
│   ├── demo/                   # Demo user, recommendations, swagger corridor
│   └── index.ts                # Master seed runner (all 9 steps)
│
├── scripts/                    # Local DynamoDB table setup (optional)
│   ├── setup-dynamodb-tables.ts
│   └── destroy-dynamodb-tables.ts
│
├── .env                        # Not committed — see section 2
├── package.json
└── Readme.md
```

---

## API routes

All routes are prefixed with the stage name, e.g. `https://xxx.execute-api.eu-west-2.amazonaws.com/dev/`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | — | Create account |
| POST | `/auth/login` | — | Login, returns JWT |
| GET | `/auth/me` | JWT | Logged-in user |
| GET | `/users/me` | JWT | User + parent profile |
| POST | `/onboard-parents` | — | Register parent + children |
| GET | `/parents/{id}` | JWT | Parent profile |
| PUT | `/parents/{id}/search-radius` | JWT | Update search radius |
| PUT | `/parents/{id}/interests` | JWT | Update interest preferences |
| POST | `/children` | JWT | Add child |
| GET | `/children/{id}` | JWT | Get child |
| PUT | `/children/{id}` | JWT | Update child |
| PUT | `/children/{id}/interests` | JWT | Update child interests |
| GET | `/interests/categories` | — | All interest categories |
| GET | `/interests/sub-categories` | — | Sub-categories (filter: `?categoryId=`) |
| GET | `/skills` | — | All skills |
| GET | `/themes` | — | All themes |
| GET | `/themes/variants` | — | All theme variants (filter: `?themeId=`) |
| GET | `/facilities` | — | All facilities |
| GET | `/opportunity/venues` | — | Venues list (v2) |
| GET | `/opportunity/venues/{id}` | — | Single venue |
| GET | `/opportunity/events` | — | Events list (v2) |
| GET | `/opportunity/events/{id}` | — | Single event |
| GET | `/opportunity/clubs` | — | Clubs list (v2) |
| GET | `/opportunity/clubs/{id}` | — | Single club |
| GET | `/opportunity/routes` | — | Routes list (v2) |
| GET | `/opportunity/routes/{id}` | — | Single route |
| GET | `/recommendations-v2?parentId=` | JWT | Scored recommendations |
| GET | `/recommendations-v2/nearby?parentId=` | JWT | Nearby recommendations |
| GET | `/wishlists?parentId=` | JWT | Parent's wishlists |
| POST | `/wishlists` | JWT | Create wishlist |
| GET | `/search?parentId=` | JWT | Search opportunities |
| GET | `/weather?postcode=` | — | Weather by postcode |

---

## All npm commands

```bash
# Install
npm run install:all          # install root + cdk/ + layers/ in one command

# CDK
npm run cdk:bootstrap        # one-time AWS account bootstrap
npm run cdk:synth            # preview CloudFormation output

# Deploy (creates/updates all AWS resources)
npm run deploy:dev
npm run deploy:staging
npm run deploy:prod

# Destroy (removes all AWS resources)
npm run destroy:dev
npm run destroy:staging
npm run destroy:prod

# Deploy + seed in one command
npm run up:dev               # deploy dev, then seed:all
npm run up:staging           # deploy staging, then seed:all

# Seed (run after deploy, requires .env with APP_ENV set)
npm run seed:all             # run all seed steps in order
npm run seed:interests
npm run seed:facilities
npm run seed:skills
npm run seed:themes
npm run seed:variants
npm run seed:opp-v2:clubs
npm run seed:opp-v2:events
npm run seed:opp-v2:routes
npm run seed:opp-v2:venues
npm run seed:demo-user
npm run seed:demo-rec
npm run seed:demo-swagger

# Tests
npm test
npm run test:watch
```

---

## Error responses

All errors return structured JSON:

```json
{ "error": "Human-readable message" }
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request / invalid input |
| 401 | Missing or expired JWT |
| 404 | Resource not found |
| 409 | Conflict (e.g. email already exists) |
| 422 | Validation failed (body/query schema) |
| 500 | Unexpected server error |

---

## Local DynamoDB (optional)

To develop seed scripts against a local DynamoDB instance instead of AWS:

```bash
# 1. Start DynamoDB Local via Docker
docker run -p 8000:8000 amazon/dynamodb-local

# 2. Add to .env
DYNAMODB_ENDPOINT=http://localhost:8000
AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=local

# 3. Create tables locally (uses scripts/ not CDK)
npx tsx scripts/setup-dynamodb-tables.ts

# 4. Seed
npm run seed:all
```
