import PropTypes from 'prop-types';
import '../../style/menu_cards.css';

/**
 * Stepper that cycles a value through a fixed list of allowed options.
 * Visual layout mirrors LevelComponent (- value +) so it lines up with
 * level rows in the same card.
 */
const OptionStepper = ({ props }) => {
  const { value, options, name, onChange } = props;

  const currentIndex = Math.max(0, options.findIndex(o => o.value === value));
  const currentLabel = options[currentIndex]?.label ?? '';

  const handleDecrement = () => {
    if (currentIndex > 0) onChange(options[currentIndex - 1].value);
  };

  const handleIncrement = () => {
    if (currentIndex < options.length - 1) onChange(options[currentIndex + 1].value);
  };

  const atMin = currentIndex <= 0;
  const atMax = currentIndex >= options.length - 1;

  return (
    <div className="card-side-div margin-top">
      <label className="modern-label">{name}</label>
      <div className="levels-div">
        <button
          className="levels-button small"
          onClick={handleDecrement}
          disabled={atMin}
        >
          <span className="material-symbols-outlined">remove</span>
        </button>

        <div className="level-frame">
          <label className="level-text">{currentLabel}</label>
        </div>

        <button
          className="levels-button small"
          onClick={handleIncrement}
          disabled={atMax}
        >
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>
    </div>
  );
};

OptionStepper.propTypes = {
  props: PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    options: PropTypes.arrayOf(PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      label: PropTypes.string.isRequired,
    })).isRequired,
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
  }).isRequired,
};

export default OptionStepper;
