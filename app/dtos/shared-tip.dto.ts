import type { OpportunityRefType } from '../shared/utils/opportunity-ref';

/** What the tip is about — the "What are you sharing?" picker in the app's Share A Tip panel
 * (A Place or Venue / A Club / An Event / A Bike or Walk Route). */
export type SharedTipKind = OpportunityRefType;

export const SHARED_TIP_KINDS: SharedTipKind[] = ['venue', 'club', 'event', 'route'];

/** "Genuinely works for a:" options. */
export const SHARED_TIP_WORKS_FOR = [
  'Simple Reset',
  'Energy Burner',
  'Low Effort',
  'Solo Outing',
  'Breather',
  'Special Trip',
] as const;

export const SHARED_TIP_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp'] as const;
export type SharedTipPhotoContentType = (typeof SHARED_TIP_PHOTO_TYPES)[number];

export interface SharedTipRatingsDto {
  kidsEnjoyed?: number;
  easyToManage?: number;
  worthTheEffort?: number;
}

export interface CreateSharedTipPhotoUploadUrlDto {
  contentType: SharedTipPhotoContentType;
}

export interface CreateSharedTipDto {
  kind: SharedTipKind;
  placeName: string;
  tip: string;
  bring?: string | null;
  photoKey?: string | null;
  opportunityId?: string | null;
  opportunityType?: OpportunityRefType | null;
  worksFor?: string[];
  ratings?: SharedTipRatingsDto;
}
