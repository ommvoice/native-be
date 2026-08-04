export interface EnumEntry {
    name: string;
    slug: string;
    active: boolean ;
}

export interface EnumSeasonalHighlight extends EnumEntry{
    seasonalTagSlugs? : string[]
}

export interface EnumThemeAttraction extends EnumEntry{
    opportunityThemeSlugs? : string[]
}

export interface EnumOpportunityTheme extends EnumEntry {
    opportunityTypeSlugs? : string[]
    interestCategorySlugs? : string[]
}

export interface EnumOpportunityThemeVariant extends EnumEntry {
    opportunityThemeSlugs? : string[]
}

export interface EnumSkillAreaVariant extends EnumEntry {
    skillAreaSlugs? : string[]
}

export type EnumOpportunityType = EnumEntry;
export type EnumActivityGroup = EnumEntry;
export type EnumInterestCategory = EnumEntry;
export type EnumGeneralSkill = EnumEntry;
export type EnumWeatherSuitability = EnumEntry;
export type EnumPhysicalSetting = EnumEntry;
export type EnumAgeSuitability = EnumEntry;
export type EnumEstimatedDuration = EnumEntry;
export type EnumFunctionalFacility = EnumEntry;
export type EnumParentFacility = EnumEntry;
export type EnumKidsFacility = EnumEntry;
export type EnumDogFacility = EnumEntry;
export type EnumParkingProvision = EnumEntry;
export type EnumExtraKit = EnumEntry;
export type EnumSeasonalTag = EnumEntry;
export type EnumRouteType = EnumEntry;
export type EnumRouteSuitability = EnumEntry;
export type EnumTerrainType = EnumEntry;
export type EnumRouteDifficulty = EnumEntry;
export type EnumClubFormat = EnumEntry;
export type EnumClubFrequency = EnumEntry;
export type EnumClubCommitment = EnumEntry;
export type EnumSkillArea = EnumEntry;
export type EnumAbilityLevel = EnumEntry;
export type EnumEventType = EnumEntry;
export type EnumBookingType = EnumEntry;
export type EnumTicketVariant = EnumEntry;

export interface EnumResponse {
    opportunityType : EnumOpportunityType[];
    activityGroup : EnumActivityGroup[];
    interestCategory : EnumInterestCategory[];
    generalSkill : EnumGeneralSkill[];
    weatherSuitability : EnumWeatherSuitability[];
    physicalSetting : EnumPhysicalSetting[];
    ageSuitability : EnumAgeSuitability[];
    estimatedDuration : EnumEstimatedDuration[];
    functionalFacility : EnumFunctionalFacility[];
    parentFacility : EnumParentFacility[];
    kidsFacility : EnumKidsFacility[];
    dogFacility : EnumDogFacility[];
    parkingProvision : EnumParkingProvision[];
    extraKit : EnumExtraKit[];
    seasonalTag : EnumSeasonalTag[];
    routeType : EnumRouteType[];
    routeSuitability : EnumRouteSuitability[];
    terrainType : EnumTerrainType[];
    routeDifficulty : EnumRouteDifficulty[];
    clubFormat : EnumClubFormat[];
    clubFrequency : EnumClubFrequency[];
    clubCommitment : EnumClubCommitment[];
    skillArea : EnumSkillArea[];
    abilityLevel : EnumAbilityLevel[];
    eventType : EnumEventType[];
    bookingType : EnumBookingType[];
    ticketVariant : EnumTicketVariant[];
    opportunityTheme : EnumOpportunityTheme[];
    opportunityThemeVariant : EnumOpportunityThemeVariant[];
    skillAreaVariant : EnumSkillAreaVariant[];
    seasonalHighlight : EnumSeasonalHighlight[];
    themeAttraction : EnumThemeAttraction[];
}
