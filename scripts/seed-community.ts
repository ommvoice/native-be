/// <reference types="node" />
/**
 * Seeds one demo "community" provider — CTCRM Lympstone's Gordon Messenger Centre — across the
 * providers / providerTeamMembers / communityFixedOpportunities / communityFluidOpportunities /
 * opportunityTeamAssignments tables, so the community hub screen has something real to render
 * against `affiliatedBaseId: "BASE-N007"` (CTCRM Lympstone in the RN app's bundled
 * src/lib/constants/militaryBases.ts).
 *
 * Usage: APP_ENV=dev npx tsx scripts/seed-community.ts
 * (APP_ENV defaults to "dev" — see seed/config/index.ts for how the table prefix/region are
 * resolved from cdk/cdk.json context.)
 *
 * By default this only upserts (Put — insert new ids, fully overwrite matching ones); it never
 * deletes anything, so rows whose id isn't in the current data are left behind as orphans. Pass
 * one of the flags below to also/instead clear the community tables first — clearing is a full
 * table scan + batch-delete (DynamoDB has no truncate), so it's O(table size) and irreversible:
 *
 *   --clear        Delete every existing row in each community table, then seed as normal.
 *   --clear-only   Delete every existing row and stop — does not reseed afterwards.
 *
 * Clearing "prod" additionally requires --force-prod, so a stray --clear against the wrong
 * APP_ENV can't wipe production by accident.
 */
import { BatchWriteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { db, TABLES, environment } from '../seed/config/index.js';

const BATCH_WRITE_MAX = 25;

const args        = process.argv.slice(2);
const shouldClear  = args.includes('--clear') || args.includes('--clear-only');
const clearOnly    = args.includes('--clear-only');
const forceProd    = args.includes('--force-prod');

const now = new Date().toISOString();

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ── Demo data ────────────────────────────────────────────────────────────────

const PROVIDER_ID = 'provider-gmc';

const providers: Record<string, unknown>[] = [
  {
    id: PROVIDER_ID,
    organizationName: 'Gordon Messenger Centre',
    organizationType: 'military_base_community_centre',
    description:
      "The Gordon Messenger Centre is the heart of community life at CTCRM Lympstone. Named after Corporal Gordon Messenger VC, we've been supporting Royal Marines families since 1985. Our welcoming centre offers activities for all ages, welfare support, social events and a café. Whether you're newly posted or a long-standing member of our Corps family, we're here to help you thrive.",
    logoUrl: null,
    websiteUrl: 'https://www.royalmarines.mod.uk/community',
    contactEmail: 'gordonmessenger@ctcrm.mod.uk',
    contactPhone: '01395 264180',
    contactName: 'Lisa Joy',
    addressLine1: 'The Gordon Messenger Centre',
    addressLine2: 'Commando Training Centre Royal Marines',
    city: 'Lympstone, Exmouth',
    postcode: 'EX8 5AR',
    country: 'UK',
    latitude: null,
    longitude: null,
    serviceBranch: 'navy',
    affiliatedBaseId: 'BASE-N007',
    isVerified: true,
    createdAt: now,
    updatedAt: now,
  },
];

const communityFixedOpportunities: Record<string, unknown>[] = [
  {
    id: 'fix-1',
    providerId: PROVIDER_ID,
    name: 'Little Commandos Playgroup',
    description: 'Fun-filled sensory play, songs and social time for babies and toddlers. A great way to meet other parents!',
    category: 'childcare',
    subcategory: 'playgroup',
    openingHours: { monday: '09:30-11:30', wednesday: '09:30-11:30' },
    address: 'Gordon Messenger Centre',
    city: 'Exmouth',
    postcode: 'EX8 5AR',
    isFree: true,
    priceInfo: null,
    minAge: 0,
    maxAge: 4,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'fix-2',
    providerId: PROVIDER_ID,
    name: 'Homework Club',
    description: 'Quiet space with support available for children to complete homework. Snacks provided.',
    category: 'education',
    subcategory: 'study',
    openingHours: { monday: '15:30-17:00', wednesday: '15:30-17:00', thursday: '15:30-17:00' },
    address: 'Gordon Messenger Centre',
    city: 'Exmouth',
    postcode: 'EX8 5AR',
    isFree: true,
    priceInfo: null,
    minAge: 5,
    maxAge: 16,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'fix-3',
    providerId: PROVIDER_ID,
    name: 'Youth Drop-In',
    description: 'Games, activities and chill-out space for teens. Pool table, Xbox, art supplies and more!',
    category: 'youth',
    subcategory: 'club',
    openingHours: { friday: '18:00-20:30' },
    address: 'Gordon Messenger Centre',
    city: 'Exmouth',
    postcode: 'EX8 5AR',
    isFree: true,
    priceInfo: null,
    minAge: 11,
    maxAge: 17,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'fix-4',
    providerId: PROVIDER_ID,
    name: 'Coffee & Connect',
    description: 'Drop in for a cuppa, cake and conversation. A relaxed space to meet other families and get information about local services.',
    category: 'social',
    subcategory: 'drop-in',
    openingHours: { tuesday: '09:30-11:30', thursday: '09:30-11:30' },
    address: 'Gordon Messenger Centre',
    city: 'Exmouth',
    postcode: 'EX8 5AR',
    isFree: true,
    priceInfo: null,
    minAge: null,
    maxAge: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'fix-5',
    providerId: PROVIDER_ID,
    name: 'Fitness Bootcamp',
    description: 'High-energy workout for all fitness levels. Childcare available during sessions. Led by qualified PTI.',
    category: 'fitness',
    subcategory: 'exercise',
    openingHours: { tuesday: '18:30-19:30', saturday: '09:00-10:00' },
    address: 'CTCRM Sports Hall',
    city: 'Exmouth',
    postcode: 'EX8 5AR',
    isFree: false,
    priceInfo: '£3 per session',
    minAge: 16,
    maxAge: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'fix-6',
    providerId: PROVIDER_ID,
    name: 'Baby Massage Class',
    description: 'Learn gentle massage techniques to soothe and bond with your baby. 4-week course for babies 6 weeks to crawling.',
    category: 'parenting',
    subcategory: 'class',
    openingHours: { friday: '10:00-11:00' },
    address: 'Gordon Messenger Centre',
    city: 'Exmouth',
    postcode: 'EX8 5AR',
    isFree: false,
    priceInfo: '£20 for 4-week course',
    minAge: 0,
    maxAge: 1,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'fix-7',
    providerId: PROVIDER_ID,
    name: 'Craft & Chat',
    description: 'Bring your own project or join our weekly craft activity. All materials provided. Tea and biscuits included!',
    category: 'social',
    subcategory: 'craft',
    openingHours: { wednesday: '13:00-15:00' },
    address: 'Gordon Messenger Centre',
    city: 'Exmouth',
    postcode: 'EX8 5AR',
    isFree: true,
    priceInfo: null,
    minAge: null,
    maxAge: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
];

const communityFluidOpportunities: Record<string, unknown>[] = [
  {
    id: 'fluid-1',
    providerId: PROVIDER_ID,
    name: 'Family Christmas Party',
    description: "Join us for festive fun! Santa's grotto, craft activities, games, refreshments and a special gift for every child.",
    category: 'social',
    subcategory: 'party',
    startDate: addDays(30),
    endDate: addDays(30),
    eventTimes: { start: '14:00', end: '17:00' },
    venueName: 'Gordon Messenger Centre',
    address: 'CTCRM Lympstone',
    city: 'Exmouth',
    isFree: true,
    priceInfo: null,
    requiresBooking: true,
    isActive: true,
    isExpired: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'fluid-2',
    providerId: PROVIDER_ID,
    name: 'New Year Family Brunch',
    description: 'Start the new year together! Full cooked breakfast, pastries, fresh fruit and unlimited hot drinks for the whole family.',
    category: 'social',
    subcategory: 'brunch',
    startDate: addDays(45),
    endDate: addDays(45),
    eventTimes: { start: '10:00', end: '12:00' },
    venueName: 'Gordon Messenger Centre',
    address: 'CTCRM Lympstone',
    city: 'Exmouth',
    isFree: false,
    priceInfo: '£5 per family',
    requiresBooking: true,
    isActive: true,
    isExpired: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'fluid-3',
    providerId: PROVIDER_ID,
    name: 'Winter Woodland Walk',
    description: 'Guided family nature walk on Woodbury Common. Spot wildlife, collect natural treasures and warm up with hot chocolate afterwards!',
    category: 'outdoors',
    subcategory: 'walk',
    startDate: addDays(52),
    endDate: addDays(52),
    eventTimes: { start: '10:30', end: '12:30' },
    venueName: 'Woodbury Common',
    address: 'Meet at Gordon Messenger Centre car park',
    city: 'Exmouth',
    isFree: true,
    priceInfo: null,
    requiresBooking: false,
    isActive: true,
    isExpired: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'fluid-4',
    providerId: PROVIDER_ID,
    name: 'Deployment Support Workshop',
    description: 'Practical tips and emotional support for families with a partner about to deploy. Childcare provided.',
    category: 'welfare',
    subcategory: 'workshop',
    startDate: addDays(60),
    endDate: addDays(60),
    eventTimes: { start: '19:00', end: '21:00' },
    venueName: 'Gordon Messenger Centre',
    address: 'CTCRM Lympstone',
    city: 'Exmouth',
    isFree: true,
    priceInfo: null,
    requiresBooking: true,
    isActive: true,
    isExpired: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'fluid-5',
    providerId: PROVIDER_ID,
    name: 'Half Term Cinema Day',
    description: 'Family film afternoon with popcorn and drinks. Two screenings: 10am (U-rated) and 2pm (PG). Bring blankets and cushions!',
    category: 'entertainment',
    subcategory: 'cinema',
    startDate: addDays(90),
    endDate: addDays(90),
    eventTimes: { start: '10:00', end: '16:00' },
    venueName: 'Gordon Messenger Centre',
    address: 'CTCRM Lympstone',
    city: 'Exmouth',
    isFree: false,
    priceInfo: '£2 per person',
    requiresBooking: true,
    isActive: true,
    isExpired: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'fluid-6',
    providerId: PROVIDER_ID,
    name: "Valentine's Parents Night Out",
    description: "Date night for couples! We'll look after the kids (ages 4-12) with pizza, games and a movie while you enjoy an evening off.",
    category: 'social',
    subcategory: 'date-night',
    startDate: addDays(95),
    endDate: addDays(95),
    eventTimes: { start: '18:00', end: '22:00' },
    venueName: 'Gordon Messenger Centre',
    address: 'CTCRM Lympstone',
    city: 'Exmouth',
    isFree: false,
    priceInfo: '£10 per child',
    requiresBooking: true,
    isActive: true,
    isExpired: false,
    createdAt: now,
    updatedAt: now,
  },
];

const providerTeamMembers: Record<string, unknown>[] = [
  {
    id: 'team-1',
    providerId: PROVIDER_ID,
    name: 'Lisa Joy',
    role: 'Community Centre Manager',
    bio: "I've led The Gordon Messenger Centre for 8 years. As a Navy spouse who's experienced 6 postings, I understand the rollercoaster of service life. My door is always open - whether you need practical help or just a friendly ear. I'm passionate about creating a community where every family feels they belong.",
    avatarUrl: null,
    email: 'lisa.joy@ctcrm.mod.uk',
    workMobile: '07700 900123',
    militaryAssociations: ['Royal Navy Spouse', 'HIVE Trained', 'Safeguarding Lead'],
    talkToMeAbout: ['New arrivals & settling in', 'Community events', 'School transitions', 'Volunteering opportunities'],
    isPastoralTeam: false,
    isAggie: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'team-2',
    providerId: PROVIDER_ID,
    name: 'Sarah Mitchell',
    role: 'Children & Youth Coordinator',
    bio: "I run all our programmes for children and young people - from baby groups to teen activities. I'm a qualified Early Years practitioner and youth worker with 12 years' experience. I especially love helping military children build resilience and friendships that last beyond the next posting!",
    avatarUrl: null,
    email: 'sarah.mitchell@ctcrm.mod.uk',
    workMobile: '07700 900124',
    militaryAssociations: ['Army Veteran (RLC)', 'Paediatric First Aid'],
    talkToMeAbout: ['Playgroups & activities', 'Youth club', 'Holiday programmes', 'SEN support for children'],
    isPastoralTeam: false,
    isAggie: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'team-3',
    providerId: PROVIDER_ID,
    name: 'Tom Williams',
    role: 'Family Welfare Officer',
    bio: "After 22 years in the Royal Marines, I now support families through the unique challenges of military life. I offer confidential, non-judgemental support whether you're dealing with deployment stress, relationship difficulties, financial worries or anything else.",
    avatarUrl: null,
    email: 'tom.williams@ctcrm.mod.uk',
    workMobile: '07700 900125',
    militaryAssociations: ['Royal Marines Veteran (WO2)', 'Mental Health First Aider', 'Trauma-Informed Practice'],
    talkToMeAbout: ['Deployment & separation', 'Mental health signposting', 'Financial guidance', 'Housing & relocation'],
    isPastoralTeam: true,
    isAggie: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'team-4',
    providerId: PROVIDER_ID,
    name: 'Emma Chen',
    role: 'Activities & Events Coordinator',
    bio: 'I organise all our social events, fitness classes and special occasions. From Christmas parties to deployment homecomings, I love bringing our community together.',
    avatarUrl: null,
    email: 'emma.chen@ctcrm.mod.uk',
    workMobile: '07700 900126',
    militaryAssociations: ['Royal Navy Spouse', 'Level 3 Personal Trainer'],
    talkToMeAbout: ['Fitness classes', 'Event bookings', 'Starting a new group', 'Room hire'],
    isPastoralTeam: false,
    isAggie: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'team-5',
    providerId: PROVIDER_ID,
    name: 'Dave Patterson',
    role: 'Centre Administrator',
    bio: "I keep everything running behind the scenes! From managing bookings to coordinating volunteers, I'm usually the first voice you'll hear when you call.",
    avatarUrl: null,
    email: 'dave.patterson@ctcrm.mod.uk',
    workMobile: null,
    militaryAssociations: ['RAF Veteran', 'DBS Checked Volunteer Coordinator'],
    talkToMeAbout: ['Room bookings', 'Volunteering', 'Lost property', 'General enquiries'],
    isPastoralTeam: false,
    isAggie: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'team-6',
    providerId: PROVIDER_ID,
    name: 'Rev. James Harper',
    role: 'Padre / Chaplain',
    bio: "I'm here for anyone who needs a confidential ear, regardless of faith or belief. 24/7 support available.",
    avatarUrl: null,
    email: 'james.harper@ctcrm.mod.uk',
    workMobile: '07700 900127',
    militaryAssociations: ['Royal Navy Chaplaincy', 'Grief & Bereavement Support'],
    talkToMeAbout: ["Spiritual support", "Life's big questions", 'Bereavement', 'Marriage preparation'],
    isPastoralTeam: true,
    isAggie: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'team-7',
    providerId: PROVIDER_ID,
    name: 'Claire Thompson',
    role: "Aggie's Welfare Advisor",
    bio: "As an Aggie's trained advisor, I provide independent and confidential welfare support to all serving families.",
    avatarUrl: null,
    email: 'claire.thompson@aggies.org.uk',
    workMobile: '07700 900128',
    militaryAssociations: ["Aggie's Certified", 'Mental Health First Aider'],
    talkToMeAbout: ['Deployment support', 'Family welfare', 'Housing concerns', 'Specialist referrals'],
    isPastoralTeam: true,
    isAggie: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'team-8',
    providerId: PROVIDER_ID,
    name: 'Mark Edwards',
    role: "Aggie's Outreach Worker",
    bio: "I'm part of the Aggie's team providing 24/7 support to military families. Whether you need practical help, emotional support, or just someone who understands - we're here for you, day or night.",
    avatarUrl: null,
    email: 'mark.edwards@aggies.org.uk',
    workMobile: '07700 900129',
    militaryAssociations: ["Aggie's Certified", 'Crisis Intervention Trained'],
    talkToMeAbout: ['24/7 support', 'Crisis assistance', 'Practical help', 'Listening ear'],
    isPastoralTeam: true,
    isAggie: true,
    createdAt: now,
    updatedAt: now,
  },
];

// team-1 → fix-1, fix-4 · team-2 → fix-1, fix-2, fix-3 · team-3 → fix-4 · team-4 → fix-5, fix-7
// (team-5 through team-8 have no fixed-opportunity assignments in this demo, so they won't show
// a "Where You'll Find Me" schedule.)
const opportunityTeamAssignments: Record<string, unknown>[] = [
  { id: 'assign-1', teamMemberId: 'team-1', fixedOpportunityId: 'fix-1', fluidOpportunityId: null, createdAt: now },
  { id: 'assign-2', teamMemberId: 'team-1', fixedOpportunityId: 'fix-4', fluidOpportunityId: null, createdAt: now },
  { id: 'assign-3', teamMemberId: 'team-2', fixedOpportunityId: 'fix-1', fluidOpportunityId: null, createdAt: now },
  { id: 'assign-4', teamMemberId: 'team-2', fixedOpportunityId: 'fix-2', fluidOpportunityId: null, createdAt: now },
  { id: 'assign-5', teamMemberId: 'team-2', fixedOpportunityId: 'fix-3', fluidOpportunityId: null, createdAt: now },
  { id: 'assign-6', teamMemberId: 'team-3', fixedOpportunityId: 'fix-4', fluidOpportunityId: null, createdAt: now },
  { id: 'assign-7', teamMemberId: 'team-4', fixedOpportunityId: 'fix-5', fluidOpportunityId: null, createdAt: now },
  { id: 'assign-8', teamMemberId: 'team-4', fixedOpportunityId: 'fix-7', fluidOpportunityId: null, createdAt: now },
];

// ── Seed / clear helpers ─────────────────────────────────────────────────────

async function seedTable(tableName: string, items: Record<string, unknown>[]): Promise<void> {
  for (let i = 0; i < items.length; i += BATCH_WRITE_MAX) {
    const chunk = items.slice(i, i + BATCH_WRITE_MAX);
    await db.send(
      new BatchWriteCommand({
        RequestItems: {
          [tableName]: chunk.map((item) => ({ PutRequest: { Item: item } })),
        },
      }),
    );
  }
  console.log(`  ${tableName} — seeded ${items.length} items`);
}

/** Deletes every row currently in `tableName` — scans the whole table (id-only projection, paged
 * via LastEvaluatedKey) then batch-deletes 25 at a time. Irreversible; only runs behind --clear /
 * --clear-only. */
async function clearTable(tableName: string): Promise<void> {
  let deleted = 0;
  let lastKey: Record<string, unknown> | undefined;

  do {
    const scanRes = await db.send(
      new ScanCommand({
        TableName: tableName,
        ProjectionExpression: 'id',
        ExclusiveStartKey: lastKey,
      }),
    );
    const items = (scanRes.Items ?? []) as { id: string }[];

    for (let i = 0; i < items.length; i += BATCH_WRITE_MAX) {
      const chunk = items.slice(i, i + BATCH_WRITE_MAX);
      await db.send(
        new BatchWriteCommand({
          RequestItems: {
            [tableName]: chunk.map(({ id }) => ({ DeleteRequest: { Key: { id } } })),
          },
        }),
      );
    }

    deleted += items.length;
    lastKey = scanRes.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);

  console.log(`  ${tableName} — deleted ${deleted} items`);
}

const COMMUNITY_TABLES = [
  TABLES.providers,
  TABLES.providerTeamMembers,
  TABLES.opportunityTeamAssignments,
  TABLES.communityFixedOpportunities,
  TABLES.communityFluidOpportunities,
];

async function main(): Promise<void> {
  if (shouldClear) {
    if (environment === 'prod' && !forceProd) {
      throw new Error('Refusing to --clear the "prod" environment without --force-prod.');
    }

    console.log('Clearing community tables...');
    for (const tableName of COMMUNITY_TABLES) {
      await clearTable(tableName);
    }
  }

  if (clearOnly) {
    console.log('Done (--clear-only, no reseed).');
    return;
  }

  console.log('Seeding community tables...');
  await seedTable(TABLES.providers, providers);
  await seedTable(TABLES.providerTeamMembers, providerTeamMembers);
  await seedTable(TABLES.communityFixedOpportunities, communityFixedOpportunities);
  await seedTable(TABLES.communityFluidOpportunities, communityFluidOpportunities);
  await seedTable(TABLES.opportunityTeamAssignments, opportunityTeamAssignments);

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
