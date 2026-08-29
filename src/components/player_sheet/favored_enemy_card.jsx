import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Card from '../common/Card';
import Pill from '../common/Pill';
import InfoPopover from '../common/InfoPopover';
import Button from '../common/Button';
import IconButton from '../common/IconButton';
import useCardCollapse from './hooks/useCardCollapse';
import {
  onAddFavoredEnemy,
  onRaiseFavoredEnemy,
  onRemoveFavoredEnemy,
} from '../../store/thunks/playerSheetThunks';
import '../../style/favored_enemy.css';

const label = (entry) => (entry.subtype ? `${entry.type} (${entry.subtype})` : entry.type);

/**
 * Ranger favored enemies.
 *
 * Every slot the ranger earns is spent one of two ways: naming a new enemy, or
 * raising one already chosen by +2. The card offers both while a slot is free,
 * and keeps offering them past the limit — over-spending is flagged, not
 * blocked, per the non-enforcing rule in CLAUDE.md.
 */
export default function FavoredEnemyCard() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet?.player);
  const [type, setType] = useState('');
  const [subtype, setSubtype] = useState('');
  const [collapsed, collapseToggle] = useCardCollapse('favoredEnemy', 'favored enemies');

  if (!player?.getFavoredEnemySlotsMax?.()) return null;

  const entries = player.getFavoredEnemies();
  const max = player.getFavoredEnemySlotsMax();
  const used = player.getFavoredEnemySlotsUsed();
  const overCap = used > max;
  const subtypes = type ? player.getFavoredEnemySubtypes(type) : [];
  const needsSubtype = type ? player.favoredEnemyRequiresSubtype(type) : false;
  const canAdd = !!type && (!needsSubtype || !!subtype);

  const handleAdd = () => {
    if (!canAdd) return;
    dispatch(onAddFavoredEnemy(type, subtype || null));
    setType('');
    setSubtype('');
  };

  const handleTypeChange = (value) => {
    setType(value);
    setSubtype('');
  };

  return (
    <Card
      title="Favored enemies"
      className="sh-card--head-spread"
      eyebrow={`${used} of ${max} slots`}
      action={
        <span className="sh-row-h" style={{ gap: 'var(--space-1)' }}>
          <InfoPopover label="Favored enemies">
            <p>
              A ranger picks a first favored enemy at 1st level and another
              every five levels after. Each new slot may name a fresh enemy or{' '}
              <b>raise an existing one by +2</b>.
            </p>
            <p>
              The bonus applies to{' '}
              <b>{player.getFavoredEnemySkills().join(', ')}</b> checks against
              that enemy, and to <b>weapon damage</b> against it. It also passes
              to anything the ranger&apos;s weapon damage would carry.
            </p>
            <p>
              A type too broad to take whole — humanoids, outsiders — must be
              narrowed to a subtype.
            </p>
          </InfoPopover>
          {collapseToggle}
        </span>
      }
    >
      {!collapsed && (
      <div className="sh-stack favored-enemy">
        {overCap && (
          <Pill tone="warn" icon="warning">
            {used - max} more than this level allows
          </Pill>
        )}

        {entries.length === 0 ? (
          <span className="sh-faint favored-enemy-empty">
            No favored enemy chosen yet.
          </span>
        ) : (
          <ul className="favored-enemy-list">
            {entries.map((entry, index) => (
              <li key={`${entry.type}-${entry.subtype ?? ''}`} className="favored-enemy-entry">
                <span className="favored-enemy-name">{label(entry)}</span>
                <span className="favored-enemy-actions">
                  <Pill tone="accent">+{entry.bonus}</Pill>
                  <IconButton
                    icon="add"
                    ghost
                    size="sm"
                    title="Spend a slot raising this enemy by +2"
                    aria-label={`Raise ${label(entry)}`}
                    onClick={() => dispatch(onRaiseFavoredEnemy(index))}
                  />
                  <IconButton
                    icon="close"
                    ghost
                    size="sm"
                    title="Remove"
                    aria-label={`Remove ${label(entry)}`}
                    onClick={() => dispatch(onRemoveFavoredEnemy(index))}
                  />
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="favored-enemy-add">
          <select
            className="sh-select"
            value={type}
            aria-label="Favored enemy type"
            onChange={(e) => handleTypeChange(e.target.value)}
          >
            <option value="">Add a favored enemy…</option>
            {player.getFavoredEnemyTypes().map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {subtypes.length > 0 && (
            <select
              className="sh-select"
              value={subtype}
              aria-label="Favored enemy subtype"
              onChange={(e) => setSubtype(e.target.value)}
            >
              <option value="">
                {needsSubtype ? 'Choose a subtype…' : 'Any subtype'}
              </option>
              {subtypes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}

          <Button variant="primary" icon="add" disabled={!canAdd} onClick={handleAdd}>
            Add
          </Button>
        </div>

        {needsSubtype && !subtype && (
          <span className="sh-faint favored-enemy-empty">
            {type} is too broad to take whole — choose a subtype.
          </span>
        )}
      </div>
      )}
    </Card>
  );
}
