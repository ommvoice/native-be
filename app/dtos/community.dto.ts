import type { Opportunity } from '../shared/utils/formatter/recommendation-formatter';

export const COMMUNITY_WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export type CommunityWeekday = (typeof COMMUNITY_WEEKDAYS)[number];

export interface GetCommunityHubQueryDto {
  parentId: string;
}

export interface ProviderDto {
  id: string;
  organizationName: string;
  organizationType: string | null;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  contactEmail: string;
  contactPhone: string | null;
  contactName: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postcode: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  serviceBranch: string | null;
  affiliatedBaseId: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderTeamMemberDto {
  id: string;
  providerId: string;
  name: string | null;
  role: string | null;
  bio: string | null;
  avatarUrl: string | null;
  email: string;
  workMobile: string | null;
  militaryAssociations: string[];
  talkToMeAbout: string[];
  isPastoralTeam: boolean;
  isAggie: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMemberScheduleEntry {
  day: string;
  time: string;
  activity: string;
  location: string;
}

export interface CommunityHubResponse {
  baseId: string | null;
  provider: ProviderDto | null;
  /** P001 events/clubs whose date range overlaps the current month. */
  thisMonth: Opportunity[];
  /** P001 regular-timetabled clubs, keyed by each day in their clubDailySchedule. */
  regulars: Record<CommunityWeekday, Opportunity[]>;
  teamMembers: ProviderTeamMemberDto[];
  schedulesByTeamMemberId: Record<string, TeamMemberScheduleEntry[]>;
}
