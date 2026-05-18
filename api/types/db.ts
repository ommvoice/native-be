export type ROLE = "ADMIN" | "PARENT" | "PROVIDER";
export type SKILL_GROUP_TYPE = "INTEREST_BASED" | "AGE_BASED";
export type FacilityType = "GENERAL" | "PARENT" | "KID" | "DOG";
export type OpportunityRecordType = "venue" | "event" | "club" | "route";

export interface Users {
  id: string;
  email: string;
  sub: string;
  role: ROLE;
  createdAt: Date;
  updatedAt: Date;
}

export interface Parents {
  id: string;
  postCode: string;
  firstNameOrNickName: string;
  latitude: string;
  longitude: string;
  searchRadius: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Children {
  id: string;
  nameOrNickName: string;
  dateOfBirth: Date;
  parentId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InterestCategory {
  id: string;
  slug: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InterestSubCategory {
  id: string;
  slug: string;
  name: string;
  suitableForAge: string | null;
  categoryId: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Skill {
  id: string;
  slug: string;
  label: string;
  description: string;
  type: SKILL_GROUP_TYPE;
  subCategoryId: string | null;
  minAge: number | null;
  maxAge: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillLevel {
  id: number;
  label: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Facility {
  id: string;
  type: FacilityType;
  slug: string;
  label: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OpportunityVenue {
  id: string;
  type: OpportunityRecordType;
  name: string;
  description: string | null;
  postCode: string | null;
  latitude: string | null;
  longitude: string | null;
  venuePostcode: string | null;
  openingDaysAndTimes: string | null;
  openingExclusions: string | null;
  themeSlug: string;
  themeVariantSlug: string | null;
  activityGroupSlug: string | null;
  terrainTypeSlug: string | null;
  venueSettingSlug: string | null;
  parkingProvisionSlug: string | null;
  adultCost: number | null;
  childCost: number | null;
  infantCost: number | null;
  generalFacilitySlugs: string[];
  kidsFacilitySlugs: string[];
  parentFacilitySlugs: string[];
  dogFacilitySlugs: string[];
  ageSuitabilitySlugs: string[];
  extraKitSlugs: string[];
  interestTags: string | null;
  estimatedTimeToSpend: string | null;
  seasonalTagSlug: string | null;
  seasonalHighlightSlugs: string[];
  highlightAttractionSlugs: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OpportunityEvent {
  id: string;
  type: OpportunityRecordType;
  name: string;
  description: string | null;
  postCode: string | null;
  latitude: string | null;
  longitude: string | null;
  themeSlug: string;
  themeVariantSlug: string | null;
  eventTypeSlug: string;
  activityGroupSlug: string | null;
  startDate: Date | null;
  endDate: Date | null;
  startTime: string | null;
  finishTime: string | null;
  venuePostCode: string | null;
  parkingProvisionSlug: string | null;
  venueSettingSlug: string | null;
  generalFacilitySlugs: string[];
  kidsFacilitySlugs: string[];
  parentFacilitySlugs: string[];
  adultCost: number | null;
  childCost: number | null;
  infantCost: number | null;
  ageSuitabilitySlugs: string[];
  skillAreaSlug: string | null;
  skillAreaVariant: string | null;
  abilityLevelSlug: string | null;
  extraKitSlugs: string[];
  interestTags: string | null;
  seasonalTagSlug: string | null;
  seasonalHighlightSlugs: string[];
  highlightAttractionSlugs: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OpportunityClub {
  id: string;
  type: OpportunityRecordType;
  name: string;
  description: string | null;
  postCode: string | null;
  latitude: string | null;
  longitude: string | null;
  themeSlug: string;
  themeVariantSlug: string | null;
  venuePostCode: string | null;
  startTime: string | null;
  finishTime: string | null;
  dayOfWeekSlug: string | null;
  activityGroupSlug: string | null;
  clubFormatSlug: string | null;
  clubFrequencySlug: string | null;
  commitmentSlug: string | null;
  skillAreaSlug: string | null;
  skillAreaVariant: string | null;
  abilityLevelSlug: string | null;
  parkingProvisionSlug: string | null;
  venueSettingSlug: string | null;
  adultCost: number | null;
  childCost: number | null;
  infantCost: number | null;
  generalFacilitySlugs: string[];
  kidsFacilitySlugs: string[];
  parentFacilitySlugs: string[];
  ageSuitabilitySlugs: string[];
  extraKitSlugs: string[];
  interestTags: string | null;
  seasonalTagSlug: string | null;
  seasonalHighlightSlugs: string[];
  highlightAttractionSlugs: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OpportunityRoute {
  id: string;
  type: OpportunityRecordType;
  name: string;
  description: string | null;
  postCode: string | null;
  latitude: string | null;
  longitude: string | null;
  themeSlug: string;
  themeVariantSlug: string | null;
  routeTypeSlug: string | null;
  routeDistanceMiles: number | null;
  routeSuitabilitySlugs: string[];
  terrainTypeSlugs: string[];
  difficultyRatingSlug: string | null;
  activityGroupSlug: string | null;
  startPointPostCode: string | null;
  parkingProvisionSlug: string | null;
  venueSettingSlug: string | null;
  generalFacilitySlugs: string[];
  kidsFacilitySlugs: string[];
  parentFacilitySlugs: string[];
  dogFacilitySlugs: string[];
  extraKitSlugs: string[];
  adultCost: number | null;
  childCost: number | null;
  infantCost: number | null;
  interestTags: string | null;
  seasonalTagSlug: string | null;
  seasonalHighlightSlugs: string[];
  highlightAttractionSlugs: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ParentOpportunityDrivingLeg {
  parentId: string;
  typeId: string;
  opportunityType: OpportunityRecordType;
  opportunityId: string;
  parentPostCode: string;
  parentLatitude: string;
  parentLongitude: string;
  opportunityPostCode: string | null;
  opportunityLatitude: string;
  opportunityLongitude: string;
  drivingDistanceMeters: number;
  drivingDurationSeconds: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Wishlist {
  id: string;
  name: string;
  color: string;
  parentId: string;
  childId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WishlistItem {
  id: string;
  wishlistId: string;
  opportunityVenueId: string | null;
  opportunityEventId: string | null;
  opportunityClubId: string | null;
  opportunityRouteId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
