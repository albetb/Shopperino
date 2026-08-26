import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import BottomSheet from './BottomSheet';
import { setDiceMultiplierMask, setDiceLastRoll } from '../../store/slices/appSlice';
import {
  DICE_MULTIPLIERS,
  DICE_TYPES,
  diceCountFromMask,
  formatRollLabel,
  isMultiplierSelected,
  rollDice,
  rollDie,
  toggleMultiplier,
} from '../../lib/dice';
import '../../style/dice_roller.css';

/* How long the numbers scramble before settling, and how often they change
   while they do. Short enough not to be in the way, long enough to read as a
   roll rather than an instant answer. */
const ROLL_DURATION_MS = 800;
const TICK_MS = 55;

/* The earliest a die may settle, as a fraction of the roll. Dice land spread
   across the tail of the animation rather than all together, which is what
   makes a handful read as a handful instead of one number. */
const FIRST_SETTLE_AT = 0.45;

/**
 * Quick dice roller, opened from the top bar over whatever tab is showing.
 *
 * Two rows of pills: how many dice (the pressed buttons add up, so +5 and +2
 * is seven dice), then which die — pressing a die rolls immediately. The count
 * selection and the last roll both persist, so reopening shows what you rolled.
 *
 * Not tied to a character: it knows nothing about the player sheet.
 */
export default function DiceRollerSheet({ open, onClose }) {
  const dispatch = useDispatch();
  const mask = useSelector((state) => state.app.diceMultiplierMask ?? 1);
  const lastRoll = useSelector((state) => state.app.diceLastRoll ?? null);

  /* `activeRoll` is the roll made in this session — it outlives the animation
     so the settle flash has something to play against. Before the first roll
     it is null and the stored one is shown instead. */
  const [activeRoll, setActiveRoll] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [display, setDisplay] = useState([]);
  const [settled, setSettled] = useState([]);
  const timerRef = useRef(null);

  const count = diceCountFromMask(mask);

  useEffect(() => () => clearInterval(timerRef.current), []);
  // Abandon a roll in progress if the sheet is dismissed mid-animation.
  useEffect(() => {
    if (open) return;
    clearInterval(timerRef.current);
    setRolling(false);
  }, [open]);

  const handleToggle = (index) => dispatch(setDiceMultiplierMask(toggleMultiplier(mask, index)));

  const handleRoll = useCallback((sides) => {
    clearInterval(timerRef.current);
    const result = rollDice(sides, count);

    /* Each die gets its own landing time inside the window, so they settle one
       after another instead of snapping together. A single die lands at the end. */
    const settleAt = result.rolls.map((_, i) => {
      const spread = result.rolls.length === 1
        ? 1
        : FIRST_SETTLE_AT + (1 - FIRST_SETTLE_AT) * ((i + 1) / result.rolls.length);
      return ROLL_DURATION_MS * spread;
    });

    setActiveRoll(result);
    setRolling(true);
    setSettled(result.rolls.map(() => false));
    setDisplay(result.rolls.map(() => rollDie(sides)));

    const startedAt = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      if (elapsed >= ROLL_DURATION_MS) {
        clearInterval(timerRef.current);
        setSettled(result.rolls.map(() => true));
        setDisplay(result.rolls);
        setRolling(false);
        // Persisted only once it has landed — a scrambling value is not a roll.
        dispatch(setDiceLastRoll(result));
        return;
      }
      const nextSettled = settleAt.map((at) => elapsed >= at);
      setSettled(nextSettled);
      setDisplay(result.rolls.map((value, i) => (nextSettled[i] ? value : rollDie(sides))));
    }, TICK_MS);
  }, [count, dispatch]);

  const shown = activeRoll ?? lastRoll;
  // Mid-roll the screen shows the scrambling faces; the total follows them, so
  // it moves with the dice rather than sitting blank until the end.
  const faces = rolling ? display : (shown?.rolls ?? []);
  const total = rolling ? faces.reduce((sum, n) => sum + n, 0) : (shown?.total ?? 0);
  const faceSettled = rolling ? settled : faces.map(() => true);

  return (
    <BottomSheet open={open} onClose={onClose} eyebrow="Roll dice">
      <div className="dice-roller">
        <div className="dice-section">
          <span className="sh-eyebrow">How many · {count} {count === 1 ? 'die' : 'dice'}</span>
          <div className="dice-pill-row" role="group" aria-label="Number of dice">
            {DICE_MULTIPLIERS.map((amount, index) => {
              const on = isMultiplierSelected(mask, index);
              return (
                <button
                  key={amount}
                  type="button"
                  className={['dice-pill', on && 'is-on'].filter(Boolean).join(' ')}
                  aria-pressed={on}
                  onClick={() => handleToggle(index)}
                >
                  +{amount}
                </button>
              );
            })}
          </div>
        </div>

        <div className="dice-section">
          <span className="sh-eyebrow">Which die</span>
          <div className="dice-pill-row" role="group" aria-label="Die type">
            {DICE_TYPES.map((sides) => (
              <button
                key={sides}
                type="button"
                className="dice-pill dice-pill--die"
                onClick={() => handleRoll(sides)}
                aria-label={`Roll ${count}d${sides}`}
              >
                d{sides}
              </button>
            ))}
          </div>
        </div>

        <div className="dice-result" aria-live="polite">
          {!shown ? (
            <span className="sh-faint dice-result-empty">Pick a die to roll.</span>
          ) : (
            <>
              <span className="dice-result-label">{formatRollLabel(shown)}</span>

              {faces.length > 1 && (
                <div className="dice-result-list">
                  {faces.map((value, i) => (
                    <span
                      key={i}
                      className={['dice-die', faceSettled[i] ? 'is-settled' : 'is-rolling'].join(' ')}
                    >
                      {value}
                    </span>
                  ))}
                </div>
              )}

              <span className={['dice-total', rolling ? 'is-rolling' : 'is-settled'].join(' ')}>
                {total}
              </span>
            </>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
