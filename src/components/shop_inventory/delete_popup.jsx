import { useEffect, useRef, useState } from 'react';
import '../../style/shop_inventory.css';
import '../../style/slider.css';

const DeletePopup = ({ itemName, itemType, itemNumber, onClose, onDelete, position }) => {
  const [num, setNum] = useState(itemNumber);
  const popupRef = useRef(null);
  const sliderRef = useRef(null);

  // Effect for updating the slider gradient whenever `num` or `itemNumber` changes
  useEffect(() => {
    if (!sliderRef.current) return;
    const percent = (num / itemNumber) * 100;
    sliderRef.current.style.background =
      `linear-gradient(to right, var(--main-t) ${percent}%, var(--black-t) ${percent}%)`;
  }, [num, itemNumber]);

  const handleDelete = () => {
    onDelete(itemName, itemType, num);
    onClose();
  };

  const popupStyle = {
    top: `${Math.floor((position.y + window.scrollY) / 6) * 6 - 95}px`,
    left: `${Math.floor((position.x + window.scrollX) / 6) * 6 - 193}px`
  };

  // Click‐outside handler
  useEffect(() => {
    const handleClickOutside = event => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="popup" style={popupStyle} ref={popupRef}>
      <div className="card-side-div around width-90">
        <input
          type="range"
          ref={sliderRef}
          value={num}
          onChange={e => setNum(Number(e.target.value))}
          min="0"
          max={itemNumber}
          className="no-padding slider"
        />
        <div className="level-frame">
          <label className='level-text'>{num}</label>
        </div>
      </div>

      <div className="card-side-div around margin-top width-90">
        <button className="item-number-button small-middle" onClick={handleDelete}>
          <span className="material-symbols-outlined">
            remove_shopping_cart
          </span>
        </button>

        <button className="item-number-button small-middle" onClick={onClose}>
          <span className="material-symbols-outlined">
            close
          </span>
        </button>
      </div>
    </div>
  );
};

export default DeletePopup;
