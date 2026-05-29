import PropTypes from 'prop-types';

export default function FusedStepper({
  value = 0,
  min = 0,
  max = 9,
  disabled = false,
  onChange,
}) {
  const dec = () => !disabled && value > min && onChange?.(value - 1);
  const inc = () => !disabled && value < max && onChange?.(value + 1);
  return (
    <div className={'fused-stepper' + (disabled ? ' is-disabled' : '')}>
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        aria-label="Prepare one less"
      >
        −
      </button>
      <span className="num">{value}</span>
      <button
        type="button"
        onClick={inc}
        disabled={value >= max}
        aria-label="Prepare one more"
      >
        +
      </button>
    </div>
  );
}

FusedStepper.propTypes = {
  value: PropTypes.number,
  min: PropTypes.number,
  max: PropTypes.number,
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
};
