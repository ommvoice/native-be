export interface OpportunityThemeVariantResponse {
  id: string;
  slug: string;
  name: string;
  applicableTypes: string | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/** One logical theme row (one per slug per interest category). */
export interface OpportunityThemeResponse {
  id: string;
  slug: string;
  name: string;
  interestId: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  variants: OpportunityThemeVariantResponse[];
}

export type ThemeListFilters = {
  interestId?: string;
  interestSlug?: string;
  /** When true (default), omit legacy rows with no `interestId`. */
  linkedOnly?: boolean;
};
