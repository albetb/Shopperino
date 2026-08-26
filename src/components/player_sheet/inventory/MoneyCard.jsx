import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import Card from '../../common/Card';
import Icon from '../../common/Icon';
import { onSetPlayerGold } from '../../../store/thunks/playerSheetThunks';
import 'style/money_card.css';

/* D&D 3.5 coinage. Internally the player stores a single float gp value
   (12.34 gp = 12 g, 3 s, 4 c). We split / recombine here. */
/* Colours come from tokens.css so the shop's gold readout shows the same
   coin — see --coin-gold there. */
const COINS = [
  { key: 'gold',   label: 'g', color: 'var(--coin-gold)',   max: 999999, primary: true },
  { key: 'silver', label: 's', color: 'var(--coin-silver)', max: 9 },
  { key: 'copper', label: 'c', color: 'var(--coin-copper)', max: 9 },
];

function splitGp(total) {
  // Convert to whole copper to avoid float drift, then split back.
  const cp = Math.max(0, Math.round((Number(total) || 0) * 100));
  return {
    gold:   Math.floor(cp / 100),
    silver: Math.floor((cp % 100) / 10),
    copper: cp % 10,
  };
}

function combineGp({ gold, silver, copper }) {
  return (gold * 100 + silver * 10 + copper) / 100;
}

export default function MoneyCard({ player }) {
  const dispatch = useDispatch();
  const total = player?.getGold?.() ?? 0;
  const parts = splitGp(total);

  const [editing, setEditing] = useState(null); // 'gold' | 'silver' | 'copper' | null
  const [temp, setTemp] = useState('');
  const inputRef = useRef(null);

  /* Auto-focus + select the input when entering edit mode so the user
     can replace the value with a single tap. */
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEdit = (key) => {
    setTemp(String(parts[key]));
    setEditing(key);
  };

  const commit = () => {
    if (!editing) return;
    const meta = COINS.find(c => c.key === editing);
    const raw = parseInt(temp, 10);
    const clamped = Number.isFinite(raw) ? Math.max(0, Math.min(meta.max, raw)) : parts[editing];
    if (clamped !== parts[editing]) {
      const next = combineGp({ ...parts, [editing]: clamped });
      dispatch(onSetPlayerGold(next));
    }
    setEditing(null);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') commit();
    else if (e.key === 'Escape') setEditing(null);
  };

  if (!player) return null;

  return (
    <Card className="card-width-spellbook money-card">
      <div className="money-row">
        {COINS.map((coin) => {
          const isEditing = editing === coin.key;
          return (
            <div
              key={coin.key}
              className={`money-cell ${coin.primary ? 'money-cell--primary' : ''}`}
            >
              {isEditing ? (
                <input
                  ref={inputRef}
                  type="number"
                  className="money-input"
                  inputMode="numeric"
                  min={0}
                  max={coin.max}
                  value={temp}
                  onChange={(e) => setTemp(e.target.value)}
                  onBlur={commit}
                  onKeyDown={handleKey}
                />
              ) : (
                <button
                  type="button"
                  className="money-value"
                  onClick={() => startEdit(coin.key)}
                  aria-label={`Edit ${coin.key}`}
                >
                  <span className="money-num">{parts[coin.key]}</span>
                  <span className="money-unit">{coin.label}</span>
                </button>
              )}
              <button
                type="button"
                className="money-coin"
                onClick={() => !isEditing && startEdit(coin.key)}
                aria-label={`Edit ${coin.key}`}
                tabIndex={-1}
              >
                <Icon name="paid" color={coin.color} size={coin.primary ? 28 : 22} />
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
