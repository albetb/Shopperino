import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import Card from '../../common/Card';
import Icon from '../../common/Icon';
import IconButton from '../../common/IconButton';
import { onAdjustPlayerGold, onSetPlayerGold } from '../../../store/thunks/playerSheetThunks';
import 'style/money_card.css';

/* D&D 3.5 coinage, shown as one number.
   The player stores a single float gp value and the decimals are the smaller
   coins — 12.34 gp is 12 gold, 3 silver, 4 copper — so silver and copper need
   no cells of their own. Two decimals is exactly copper precision; a third
   would be a coin that does not exist.
   The colour comes from tokens.css, so the shop's gold readout shows the same
   coin — see --coin-gold there. */
const GOLD_COLOR = 'var(--coin-gold)';
const DECIMALS = 2;

/* Whole gold drops the decimals — "12" rather than "12.00". A part-coin keeps
   both, so 1.50 stays 1.50: the trailing zero there is five silver, not
   nothing. */
const formatGp = (value) => {
  const fixed = (Math.max(0, Number(value) || 0)).toFixed(DECIMALS);
  return fixed.endsWith('.00') ? fixed.slice(0, -(DECIMALS + 1)) : fixed;
};

export default function MoneyCard({ player }) {
  const dispatch = useDispatch();
  const total = player?.getGold?.() ?? 0;

  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState('');
  const inputRef = useRef(null);

  /* The spend/earn row is a transient control, not a preference — it starts
     closed on every visit and its state stays out of the saved app object. */
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [amount, setAmount] = useState('');

  /* Auto-focus + select on entering edit mode so the value can be replaced
     with a single tap. */
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEdit = () => {
    setTemp(formatGp(total));
    setEditing(true);
  };

  const commit = () => {
    if (!editing) return;
    const raw = Number(temp);
    if (Number.isFinite(raw) && raw >= 0) dispatch(onSetPlayerGold(raw));
    setEditing(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') commit();
    else if (e.key === 'Escape') setEditing(false);
  };

  /* A spend or an earning. The box goes back to empty either way, so the next
     amount is typed rather than edited over the last one. */
  const applyAmount = (sign) => {
    const raw = Number(amount);
    if (Number.isFinite(raw) && raw > 0) dispatch(onAdjustPlayerGold(sign * raw));
    setAmount('');
  };

  if (!player) return null;

  return (
    <Card className="card-width-spellbook money-card">
      <div className="money-row">
        <div className="money-cell money-cell--primary">
          {editing ? (
            <input
              ref={inputRef}
              type="number"
              className="money-input"
              inputMode="decimal"
              min={0}
              step={0.01}
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
              onBlur={commit}
              onKeyDown={handleKey}
            />
          ) : (
            <button
              type="button"
              className="money-value"
              onClick={startEdit}
              aria-label="Edit gold"
            >
              <span className="money-num">{formatGp(total)}</span>
              <span className="money-unit">g</span>
            </button>
          )}
          <button
            type="button"
            className="money-coin"
            onClick={() => !editing && startEdit()}
            aria-label="Edit gold"
            tabIndex={-1}
          >
            <Icon name="paid" color={GOLD_COLOR} size={28} />
          </button>
        </div>

        <IconButton
          className="money-adjust-toggle"
          icon={adjustOpen ? 'expand_less' : 'expand_more'}
          ghost
          size="sm"
          onClick={() => setAdjustOpen((v) => !v)}
          aria-expanded={adjustOpen}
          aria-label={adjustOpen ? 'Hide spend and earn' : 'Spend or earn gold'}
        />
      </div>

      {adjustOpen && (
        <div className="money-adjust-row">
          <input
            type="number"
            className="money-input money-adjust-input"
            inputMode="decimal"
            min={0}
            step={0.01}
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-label="Amount to add or subtract"
          />
          <IconButton
            icon="add"
            size="sm"
            onClick={() => applyAmount(1)}
            aria-label="Add to gold"
            title="Add"
          />
          <IconButton
            icon="remove"
            size="sm"
            onClick={() => applyAmount(-1)}
            aria-label="Subtract from gold"
            title="Subtract"
          />
        </div>
      )}
    </Card>
  );
}
