export interface ClubFormatEntry {
  name: string;
  slug: string;
  active: boolean;
}

export const CLUB_FORMAT_ENUM: ClubFormatEntry[] = [
  { name: "Workshop", slug: "workshop", active: true },
  { name: "Stay-and-play (supervised)", slug: "stay_and_play_supervised", active: true },
  { name: "Lesson", slug: "lesson", active: true },
  { name: "Free play (unsupervised)", slug: "free_play_unsupervised", active: true },
  { name: "Training / Skill Development", slug: "training", active: true },
];

export type ClubFormatSlug = (typeof CLUB_FORMAT_ENUM)[number]["slug"];
