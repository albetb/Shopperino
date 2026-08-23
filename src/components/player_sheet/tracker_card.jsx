import { useState } from 'react';
import Card from '../common/Card';
import Slots from '../common/Slots';
import IconButton from '../common/IconButton';
import Pill from '../common/Pill';
import '../../style/tracker_card.css';

/* Beyond this many, a pip row stops being readable and the count carries it. */
const MAX_PIPS = 12;

/**
 * Shared used/max tracker for per-day class features.
 *
 * Two variants:
 *  - `uses` (default) — whole uses per day (rage, smite, stunning fist). Steps
 *    up and down by one and shows a pip row.
 *  - `pool` — a spendable amount (lay on hands, wholeness of body). Takes a
 *    free-form quantity and reports the remaining total.
 *
 * `onUse` receives a signed delta so a single handler covers spending and
 * giving back. Per the non-enforcing rule in CLAUDE.md the component never
 * blocks going past the maximum — it flags it instead.
 *
 * @param {number} used current uses or points spent
 * @param {number} max derived maximum; the model owns this calculation
 * @param {(delta: number) => void} onUse
 * @param {() => void} [onReset]
 */
export default function TrackerCard({
  title,
  eyebrow,
  used = 0,
  max = 0,
  unit = '',
  variant = 'uses',
  onUse,
  onReset,
  note,
  action,
  children,
}) {
  const [spend, setSpend] = useState('');

  const usedNum = Math.max(0, Math.floor(Number(used) || 0));
  const maxNum = Math.max(0, Math.floor(Number(max) || 0));
  const remaining = maxNum - usedNum;
  const overCap = usedNum > maxNum;
  const isPool = variant === 'pool';
  const unitLabel = unit ? ` ${unit}` : '';

  const commitSpend = () => {
    const amount = Math.floor(Number(spend));
    if (!Number.isFinite(amount) || amount === 0) return;
    onUse?.(amount);
    setSpend('');
  };

  return (
    <Card
      title={title}
      eyebrow={eyebrow}
      action={
        (action || onReset) ? (
          <>
            {action}
            {onReset && (
              <IconButton
                icon="restart_alt"
                ghost
                size="sm"
                title="Reset"
                aria-label={`Reset ${title}`}
                onClick={onReset}
              />
            )}
          </>
        ) : null
      }
    >
      <div className="sh-stack tracker-card">
        <div className="tracker-card-row">
          <span className="tracker-card-count">
            <span className={overCap ? 'tracker-card-count-over' : undefined}>{usedNum}</span>
            <span className="tracker-card-sep">/</span>
            {maxNum}{unitLabel}
          </span>

          {!isPool && maxNum > 0 && maxNum <= MAX_PIPS && (
            <Slots total={maxNum} used={usedNum} />
          )}

          <span className="tracker-card-controls">
            {isPool ? (
              <>
                <input
                  className="tracker-card-input"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={spend}
                  placeholder="0"
                  aria-label={`Amount to spend from ${title}`}
                  onChange={(e) => setSpend(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitSpend(); }}
                />
                <IconButton
                  icon="remove"
                  ghost
                  size="sm"
                  title="Spend"
                  aria-label={`Spend from ${title}`}
                  onClick={commitSpend}
                />
              </>
            ) : (
              <IconButton
                icon="add"
                ghost
                size="sm"
                title="Use one"
                aria-label={`Use one ${title}`}
                onClick={() => onUse?.(1)}
              />
            )}
            <IconButton
              icon="undo"
              ghost
              size="sm"
              disabled={usedNum === 0}
              title="Give back"
              aria-label={`Give back to ${title}`}
              onClick={() => onUse?.(isPool ? -Math.max(1, Math.floor(Number(spend)) || 1) : -1)}
            />
          </span>
        </div>

        <div className="tracker-card-row tracker-card-meta">
          <Pill tone={overCap ? 'warn' : 'default'}>
            {Math.max(0, remaining)}{unitLabel} left
          </Pill>
          {overCap && (
            <Pill tone="warn" icon="warning">
              {usedNum - maxNum}{unitLabel} over the limit for this level
            </Pill>
          )}
          {note && <span className="sh-faint tracker-card-note">{note}</span>}
        </div>

        {children}
      </div>
    </Card>
  );
}
