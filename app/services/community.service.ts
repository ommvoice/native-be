import { ParentRepository } from '../repositories/parent.repository';
import type { CommunityHubResponse } from '../dtos/community.dto';

export class CommunityService {
  private readonly parentRepo: ParentRepository;

  constructor() {
    this.parentRepo = new ParentRepository();
  }

  /** Powers the "your community" screen — a parent's local provider (community centre), its
   * regular activities, upcoming events, staff team, and where each team member can be found.
   *
   * "No parent", "no base linked yet" and "no verified provider for that base" are all normal,
   * valid empty states for a parent who hasn't finished setting up their community — never thrown
   * as errors, always returned as a 200 with nulls/empty arrays. */
  async getHub(parentId: string): Promise<CommunityHubResponse> {
    const parent1 = await this.parentRepo.getById(parentId);
    let parent = { ...parent1, baseId: "BASE-N007" }; // Ensure baseId is always present mocked

    if (!parent || !parent.baseId) return this.emptyHub(parent?.baseId ?? null);

    return this.mockedHub(); // TODO: replace with real data once backend is ready
  }

  private emptyHub(baseId: string | null): CommunityHubResponse {
    return {
      baseId,
      provider: null,
      fixedOpportunities: [],
      fluidOpportunities: [],
      teamMembers: [],
      schedulesByTeamMemberId: {},
    };
  }

