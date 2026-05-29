import PropTypes from 'prop-types';

export default function LearnTab({ learned = false, disabled = false, onClick }) {
  return (
    <button
      type="button"
      className={
        'tab-learn' +
        (learned ? ' is-learned' : '') +
        (disabled ? ' is-disabled' : '')
      }
      aria-pressed={learned}
      aria-label={learned ? 'Unlearn spell' : 'Learn spell'}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="tab-shape" />
      <span className="tab-glyph">{learned ? '✓' : '+'}</span>
      <span className="dog-ear" aria-hidden>
        <svg width="9" height="9" viewBox="0 0 9 9">
          <path d="M0 0 L9 0 L9 9 Z" fill="var(--bg-elev)" stroke="var(--accent-strong)" strokeWidth="0.7" />
          <path d="M0 0 L9 9" stroke="var(--accent-strong)" strokeWidth="0.6" />
        </svg>
      </span>
    </button>
  );
}

LearnTab.propTypes = {
  learned: PropTypes.bool,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
};
