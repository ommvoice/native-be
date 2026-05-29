export type OpportunityRecordType = "route" | "venue" | "club" | "event";

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

/** One DynamoDB opportunity theme row plus its variants (same `themeId` in variants table). */
export interface OpportunityThemeResponse {
  id: string;
  slug: string;
  name: string;
  recordType: OpportunityRecordType;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  variants: OpportunityThemeVariantResponse[];
}
