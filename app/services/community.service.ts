import { ParentRepository } from '../repositories/parent.repository';
import { COMMUNITY_WEEKDAYS, type CommunityHubResponse, type CommunityWeekday } from '../dtos/community.dto';
import { buildImageUrl, IMG_FOLDER, toOpportunityList } from '../shared/utils/formatter';
import type { EnrichedScoredRecommendationV2 } from '../shared/utils/formatter/recommendation-formatter';
import { RecommendationV2Repository } from '../repositories/recommendation-v2.repository';
import { AssetsService } from './assets.service';
import { RecommendationV2Service } from './recommendation-v2.service';
import { getInitialScore } from './scoring-v2.service';
import { AppError } from '../shared/errors/app-error';
import { AppClock } from '../shared/utils/app-clock';

export class CommunityService {
  private readonly parentRepo: ParentRepository;
  private readonly assets = new AssetsService();
  private readonly recommendationRepo: RecommendationV2Repository;

  constructor() {
    this.parentRepo = new ParentRepository();
    this.recommendationRepo = new RecommendationV2Repository();
  }

  /** Powers the "your community" screen — a parent's local provider (community centre), its
   * regular activities, upcoming events, staff team, and where each team member can be found.
   *
   * "No parent", "no base linked yet" and "no verified provider for that base" are all normal,
   * valid empty states for a parent who hasn't finished setting up their community — never thrown
   * as errors, always returned as a 200 with nulls/empty arrays. */
  async getHub(parentId: string): Promise<CommunityHubResponse> {
    const parent1 = await this.recommendationRepo.getParentForRecommendations(parentId);

    let parent = { ...parent1, baseId: "BASE-N007" }; // Ensure baseId is always present mocked

    if (!parent || !parent.baseId) return this.emptyHub(parent?.baseId ?? null);

    const opportunities = await this.buildOpportunities(parentId);

    return { ...this.mockedHub(), ...opportunities }; // TODO: replace the mocked provider/team with real data once backend is ready
  }

