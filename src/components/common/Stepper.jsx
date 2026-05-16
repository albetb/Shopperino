import { useRef } from 'react';
import Icon from './Icon';

export default function Stepper({
  value,
  min = 0,
  max = 99,
  step = 1,
  onChange,
  size,
  disabled,
  className = '',
}) {
  const repeatTimer = useRef(null);
  const holdTimer = useRef(null);

  const dispatch = delta => {
    const next = Math.max(min, Math.min(max, value + delta * step));
    if (next !== value) onChange?.(next);
  };

  const startHold = delta => {
    if (disabled) return;
    dispatch(delta);
    holdTimer.current = setTimeout(() => {
      repeatTimer.current = setInterval(() => dispatch(delta), 80);
    }, 400);
  };

  const endHold = () => {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
    if (repeatTimer.current) { clearInterval(repeatTimer.current); repeatTimer.current = null; }
  };

  const minusDisabled = disabled || value <= min;
  const plusDisabled  = disabled || value >= max;

  const cls = ['sh-stepper', size === 'sm' && 'sh-stepper--sm', className].filter(Boolean).join(' ');

  return (
    <div className={cls}>
      <button
        type="button"
        aria-label="Decrement"
        disabled={minusDisabled}
        onPointerDown={() => startHold(-1)}
        onPointerUp={endHold}
        onPointerLeave={endHold}
        onPointerCancel={endHold}
      >
        <Icon name="remove" size={18} />
      </button>
      <span className="v">{value}</span>
      <button
        type="button"
        aria-label="Increment"
        disabled={plusDisabled}
        onPointerDown={() => startHold(+1)}
        onPointerUp={endHold}
        onPointerLeave={endHold}
        onPointerCancel={endHold}
      >
        <Icon name="add" size={18} />
      </button>
    </div>
  );
}
