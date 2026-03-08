import { useEffect, useRef, useState } from 'react';
import 'style/shop_inventory.css';
import 'style/slider.css';

const EQUIP_BUTTONS = {
  'one-hand': [
    { slot: 'lh1', icon: 'game_button_l1' },
    { slot: 'rh1', icon: 'game_button_r1' },
    { slot: 'lh2', icon: 'game_button_l2', rowBreak: true },
    { slot: 'rh2', icon: 'game_button_r2', rowBreak: true },
  ],
  'two-hand': [
    { slot: 'set1', icon: 'filter_1' },
    { slot: 'set2', icon: 'filter_2', rowBreak: true },
  ],
  'armor': [
    { slot: 'armor', icon: 'shield' },
  ],
  'other': [
    { slot: 'other1', icon: 'looks_one' },
    { slot: 'other2', icon: 'looks_two' },
    { slot: 'other3', icon: 'looks_3', rowBreak: true },
    { slot: 'other4', icon: 'looks_4', rowBreak: true },
  ],
};

export default function InventoryOptionsPopup({
  itemName,
  itemType,
  itemNumber,
  equipType,
  position,
  onClose,
  onRemove,
  onEquip,
}) {
  const [num, setNum] = useState(itemNumber);
  const popupRef = useRef(null);
  const sliderRef = useRef(null);

  useEffect(() => {
    if (!sliderRef.current) return;
    const percent = (num / itemNumber) * 100;
    sliderRef.current.style.background = `linear-gradient(to right, var(--main-t) ${percent}%, var(--black-t) ${percent}%)`;
  }, [num, itemNumber]);

  const handleRemove = () => {
    onRemove(itemName, itemType, num);
    onClose();
  };

  const popupStyle = {
    top: `${Math.floor((position.y + window.scrollY) / 6) * 6 - 95}px`,
    left: `${Math.floor((position.x + window.scrollX) / 6) * 6 - 193}px`,
  };

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

  const equipButtons = EQUIP_BUTTONS[equipType] || [];

  return (
    <div className="popup inventory-options-popup" style={popupStyle} ref={popupRef}>
      {equipButtons.length > 0 && (
        <div className="card-side-div around width-90 inventory-options-equip-row">
          {equipButtons.map(({ slot, icon, rowBreak }) => (
            <button
              key={slot}
              type="button"
              className="item-number-button small-middle inventory-equip-btn"
              onClick={() => { onEquip(slot); onClose(); }}
              title={`Equip: ${slot}`}
              style={rowBreak ? { marginTop: '0.2rem' } : undefined}
            >
              <span className="material-symbols-outlined">{icon}</span>
            </button>
          ))}
        </div>
      )}
      <div className="card-side-div around width-90">
        <input
          type="range"
          ref={sliderRef}
          value={num}
          onChange={(e) => setNum(Number(e.target.value))}
          min="0"
          max={itemNumber}
          className="no-padding slider"
        />
        <div className="level-frame">
          <label className="level-text">{num}</label>
        </div>
      </div>
      <div className="card-side-div around margin-top width-90">
        <button type="button" className="item-number-button small-middle" onClick={handleRemove}>
          <span aria-hidden="true">−</span>
        </button>
        <button type="button" className="item-number-button small-middle" onClick={onClose}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
    </div>
  );
}
