import { useSelector } from 'react-redux';
import AnimalCompanionCard from './animal_companion_card';
import FamiliarCard from './familiar_card';
import RageCard from './rage_card';
import TurnUndeadCard from './turn_undead_card';
import { SmiteEvilCard, LayOnHandsCard, RemoveDiseaseCard } from './paladin_cards';
import { StunningFistCard, WholenessOfBodyCard } from './monk_cards';
import BardicMusicCard from './bardic_music_card';
import FavoredEnemyCard from './favored_enemy_card';
import CombatStyleCard from './combat_style_card';
import DomainsCard from './domains_card';
import SpecialMountCard from './special_mount_card';
import { WildShapeCard, ElementalShapeCard } from './wild_shape_card';

/**
 * Registry of the class-feature cards shown on the combat page.
 *
 * Each class maps to the cards it grants, in display order. An entry may gate
 * itself on `minLevel`, the class level at which the feature is gained. Adding
 * a new class card is one entry here plus the card component itself — the
 * combat page needs no change.
 *
 * Cards own their own collapse state and heading; this registry only decides
 * which ones exist for the current character.
 */
const CLASS_FEATURE_CARDS = {
  Barbarian: [
    { key: 'rage', Component: RageCard },
  ],
  Bard: [
    { key: 'bardicMusic', Component: BardicMusicCard },
  ],
  Cleric: [
    { key: 'turnUndead', Component: TurnUndeadCard },
    { key: 'domains', Component: DomainsCard },
  ],
  Druid: [
    { key: 'wildShape', Component: WildShapeCard, minLevel: 5 },
    { key: 'elementalWildShape', Component: ElementalShapeCard, minLevel: 16 },
    { key: 'animalCompanion', Component: AnimalCompanionCard },
  ],
  Monk: [
    { key: 'stunningFist', Component: StunningFistCard },
    { key: 'wholenessOfBody', Component: WholenessOfBodyCard, minLevel: 7 },
  ],
  Paladin: [
    { key: 'smiteEvil', Component: SmiteEvilCard },
    { key: 'layOnHands', Component: LayOnHandsCard, minLevel: 2 },
    { key: 'turnUndead', Component: TurnUndeadCard, minLevel: 4 },
    { key: 'specialMount', Component: SpecialMountCard, minLevel: 5 },
    { key: 'removeDisease', Component: RemoveDiseaseCard, minLevel: 6 },
  ],
  Ranger: [
    { key: 'favoredEnemy', Component: FavoredEnemyCard },
    { key: 'combatStyle', Component: CombatStyleCard, minLevel: 2 },
    { key: 'animalCompanion', Component: AnimalCompanionCard, minLevel: 4 },
  ],
  Wizard: [
    { key: 'familiar', Component: FamiliarCard },
  ],
  Sorcerer: [
    { key: 'familiar', Component: FamiliarCard },
  ],
};

/**
 * The cards a class grants at a given level, in display order.
 * Exported for tests and for callers that need the list without rendering.
 */
export function getClassFeatureCards(className, level) {
  const entries = CLASS_FEATURE_CARDS[className];
  if (!Array.isArray(entries)) return [];
  const lvl = Number(level);
  const effectiveLevel = Number.isFinite(lvl) ? lvl : 1;
  return entries.filter((entry) => effectiveLevel >= (entry.minLevel ?? 1));
}

export default function ClassFeatureCards() {
  const player = useSelector((state) => state.playerSheet?.player);
  const cards = getClassFeatureCards(player?.getClass?.() ?? '', player?.getLevel?.() ?? 1);
  if (cards.length === 0) return null;
  return (
    <>
      {cards.map(({ key, Component }) => <Component key={key} />)}
    </>
  );
}
