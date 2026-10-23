import { describe, expect, it } from 'vitest';
import * as S from '../../scoring-v3.service';
import { exmouthBeach, oppInterest, tenpin, themeCategories } from './helpers';

describe('opportunityInterestOf', () => {
  it('Tenpin Bowling → theme, variant and the theme\'s interest categories (enums.json)', () => {
    const o = oppInterest(tenpin);
    expect(o.themes).toEqual(['indoor_entertainment']);
    expect(o.variants).toEqual(['bowling_alley']);
    expect([...o.categories].sort()).toEqual(['creativity_imagination', 'special_memorable', 'together_time']);
  });

  it('splits comma-joined variants (Exmouth Beach)', () => {
    expect(oppInterest(exmouthBeach).variants).toEqual(['sandy_beach', 'rnli_beach', 'dog_friendly_beaches']);
  });

  it('a theme with no category links → no categories', () => {
    expect(S.opportunityInterestOf('unknown_theme', '', themeCategories)).toEqual({ themes: ['unknown_theme'], variants: [], categories: [] });
  });
});
