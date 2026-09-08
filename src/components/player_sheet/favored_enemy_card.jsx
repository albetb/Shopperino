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
import { t, tx, tName } from '../../lib/i18n';

const label = (entry) => (entry.subtype
  ? tx('{0} ({1})', tName('creatureTypes', entry.type), tName('creatureTypes', entry.subtype))
  : tName('creatureTypes', entry.type));

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
      title={t('Favored enemies')}
      className="sh-card--head-spread"
      eyebrow={tx('{0} of {1} slots', used, max)}
      action={
        <span className="sh-row-h" style={{ gap: 'var(--space-1)' }}>
          <InfoPopover label={t('Favored enemies')}>
            <p>
              {tx(
                'A ranger picks a first favored enemy at 1st level and another every five levels after. Each new slot may name a fresh enemy or {0}.',
                <b>{t('raise an existing one by +2')}</b>
              )}
            </p>
            <p>
              {tx(
                "The bonus applies to {0} checks against that enemy, and to {1} against it. It also passes to anything the ranger's weapon damage would carry.",
                <b>{player.getFavoredEnemySkills().map((s) => tName('skills', s)).join(', ')}</b>,
                <b>{t('weapon damage')}</b>
              )}
            </p>
            <p>
              {t('A type too broad to take whole — humanoids, outsiders — must be narrowed to a subtype.')}
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
            {tx('{0} more than this level allows', used - max)}
          </Pill>
        )}

        {entries.length === 0 ? (
          <span className="sh-faint favored-enemy-empty">
            {t('No favored enemy chosen yet.')}
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
                    title={t('Spend a slot raising this enemy by +2')}
                    aria-label={tx('Raise {0}', label(entry))}
                    onClick={() => dispatch(onRaiseFavoredEnemy(index))}
                  />
                  <IconButton
                    icon="close"
                    ghost
                    size="sm"
                    title={t('Remove')}
                    aria-label={tx('Remove {0}', label(entry))}
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
            aria-label={t('Favored enemy type')}
            onChange={(e) => handleTypeChange(e.target.value)}
          >
            <option value="">{t('Add a favored enemy…')}</option>
            {player.getFavoredEnemyTypes().map((ft) => (
              <option key={ft} value={ft}>{tName('creatureTypes', ft)}</option>
            ))}
          </select>

          {subtypes.length > 0 && (
            <select
              className="sh-select"
              value={subtype}
              aria-label={t('Favored enemy subtype')}
              onChange={(e) => setSubtype(e.target.value)}
            >
              <option value="">
                {needsSubtype ? t('Choose a subtype…') : t('Any subtype')}
              </option>
              {subtypes.map((s) => (
                <option key={s} value={s}>{tName('creatureTypes', s)}</option>
              ))}
            </select>
          )}

          <Button variant="primary" icon="add" disabled={!canAdd} onClick={handleAdd}>
            {t('Add')}
          </Button>
        </div>

        {needsSubtype && !subtype && (
          <span className="sh-faint favored-enemy-empty">
            {tx('{0} is too broad to take whole — choose a subtype.', tName('creatureTypes', type))}
          </span>
        )}
      </div>
      )}
    </Card>
  );
}
