import { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setCombatPageCardCollapsed,
} from '../../store/slices/playerSheetSlice';
import {
  onAdjustCurrentHp,
  onSetMaxLife,
  onSetHealthModifier,
  onSetSpeedBonus,
  onSetInitiativeBonus,
  onSetFortBonus,
  onSetReflexBonus,
  onSetWillBonus,
  onSetAcBonus,
  onSetAcTouchBonus,
  onSetAcFlatBonus,
  onSetCharacterPortrait,
  onClearCharacterPortrait,
  onPlayerRest,
} from '../../store/thunks/playerSheetThunks';
import PortraitEditorSheet from './PortraitEditorSheet';
import ConditionsSection from './conditions_section';
import ClassFeatureCards from './class_feature_cards';
import EquippedItemsCard from './equipped_items_card';
import PotionsCard from './potions_card';
import ScrollsCard from './scrolls_card';
import useLongPress from '../hooks/useLongPress';
import useHpFeedback from '../hooks/useHpFeedback';
import { getItemByRef, calculateWeaponAttackBonus, calculateWeaponDamage, applyItemOverrides, getWeaponType } from '../../lib/utils';
import SpellLink from '../common/spell_link';
import Card from '../common/Card';
import StatPill from '../common/StatPill';
import StatInfo from '../common/StatInfo';
import CombatStancesRow from './combat_stances_row';
import ActionFeatsRow from './action_feats_row';
import HeldItemsRows from './held_items_rows';
import { handItemIsWeapon } from '../../lib/item/heldItems';
import InfoPopover from '../common/InfoPopover';
import Bar from '../common/Bar';
import Pill from '../common/Pill';
import Filigree from '../common/Filigree';
import IconButton from '../common/IconButton';
import Stepper from '../common/Stepper';
import EmptyState from '../common/EmptyState';
import Icon from '../common/Icon';
import { useUnits } from 'components/hooks/useUnits';
import { t, tx } from '../../lib/i18n';

function formatBaseAttackBonus(bab) {
  const b = Number(bab) || 0;
  if (b <= 0) return '+0';
  const parts = [];
  for (let k = 0; b - 5 * k >= 1; k += 1) parts.push(`+${b - 5 * k}`);
  return parts.join(' / ');
}

/**
 * Colour for an attack pill, from how far the bonus sits off the plain one the
 * character's class and ability score alone would give. Neutral when nothing
 * else is acting on it, green when something raised it — a magic weapon,
 * Weapon Focus, a spell — and red when something took it away, whether that is
 * ability damage or holding a weapon you were never trained for.
 */
function attackTone(deviation) {
  if (deviation > 0) return 'success';
  if (deviation < 0) return 'danger';
  return 'default';
}

const BONUS_THUNK = {
  speedBonus:      onSetSpeedBonus,
  initiativeBonus: onSetInitiativeBonus,
  fortBonus:       onSetFortBonus,
  reflexBonus:     onSetReflexBonus,
  willBonus:       onSetWillBonus,
  acBonus:         onSetAcBonus,
  acTouchBonus:    onSetAcTouchBonus,
  acFlatBonus:     onSetAcFlatBonus,
};