  private mockedHub(): CommunityHubResponse {
    return {
      "baseId": "BASE-N007",
      "provider": {
        "contactPhone": "01395 264180",
        "description": "The Gordon Messenger Centre is the heart of community life at CTCRM Lympstone. Named after Corporal Gordon Messenger VC, we've been supporting Royal Marines families since 1985. Our welcoming centre offers activities for all ages, welfare support, social events and a café. Whether you're newly posted or a long-standing member of our Corps family, we're here to help you thrive.",
        "postcode": "EX8 5AR",
        "latitude": null,
        "country": "UK",
        "id": "provider-gmc",
        "websiteUrl": "https://www.royalmarines.mod.uk/community",
        "longitude": null,
        "organizationType": "military_base_community_centre",
        "contactEmail": "gordonmessenger@ctcrm.mod.uk",
        "createdAt": "2026-09-16T18:30:23.092Z",
        "contactName": "Lisa Joy",
        "updatedAt": "2026-09-16T18:30:23.092Z",
        "isVerified": true,
        "affiliatedBaseId": "BASE-N007",
        "logoUrl": null,
        "addressLine2": "Commando Training Centre Royal Marines",
        "serviceBranch": "navy",
        "city": "Lympstone, Exmouth",
        "organizationName": "Gordon Messenger Centre",
        "addressLine1": "The Gordon Messenger Centre"
      },
      "fixedOpportunities": [
        {
          "postcode": "EX8 5AR",
          "openingHours": {
            "thursday": "09:30-11:30",
            "tuesday": "09:30-11:30"
          },
          "description": "Drop in for a cuppa, cake and conversation. A relaxed space to meet other families and get information about local services.",
          "providerId": "provider-gmc",
          "name": "Coffee & Connect",
          "createdAt": "2026-09-16T18:30:23.092Z",
          "city": "Exmouth",
          "subcategory": "drop-in",
          "minAge": null,
          "maxAge": null,
          "updatedAt": "2026-09-16T18:30:23.092Z",
          "category": "social",
          "isActive": true,
          "isFree": true,
          "id": "fix-4",
          "priceInfo": null,
          "address": "Gordon Messenger Centre"
        },
        {
          "postcode": "EX8 5AR",
          "providerId": "provider-gmc",
          "minAge": 0,
          "name": "Baby Massage Class",
          "maxAge": 1,
          "createdAt": "2026-09-16T18:30:23.092Z",
          "category": "parenting",
          "city": "Exmouth",
          "isFree": false,
          "openingHours": {
            "friday": "10:00-11:00"
          },
          "description": "Learn gentle massage techniques to soothe and bond with your baby. 4-week course for babies 6 weeks to crawling.",
          "priceInfo": "£20 for 4-week course",
          "subcategory": "class",
          "updatedAt": "2026-09-16T18:30:23.092Z",
          "isActive": true,
          "id": "fix-6",
          "address": "Gordon Messenger Centre"
        },
        {
          "postcode": "EX8 5AR",
          "providerId": "provider-gmc",
          "id": "fix-2",
          "minAge": 5,
          "createdAt": "2026-09-16T18:30:23.092Z",
          "city": "Exmouth",
          "openingHours": {
            "wednesday": "15:30-17:00",
            "thursday": "15:30-17:00",
            "monday": "15:30-17:00"
          },
          "category": "education",
          "description": "Quiet space with support available for children to complete homework. Snacks provided.",
          "subcategory": "study",
          "updatedAt": "2026-09-16T18:30:23.092Z",
          "isActive": true,
          "isFree": true,
          "priceInfo": null,
          "maxAge": 16,
          "name": "Homework Club",
          "address": "Gordon Messenger Centre"
        },
        {
          "postcode": "EX8 5AR",
          "providerId": "provider-gmc",
          "subcategory": "exercise",
          "priceInfo": "£3 per session",
          "createdAt": "2026-09-16T18:30:23.092Z",
          "city": "Exmouth",
          "id": "fix-5",
          "isFree": false,
          "maxAge": null,
          "updatedAt": "2026-09-16T18:30:23.092Z",
          "description": "High-energy workout for all fitness levels. Childcare available during sessions. Led by qualified PTI.",
          "name": "Fitness Bootcamp",
          "isActive": true,
          "openingHours": {
            "saturday": "09:00-10:00",
            "tuesday": "18:30-19:30"
          },
          "minAge": 16,
          "address": "CTCRM Sports Hall",
          "category": "fitness"
        },
        {
          "postcode": "EX8 5AR",
          "subcategory": "craft",
          "providerId": "provider-gmc",
          "id": "fix-7",
          "createdAt": "2026-09-16T18:30:23.092Z",
          "city": "Exmouth",
          "openingHours": {
            "wednesday": "13:00-15:00"
          },
          "minAge": null,
          "maxAge": null,
          "updatedAt": "2026-09-16T18:30:23.092Z",
          "category": "social",
          "isActive": true,
          "description": "Bring your own project or join our weekly craft activity. All materials provided. Tea and biscuits included!",
          "isFree": true,
          "priceInfo": null,
          "name": "Craft & Chat",
          "address": "Gordon Messenger Centre"
        },
        {
          "postcode": "EX8 5AR",
          "name": "Little Commandos Playgroup",
          "providerId": "provider-gmc",
          "minAge": 0,
          "openingHours": {
            "wednesday": "09:30-11:30",
            "monday": "09:30-11:30"
          },
          "createdAt": "2026-09-16T18:30:23.092Z",
          "subcategory": "playgroup",
          "city": "Exmouth",
          "description": "Fun-filled sensory play, songs and social time for babies and toddlers. A great way to meet other parents!",
          "updatedAt": "2026-09-16T18:30:23.092Z",
          "id": "fix-1",
          "isActive": true,
          "maxAge": 4,
          "isFree": true,
          "category": "childcare",
          "priceInfo": null,
          "address": "Gordon Messenger Centre"
        },
        {
          "postcode": "EX8 5AR",
          "maxAge": 17,
          "providerId": "provider-gmc",
          "name": "Youth Drop-In",
          "description": "Games, activities and chill-out space for teens. Pool table, Xbox, art supplies and more!",
          "createdAt": "2026-09-16T18:30:23.092Z",
          "city": "Exmouth",
          "category": "youth",
          "subcategory": "club",
          "openingHours": {
            "friday": "18:00-20:30"
          },
          "minAge": 11,
          "updatedAt": "2026-09-16T18:30:23.092Z",
          "id": "fix-3",
          "isActive": true,
          "isFree": true,
          "priceInfo": null,
          "address": "Gordon Messenger Centre"
        }
      ],
      "fluidOpportunities": [
        {
          "isExpired": false,
          "providerId": "provider-gmc",
          "createdAt": "2026-09-16T18:30:23.092Z",
          "startDate": "2026-10-16",
          "address": "CTCRM Lympstone",
          "requiresBooking": true,
          "city": "Exmouth",
          "subcategory": "party",
          "id": "fluid-1",
          "venueName": "Gordon Messenger Centre",
          "isActive": true,
          "category": "social",
          "description": "Join us for festive fun! Santa's grotto, craft activities, games, refreshments and a special gift for every child.",
          "eventTimes": {
            "start": "14:00",
            "end": "17:00"
          },
          "isFree": true,
          "name": "Family Christmas Party",
          "updatedAt": "2026-09-16T18:30:23.092Z",
          "endDate": "2026-10-16",
          "priceInfo": null
        },
        {
          "isExpired": false,
          "providerId": "provider-gmc",
          "createdAt": "2026-09-16T18:30:23.092Z",
          "address": "CTCRM Lympstone",
          "requiresBooking": true,
          "city": "Exmouth",
          "endDate": "2026-10-31",
          "eventTimes": {
            "start": "10:00",
            "end": "12:00"
          },
          "name": "New Year Family Brunch",
          "startDate": "2026-10-31",
          "venueName": "Gordon Messenger Centre",
          "isActive": true,
          "category": "social",
          "subcategory": "brunch",
          "isFree": false,
          "priceInfo": "£5 per family",
          "updatedAt": "2026-09-16T18:30:23.092Z",
          "id": "fluid-2",
          "description": "Start the new year together! Full cooked breakfast, pastries, fresh fruit and unlimited hot drinks for the whole family."
        },
        {
          "isExpired": false,
          "providerId": "provider-gmc",
          "description": "Guided family nature walk on Woodbury Common. Spot wildlife, collect natural treasures and warm up with hot chocolate afterwards!",
          "category": "outdoors",
          "createdAt": "2026-09-16T18:30:23.092Z",
          "city": "Exmouth",
          "subcategory": "walk",
          "address": "Meet at Gordon Messenger Centre car park",
          "requiresBooking": false,
          "startDate": "2026-11-07",
          "id": "fluid-3",
          "name": "Winter Woodland Walk",
          "eventTimes": {
            "start": "10:30",
            "end": "12:30"
          },
          "endDate": "2026-11-07",
          "venueName": "Woodbury Common",
          "isActive": true,
          "isFree": true,
          "updatedAt": "2026-09-16T18:30:23.092Z",
          "priceInfo": null
        },
        {
          "isExpired": false,
          "providerId": "provider-gmc",
          "createdAt": "2026-09-16T18:30:23.092Z",
          "id": "fluid-4",
          "address": "CTCRM Lympstone",
          "startDate": "2026-11-15",
          "description": "Practical tips and emotional support for families with a partner about to deploy. Childcare provided.",
          "requiresBooking": true,
          "name": "Deployment Support Workshop",
          "city": "Exmouth",
          "eventTimes": {
            "start": "19:00",
            "end": "21:00"
          },
          "venueName": "Gordon Messenger Centre",
          "isActive": true,
          "endDate": "2026-11-15",
          "category": "welfare",
          "isFree": true,
          "subcategory": "workshop",
          "updatedAt": "2026-09-16T18:30:23.092Z",
          "priceInfo": null
        },
        {
          "isExpired": false,
          "providerId": "provider-gmc",
          "endDate": "2026-12-15",
          "createdAt": "2026-09-16T18:30:23.092Z",
          "address": "CTCRM Lympstone",
          "requiresBooking": true,
          "name": "Half Term Cinema Day",
          "city": "Exmouth",
          "eventTimes": {
            "start": "10:00",
            "end": "16:00"
          },
          "id": "fluid-5",
          "priceInfo": "£2 per person",
          "description": "Family film afternoon with popcorn and drinks. Two screenings: 10am (U-rated) and 2pm (PG). Bring blankets and cushions!",
          "venueName": "Gordon Messenger Centre",
          "isActive": true,
          "isFree": false,
          "updatedAt": "2026-09-16T18:30:23.092Z",
          "subcategory": "cinema",
          "category": "entertainment",
          "startDate": "2026-12-15"
        },
        {
          "isExpired": false,
          "providerId": "provider-gmc",
          "createdAt": "2026-09-16T18:30:23.092Z",
          "address": "CTCRM Lympstone",
          "requiresBooking": true,
          "city": "Exmouth",
          "startDate": "2026-12-20",
          "eventTimes": {
            "start": "18:00",
            "end": "22:00"
          },
          "endDate": "2026-12-20",
          "venueName": "Gordon Messenger Centre",
          "isActive": true,
          "category": "social",
          "priceInfo": "£10 per child",
          "subcategory": "date-night",
          "isFree": false,
          "description": "Date night for couples! We'll look after the kids (ages 4-12) with pizza, games and a movie while you enjoy an evening off.",
          "name": "Valentine's Parents Night Out",
          "updatedAt": "2026-09-16T18:30:23.092Z",
          "id": "fluid-6"
        }
      ],
      "teamMembers": [
        {
          "talkToMeAbout": [
            "Playgroups & activities",
            "Youth club",
            "Holiday programmes",
            "SEN support for children"
          ],
          "updatedAt": "2026-09-16T18:30:23.092Z",
          "avatarUrl": null,
          "providerId": "provider-gmc",
          "role": "Children & Youth Coordinator",
          "workMobile": "07700 900124",
          "name": "Sarah Mitchell",
          "email": "sarah.mitchell@ctcrm.mod.uk",
          "isAggie": false,
          "id": "team-2",
          "createdAt": "2026-09-16T18:30:23.092Z",
          "bio": "I run all our programmes for children and young people - from baby groups to teen activities. I'm a qualified Early Years practitioner and youth worker with 12 years' experience. I especially love helping military children build resilience and friendships that last beyond the next posting!",
          "militaryAssociations": [
            "Army Veteran (RLC)",
            "Paediatric First Aid"
          ],
          "isPastoralTeam": false
        },
        {
          "workMobile": "07700 900126",
          "militaryAssociations": [
            "Royal Navy Spouse",
            "Level 3 Personal Trainer"
          ],
          "updatedAt": "2026-09-16T18:30:23.092Z",
          "avatarUrl": null,
          "providerId": "provider-gmc",
          "name": "Emma Chen",
          "bio": "I organise all our social events, fitness classes and special occasions. From Christmas parties to deployment homecomings, I love bringing our community together.",
          "talkToMeAbout": [
            "Fitness classes",
            "Event bookings",
            "Starting a new group",
            "Room hire"
          ],
          "role": "Activities & Events Coordinator",
          "isAggie": false,
          "id": "team-4",
          "createdAt": "2026-09-16T18:30:23.092Z",
          "email": "emma.chen@ctcrm.mod.uk",
          "isPastoralTeam": false
        },
        {
          "role": "Centre Administrator",
          "militaryAssociations": [
            "RAF Veteran",
            "DBS Checked Volunteer Coordinator"
          ],
          "talkToMeAbout": [
            "Room bookings",
            "Volunteering",
            "Lost property",
            "General enquiries"
          ],
          "bio": "I keep everything running behind the scenes! From managing bookings to coordinating volunteers, I'm usually the first voice you'll hear when you call.",
          "updatedAt": "2026-09-16T18:30:23.092Z",
          "avatarUrl": null,
          "providerId": "provider-gmc",
          "id": "team-5",
          "name": "Dave Patterson",
          "email": "dave.patterson@ctcrm.mod.uk",
          "isAggie": false,
          "createdAt": "2026-09-16T18:30:23.092Z",
          "isPastoralTeam": false,
          "workMobile": null
        },
        {
          "talkToMeAbout": [
            "Spiritual support",
            "Life's big questions",
            "Bereavement",
            "Marriage preparation"
          ],
          "updatedAt": "2026-09-16T18:30:23.092Z",
          "avatarUrl": null,
          "providerId": "provider-gmc",
          "email": "james.harper@ctcrm.mod.uk",
          "militaryAssociations": [
            "Royal Navy Chaplaincy",
            "Grief & Bereavement Support"
          ],
          "isPastoralTeam": true,
          "bio": "I'm here for anyone who needs a confidential ear, regardless of faith or belief. 24/7 support available.",
          "workMobile": "07700 900127",
          "name": "Rev. James Harper",
          "role": "Padre / Chaplain",
          "isAggie": false,
          "createdAt": "2026-09-16T18:30:23.092Z",
          "id": "team-6"
        },
        {
          "bio": "After 22 years in the Royal Marines, I now support families through the unique challenges of military life. I offer confidential, non-judgemental support whether you're dealing with deployment stress, relationship difficulties, financial worries or anything else.",
          "updatedAt": "2026-09-16T18:30:23.092Z",
          "avatarUrl": null,
          "talkToMeAbout": [
            "Deployment & separation",
            "Mental health signposting",
            "Financial guidance",
            "Housing & relocation"
          ],
          "name": "Tom Williams",
          "providerId": "provider-gmc",
          "id": "team-3",
          "militaryAssociations": [
            "Royal Marines Veteran (WO2)",
            "Mental Health First Aider",
            "Trauma-Informed Practice"
          ],
          "isPastoralTeam": true,
          "isAggie": false,
          "email": "tom.williams@ctcrm.mod.uk",
          "createdAt": "2026-09-16T18:30:23.092Z",
          "role": "Family Welfare Officer",
          "workMobile": "07700 900125"
        },
        {
          "talkToMeAbout": [
            "New arrivals & settling in",
            "Community events",
            "School transitions",
            "Volunteering opportunities"
          ],
          "updatedAt": "2026-09-16T18:30:23.092Z",
          "avatarUrl": null,
          "id": "team-1",
          "providerId": "provider-gmc",
          "email": "lisa.joy@ctcrm.mod.uk",
          "militaryAssociations": [
            "Royal Navy Spouse",
            "HIVE Trained",
            "Safeguarding Lead"
          ],
          "name": "Lisa Joy",
          "workMobile": "07700 900123",
          "role": "Community Centre Manager",
          "isAggie": false,
          "bio": "I've led The Gordon Messenger Centre for 8 years. As a Navy spouse who's experienced 6 postings, I understand the rollercoaster of service life. My door is always open - whether you need practical help or just a friendly ear. I'm passionate about creating a community where every family feels they belong.",
          "createdAt": "2026-09-16T18:30:23.092Z",
          "isPastoralTeam": false
        },
        {
          "id": "team-8",
          "talkToMeAbout": [
            "24/7 support",
            "Crisis assistance",
            "Practical help",
            "Listening ear"
          ],
          "updatedAt": "2026-09-16T18:30:23.092Z",
          "isAggie": true,
          "avatarUrl": null,
          "providerId": "provider-gmc",
          "militaryAssociations": [
            "Aggie's Certified",
            "Crisis Intervention Trained"
          ],
          "isPastoralTeam": true,
          "bio": "I'm part of the Aggie's team providing 24/7 support to military families. Whether you need practical help, emotional support, or just someone who understands - we're here for you, day or night.",
          "workMobile": "07700 900129",
          "name": "Mark Edwards",
          "email": "mark.edwards@aggies.org.uk",
          "createdAt": "2026-09-16T18:30:23.092Z",
          "role": "Aggie's Outreach Worker"
        },
        {
          "workMobile": "07700 900128",
          "email": "claire.thompson@aggies.org.uk",
          "updatedAt": "2026-09-16T18:30:23.092Z",
          "isAggie": true,
          "bio": "As an Aggie's trained advisor, I provide independent and confidential welfare support to all serving families.",
          "avatarUrl": null,
          "name": "Claire Thompson",
          "providerId": "provider-gmc",
          "isPastoralTeam": true,
          "id": "team-7",
          "talkToMeAbout": [
            "Deployment support",
            "Family welfare",
            "Housing concerns",
            "Specialist referrals"
          ],
          "militaryAssociations": [
            "Aggie's Certified",
            "Mental Health First Aider"
          ],
          "createdAt": "2026-09-16T18:30:23.092Z",
          "role": "Aggie's Welfare Advisor"
        }
      ],
      "schedulesByTeamMemberId": {
        "team-2": [
          {
            "day": "friday",
            "time": "18:00-20:30",
            "activity": "Youth Drop-In",
            "location": "Gordon Messenger Centre"
          },
          {
            "day": "wednesday",
            "time": "09:30-11:30",
            "activity": "Little Commandos Playgroup",
            "location": "Gordon Messenger Centre"
          },
          {
            "day": "monday",
            "time": "09:30-11:30",
            "activity": "Little Commandos Playgroup",
            "location": "Gordon Messenger Centre"
          },
          {
            "day": "wednesday",
            "time": "15:30-17:00",
            "activity": "Homework Club",
            "location": "Gordon Messenger Centre"
          },
          {
            "day": "thursday",
            "time": "15:30-17:00",
            "activity": "Homework Club",
            "location": "Gordon Messenger Centre"
          },
          {
            "day": "monday",
            "time": "15:30-17:00",
            "activity": "Homework Club",
            "location": "Gordon Messenger Centre"
          }
        ],
        "team-4": [
          {
            "day": "saturday",
            "time": "09:00-10:00",
            "activity": "Fitness Bootcamp",
            "location": "CTCRM Sports Hall"
          },
          {
            "day": "tuesday",
            "time": "18:30-19:30",
            "activity": "Fitness Bootcamp",
            "location": "CTCRM Sports Hall"
          },
          {
            "day": "wednesday",
            "time": "13:00-15:00",
            "activity": "Craft & Chat",
            "location": "Gordon Messenger Centre"
          }
        ],
        "team-5": [],
        "team-6": [],
        "team-3": [
          {
            "day": "thursday",
            "time": "09:30-11:30",
            "activity": "Coffee & Connect",
            "location": "Gordon Messenger Centre"
          },
          {
            "day": "tuesday",
            "time": "09:30-11:30",
            "activity": "Coffee & Connect",
            "location": "Gordon Messenger Centre"
          }
        ],
        "team-1": [
          {
            "day": "thursday",
            "time": "09:30-11:30",
            "activity": "Coffee & Connect",
            "location": "Gordon Messenger Centre"
          },
          {
            "day": "tuesday",
            "time": "09:30-11:30",
            "activity": "Coffee & Connect",
            "location": "Gordon Messenger Centre"
          },
          {
            "day": "wednesday",
            "time": "09:30-11:30",
            "activity": "Little Commandos Playgroup",
            "location": "Gordon Messenger Centre"
          },
          {
            "day": "monday",
            "time": "09:30-11:30",
            "activity": "Little Commandos Playgroup",
            "location": "Gordon Messenger Centre"
          }
        ],
        "team-8": [],
        "team-7": []
      }
    }
  }
}
