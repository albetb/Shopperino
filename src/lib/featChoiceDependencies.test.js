import {
  getChoicesForFeat,
  getChoiceUnavailableReason,
  getBaseFeatName,
  UNARMED_STRIKE,
} from './featChoices';

/* Four feats in the game do not choose freely: they choose from what an earlier
   feat already named. Greater Weapon Focus is "choose one type of weapon for
   which you have already selected Weapon Focus", and Greater Weapon
   Specialization needs one weapon carrying *both* of its prerequisites, not one
   of each. These check the list narrows to exactly that, and that the sentence
   shown when it narrows to nothing says which of the three things went wrong. */

const focus = (weapon) => `Weapon focus (${weapon})`;
const greaterFocus = (weapon) => `Greater weapon focus (${weapon})`;
const spec = (weapon) => `Weapon specialization (${weapon})`;

describe('a choice feat that inherits its list from another feat', () => {
  test('Greater weapon focus offers only the focused weapons', () => {
    const feats = [focus('Longsword'), focus('Dagger')];
    expect(getChoicesForFeat('Greater weapon focus', feats)).toEqual(['Dagger', 'Longsword']);
  });

  test('Weapon specialization offers only the focused weapons', () => {
    expect(getChoicesForFeat('Weapon specialization', [focus('Longsword')])).toEqual(['Longsword']);
  });

  test('Greater weapon specialization needs one weapon carrying both prerequisites', () => {
    // One of each, on different weapons — nothing qualifies.
    const split = [focus('Longsword'), focus('Dagger'), greaterFocus('Longsword'), spec('Dagger')];
    expect(getChoicesForFeat('Greater weapon specialization', split)).toEqual([]);

    const together = [focus('Longsword'), greaterFocus('Longsword'), spec('Longsword')];
    expect(getChoicesForFeat('Greater weapon specialization', together)).toEqual(['Longsword']);
  });

  test('the chain works for an unarmed strike like any other weapon', () => {
    const feats = [focus(UNARMED_STRIKE)];
    expect(getChoicesForFeat('Greater weapon focus', feats)).toEqual([UNARMED_STRIKE]);
    expect(getChoicesForFeat('Weapon specialization', feats)).toEqual([UNARMED_STRIKE]);
  });

  test('a weapon already taken for the dependent feat drops off its own list', () => {
    const feats = [focus('Longsword'), focus('Dagger'), greaterFocus('Longsword')];
    expect(getChoicesForFeat('Greater weapon focus', feats)).toEqual(['Dagger']);
  });

  test('the feats with no per-choice prerequisite still offer everything', () => {
    // Weapon focus and Improved critical gate on proficiency and BAB, neither of
    // which says anything about *which* weapon — so their lists stay whole.
    expect(getChoicesForFeat('Weapon focus', []).length).toBeGreaterThan(20);
    expect(getChoicesForFeat('Improved critical', []).length).toBeGreaterThan(20);
    expect(getChoicesForFeat('Skill focus', []).length).toBeGreaterThan(20);
    expect(getChoicesForFeat('Spell focus', []).length).toBeGreaterThan(5);
  });
});

describe('the sentence shown when a dependent feat has no options', () => {
  test('names the missing prerequisite feat', () => {
    expect(getChoiceUnavailableReason('Greater weapon focus', []))
      .toMatch(/no weapon focus feat selected/i);
    expect(getChoiceUnavailableReason('Weapon specialization', []))
      .toMatch(/no weapon focus feat selected/i);
    expect(getChoiceUnavailableReason('Greater spell focus', []))
      .toMatch(/no spell focus feat selected/i);
  });

  test('names both missing prerequisites when both are absent', () => {
    const reason = getChoiceUnavailableReason('Greater weapon specialization', [focus('Longsword')]);
    expect(reason).toMatch(/greater weapon focus and weapon specialization/i);
  });

  test('says so when the prerequisites are held for different weapons', () => {
    const split = [focus('Longsword'), focus('Dagger'), greaterFocus('Longsword'), spec('Dagger')];
    const reason = getChoiceUnavailableReason('Greater weapon specialization', split);
    expect(reason).toMatch(/must name the same one/i);
  });

  test('says so when every eligible weapon is already taken', () => {
    const feats = [focus('Longsword'), greaterFocus('Longsword')];
    expect(getChoiceUnavailableReason('Greater weapon focus', feats))
      .toMatch(/already has greater weapon focus/i);
  });

  test('stays silent while there is still something to choose', () => {
    expect(getChoiceUnavailableReason('Greater weapon focus', [focus('Longsword')])).toBe('');
    expect(getChoiceUnavailableReason('Weapon focus', [])).toBe('');
  });
});

describe('a feat whose own name ends in a parenthetical', () => {
  test('the three armor proficiencies stay three distinct feats', () => {
    // They are not choice feats — the category is part of the name in
    // feats.json — so nothing may be stripped off them. Collapsing them onto
    // "Armor proficiency" made taking one hide the other two from the picker
    // and lost all three their descriptions.
    expect(getBaseFeatName('Armor proficiency (light)')).toBe('Armor proficiency (light)');
    expect(getBaseFeatName('Armor proficiency (medium)')).toBe('Armor proficiency (medium)');
    expect(getBaseFeatName('Armor proficiency (heavy)')).toBe('Armor proficiency (heavy)');
  });

  test('a real choice feat still gives up its choice', () => {
    expect(getBaseFeatName('Weapon focus (Longsword)')).toBe('Weapon focus');
    expect(getBaseFeatName('Skill focus (Knowledge (arcana))')).toBe('Skill focus');
    expect(getBaseFeatName('Toughness')).toBe('Toughness');
  });
});