  private emptyHub(baseId: string | null): CommunityHubResponse {
    return {
      baseId,
      provider: null,
      thisMonth: [],
      regulars: { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] },
      teamMembers: [],
      schedulesByTeamMemberId: {},
    };
  }

  private mockedHub(): Omit<CommunityHubResponse, 'thisMonth' | 'regulars'> {
    return {
      "baseId": "BASE-N007",
      "provider": {
        "id": "provider-gmc",
        "logoUrl": buildImageUrl("GMC_Logo.png", IMG_FOLDER.community, true), // png read as-is, not normalized to .jpg
        "description": `The Gordon Messenger Centre (“GMC” as it’s fondly known) is the heart of community life at CTCRM Lympstone and has been supporting families since 1985. The vibrant building is brilliantly-equipped and plays host to a varied calendar of activities every month. Found opposite the Camp gates the building is open daily during the week, has a large car park for easy access, and is a brilliant place to head if you need a chat, change of scenery or a cuppa with friendly support staff that genuinely ‘get it’.`,
        "contactName": "Lisa-Joy",
        "contactPhone": "01395 264180",
        "contactEmail": "gordonmessenger@ctcrm.mod.uk",
        "websiteUrl": "https://www.royalmarines.mod.uk/community",
        "organizationName": "Gordon Messenger Centre",
        "organizationType": "military_base_community_centre",
        "isVerified": true,
        "affiliatedBaseId": "BASE-N007",
        "serviceBranch": "navy",
        "addressLine1": "The Gordon Messenger Centre",
        "addressLine2": "Commando Training Centre Royal Marines",
        "city": "Lympstone, Exmouth",
        "postcode": "EX8 5AR",
        "country": "UK",
        "latitude": null,
        "longitude": null,
        "createdAt": "2026-09-16T18:30:23.092Z",
        "updatedAt": "2026-09-16T18:30:23.092Z"
      },
      "teamMembers": [
        {
          "id": "team-1",
          "name": "Lisa-Joy",
          "email": "lisa.joy@ctcrm.mod.uk",
          "avatarUrl": buildImageUrl("GMC_Staff_006.jpg", IMG_FOLDER.community),
          "role": "Gordon Messenger Centre Manager",
          "bio": "As Centre Manager, Lisa-Joy is passionate about bringing people together and creating opportunities for military families, veterans, and the wider community to thrive. She firmly believes that a cup of tea and a friendly chat can solve most problems. A military wife for over 26 years, she knows all about resilience, adaptability, and especially the art of waiting. She also speaks fluent military acronym and is well versed in navigating last-minute plan changes.\n\nFun fact: Lisa-Joy once sang live on television in front of more than 200 million viewers. These days, her audience is a little smaller, but she still loves a good sing-song, a brisk seafront walk, travelling, and spending time with her family. Her favourite part of the job is seeing connections made between people who might never otherwise have met.",
          "workMobile": null,
          "talkToMeAbout": [
            "GMC Events & Clubs",
            "Military Wives Choir"
          ],
          "militaryAssociations": [],
          "isPastoralTeam": false,
          "isAggie": false,
          "providerId": "provider-gmc",
          "createdAt": "2026-09-16T18:30:23.092Z",
          "updatedAt": "2026-10-28T00:00:00.000Z",
        },
        {
          "id": "team-2",
          "name": "Charley",
          "email": "",
          "avatarUrl": buildImageUrl("GMC_Staff_005.jpg", IMG_FOLDER.community),
          "role": "Gordon Messenger Centre Assistant",
          "bio": "Hello I’m Charley. I grew up in a military family and my partner is also serving, so supporting families, veterans and anyone who uses the Centre is something that's really important to me.\n\nI'm a mum to three young children, so life is wonderfully busy! If you ever see me looking slightly frazzled, it's probably because I've just survived the school run and the hunt for missing shoes, water bottles, or PE kits. I love being outdoors, whether that's a trip to the beach, exploring Dartmoor, or finding a new place for a family adventure. Equally, I absolutely love to hunker-down and relax at home. I enjoy being creative, meeting people and having a laugh. It’s no secret that I can be “a little” socially awkward at times, so if I ever say something a bit odd, don't worry, I'll definitely be overthinking it later!\n\nAt the GMC, I'm always happy to lend a listening ear, help point people in the right direction, or simply have a chat. If there’s anything you need to make your experience better, please just give me a shout. I'm always happy to help, and if I don't know the answer, I'll happily find someone who does.\n\nFun Fact: I took part in a Royal Marines Ladies Survival Weekend which raised £24,000 towards building the GMC, and I still have the scars to prove it!",
          "workMobile": null,
          "talkToMeAbout": [
            "Booking the Centre",
            "Parenting & Family Support",
            "Community groups",
            "Local services",
            "GMC Activities"
          ],
          "militaryAssociations": [],
          "isPastoralTeam": false,
          "isAggie": false,
          "providerId": "provider-gmc",
          "createdAt": "2026-09-16T18:30:23.092Z",
          "updatedAt": "2026-10-28T00:00:00.000Z",
        },
        {
          "id": "team-3",
          "name": "Vicky",
          "email": "",
          "avatarUrl": buildImageUrl("GMC_Staff_003.jpg", IMG_FOLDER.community),
          "role": "Aggie’s Family Pastoral Worker",
          "bio": "Vicky is a friendly, caring, and approachable Pastoral Worker who loves making a positive difference in people's lives. With a listening ear, a kind heart, and a good dose of positivity, Vicky is always ready to offer support, encouragement, or simply a friendly chat when it's needed most.\n\nVicky believes that a little kindness goes a long way, a smile can brighten someone's day, and sometimes a good chat and a cuppa can make all the difference!\n\nPassionate about helping others feel happy, valued, and supported, Vicky is here to lend a helping hand, share a laugh, and remind everyone that they don't have to face life's challenges alone. Vicky brings warmth, compassion, and a little bit of magic to her role, believing that everyone deserves to feel special, supported, and able to shine in their own unique way. And, of course, life is always better with a little extra sparkle! Vicky's motto? A little kindness, a lot of laughter, a sprinkle of glitter, yummy cake, and always time to listen!",
          "workMobile": null,
          "talkToMeAbout": [
            "Anything and everything!",
            "Settling In",
            "Pastoral Care",
            "Aggie’s Family Support",
            "Children’s clubs & Activities",
            "Making new friends and connections"
          ],
          "militaryAssociations": [],
          // Aggie's pastoral worker: navy "Pastoral" ribbon, no GMC logo (same flags as main-6).
          "isPastoralTeam": true,
          "isAggie": true,
          "providerId": "provider-gmc",
          "createdAt": "2026-09-16T18:30:23.092Z",
          "updatedAt": "2026-10-28T00:00:00.000Z",
        },
        {
          "id": "team-4",
          "name": "Liz",
          "email": "",
          "avatarUrl": buildImageUrl("GMC_Staff_002.jpg", IMG_FOLDER.community),
          "role": "Assistant, GMC", // from main-6; not supplied with the rest of Liz's details
          "bio": "Liz started at the GMC in 2026 to extend the opening hours of the Centre and build some more out-of-hours events into the calendar – such as a speaking programme; a supper club and film nights to name but a few! With a business background and event planning portfolio Liz loves working with the GMC team to build a wider audience - whether that’s veterans, serving personnel or family members. Liz finds working at the GMC really unique – it could be a light-touch coffee chat to welfare sign-posting. Every interaction is important and all of them special.\n\nFun Fact: Liz has done the Royal Marines Woodbury Endurance Challenge three times and the last time she was 51 years…. She could never run round so, if you see her running be warned, there is probably something chasing her!",
          "workMobile": null,
          "talkToMeAbout": [
            "Out-of-Hours Events",
            "Activity Ideas for the GMC",
            "Travel Tips!",
            "Italy!"
          ],
          "militaryAssociations": [],
          "isPastoralTeam": false,
          "isAggie": false,
          "providerId": "provider-gmc",
          "createdAt": "2026-09-16T18:30:23.092Z",
          "updatedAt": "2026-10-28T00:00:00.000Z",
        },
        {
          "id": "team-5",
          "name": "Gary",
          "email": "",
          "avatarUrl": buildImageUrl("GMC_Staff_001.jpg", IMG_FOLDER.community),
          "role": "Gordon Messenger Centre Assistant",
          "bio": "Hi, I’m Gary and I’m part of the team at the Gordon Messenger Centre. After spending a large part of my life in the military, I really enjoy still being part of the Armed Forces community – although these days there’s a lot more coffee involved!\n\nAt the GMC I seem to get involved in a bit of everything. I’ve got a lot of experience in bringing people together, organising activities and events, and creating an environment where individuals feel welcomed, valued and supported; one minute I’m helping organise an event or working with our volunteers, the next I’m fixing something, moving something or trying to work out why something isn’t working. Basically, if nobody else knows who to ask, there’s a fair chance they’ll come and find me; I’m always available for a coffee and a chat!\n\nAway from work, I love being outdoors and keeping active. I’m a keen ultra runner and can often be found somewhere on Dartmoor questioning my life choices while running ridiculous distances for fun. I also enjoy paddleboarding, keeping fit and, most importantly, spending time with my wife Karen and my family.",
          "workMobile": null,
          "talkToMeAbout": [
            "GMC Activities & Events",
            "Volunteering",
            "Running & Fitness",
            "Getting Active",
            "Veterans",
            "The Armed Forces community",
            "Trying DIY",
            "Fixing things"
          ],
          "militaryAssociations": [],
          "isPastoralTeam": false,
          "isAggie": false,
          "providerId": "provider-gmc",
          "createdAt": "2026-09-16T18:30:23.092Z",
          "updatedAt": "2026-10-28T00:00:00.000Z",
        },
      ],
      "schedulesByTeamMemberId": {
        // "Where You'll Find Me" slots, shown as "time — activity (location)". Days with no slot are
        // simply left out.
        "team-1": [
          { "day": "monday",    "time": "10:00 - 14:00", "activity": "The GMC Office", "location": "Gordon Messenger Centre" },
          { "day": "tuesday",   "time": "10:00 - 14:00", "activity": "The GMC Office", "location": "Gordon Messenger Centre" },
          { "day": "wednesday", "time": "10:00 - 14:00", "activity": "The GMC Office", "location": "Gordon Messenger Centre" },
          { "day": "thursday",  "time": "10:00 - 14:00", "activity": "The GMC Office", "location": "Gordon Messenger Centre" },
          { "day": "friday",    "time": "10:00 - 12:00", "activity": "The GMC Office", "location": "Gordon Messenger Centre" },
        ],
        "team-2": [
          { "day": "tuesday",   "time": "09:00 - 15:00", "activity": "The GMC Office", "location": "Gordon Messenger Centre" },
          { "day": "wednesday", "time": "09:00 - 15:00", "activity": "The GMC Office", "location": "Gordon Messenger Centre" },
          { "day": "thursday",  "time": "09:00 - 15:00", "activity": "The GMC Office", "location": "Gordon Messenger Centre" },
          { "day": "friday",    "time": "09:00 - 15:00", "activity": "The GMC Office", "location": "Gordon Messenger Centre" },
        ],
        // Pastoral team: the app (like main-6) doesn't show "Where You'll Find Me" for them.
        "team-3": [
          { "day": "monday",    "time": "08:30 - 15:00", "activity": "The GMC Office", "location": "Gordon Messenger Centre" },
          { "day": "tuesday",   "time": "08:30 - 15:00", "activity": "The GMC Office", "location": "Gordon Messenger Centre" },
          { "day": "wednesday", "time": "08:30 - 15:00", "activity": "The GMC Office", "location": "Gordon Messenger Centre" },
          { "day": "thursday",  "time": "08:30 - 15:00", "activity": "The GMC Office", "location": "Gordon Messenger Centre" },
          { "day": "friday",    "time": "08:30 - 15:00", "activity": "The GMC Office", "location": "Gordon Messenger Centre" },
        ],
        "team-4": [
          { "day": "monday",    "time": "09:30 - 16:00", "activity": "The GMC Office", "location": "Gordon Messenger Centre" },
          { "day": "tuesday",   "time": "09:30 - 16:00", "activity": "The GMC Office", "location": "Gordon Messenger Centre" },
          { "day": "wednesday", "time": "09:30 - 16:00", "activity": "The GMC Office", "location": "Gordon Messenger Centre" },
          { "day": "thursday",  "time": "09:30 - 16:00", "activity": "The GMC Office", "location": "Gordon Messenger Centre" },
          { "day": "friday",    "time": "09:30 - 16:00", "activity": "The GMC Office", "location": "Gordon Messenger Centre" },
        ],
        "team-5": [
          { "day": "tuesday",   "time": "08:30 - 16:30", "activity": "The GMC Office", "location": "Gordon Messenger Centre" },
          { "day": "wednesday", "time": "08:30 - 16:30", "activity": "The GMC Office", "location": "Gordon Messenger Centre" },
          { "day": "thursday",  "time": "08:30 - 16:30", "activity": "The GMC Office", "location": "Gordon Messenger Centre" },
        ],
      }
    }
  }

  private mockedHub2(): Omit<CommunityHubResponse, 'thisMonth' | 'regulars'> {
    return {
      "baseId": "BASE-N007",
      "provider": {
        "contactPhone": "01395 264180",
        "description": `The Gordon Messenger Centre (“GMC” as it’s fondly known) is the heart of community life at CTCRM Lympstone and has been supporting families since 1985. The vibrant building is brilliantly-equipped and plays host to a varied calendar of activities every month. Found opposite the Camp gates the building is open daily during the week, has a large car park for easy access, and is a brilliant place to head if you need a chat, change of scenery or a cuppa with friendly support staff that genuinely ‘get it’.`,
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

  /** The hub's "This Month" and "Regular Activities & Clubs" sections, built from the partner's
   * (P001) events and clubs. Scoring is skipped (skipAll), so nothing is dropped for interests,
   * age, weather, schedule or distance — the pipeline is only used for travel time and card text.
   *
   * - thisMonth: the item's start→end date range overlaps the current UK month (so an event that
   *   started last month or ends next month still shows).
   * - regulars: regularTimetabled clubs, listed under each day named in clubDailySchedule. */
  private async buildOpportunities(parentId: string): Promise<Pick<CommunityHubResponse, 'thisMonth' | 'regulars'>> {
    const regulars = Object.fromEntries(COMMUNITY_WEEKDAYS.map((day) => [day, []])) as unknown as CommunityHubResponse['regulars'];

    let raw: EnrichedScoredRecommendationV2[];
    let childrenAges: number[];
    try {
      const skipRecommendations = getInitialScore({ skipAll: true });
      const result = await new RecommendationV2Service().getRecommendations2({ parentId }, skipRecommendations);
      raw = result.data as unknown as EnrichedScoredRecommendationV2[];
      childrenAges = result.childrenAges;
    } catch (err) {
      // No parent / no children yet is a normal empty state here, not an error.
      if (err instanceof AppError && (err.statusCode === 400 || err.statusCode === 404)) return { thisMonth: [], regulars };
      throw err;
    }

    const partnerItems = raw.filter(
      (r) => (r.opportunityType === 'event' || r.opportunityType === 'club') && r.partnerCode === COMMUNITY_PARTNER_CODE,
    );

    const currentMonth = AppClock.isoDateString().slice(0, 7); // "YYYY-MM"
    const thisMonth = toOpportunityList(partnerItems.filter((r) => overlapsMonth(r, currentMonth)), childrenAges);

    const regularItems = partnerItems.filter((r) => r.opportunityType === 'club' && r.regularTimetabled === true);
    toOpportunityList(regularItems, childrenAges).forEach((opp, i) => {
      for (const day of scheduleDays(regularItems[i].clubDailySchedule)) regulars[day].push(opp);
    });

    return { thisMonth, regulars };
  }
}

const COMMUNITY_PARTNER_CODE = 'P001';

/** Whether an event/club's start→end range touches `month` ("YYYY-MM"). A missing end means a
 * single-day item; an item with no dates at all can't be placed in a month, so it's left out. */
function overlapsMonth(r: EnrichedScoredRecommendationV2, month: string): boolean {
  const start = (r.opportunityType === 'event' ? r.eventStartDate : r.clubStartDate) as string | null | undefined;
  const end = (r.opportunityType === 'event' ? r.eventEndDate : r.clubEndDate) as string | null | undefined;
  const startMonth = (start ?? end)?.slice(0, 7);
  const endMonth = (end ?? start)?.slice(0, 7);
  if (!startMonth || !endMonth) return false;
  return startMonth <= month && month <= endMonth;
}

/** "Tuesday, Wednesday, Thursday" → ['tuesday', 'wednesday', 'thursday'], ignoring anything that isn't a weekday. */
function scheduleDays(schedule: unknown): CommunityWeekday[] {
  if (typeof schedule !== 'string') return [];
  const days = schedule.split(',').map((d) => d.trim().toLowerCase());
  return COMMUNITY_WEEKDAYS.filter((day) => days.includes(day));
}
