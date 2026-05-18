# native-be

Backend API built with Express + TypeScript using AWS DynamoDB for storage.

---

## Prerequisites

- Node.js 18+
- AWS account **or** [DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html) for offline development

---

## Environment Variables

Create a `.env` file in the project root. Required keys:

```env
# AWS credentials (real AWS or local dummy values for DynamoDB Local)
AWS_REGION=eu-west-2
AWS_ACCESS_KEY_ID=your_key_id
AWS_SECRET_ACCESS_KEY=your_secret_key

# Optional: point at DynamoDB Local instead of real AWS
DYNAMODB_ENDPOINT=http://localhost:8000

# Optional: prefix for all table names (default: native-be)
DYNAMODB_TABLE_PREFIX=native-be

# Auth
COGNITO_USER_POOL_ID=your_pool_id
COGNITO_CLIENT_ID=your_client_id

# Other services
MAPBOX_ACCESS_TOKEN=your_token
WEATHER_API_KEY=your_key
```

When using **DynamoDB Local**, you can use any dummy values for `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.

---

## Running DynamoDB Locally

Download and start DynamoDB Local (one-time setup):

```bash
# Using Docker (easiest)
docker run -p 8000:8000 amazon/dynamodb-local

# Or download the JAR from AWS and run:
java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb
```

Then add to `.env`:

```env
DYNAMODB_ENDPOINT=http://localhost:8000
```

---

## 1. Create DynamoDB Tables

Run this once before starting the server (or any time tables are missing):

```bash
npm run setup:db
```

To **drop** all tables (useful when resetting local state):

```bash
npm run destroy:db
```

Tables that don't exist are skipped. Re-run `setup:db` afterwards to recreate them.

---

This creates all 15 tables (`users`, `parents`, `children`, `interest-categories`, `interest-sub-categories`, `skills`, `skill-levels`, `facilities`, `opportunity-venues`, `opportunity-events`, `opportunity-clubs`, `opportunity-routes`, `driving-legs`, `wishlists`, `wishlist-items`) with the correct indexes. Existing tables are skipped automatically.

---

## 2. Seed Data

Run seed scripts in this order (each is independent but interests must come before skills and opportunities):

```bash
# 1. Interest categories + sub-categories
npm run seed:interests

# 2. Skills
npm run seed:skills

# 3. Opportunity venues, events, clubs, routes
npm run seed:opportunities

# 4. Recommendation demo data (optional, for testing recommendations)
npm run seed:rec-demo

# 5. Swagger corridor demo data (optional)
npm run seed:swagger-corridor
```

All seed scripts are safe to re-run — they upsert rather than duplicate.

---

## 3. Run the Server

**Development** (auto-restarts on file changes):

```bash
npm run dev
```

**Production**:

```bash
npm start
```

The API starts on `http://localhost:3000` by default.

---

## Running Tests

```bash
# Run all tests once
npm test

# Watch mode
npm run test:watch
```

---

## Quick Start (local DynamoDB)

```bash
# 1. Start DynamoDB Local (Docker)
docker run -p 8000:8000 amazon/dynamodb-local

# 2. Install dependencies
npm install

# 3. Create tables
npm run setup:db

# 4. Seed data
npm run seed:interests
npm run seed:skills
npm run seed:opportunities

# 5. Start the server
npm run dev
```