export default function CombatPage() {
  const u = useUnits();
  const dispatch = useDispatch();
  const player = useSelector(state => state.playerSheet?.player);
  const collapsed = useSelector(state => state.playerSheet?.combatPageCardsCollapsed ?? { player: false, combat: false, items: false });

  const { feedback: hpFeedback, show: showHpFeedback } = useHpFeedback();
  const [portraitOpen, setPortraitOpen] = useState(false);
  const [editMaxLife, setEditMaxLife] = useState(false);
  const [tempMaxLife, setTempMaxLife] = useState(10);
  const [editBonusLife, setEditBonusLife] = useState(false);
  const [tempBonusLife, setTempBonusLife] = useState(0);
  const [hpAdvancedOpen, setHpAdvancedOpen] = useState(false);
  const [editBonus, setEditBonus] = useState(null);
  const [tempBonus, setTempBonus] = useState(0);
  /* AC has three independent fields editable together; the other stats
     only need a single temp value (tempBonus above). */
  const [tempAc, setTempAc] = useState({ general: 0, touch: 0, flat: 0 });

  const currentHp = player?.getCurrentHp?.() ?? 0;
  const maxHp = player?.getMaxLife?.() ?? 0;
  // Two visual modes for the bar:
  //  - currentHp > 0: normal gradient, fill = currentHp / maxHp.
  //  - currentHp ≤ 0: "dying" full-red bar, fill = (currentHp + 10) / 10
  //    so 0 HP is a full red bar and −10 HP is an empty one.
  const isDying = currentHp <= 0;
  const hpRatio = isDying
    ? Math.max(0, Math.min(1, (currentHp + 10) / 10))
    : (maxHp > 0 ? Math.max(0, Math.min(1, currentHp / maxHp)) : 0);
  const hpBarVariant = isDying ? 'danger' : 'hp';

  const handleHpDelta = useCallback(delta => {
    if (!player) return;
    dispatch(onAdjustCurrentHp(delta));
    showHpFeedback(delta);
  }, [player, dispatch, showHpFeedback]);

  /* A rest heals as well as refreshing uses, so it reports the hit points the
     same way a manual heal does. Asked before the dispatch: resting is what
     clears the damage the amount is derived from. */
  const handleRest = useCallback(() => {
    if (!player) return;
    const healed = player.getRestHealAmount?.() ?? 0;
    dispatch(onPlayerRest());
    if (healed > 0) showHpFeedback(healed);
  }, [player, dispatch, showHpFeedback]);

  const longPressPlus  = useLongPress(() => handleHpDelta(10),  () => handleHpDelta(1),  { delay: 400 });
  const longPressMinus = useLongPress(() => handleHpDelta(-10), () => handleHpDelta(-1), { delay: 400 });

  const toggleCard = key => dispatch(setCombatPageCardCollapsed({ key, value: !collapsed[key] }));

  const startEditMaxLife = useCallback(() => {
    if (!player) return;
    setTempMaxLife(player.maxLife ?? 10);
    setEditMaxLife(true);
  }, [player]);

  const saveMaxLife = useCallback(() => {
    const min = player?.getBaseLifeMin?.() ?? 1;
    // Per CLAUDE.md: rules are signaled, never enforced. We do NOT clamp to
    // getBaseLifeMax — the UI shows a warning pill below when the value
    // exceeds the theoretical maximum (HD_max × level).
    const value = Math.max(min, Math.floor(Number(tempMaxLife) || min));
    dispatch(onSetMaxLife(value));
    setEditMaxLife(false);
  }, [player, tempMaxLife, dispatch]);

  const startEditBonusLife = useCallback(() => {
    if (!player) return;
    setTempBonusLife(Number(player.healthModifier) || 0);
    setEditBonusLife(true);
  }, [player]);

  const saveBonusLife = useCallback(() => {
    dispatch(onSetHealthModifier(Math.floor(Number(tempBonusLife) || 0)));
    setEditBonusLife(false);
  }, [tempBonusLife, dispatch]);

  const startEditBonus = useCallback(key => {
    if (!player) return;
    setEditBonus(key);
    if (key === 'ac') {
      setTempAc({
        general: Number(player.acBonus) || 0,
        touch:   Number(player.acTouchBonus) || 0,
        flat:    Number(player.acFlatBonus) || 0,
      });
    } else {
      setTempBonus(Number(player[key]) || 0);
    }
  }, [player]);

  /* Pencil button toggles: clicking the active stat's pencil closes the
     editor; clicking a different stat's pencil switches to that one. */
  const toggleEditBonus = useCallback(key => {
    if (editBonus === key) setEditBonus(null);
    else startEditBonus(key);
  }, [editBonus, startEditBonus]);

  const saveBonus = useCallback(() => {
    if (!editBonus) return;
    if (editBonus === 'ac') {
      dispatch(onSetAcBonus(tempAc.general));
      dispatch(onSetAcTouchBonus(tempAc.touch));
      dispatch(onSetAcFlatBonus(tempAc.flat));
    } else if (BONUS_THUNK[editBonus]) {
      dispatch(BONUS_THUNK[editBonus](tempBonus));
    }
    setEditBonus(null);
  }, [editBonus, tempBonus, tempAc, dispatch]);

  // Hooks above the early-return ----------------------------------
  const equipment = player?.getEquipment?.() ?? {};
  const mainHandWeapon = equipment.rh1;
  const offHandWeapon = equipment.lh1;
  const secondaryMainHand = equipment.rh2;
  const secondaryOffHand = equipment.lh2;

  const equippedWeapons = useMemo(() => {
    const weapons = [];
    const pushIf = (slot, w) => {
      if (!w?.link) return;
      /* Shields are equipped in hand slots but don't belong in the
         attack list — their AC contribution shows in the equipment card
         instead. */
      if (/\/(Shield|Specific Shield)\//.test(w.link)) return;
      const rawItem = getItemByRef(w.baseLink || w.link)?.raw;
      if (!rawItem) return;
      /* A wand, rod or staff occupies a hand but is not an attack. The rule
         lives in heldItems.js so the attacks list and the two-weapon check
         cannot disagree about what counts as a weapon. */
      if (!handItemIsWeapon(rawItem, w.ItemType)) return;
      const item = applyItemOverrides(rawItem, w.overrides);
      const displayName = w.overrides?.Name ?? w.name;
      weapons.push({ slot, name: displayName, link: w.link, weaponItem: item, isTwoHanded: w.twoHanded === true, itemData: w });
    };
    pushIf('main', mainHandWeapon);
    if (mainHandWeapon?.twoHanded !== true && (!mainHandWeapon || offHandWeapon?.link !== mainHandWeapon.link)) {
      pushIf('offhand', offHandWeapon);
    }
    if (secondaryMainHand?.link && secondaryMainHand.link !== mainHandWeapon?.link) {
      pushIf('secondary-main', secondaryMainHand);
    }
    if (secondaryMainHand?.twoHanded !== true && secondaryOffHand?.link && secondaryOffHand.link !== mainHandWeapon?.link && secondaryOffHand.link !== secondaryMainHand?.link) {
      pushIf('secondary-offhand', secondaryOffHand);
    }
    return weapons;
  }, [mainHandWeapon, offHandWeapon, secondaryMainHand, secondaryOffHand]);

  if (!player) {
    return (
      <div className="sh-stack" style={{ padding: 'var(--space-4)' }}>
        <EmptyState icon="badge" title={t('No character selected')} hint={t('Pick or create one from the sidebar.')} />
      </div>
    );
  }

  const speedBonus      = Number(player.speedBonus)      || 0;
  const initiativeBonus = Number(player.initiativeBonus) || 0;
  const fortBonus       = Number(player.fortBonus)       || 0;
  const reflexBonus     = Number(player.reflexBonus)     || 0;
  const willBonus       = Number(player.willBonus)       || 0;

  const bab = player.getBaseAttackBonus?.() ?? 0;
  // Both come from the model: an unarmed strike carries an ability modifier,
  // conditions and its own Weapon Focus / Specialization, exactly as a weapon does.
  const punchAttack = player.getPunchAttackBonus?.() ?? bab;
  const punchDamage = player.getPunchDamage?.() ?? '1d3';
  const punchCrit = player.getPunchCritical?.() ?? { text: '20/x2', improved: false };
  /* Only the weapon half — the armor and shield penalties are reported once for
     the whole card rather than repeated on every line. */
  const punchUntrained = (player.getPunchProficiencyPenalty?.() ?? 0)
    < (player.getArmorProficiencyAttackPenalty?.() ?? 0);
  const untrainedArmor = player.isProficientWithArmor?.() === false;
  const untrainedShield = player.isProficientWithShield?.() === false;
  const armorProficiencyPenalty = player.getArmorProficiencyAttackPenalty?.() ?? 0;

  // Change to each displayed stat caused by temporary effects — conditions,
  // rage, or an assumed wild-shape form. Empty when none are active. The sign
  // drives the green/red glow, so these stay numbers rather than booleans.
  const condDeltas = player.getTemporaryStatDeltas?.() ?? {};
  const fmtDelta = (d) => `${d > 0 ? '+' : ''}${d}`;
  const condNote = (d) => (d
    ? (
      <span
        className={`sh-stat-cond-note ${d > 0 ? 'sh-stat-cond-note--up' : 'sh-stat-cond-note--down'}`}
        style={{ display: 'block' }}
      >
        {fmtDelta(d)}
      </span>
    )
    : null);
  const withCond = (baseSub, d) => {
    const note = condNote(d);
    if (!note) return baseSub;
    return baseSub != null ? <>{baseSub}{note}</> : note;
  };
  // AC glows on the full-AC delta, falling back to touch/flat when only those
  // moved (a natural-armour form raises AC and flat but never touch).
  const acDelta = condDeltas.ac || condDeltas.acFlat || condDeltas.acTouch || 0;
  const acCondAffected = !!(condDeltas.ac || condDeltas.acTouch || condDeltas.acFlat);
  const condBaseline = player.getTemporaryBaseline?.() ?? null;
  const punchDmgAffected = condBaseline ? condBaseline.getPunchDamage() !== punchDamage : false;

  // Flurry of blows: an extra attack at the highest BAB, with a blanket
  // penalty on every attack. Only unarmed strikes and monk weapons qualify,
  // so each equipped weapon is tested individually by the model.
  const flurry = player.getFlurryOfBlows?.() ?? { extraAttacks: 0, penalty: 0 };
  /* A weapon in each hand: an extra off-hand attack, and a penalty on both
     that the sheet never applied. The model decides whether the pair
     qualifies and what each hand swings at. */
  const twoWeapon = player.getTwoWeaponFighting?.() ?? null;

  /* Attacks of opportunity. Everyone gets one, which needs no saying, so the
     row appears only for a character with Combat Reflexes — the feat is the
     only thing that makes the number worth reading, and it had nowhere at all
     to show itself before this. */
  const hasCombatReflexes = player.hasFeatNamed?.('Combat reflexes') ?? false;
  const attacksOfOpportunity = player.getAttacksOfOpportunity?.() ?? 1;
  const flurryWeapons = equippedWeapons.filter((w) =>
    player.isFlurryWeapon?.({ weaponItem: w.weaponItem, isTwoHanded: w.isTwoHanded }) ?? false);
  // A monk holding only monk weapons — or nothing — can still strike unarmed,
  // so the punch line joins the weapon list rather than replacing it. The
  // model owns the "does this whole set qualify" question.
  const unarmedAvailable = player.canUseUnarmedStrike?.() ?? false;
  /* Anyone with a hand free can punch, whatever their class — a fighter
     holding one sword has a real attack the sheet used to hide. A monk whose
     whole set qualifies for the flurry keeps the line even with both hands
     full, since an unarmed strike is what the flurry is for. */
  const showsPunch = (player.hasFreeHand?.() ?? equippedWeapons.length === 0) || unarmedAvailable;
  const flurryUnarmed = flurry.extraAttacks > 0 && unarmedAvailable;

  const speedInfo = player.getArmorSpeedInfo?.();
  // The form a character travels in is not always a walk: an air elemental
  // only flies, so its land speed is 0 and the walk would read "0 ft". The
  // model picks the fastest mode that crosses ground and names it.
  const primaryMovement = player.getPrimaryMovement?.() ?? { mode: 'land', speed: 30 };
  /* Armor or a heavy load slows the character: the speed they actually move at
     is the only one worth reading at the table, so it stands alone and in red
     rather than beside the speed they would have had. The breakdown box says
     where the difference went. */
  const speedReduced = !!speedInfo?.hasReduction;
  const currentSpeed = speedReduced ? speedInfo.reducedSpeed : primaryMovement.speed;
  const speedDisplay = u.distance(currentSpeed);
  // Only a non-walking mode earns a label; a walk is the unremarkable default.
  /* The mode itself stays the English key the speed model uses; only the
     word on the pill is translated. */
  const speedModeLabel = primaryMovement.mode === 'land'
    ? null
    : t(primaryMovement.mode.toUpperCase());

  /* Run: how far a full-round sprint covers. Normally four times speed, three
     in heavy armor or under a heavy load, and one multiple more with the Run
     feat — which had nowhere on the sheet to show itself before this. It runs
     off the speed actually travelled at, so armor and encumbrance are already
     in the number. */
  const runMultiplier = player.getRunSpeedMultiplier?.() ?? 4;
  const hasRun = player.hasRunFeat?.() ?? false;
  const runSpeed = currentSpeed * runMultiplier;

  /* One breakdown box per stat. StatInfo renders nothing when both lists are
     empty, so "only when there is something to say" needs no test here — the
     component owns that rule so it cannot drift between surfaces. */
  const statInfo = (label, value, contributions, statKey, extraNotes = []) => (
    <StatInfo
      label={label}
      value={value}
      contributions={contributions ?? []}
      situational={[
        ...(statKey ? (player.getSituationalContributions?.(statKey) ?? []) : []),
        ...extraNotes,
      ]}
    />
  );

  const totalInitiative = player.getTotalInitiative?.() ?? 0;
  const totalFort = player.getTotalFortitudeSave?.() ?? player.getFortitudeSave?.() ?? 0;
  const totalRef  = player.getTotalReflexSave?.()    ?? player.getReflexSave?.()    ?? 0;
  const totalWill = player.getTotalWillSave?.()      ?? player.getWillSave?.()      ?? 0;
  const ac        = player.getArmorClass?.()    ?? 10;
  const acTouch   = player.getContactAC?.()     ?? 10;
  const acFlat    = player.getFlatFootedAC?.()  ?? 10;

  const characterName  = player.getName?.() ?? '';
  const characterClass = player.getClass?.() ?? '';
  const characterLevel = player.getLevel?.() ?? 1;
  const characterPortrait = player.getPortrait?.() ?? '';

  const renderBonusEditor = (label, min, max, step = 1) => (
    <Card padding>
      <div className="sh-row-h" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <span className="sh-eyebrow">{tx('{0} bonus', label)}</span>
        <Stepper
          value={tempBonus}
          min={min}
          max={max}
          step={step}
          onChange={setTempBonus}
        />
        {/* marginLeft auto pushes the save/cancel pair to the right edge
            of the row, matching the AC editor's footer layout. */}
        <IconButton icon="check" size="sm" onClick={saveBonus} aria-label={t('Save bonus')} style={{ marginLeft: 'auto' }} />
        <IconButton icon="close" ghost size="sm" onClick={() => setEditBonus(null)} aria-label={t('Cancel')} />
      </div>
    </Card>
  );

  const renderAcEditor = () => (
    <Card padding>
      <div className="sh-stack" style={{ gap: 'var(--space-2)' }}>
        <Filigree>{t('AC modifiers')}</Filigree>
        {[
          { key: 'general', label: t('General'), hint: t('AC + touch + flat') },
          { key: 'touch',   label: t('Touch'),   hint: t('touch only') },
          { key: 'flat',    label: t('Flat'),    hint: t('flat-footed only') },
        ].map(({ key, label, hint }) => (
          <div key={key} className="sh-row-h sh-spread" style={{ gap: 'var(--space-2)' }}>
            <span className="sh-eyebrow">{label} <span className="sh-faint" style={{ textTransform: 'none', letterSpacing: 0 }}>({hint})</span></span>
            <Stepper
              value={tempAc[key]}
              min={-99}
              max={99}
              onChange={v => setTempAc(prev => ({ ...prev, [key]: v }))}
            />
          </div>
        ))}
        <div className="sh-row-h" style={{ gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <IconButton icon="check" size="sm" onClick={saveBonus} aria-label={t('Save AC modifiers')} />
          <IconButton icon="close" ghost size="sm" onClick={() => setEditBonus(null)} aria-label={t('Cancel')} />
        </div>
      </div>
    </Card>
  );

  /* Render the inline editor for whichever stat is being edited; placed
     directly below the grid row that contains the active stat. */
  const renderActiveEditor = () => {
    if (editBonus === 'ac') return renderAcEditor();
    if (editBonus === 'speedBonus')      return renderBonusEditor(t('Speed'), 0, 99, 5);
    if (editBonus === 'initiativeBonus') return renderBonusEditor(t('Init'), -99, 99);
    if (editBonus === 'fortBonus')       return renderBonusEditor(t('Fort'), -99, 99);
    if (editBonus === 'reflexBonus')     return renderBonusEditor(t('Ref'),  -99, 99);
    if (editBonus === 'willBonus')       return renderBonusEditor(t('Will'), -99, 99);
    return null;
  };

  const TOP_ROW_KEYS    = ['ac', 'initiativeBonus', 'speedBonus'];
  const BOTTOM_ROW_KEYS = ['fortBonus', 'reflexBonus', 'willBonus'];

  const bab_display = formatBaseAttackBonus(bab);
  const sneakAttackDice = player.getSneakAttackDice?.() ?? 0;
  const sneakAttackRange = player.getSneakAttackRange?.() ?? 0;
  const sneakAttackImmuneTypes = player.getSneakAttackImmuneTypes?.() ?? [];
  const damageReductions = player.getDamageReductions?.() ?? [];
  /* The monk's Diamond Soul. Spell resistance is a defense, so it sits with
     damage reduction beside the hit points both protect — the paladin's mount
     already showed its own SR while the monk who has it showed nothing. */
  const spellResistance = player.getSpellResistance?.() ?? 0;
  /* Worn-item defenses. Energy resistance and concealment are the two concepts
     the sheet had no notion of before item 1; they sit beside DR and SR
     because they answer the same question — what stops damage reaching me. */
  const energyResistances = player.getEnergyResistances?.() ?? [];
  const missChance = player.getMissChance?.() ?? 0;
  const wornImmunities = player.getWornImmunities?.() ?? [];
  const grantedAbilities = player.getWornGrantedAbilities?.() ?? [];
  const isShaped = player.isWildShaped?.() ?? false;
  const wildShapeAttacks = isShaped ? (player.getWildShapeAttacks?.() ?? []) : [];

  return (
    <>
    <div
      className="sh-stack combat-page-wrap"
      style={{ paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-12)' }}
    >
      {/* Header card with portrait + identity */}
      <Card padding>
        <div className="sh-row-h" style={{ gap: 'var(--space-3)', alignItems: 'stretch' }}>
          <button
            type="button"
            className="sh-portrait"
            onClick={() => setPortraitOpen(true)}
            aria-label={characterPortrait ? t('Change portrait') : t('Add portrait')}
          >
            {characterPortrait
              ? <img src={characterPortrait} alt="" className="sh-portrait-img" />
              : <Icon name="badge" />}
          </button>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <Filigree>{tx('{0} · level {1}', characterClass || t('No class'), characterLevel)}</Filigree>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
              <div className="sh-display" style={{ fontSize: 'var(--font-size-2xl)' }}>{characterName || t('Unnamed')}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Health card: hit points and the conditions that act on them, which
          overlap enough that splitting them meant reading two cards for one
          state — Dead, Dying and Disabled are derived from the HP number. */}
      <Card
        title={`${currentHp} / ${maxHp} hp`}
        eyebrow={t('Health')}
        /* Tapping the head collapses the card. The breakdown and rest buttons
           live in the action slot, which Card excludes from this handler, so
           they keep behaving as themselves. */
        onHeadClick={() => toggleCard('player')}
        action={
          <>
            {statInfo(t('Maximum hit points'), maxHp, player.getMaxLifeContributions?.(), 'maxHp')}
            {/* A day's rest: refreshes spell slots, gnome racial spells and
                every per-day class-feature counter in one action. */}
            <IconButton
              icon="bedtime"
              ghost size="sm"
              aria-label={t('Rest: refresh spells and class feature uses')}
              title={t('Rest')}
              onClick={handleRest}
            />
            <IconButton
              icon={collapsed.player ? 'expand_more' : 'expand_less'}
              ghost size="sm"
              aria-label={t('Toggle HP card')}
              onClick={() => toggleCard('player')}
            />
          </>
        }
      >
        {!collapsed.player && (
          <div className="sh-stack">
            <Bar value={hpRatio} variant={hpBarVariant} />
            {(condDeltas.maxHp || damageReductions.length > 0 || spellResistance > 0
              || energyResistances.length > 0 || missChance > 0
              || wornImmunities.length > 0 || grantedAbilities.length > 0) ? (
              <div className="sh-row-h" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                {condDeltas.maxHp ? (
                  <Pill tone="warn" icon="warning">{tx('Conditions: {0} max HP', fmtDelta(condDeltas.maxHp))}</Pill>
                ) : null}
                {/* Damage reduction belongs with the hit points it protects,
                    and shows here only — never on the card of the feature that
                    granted it. Sources are listed separately because DR does
                    not stack: the best applies, or each applies on its own when
                    the bypass types differ. */}
                {damageReductions.map(({ amount, bypass, source }) => (
                  <Pill key={`${source}-${amount}-${bypass}`} tone="success" icon="shield" title={tx('From {0}', source)}>
                    {t('DR')} {amount}/{bypass}
                  </Pill>
                ))}
                {spellResistance > 0 && (
                  <Pill tone="success" icon="security" title={t('A caster must beat this with a caster level check to affect you')}>
                    {t('SR')} {spellResistance}
                  </Pill>
                )}
                {/* A ring of energy resistance is attuned to one energy type
                    when it is made. An unattuned one says so rather than
                    quietly claiming a type it does not have. */}
                {energyResistances.map(({ type, amount, source }) => (
                  <Pill
                    key={`${source}-${type}-${amount}`}
                    tone={type ? 'success' : 'warn'}
                    icon={type ? 'local_fire_department' : 'help'}
                    title={tx('From {0}', source)}
                  >
                    {type ? tx('Resist {0} {1}', type.toLowerCase(), amount) : tx('Resist {0} — pick an energy type', amount)}
                  </Pill>
                ))}
                {missChance > 0 && (
                  <Pill tone="success" icon="blur_on" title={t('Attacks against you must beat this miss chance')}>
                    {tx('{0}% miss chance', missChance)}
                  </Pill>
                )}
                {wornImmunities.map(({ what, source }) => (
                  <Pill key={`${source}-${what}`} tone="success" icon="block" title={tx('From {0}', source)}>
                    {tx('Immune: {0}', String(what).toLowerCase())}
                  </Pill>
                ))}
                {grantedAbilities.map(({ ability, source }) => (
                  <Pill key={`${source}-${ability}`} tone="success" icon="auto_awesome" title={tx('From {0}', source)}>
                    {ability}
                  </Pill>
                ))}
              </div>
            ) : null}
            {(() => {
              // Disabled buttons still receive pointer events, so the long-press
              // handlers must NOT be wired when the button is in its disabled
              // boundary state (max HP for +, -10 for −). Spreading conditionally
              // is the cleanest way to gate this.
              const plusDisabled  = currentHp >= maxHp;
              const minusDisabled = currentHp <= -10;
              return (
                <div className="sh-row-h" style={{ justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                  <IconButton
                    icon={hpAdvancedOpen ? 'expand_less' : 'expand_more'}
                    ghost size="sm"
                    onClick={() => setHpAdvancedOpen(v => !v)}
                    aria-label={hpAdvancedOpen ? t('Hide advanced HP') : t('Show advanced HP')}
                  />
                  <IconButton
                    icon="remove"
                    {...(minusDisabled ? {} : longPressMinus)}
                    disabled={minusDisabled}
                    aria-label={t('Decrease HP')}
                  />
                  <div style={{
                    flex: 1,
                    textAlign: 'center',
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--font-size-2xl)',
                    fontVariantNumeric: 'tabular-nums',
                    color: hpFeedback ? (hpFeedback.delta >= 0 ? 'var(--success)' : 'var(--danger)') : 'var(--ink)',
                    transition: 'color var(--t-base) var(--ease)',
                  }}>
                    {hpFeedback?.text ?? `${currentHp} / ${maxHp}`}
                  </div>
                  <IconButton
                    icon="add"
                    {...(plusDisabled ? {} : longPressPlus)}
                    disabled={plusDisabled}
                    aria-label={t('Increase HP')}
                  />
                </div>
              );
            })()}
            {hpAdvancedOpen && (
              <>
                <div className="sh-row-h sh-spread">
                  <span className="sh-eyebrow">{t('Base max life')}</span>
                  {editMaxLife ? (
                    <div className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                      <Stepper
                        value={tempMaxLife}
                        min={player.getBaseLifeMin?.() ?? 1}
                        /* Stepper is hard-capped, so use a sentinel high enough
                           to not block house-rule HP. Warning below flags any
                           value above the theoretical PHB max. */
                        max={999}
                        onChange={setTempMaxLife}
                      />
                      <IconButton icon="check" size="sm" onClick={saveMaxLife} aria-label={t('Save max life')} />
                      <IconButton icon="close" ghost size="sm" onClick={() => setEditMaxLife(false)} aria-label={t('Cancel')} />
                    </div>
                  ) : (
                    <div className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                      <span className="sh-mono sh-num sh-muted">{player.maxLife ?? maxHp}</span>
                      <IconButton icon="edit" ghost size="sm" onClick={startEditMaxLife} aria-label={t('Edit max life')} />
                    </div>
                  )}
                </div>
                {(() => {
                  const phbMax = player.getBaseLifeMax?.() ?? 0;
                  const current = editMaxLife ? Number(tempMaxLife) : Number(player.maxLife);
                  if (phbMax > 0 && current > phbMax) {
                    return (
                      <div className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                        <Pill tone="warn" icon="warning">{tx('Over {0} max ({1})', t('PHB'), phbMax)}</Pill>
                      </div>
                    );
                  }
                  return null;
                })()}
                <div className="sh-row-h sh-spread">
                  <span className="sh-eyebrow">{t('Bonus life')}</span>
                  {editBonusLife ? (
                    <div className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                      <Stepper
                        value={tempBonusLife}
                        min={-99}
                        max={999}
                        onChange={setTempBonusLife}
                      />
                      <IconButton icon="check" size="sm" onClick={saveBonusLife} aria-label={t('Save bonus life')} />
                      <IconButton icon="close" ghost size="sm" onClick={() => setEditBonusLife(false)} aria-label={t('Cancel')} />
                    </div>
                  ) : (
                    <div className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                      <span className="sh-mono sh-num sh-muted">{(Number(player.healthModifier) || 0) >= 0 ? '+' : ''}{Number(player.healthModifier) || 0}</span>
                      <IconButton icon="edit" ghost size="sm" onClick={startEditBonusLife} aria-label={t('Edit bonus life')} />
                    </div>
                  )}
                </div>
              </>
            )}

            <ConditionsSection />
          </div>
        )}
      </Card>

      {/* Defense pills row (AC / Init / Speed). Each pill carries its
          own pencil; the matching inline editor renders below the row. */}
      <div className="sh-grid-3">
        <StatPill
          accent
          label={t('AC')}
          value={ac}
          info={statInfo(t('Armor Class'), ac, player.getArmorClassContributions?.(), 'ac')}
          cond={acDelta}
          sub={
            <>
              <span style={{ display: 'block' }}>touch {acTouch}</span>
              <span style={{ display: 'block' }}>flat {acFlat}</span>
              {acCondAffected && condNote(acDelta)}
            </>
          }
          editing={editBonus === 'ac'}
          onEdit={() => toggleEditBonus('ac')}
        />
        <StatPill
          label={t('Init')}
          value={totalInitiative >= 0 ? `+${totalInitiative}` : `${totalInitiative}`}
          info={statInfo(t('Initiative'), totalInitiative, player.getInitiativeContributions?.(), 'initiative')}
          cond={condDeltas.initiative || 0}
          sub={withCond(initiativeBonus !== 0 ? `${t('bonus')} ${initiativeBonus >= 0 ? '+' : ''}${initiativeBonus}` : null, condDeltas.initiative || 0)}
          editing={editBonus === 'initiativeBonus'}
          onEdit={() => toggleEditBonus('initiativeBonus')}
        />
        <StatPill
          label={t('Speed')}
          value={speedReduced ? <span className="sh-stat-value-reduced">{speedDisplay}</span> : speedDisplay}
          info={statInfo(t('Speed'), currentSpeed, player.getSpeedContributions?.(), 'speed', [{
            source: 'run',
            label: t('Running'),
            note: hasRun
              ? tx('A full-round run covers {0} (×{1}), and the Run feat keeps your Dexterity bonus to AC while running.', u.distance(runSpeed), runMultiplier)
              : tx('A full-round run covers {0} (×{1}), and you lose your Dexterity bonus to AC while running.', u.distance(runSpeed), runMultiplier),
          }])}
          cond={condDeltas.speed || 0}
          sub={
            <>
              {speedModeLabel && (
                <span className="sh-speed-mode" style={{ display: 'block' }}>{speedModeLabel}</span>
              )}
              {/* The run distance is reference, not a number read mid-turn, so
                  it lives in the breakdown box rather than crowding the pill. */}
              {withCond(
                speedInfo?.hasReduction ? t('encumbered') : (speedBonus !== 0 ? `${t('bonus')} +${speedBonus}` : null),
                condDeltas.speed || 0
              )}
            </>
          }
          editing={editBonus === 'speedBonus'}
          onEdit={() => toggleEditBonus('speedBonus')}
        />
      </div>
      {TOP_ROW_KEYS.includes(editBonus) && renderActiveEditor()}

      {/* Saves row */}
      <div className="sh-grid-3">
        <StatPill
          label={t('Fort')}
          value={totalFort >= 0 ? `+${totalFort}` : totalFort}
          info={statInfo(t('Fortitude save'), totalFort, player.getSaveContributions?.('fortitude'), 'fortitude')}
          cond={condDeltas.fort || 0}
          sub={withCond(fortBonus ? `${t('bonus')} ${fortBonus >= 0 ? '+' : ''}${fortBonus}` : null, condDeltas.fort || 0)}
          editing={editBonus === 'fortBonus'}
          onEdit={() => toggleEditBonus('fortBonus')}
        />
        <StatPill
          label={t('Ref')}
          value={totalRef >= 0 ? `+${totalRef}` : totalRef}
          info={statInfo(t('Reflex save'), totalRef, player.getSaveContributions?.('reflex'), 'reflex')}
          cond={condDeltas.reflex || 0}
          sub={withCond(reflexBonus ? `${t('bonus')} ${reflexBonus >= 0 ? '+' : ''}${reflexBonus}` : null, condDeltas.reflex || 0)}
          editing={editBonus === 'reflexBonus'}
          onEdit={() => toggleEditBonus('reflexBonus')}
        />
        <StatPill
          label={t('Will')}
          value={totalWill >= 0 ? `+${totalWill}` : totalWill}
          info={statInfo(t('Will save'), totalWill, player.getSaveContributions?.('will'), 'will')}
          cond={condDeltas.will || 0}
          sub={withCond(willBonus ? `${t('bonus')} ${willBonus >= 0 ? '+' : ''}${willBonus}` : null, condDeltas.will || 0)}
          editing={editBonus === 'willBonus'}
          onEdit={() => toggleEditBonus('willBonus')}
        />
      </div>
      {BOTTOM_ROW_KEYS.includes(editBonus) && renderActiveEditor()}

      {/* Attacks card */}
      <Card
        eyebrow={`BAB ${bab_display}`}
        title={t('Attacks')}
        onHeadClick={() => toggleCard('combat')}
        action={
          <IconButton
            icon={collapsed.combat ? 'expand_more' : 'expand_less'}
            ghost size="sm"
            onClick={() => toggleCard('combat')}
            aria-label={t('Toggle attacks')}
          />
        }
      >
        {!collapsed.combat && (
          <>
          {/* An assumed form replaces the whole attack list: its gear has
              melded, so no weapon it carried is usable and the natural attacks
              are the only ones it has. */}
          {isShaped ? (
            <div className="sh-stack" style={{ gap: 'var(--space-2)' }}>
              {wildShapeAttacks.length === 0 ? (
                <div className="sh-warn-strip">
                  <Icon name="sports_mma" />
                  {t('This form has no natural attacks.')}
                </div>
              ) : wildShapeAttacks.map((line, idx) => (
                <div
                  key={line.index}
                  className="sh-row-h sh-spread"
                  style={idx === 0
                    ? { gap: 'var(--space-3)' }
                    : { gap: 'var(--space-3)', borderTop: '1px solid var(--border-soft)', paddingTop: 'var(--space-2)' }}
                >
                  <span className="sh-display" style={{ fontSize: 'var(--font-size-lg)', textTransform: 'capitalize' }}>
                    {line.count > 1 ? `${line.count} ` : ''}{line.name}
                  </span>
                  <span className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                    <Pill tone="accent">{line.bonus >= 0 ? '+' : ''}{line.bonus ?? 0}</Pill>
                    {line.damage && <Pill tone="default">{line.damage}</Pill>}
                  </span>
                </div>
              ))}
              <div className="sh-faint" style={{ fontSize: 'var(--font-size-xs)' }}>
                {t("Natural attacks of your form, computed with your own base attack bonus and the form's Strength. Extra limbs grant no extra attacks.")}
              </div>
            </div>
          ) : (
          <>
          {/* Untrained armor is worth saying once, above every attack line,
              because unlike a weapon it costs the same on all of them. The
              penalty is already inside each attack number. */}
          {(untrainedArmor || untrainedShield) && (
            <div className="sh-warn-strip" style={{ marginBottom: 'var(--space-2)' }}>
              <Icon name="shield_with_heart" />
              {tx(
                armorProficiencyPenalty !== 0
                  ? 'Not proficient with your {0}: {1} on every attack roll'
                  : 'Not proficient with your {0}',
                [untrainedArmor && t('armor'), untrainedShield && t('shield')].filter(Boolean).join(t(' or ')),
                armorProficiencyPenalty
              )}
            </div>
          )}
          {equippedWeapons.length > 0 && (
            <div className="sh-stack" style={{ gap: 'var(--space-2)' }}>
              {equippedWeapons.map((w, idx) => {
                const wd = { weaponItem: w.weaponItem, isTwoHanded: w.isTwoHanded, itemData: w.itemData };
                const ab = calculateWeaponAttackBonus(player, wd);
                const dmg = calculateWeaponDamage(player, wd);
                const dmgAffected = player.isWeaponDamageConditionAffected?.(wd) ?? false;
                /* The weapon's own profile, which the sheet never showed: the
                   threat range Improved Critical widens, and the range
                   increment Far Shot extends. Both come from the model so the
                   feats are applied in one place. */
                const crit = player.getWeaponCritical?.(w.weaponItem) ?? null;
                const range = player.getWeaponRange?.(w.weaponItem) ?? { feet: 0, extended: false };
                /* The -4 is already inside the attack number above; this says
                   where it came from, which is the part the sheet was missing. */
                const untrained = player.isProficientWithWeapon?.(w.weaponItem) === false;
                /* Only show the separator border between rows, not above
                   the first weapon (otherwise it visually doubles the
                   Card's own internal padding boundary). */
                const rowStyle = idx === 0
                  ? { gap: 'var(--space-3)' }
                  : { gap: 'var(--space-3)', borderTop: '1px solid var(--border-soft)', paddingTop: 'var(--space-2)' };
                return (
                  <div key={`${w.link}-${w.slot}`} className="sh-row-h sh-spread" style={rowStyle}>
                    <span className="sh-row-h attack-row-label">
                      {/* A sword for a weapon that is swung, a crosshair for one
                          used at range — Material Symbols has no bow. Thrown
                          melee weapons (dagger, spear, trident) read as melee,
                          which is how they are usually used. */}
                      <Icon
                        name={getWeaponType(w.weaponItem).isRanged ? 'my_location' : 'swords'}
                        size={18}
                        className="sh-faint attack-row-icon"
                      />
                      <span className="attack-row-name">
                        <SpellLink link={w.link}>
                          <span className="sh-display" style={{ fontSize: 'var(--font-size-lg)' }}>{w.name}</span>
                        </SpellLink>
                        {(crit || range.feet > 0 || untrained) && (
                          <span className="sh-faint attack-row-meta">
                            {crit && (
                              <span className={crit.improved ? 'is-feat-boosted' : undefined}>{crit.text}</span>
                            )}
                            {crit && range.feet > 0 && ' · '}
                            {range.feet > 0 && (
                              <span className={range.extended ? 'is-feat-boosted' : undefined}>
                                {u.distance(range.feet)}
                              </span>
                            )}
                            {untrained && (crit || range.feet > 0) && ' · '}
                            {untrained && <span className="is-untrained">{t('not proficient')}</span>}
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                      <Pill tone={attackTone(player.getWeaponAttackDeviation?.(wd) ?? 0)}>{ab >= 0 ? '+' : ''}{ab}</Pill>
                      <Pill tone={dmgAffected ? 'warn' : 'default'}>{dmg}</Pill>
                      {/* One box per weapon, not two: the damage bonus shares
                          it as a second labelled group, so a dense row keeps a
                          single button and the reader still gets the number
                          after the dice explained. */}
                      <StatInfo
                        label={w.name}
                        value={ab}
                        primaryLabel={t('Attack bonus')}
                        contributions={player.getWeaponAttackContributions?.(wd) ?? []}
                        secondary={{
                          label: t('Damage bonus'),
                          contributions: player.getWeaponDamageContributions?.(wd) ?? [],
                        }}
                        situational={player.getWeaponSituationalContributions?.() ?? []}
                      />
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          {showsPunch && (
            <div
              className="sh-stack"
              style={equippedWeapons.length === 0 ? undefined : {
                gap: 'var(--space-1)',
                borderTop: '0.0625rem solid var(--border-soft)',
                paddingTop: 'var(--space-2)',
                marginTop: 'var(--space-2)',
              }}
            >
              {/* No "defaulting to punch" strip: the punch is one of the
                  character's attacks, listed beside the others, not a warning
                  that something is missing. */}
              <div className="sh-row-h sh-spread" style={{ gap: 'var(--space-3)' }}>
                <span className="sh-row-h attack-row-label">
                  {/* No weapon to draw — a fist. */}
                  <Icon name="sports_mma" size={18} className="sh-faint attack-row-icon" />
                  <span className="attack-row-name">
                    <span className="sh-display">{t('Punch')}</span>
                    <span className="sh-faint attack-row-meta">
                      <span className={punchCrit.improved ? 'is-feat-boosted' : undefined}>
                        {punchCrit.text}
                      </span>
                      {punchUntrained && ' · '}
                      {punchUntrained && <span className="is-untrained">{t('not proficient')}</span>}
                    </span>
                  </span>
                </span>
                <span className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                  <Pill tone={attackTone(player.getPunchAttackDeviation?.() ?? 0)}>{punchAttack >= 0 ? '+' : ''}{punchAttack}</Pill>
                  <Pill tone={punchDmgAffected ? 'warn' : 'default'}>{punchDamage}</Pill>
                </span>
              </div>
            </div>
          )}
          {/* Wands, rods and staffs: what the character can do with what is in
              their hands, beside what they can swing. */}
          <HeldItemsRows />
          {hasCombatReflexes && (
            <div
              className="sh-row-h sh-spread"
              style={{
                gap: 'var(--space-3)',
                borderTop: '0.0625rem solid var(--border-soft)',
                paddingTop: 'var(--space-2)',
                marginTop: 'var(--space-2)',
              }}
            >
              <span className="sh-display">{t('Attacks of opportunity')}</span>
              <span className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                <Pill tone="accent">
                  {attacksOfOpportunity} / round
                </Pill>
                {statInfo(
                  t('Attacks of opportunity'),
                  attacksOfOpportunity,
                  player.getAttacksOfOpportunityContributions?.(),
                  'attacksOfOpportunity'
                )}
              </span>
            </div>
          )}
          {twoWeapon && (
            <div
              className="sh-stack"
              style={{
                gap: 'var(--space-1)',
                borderTop: '0.0625rem solid var(--border-soft)',
                paddingTop: 'var(--space-2)',
                marginTop: 'var(--space-2)',
              }}
            >
              <div className="sh-row-h sh-spread" style={{ gap: 'var(--space-3)' }}>
                <span className="sh-display">{t('Two-weapon attack')}</span>
                <span className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                  <Pill tone={twoWeapon.hasFeat ? 'success' : 'warn'}>
                    {twoWeapon.penalties.main} / {twoWeapon.penalties.offHand}
                  </Pill>
                  <InfoPopover label={t('Two-weapon attack')}>
                    <p>
                      {tx(
                        'A {0}. A weapon in each hand grants one extra attack with the off hand, and both hands take a penalty for the round: {1} on every main-hand attack and {2} on the off-hand one.',
                        <b>{t('full-round action')}</b>,
                        <b>{twoWeapon.penalties.main}</b>,
                        <b>{twoWeapon.penalties.offHand}</b>
                      )}
                    </p>
                    <p>
                      {twoWeapon.offHandIsLight
                        ? t('Your off-hand weapon is light, which is two better on both.')
                        : t('A light weapon in the off hand would be two better on both.')}
                      {twoWeapon.hasFeat
                        ? t(' Two-Weapon Fighting is already counted here.')
                        : t(' Two-Weapon Fighting would bring the off hand up to match the main one.')}
                    </p>
                    <p>
                      {tx('The off-hand weapon adds only {0} your Strength modifier to damage.', <b>{t('half')}</b>)}
                    </p>
                  </InfoPopover>
                </span>
              </div>
              <div className="sh-row-h sh-spread sh-faint" style={{ gap: 'var(--space-3)' }}>
                <span>{twoWeapon.main.name}</span>
                <span className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                  <Pill tone="ghost">
                    {twoWeapon.main.attack >= 0 ? '+' : ''}{twoWeapon.main.attack}
                  </Pill>
                  <Pill tone="ghost">{twoWeapon.main.damage}</Pill>
                </span>
              </div>
              <div className="sh-row-h sh-spread sh-faint" style={{ gap: 'var(--space-3)' }}>
                <span>{twoWeapon.offHand.name} (off hand)</span>
                <span className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                  {twoWeapon.offHand.attacks.map((n, i) => (
                    <Pill key={`offhand-${i}`} tone="ghost">{n >= 0 ? '+' : ''}{n}</Pill>
                  ))}
                  <Pill tone="ghost">{twoWeapon.offHand.damage}</Pill>
                </span>
              </div>
            </div>
          )}
          {(flurryUnarmed || flurryWeapons.length > 0) && (
            <div
              className="sh-stack"
              style={{
                gap: 'var(--space-1)',
                borderTop: '0.0625rem solid var(--border-soft)',
                paddingTop: 'var(--space-2)',
                marginTop: 'var(--space-2)',
              }}
            >
              <div className="sh-row-h sh-spread" style={{ gap: 'var(--space-3)' }}>
                <span className="sh-display">{t('Flurry of blows')}</span>
                <span className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                  <Pill tone="accent">
                    {flurry.extraAttacks === 1
                      ? tx('+{0} attack', flurry.extraAttacks)
                      : tx('+{0} attacks', flurry.extraAttacks)}
                  </Pill>
                  <Pill tone={flurry.penalty < 0 ? 'warn' : 'default'}>
                    {flurry.penalty === 0 ? t('no penalty') : tx('{0} to all', flurry.penalty)}
                  </Pill>
                  {/* Was a bare `info` glyph beside a title tooltip: it looked
                      like a button, did nothing, and said nothing at all on a
                      phone, where a hover title never appears. */}
                  <InfoPopover label={t('Flurry of blows')}>
                    <p>
                      {flurry.extraAttacks === 1
                        ? tx(
                          'A {0} granting {1} extra attack at your highest base attack bonus.',
                          <b>{t('full-round action')}</b>,
                          flurry.extraAttacks
                        )
                        : tx(
                          'A {0} granting {1} extra attacks at your highest base attack bonus.',
                          <b>{t('full-round action')}</b>,
                          flurry.extraAttacks
                        )}
                      {flurry.penalty === 0
                        ? t(' At your level it costs no penalty at all.')
                        : tx(' Every attack in the flurry, the extra one included, takes {0}.', flurry.penalty)}
                    </p>
                    <p>
                      {tx(
                        'Usable only with {0} — kama, nunchaku, sai, shuriken, siangham — and a single flurry may not mix the two. A quarterstaff qualifies only while wielded two-handed.',
                        <b>{t('unarmed strikes or monk weapons')}</b>
                      )}
                    </p>
                  </InfoPopover>
                </span>
              </div>
              {/* A monk wielding monk weapons can still strike unarmed, so both
                  lines can appear at once — a flurry may not mix the two, but
                  the sheet shows what each one would swing at. */}
              {flurryUnarmed && (
                <div className="sh-row-h sh-spread sh-faint" style={{ gap: 'var(--space-3)' }}>
                  <span>{t('Punch')}</span>
                  <Pill tone="ghost">
                    {punchAttack + flurry.penalty >= 0 ? '+' : ''}{punchAttack + flurry.penalty}
                  </Pill>
                </div>
              )}
              {flurryWeapons.map((w) => {
                const wd = { weaponItem: w.weaponItem, isTwoHanded: w.isTwoHanded, itemData: w };
                const flurried = calculateWeaponAttackBonus(player, wd) + flurry.penalty;
                return (
                  <div key={`flurry-${w.link}-${w.slot}`} className="sh-row-h sh-spread sh-faint" style={{ gap: 'var(--space-3)' }}>
                    <span>{w.name}</span>
                    <Pill tone="ghost">{flurried >= 0 ? '+' : ''}{flurried}</Pill>
                  </div>
                );
              })}
            </div>
          )}
          </>
          )}
          {/* Sneak attack rides on whichever attack landed, so it sits outside
              the shaped / unshaped split. */}
          {sneakAttackDice > 0 && (
            <div
              className="sh-row-h sh-spread"
              style={{
                gap: 'var(--space-3)',
                borderTop: '0.0625rem solid var(--border-soft)',
                paddingTop: 'var(--space-2)',
                marginTop: 'var(--space-2)',
              }}
            >
              <span className="sh-display">{t('Sneak attack')}</span>
              <span className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                <Pill tone="accent">+{sneakAttackDice}d6</Pill>
                {/* Was a title attribute, which a phone never shows, and which
                    restated a range and an immunity list classes.json already
                    held. Both now come from the model. */}
                <InfoPopover label={t('Sneak attack')}>
                  <p>
                    {sneakAttackRange > 0
                      ? tx(
                          'Applies when the target is {0} to AC, or when you are {1} it — with a ranged weapon, only within {2}.',
                          <b>{t('denied its Dexterity bonus')}</b>,
                          <b>{t('flanking')}</b>,
                          <b>{u.distance(sneakAttackRange)}</b>
                        )
                      : tx(
                          'Applies when the target is {0} to AC, or when you are {1} it.',
                          <b>{t('denied its Dexterity bonus')}</b>,
                          <b>{t('flanking')}</b>
                        )}
                  </p>
                  <p>
                    {tx('The dice are added on a critical hit but are {0}, and any concealment at all negates them.', <b>{t('never multiplied')}</b>)}
                  </p>
                  {sneakAttackImmuneTypes.length > 0 && (
                    <p>
                      {tx('No effect on {0} creatures, or anything else immune to critical hits.', sneakAttackImmuneTypes.join(', ').toLowerCase())}
                    </p>
                  )}
                </InfoPopover>
              </span>
            </div>
          )}
          </>
        )}
          {/* The two feats that are a decision rather than a bonus. Last in
              the card because every number above it moves when they change. */}
          <CombatStancesRow />

          {/* The feats that grant an action rather than a number. Last in the
              card because they change none of the figures above them. */}
          <ActionFeatsRow />
      </Card>

      {/* What is in the four free slots — absent when they are empty. */}
      <EquippedItemsCard />
      <PotionsCard />
      <ScrollsCard />

      {/* Class-specific cards — see class_feature_cards.jsx for the registry */}
      <ClassFeatureCards />
    </div>
    <PortraitEditorSheet
      open={portraitOpen}
      onClose={() => setPortraitOpen(false)}
      currentPortrait={characterPortrait}
      onSave={(dataUrl) => { dispatch(onSetCharacterPortrait(dataUrl)); setPortraitOpen(false); }}
      onRemove={() => { dispatch(onClearCharacterPortrait()); setPortraitOpen(false); }}
    />
    </>
  );
}

