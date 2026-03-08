import { useEffect, useRef, useState } from 'react';
import '../../style/shop_inventory.css';

export default function FeatChoicePopover({ position, choices, featName, onConfirm, onClose }) {
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
      zIndex: 100,
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

  if (!position || !choices?.length) return null;

  return (
    <div className="popup feat-choice-popover" style={popupStyle} ref={popupRef}>
      <div className="card-side-div around width-90" style={{ flexDirection: 'column', gap: '0.5rem' }}>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="feat-choice-select"
          aria-label={`Select option for ${featName}`}
        >
          <option value="">— Choose —</option>
          {choices.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div className="card-side-div around width-90" style={{ marginTop: 0, gap: '0.5rem' }}>
          <button
            type="button"
            className="item-number-button small-middle"
            onClick={handleConfirm}
            disabled={!selected.trim()}
            aria-label="Confirm"
          >
            <span className="material-symbols-outlined">check</span>
          </button>
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
