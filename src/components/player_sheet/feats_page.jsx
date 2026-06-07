import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadFile } from '../../lib/loadFile';
import { meetsPrerequisites } from '../../lib/featPrerequisites';
import {
  REPEATABLE_NO_CHOICE,
  REPEATABLE_WITH_CHOICE,
  getChoicesForFeat,
  formatFeatWithChoice,
  getBaseFeatName,
} from '../../lib/featChoices';
import {
  onAddFeat,
  onRemoveFeatAt,
} from '../../store/thunks/playerSheetThunks';
import FeatChoicePopover from './FeatChoicePopover';
import { slug } from '../../lib/slugUtils';
import SpellLink from '../common/spell_link';
import Card from '../common/Card';
import Pill from '../common/Pill';
import Button from '../common/Button';
import IconButton from '../common/IconButton';
import Filigree from '../common/Filigree';
import EmptyState from '../common/EmptyState';
import BottomSheet from '../common/BottomSheet';
import Icon from '../common/Icon';

export default function FeatsPage() {
  const dispatch = useDispatch();
  const player = useSelector(state => state.playerSheet?.player);
  const [isSelection, setIsSelection] = useState(false);
  const [filterPrereqs, setFilterPrereqs] = useState(false);
  const [filterSuggested, setFilterSuggested] = useState(false);
  const [query, setQuery] = useState('');
  const [popoverState, setPopoverState] = useState(null);

  const playerClass = player?.getClass?.() ?? '';

  const featsData = useMemo(() => loadFile('feats') || [], []);
  const featMap = useMemo(() => {
    const m = {};
    featsData.forEach(f => { if (f?.Name) m[f.Name] = f; });
    return m;
  }, [featsData]);

  const playerFeats = useMemo(() => player?.getFeats?.() ?? [], [player]);
  const count = playerFeats.length;
  const max = player?.getFeatPointsMax?.() ?? 1;
  // Per CLAUDE.md: rules are signaled, never enforced. The "Choose feat"
  // button is always available; the warning pill below flags when the
  // selection count is above the allotment.
  const overCap = count > max;

  const isAllowedFeat = featName => {
    const baseName = getBaseFeatName(featName);
    if (REPEATABLE_NO_CHOICE.includes(baseName)) return true;
    if (REPEATABLE_WITH_CHOICE[baseName]) return true;
    return !playerFeats.includes(featName);
  };

  const availableFeats = useMemo(() => {
    const normalized = new Set(playerFeats.map(f => getBaseFeatName(f).toLowerCase()));
    const q = query.trim().toLowerCase();
    return featsData
      .filter(f => {
        if (!f?.Name) return false;
        const baseName = getBaseFeatName(f.Name);
        const isRepeatable = REPEATABLE_NO_CHOICE.includes(baseName) || REPEATABLE_WITH_CHOICE[baseName];
        if (!isRepeatable && normalized.has(baseName.toLowerCase())) return false;
        if (filterPrereqs && !meetsPrerequisites(f, player)) return false;
        if (filterSuggested && playerClass) {
          const sc = Array.isArray(f.suggestedClass) ? f.suggestedClass : [];
          if (!sc.includes(playerClass)) return false;
        }
        if (q && !f.Name.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => (a.Name || '').localeCompare(b.Name || ''));
  }, [featsData, playerFeats, filterPrereqs, filterSuggested, playerClass, player, query]);

  const handleAddFeat = (featName, ev) => {
    const baseName = getBaseFeatName(featName);
    const choicesAvailable = getChoicesForFeat(baseName, playerFeats);
    if (choicesAvailable.length > 0) {
      // FeatChoicePopover only renders when given a position — capture the
      // click target's rect so the popover anchors next to the "+" button.
      const rect = ev?.currentTarget?.getBoundingClientRect?.();
      const position = rect
        ? { top: rect.bottom, left: rect.left }
        : { top: window.innerHeight / 2, left: window.innerWidth / 2 };
      setPopoverState({ feat: featName, choices: choicesAvailable, position });
    } else {
      dispatch(onAddFeat(featName));
    }
  };

  const handleConfirmChoice = choice => {
    if (popoverState) {
      const baseName = getBaseFeatName(popoverState.feat);
      dispatch(onAddFeat(formatFeatWithChoice(baseName, choice)));
      setPopoverState(null);
    }
  };

  const handleRemove = index => dispatch(onRemoveFeatAt(index));

  const handleFeatClick = (feat, ev) => {
    // Allow adding even when over cap (warning is shown in the header).
    // Still respect non-repeatable feats — those shouldn't be picked twice.
    if (!isAllowedFeat(feat.Name)) return;
    handleAddFeat(feat.Name, ev);
  };

  if (!player) {
    return (
      <div className="sh-stack" style={{ padding: 'var(--space-4)' }}>
        <EmptyState icon="auto_awesome" title="No character selected" hint="Pick or create one from the sidebar." />
      </div>
    );
  }

  return (
    <div className="sh-stack" style={{ padding: 'var(--space-4)', paddingBottom: 'var(--space-12)' }}>
      <div className="sh-row-h sh-spread">
        <div>
          <Filigree>{count} of {max} selected</Filigree>
          <div className="sh-display" style={{ fontSize: 'var(--font-size-2xl)' }}>Feats</div>
          {overCap && (
            <div style={{ marginTop: 'var(--space-1)' }}>
              <Pill tone="warn" icon="warning">Over cap ({count - max} extra)</Pill>
            </div>
          )}
        </div>
        <Button variant="primary" icon="add" onClick={() => { setIsSelection(true); setQuery(''); }}>
          Choose feat
        </Button>
      </div>

      {playerFeats.length === 0 ? (
        <EmptyState icon="auto_awesome" title="No feats yet" hint="Tap 'Choose feat' to start." />
      ) : (
        <div className="sh-stack">
          {playerFeats.map((displayFeat, idx) => {
            const feat = featMap[getBaseFeatName(displayFeat)];
            // Selected feats show the curated one-liner (shortDescription),
            // not the verbose HTML Description.
            const desc = feat?.shortDescription || '';
            return (
              <Card key={`${displayFeat}-${idx}`} padding>
                <div className="sh-row-h" style={{ gap: 'var(--space-3)', alignItems: 'flex-start' }}>
                  <Icon name="auto_awesome" className="sh-accent-text" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <SpellLink link={`feats#${slug(getBaseFeatName(displayFeat))}`}>
                      <span className="sh-display" style={{ fontSize: 'var(--font-size-lg)' }}>{displayFeat}</span>
                    </SpellLink>
                    {desc && (
                      <div className="sh-faint" style={{
                        fontSize: 'var(--font-size-xs)',
                        marginTop: 'var(--space-1)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>{desc}</div>
                    )}
                  </div>
                  <IconButton
                    ghost size="sm"
                    icon="close"
                    onClick={() => handleRemove(idx)}
                    aria-label="Remove feat"
                    title="Remove feat"
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <BottomSheet
        open={isSelection}
        onClose={() => { setIsSelection(false); setQuery(''); }}
        title="Choose a feat"
        eyebrow={`${availableFeats.length} available`}
        subheader={
          <div className="sh-stack" style={{ gap: 'var(--space-2)' }}>
            <input
              type="text"
              className="sh-input"
              placeholder="Search feats…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
            <div className="sh-row-h" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={['sh-chip', filterPrereqs && 'is-on'].filter(Boolean).join(' ')}
                aria-pressed={filterPrereqs}
                onClick={() => setFilterPrereqs(v => !v)}
              >
                Prerequisites met
              </button>
              {playerClass && (
                <button
                  type="button"
                  className={['sh-chip', filterSuggested && 'is-on'].filter(Boolean).join(' ')}
                  aria-pressed={filterSuggested}
                  onClick={() => setFilterSuggested(v => !v)}
                >
                  Suggested for {playerClass}
                </button>
              )}
            </div>
          </div>
        }
      >
        {availableFeats.length === 0 ? (
          <EmptyState icon="filter_alt_off" title="Nothing matches" hint="Try clearing the search or filters." />
        ) : (
          <div className="sh-stack" style={{ gap: 'var(--space-1)' }}>
            {availableFeats.map(feat => {
              const baseName = getBaseFeatName(feat.Name);
              const isTaken = playerFeats.some(f => getBaseFeatName(f) === baseName);
              const isDisabled = isTaken
                && !REPEATABLE_NO_CHOICE.includes(baseName)
                && !REPEATABLE_WITH_CHOICE[baseName];
              const prereqOk = meetsPrerequisites(feat, player);
              const shortDesc = feat.shortDescription || '';
              return (
                <div key={feat.Name} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  background: isDisabled ? 'transparent' : 'var(--surface-1)',
                  opacity: isDisabled ? 0.45 : 1,
                  gap: '0.25rem',
                }}>
                  <div className="sh-row-h sh-spread" style={{ gap: 'var(--space-2)' }}>
                    <span className="sh-row-h" style={{ gap: 'var(--space-2)', minWidth: 0, flex: 1 }}>
                      <SpellLink link={`feats#${slug(getBaseFeatName(feat.Name))}`}>
                        <span className="sh-display" style={{ fontSize: 'var(--font-size-md)' }}>{feat.Name}</span>
                      </SpellLink>
                      {!prereqOk && <Pill tone="warn" icon="warning">prereq</Pill>}
                    </span>
                    <IconButton
                      ghost size="sm"
                      icon="add"
                      onClick={(ev) => handleFeatClick(feat, ev)}
                      disabled={isDisabled}
                      title={isDisabled ? 'Already selected' : 'Add feat'}
                      aria-label="Add"
                    />
                  </div>
                  {shortDesc && (
                    <div className="sh-faint" style={{ fontSize: 'var(--font-size-xs)' }}>
                      {shortDesc}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </BottomSheet>

      {popoverState && (
        <FeatChoicePopover
          position={popoverState.position}
          choices={popoverState.choices}
          featName={popoverState.feat}
          onConfirm={handleConfirmChoice}
          onClose={() => setPopoverState(null)}
        />
      )}
    </div>
  );
}
