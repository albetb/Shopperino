import { useEffect, useRef, useState } from 'react';
import '../../style/shop_inventory.css';

export default function FeatChoicePopover({ position, choices, reason, featName, onConfirm, onClose }) {
  const [selected, setSelected] = useState('');
  const popupRef = useRef(null);

  useEffect(() => {
    setSelected('');
  }, [featName]);

  const handleConfirm = () => {
    if (selected.trim()) {
      onConfirm(selected.trim());
      onClose();
    }
  };

  const popupStyle = position ? (() => {
    const popupWidth = 256; // 16rem ≈ 256px
    const popupHeight = 200; // estimated height
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = Math.floor((position.top + window.scrollY) / 6) * 6 - 95;
    let left = Math.floor((position.left + window.scrollX) / 6) * 6 - 70;

    // Adjust for viewport bounds
    if (left + popupWidth > viewportWidth - 8) {
      left = viewportWidth - popupWidth - 8;
    }
    if (left < 8) {
      left = 8;
    }
    if (top + popupHeight > viewportHeight + window.scrollY) {
      top = position.top + window.scrollY - popupHeight - 10;
    }
    if (top < 8 + window.scrollY) {
      top = position.top + window.scrollY + 40;
    }

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      // Every add path opens this from inside the "Choose a feat" bottom
      // sheet, whose scrim is z-index 1100 and whose panel is 1101
      // (.sh-scrim / .sh-sheet in atoms.css). Anything below that mounts
      // but renders behind the sheet, which reads as "the picker never
      // opens" — the whole reason the choice feats appeared broken.
      zIndex: 1120,
    };
  })()
    : {};

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [onClose]);

  // `reason` is the picker's other job: a feat whose whole option list is
  // ruled out (Greater spell focus with no Spell focus) has to say so, not
  // silently refuse to open.
  const hasChoices = Boolean(choices?.length);
  if (!position || (!hasChoices && !reason)) return null;

  return (
    <div className="popup feat-choice-popover" style={popupStyle} ref={popupRef}>
      <div className="feat-choice-body">
        {hasChoices ? (
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="modern-dropdown feat-choice-select"
            aria-label={`Select option for ${featName}`}
          >
            <option value="">— Choose —</option>
            {choices.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        ) : (
          <p className="feat-choice-reason" role="status">{reason}</p>
        )}
        <div className="feat-choice-actions">
          {hasChoices && (
            <button
              type="button"
              className="item-number-button small-middle"
              onClick={handleConfirm}
              disabled={!selected.trim()}
              aria-label="Confirm"
            >
              <span className="material-symbols-outlined">check</span>
            </button>
          )}
          <button
            type="button"
            className="item-number-button small-middle"
            onClick={onClose}
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>
    </div>
  );
}
