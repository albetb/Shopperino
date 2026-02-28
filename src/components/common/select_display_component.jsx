import '../../style/menu_cards.css';

/**
 * Reusable row: label + dropdown + magnifying-glass button.
 * Used for Race and Class selection on the Player sheet.
 * Parent is responsible for showing main-content cards when onOpenDisplay is called.
 *
 * @param {string} label - Row label (e.g. "Race", "Class")
 * @param {string[]} options - Dropdown options (e.g. race or class names)
 * @param {string} value - Current selected value (controlled)
 * @param {function(string): void} onSelect - Called when selection changes (dropdown or card Select)
 * @param {function(): void} onOpenDisplay - Called when magnifying glass is clicked; parent shows cards in main area
 */
const SelectDisplayComponent = ({
  label,
  options = [],
  value,
  onSelect,
  onOpenDisplay
}) => {
  const handleDropdownChange = (event) => {
    onSelect(event.target.value);
  };

  const handleMagnifyingGlassClick = () => {
    onOpenDisplay?.();
  };

  return (
    <div className="card-side-div margin-top">
      <label className="modern-label">{label}:</label>
      <select
        className="modern-dropdown small-long"
        value={value ?? ''}
        onChange={handleDropdownChange}
      >
        <option value="">—</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <button
        type="button"
        title="View details"
        className="levels-button small"
        onClick={handleMagnifyingGlassClick}
      >
        <span className="material-symbols-outlined">search</span>
      </button>
    </div>
  );
};

export default SelectDisplayComponent;
