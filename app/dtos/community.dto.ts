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

export interface CommunityFixedOpportunityDto {
  id: string;
  providerId: string;
  name: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  openingHours: Record<string, string> | null;
  address: string | null;
  city: string | null;
  postcode: string | null;
  isFree: boolean;
  priceInfo: string | null;
  minAge: number | null;
  maxAge: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityFluidOpportunityDto {
  id: string;
  providerId: string;
  name: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  startDate: string;
  endDate: string;
  eventTimes: { start?: string; end?: string } | null;
  venueName: string | null;
  address: string | null;
  city: string | null;
  isFree: boolean;
  priceInfo: string | null;
  requiresBooking: boolean;
  isActive: boolean;
  isExpired: boolean;
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
  fixedOpportunities: CommunityFixedOpportunityDto[];
  fluidOpportunities: CommunityFluidOpportunityDto[];
  teamMembers: ProviderTeamMemberDto[];
  schedulesByTeamMemberId: Record<string, TeamMemberScheduleEntry[]>;
}
