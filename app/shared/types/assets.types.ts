export interface EnumEntry {
    name: string; 
    slug: string; 
    active: boolean ;
} 

export interface EnumSeasonalHighlight extends EnumEntry{
    seasonalTagSlugs? : string[] 
} 