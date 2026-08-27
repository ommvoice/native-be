export interface ClubCommitmentEntry {
  name: string;
  slug: string;
  active: boolean;
}

export const CLUB_COMMITMENT_ENUM: ClubCommitmentEntry[] = [
  { name: "One-off (pay as you go)", slug: "payg_one_off", active: true },
  { name: "Monthly", slug: "monthly", active: true },
  { name: "Termly blocks", slug: "termly_blocks", active: true },
  { name: "Annually", slug: "annually", active: true },
  { name: "Membership", slug: "membership", active: true },
];

export type ClubCommitmentSlug = (typeof CLUB_COMMITMENT_ENUM)[number]["slug"];
