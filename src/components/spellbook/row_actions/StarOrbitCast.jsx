import { useState } from 'react';
import PropTypes from 'prop-types';

export default function StarOrbitCast({ remaining = 0, total = 1, onClick }) {
  const empty = remaining <= 0;
  const n = Math.min(Math.max(remaining, 0), 9);
  const [casting, setCasting] = useState(false);

  const handleClick = (e) => {
    if (empty) return;
    setCasting(true);
    setTimeout(() => setCasting(false), 340);
    onClick?.(e);
  };

  return (
    <button
      type="button"
      className={
        'orbit-cast' +
        (empty ? ' is-empty' : '') +
        (casting ? ' casting' : '')
      }
      aria-label={empty ? 'No slots remaining' : `Cast spell (${remaining} of ${total} left)`}
      disabled={empty}
      onClick={handleClick}
      style={{ '--star-count': n || 1 }}
    >
      <span className="orbit-path" aria-hidden />
      <span className="ring" aria-hidden>
        {Array.from({ length: n }).map((_, i) => (
          <span
            key={i}
            className="star"
            style={{ '--a': `${(360 / n) * i}deg` }}
          >
            <span className="material-symbols-outlined">arrow_drop_down</span>
          </span>
        ))}
      </span>
      <span className="orbit-num">{remaining}</span>
    </button>
  );
}

StarOrbitCast.propTypes = {
  remaining: PropTypes.number,
  total: PropTypes.number,
  onClick: PropTypes.func,
};
