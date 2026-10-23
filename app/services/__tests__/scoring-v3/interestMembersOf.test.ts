import { describe, expect, it } from 'vitest';
import * as S from '../../scoring-v3.service';
import { family, familyMembers } from './helpers';

const sub = (...slugs: string[]) => slugs.map((slug) => ({ slug }));

describe('interestMembersOf', () => {
  it('params.json family → parent + 3 children, all counted', () => {
    expect(familyMembers.map((m) => m.id)).toEqual([family.id, ...family.children.map((c) => c.id)]);
    expect(familyMembers[0]!.picks).toContain('indoor_entertainment');
    expect(familyMembers[0]!.categories).toContain('nature_exploration');
  });

  it('leaves out same-day guests and members with no interests; keeps adults', () => {
    const members = S.interestMembersOf({
      id: 'parent', interestCategories: sub('nature_exploration'), interestSubCategories: sub('beaches'),
      children: [
        { id: 'kid', variant: 'child', interestCategories: [], interestSubCategories: sub('soft_play') },
        { id: 'grandad', variant: 'adult', interestCategories: sub('learning_curiosity'), interestSubCategories: [] },
        { id: 'guest', variant: 'guest', interestCategories: sub('nature_exploration'), interestSubCategories: sub('beaches') },
        { id: 'no-interests', variant: 'child', interestCategories: [], interestSubCategories: [] },
      ],
    });
    expect(members.map((m) => m.id)).toEqual(['parent', 'kid', 'grandad']);
  });

  it('leaves out a parent with no interests', () => {
    const members = S.interestMembersOf({
      id: 'parent', interestCategories: [], interestSubCategories: [],
      children: [{ id: 'kid', interestCategories: [], interestSubCategories: sub('soft_play') }],
    });
    expect(members.map((m) => m.id)).toEqual(['kid']);
  });

  it('normalises case/whitespace and de-duplicates picks', () => {
    const [m] = S.interestMembersOf({ id: 'p', interestCategories: sub(' Nature_Exploration '), interestSubCategories: sub('Beaches', 'beaches'), children: [] });
    expect(m).toEqual({ id: 'p', categories: ['nature_exploration'], picks: ['beaches'] });
  });
});
