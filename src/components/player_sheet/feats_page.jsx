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
import Card from '../common/Card';
import Pill from '../common/Pill';
import Button from '../common/Button';
import IconButton from '../common/IconButton';
import Filigree from '../common/Filigree';
import EmptyState from '../common/EmptyState';
import Switch from '../common/Switch';
import Icon from '../common/Icon';

function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function FeatsPage() {
  const dispatch = useDispatch();
  const player = useSelector(state => state.playerSheet?.player);
  const [isSelection, setIsSelection] = useState(false);
  const [filterPrereqs, setFilterPrereqs] = useState(false);
  const [popoverState, setPopoverState] = useState(null);

  const featsData = useMemo(() => loadFile('feats') || [], []);
  const featMap = useMemo(() => {
    const m = {};
    featsData.forEach(f => { if (f?.Name) m[f.Name] = f; });
    return m;
  }, [featsData]);

  const playerFeats = useMemo(() => player?.getFeats?.() ?? [], [player]);
  const count = playerFeats.length;
  const max = player?.getFeatPointsMax?.() ?? 1;
  const canChoose = count < max;

  const isAllowedFeat = featName => {
    const baseName = getBaseFeatName(featName);
    if (REPEATABLE_NO_CHOICE.includes(baseName)) return true;
    if (REPEATABLE_WITH_CHOICE[baseName]) return true;
    return !playerFeats.includes(featName);
  };

  const availableFeats = useMemo(() => {
    const normalized = new Set(playerFeats.map(f => getBaseFeatName(f).toLowerCase()));
    return featsData
      .filter(f => {
        if (!f?.Name) return false;
        const baseName = getBaseFeatName(f.Name);
        const isRepeatable = REPEATABLE_NO_CHOICE.includes(baseName) || REPEATABLE_WITH_CHOICE[baseName];
        if (!isRepeatable && normalized.has(baseName.toLowerCase())) return false;
        if (filterPrereqs && !meetsPrerequisites(f, player)) return false;
        return true;
      })
      .sort((a, b) => (a.Name || '').localeCompare(b.Name || ''));
  }, [featsData, playerFeats, filterPrereqs, player]);

  const handleAddFeat = featName => {
    const baseName = getBaseFeatName(featName);
    const choicesAvailable = getChoicesForFeat(baseName, playerFeats);
    if (choicesAvailable.length > 0) setPopoverState({ feat: featName, choices: choicesAvailable });
    else dispatch(onAddFeat(featName));
  };

  const handleConfirmChoice = choice => {
    if (popoverState) {
      const baseName = getBaseFeatName(popoverState.feat);
      dispatch(onAddFeat(formatFeatWithChoice(baseName, choice)));
      setPopoverState(null);
    }
  };

  const handleRemove = index => dispatch(onRemoveFeatAt(index));

  const handleFeatClick = feat => {
    if (!canChoose && !isAllowedFeat(feat.Name)) return;
    handleAddFeat(feat.Name);
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
        </div>
        {canChoose && (
          <Button variant="primary" icon="add" onClick={() => setIsSelection(v => !v)}>
            {isSelection ? 'Close' : 'Choose feat'}
          </Button>
        )}
      </div>

      {playerFeats.length === 0 ? (
        <EmptyState icon="auto_awesome" title="No feats yet" hint="Tap 'Choose feat' to start." />
      ) : (
        <div className="sh-stack">
          {playerFeats.map((displayFeat, idx) => {
            const feat = featMap[getBaseFeatName(displayFeat)];
            const desc = feat?.Description ? stripHtml(feat.Description) : '';
            return (
              <Card key={`${displayFeat}-${idx}`} padding>
                <div className="sh-row-h" style={{ gap: 'var(--space-3)', alignItems: 'flex-start' }}>
                  <Icon name="auto_awesome" className="sh-accent-text" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="sh-display" style={{ fontSize: 'var(--font-size-lg)' }}>{displayFeat}</div>
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

      {isSelection && canChoose && (
        <Card eyebrow={`${availableFeats.length} available`} title="Choose a feat" padding>
          <div className="sh-stack">
            <label className="sh-row-h" style={{ gap: 'var(--space-2)', cursor: 'pointer' }}>
              <Switch checked={filterPrereqs} onChange={setFilterPrereqs} aria-label="Filter by prerequisites" />
              <span className="sh-label">Only show feats whose prerequisites I meet</span>
            </label>
            {availableFeats.length === 0 ? (
              <EmptyState icon="filter_alt_off" title="Nothing matches" hint="Try unchecking the filter." />
            ) : (
              <div className="sh-stack" style={{ gap: 'var(--space-1)', maxHeight: '24rem', overflowY: 'auto' }}>
                {availableFeats.map(feat => {
                  const baseName = getBaseFeatName(feat.Name);
                  const isTaken = playerFeats.some(f => getBaseFeatName(f) === baseName);
                  const isDisabled = isTaken
                    && !REPEATABLE_NO_CHOICE.includes(baseName)
                    && !REPEATABLE_WITH_CHOICE[baseName];
                  const prereqOk = meetsPrerequisites(feat, player);
                  return (
                    <div key={feat.Name} className="sh-row-h sh-spread" style={{
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-sm)',
                      background: isDisabled ? 'transparent' : 'var(--surface-1)',
                      opacity: isDisabled ? 0.45 : 1,
                    }}>
                      <span className="sh-row-h" style={{ gap: 'var(--space-2)', minWidth: 0, flex: 1 }}>
                        <span className="sh-display" style={{ fontSize: 'var(--font-size-md)' }}>{feat.Name}</span>
                        {!prereqOk && <Pill tone="warn" icon="warning">prereq</Pill>}
                      </span>
                      <IconButton
                        ghost size="sm"
                        icon="add"
                        onClick={() => handleFeatClick(feat)}
                        disabled={isDisabled}
                        title={isDisabled ? 'Already selected' : 'Add feat'}
                        aria-label="Add"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      )}

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
