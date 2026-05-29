import { useEffect, useState } from 'react';
import { getItem, itemRefLink } from 'lib/item';
import { itemTypes } from 'lib/utils';
import Modal from '../../common/Modal';
import Button from '../../common/Button';
import 'style/shop_inventory.css';

export default function AddItemFormInventory({ open, onAddItem, items, onClose }) {
  const [number, setNumber] = useState(1);
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState('Good');
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [link, setLink] = useState('');

  const MAX_NUMBER = 99;
  const MAX_NAME_LENGTH = 64;

  useEffect(() => {
    if (!open) {
      setNumber(1);
      setItemName('');
      setItemType('Good');
      setLink('');
      setSuggestions([]);
      setIsFocused(false);
    }
  }, [open]);

  useEffect(() => {
    if (itemName.length >= 2) {
      const filteredSuggestions = items.filter((item) =>
        item.Name.toLowerCase().includes(itemName.toLowerCase())
      );
      const otherItems = getItem(itemName, itemType);
      const namesInFilteredSuggestions = new Set(filteredSuggestions.map((item) => item.Name));
      const filteredOtherItems = otherItems.filter(
        (item) => !namesInFilteredSuggestions.has(item.Name)
      );
      setSuggestions([...filteredSuggestions, ...filteredOtherItems]);
    } else {
      setSuggestions([]);
    }
  }, [itemName, itemType, items]);

  const handleAddItemClick = () => {
    if (!itemName.trim()) return;
    onAddItem(itemName, itemType, number, link);
    onClose?.();
  };

  const handleSuggestionClick = (suggestion) => {
    setItemName(suggestion.Name);
    setItemType(suggestion.ItemType);
    setLink(itemRefLink(suggestion) || suggestion.Link || '');
    setSuggestions([]);
    setIsFocused(false);
  };

  const clampQty = (n) => Math.max(0, Math.min(MAX_NUMBER, n));

  const handleQtyChange = (e) => {
    const raw = e.target.value;
    if (raw === '') { setNumber(''); return; }
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed)) return;
    setNumber(clampQty(parsed));
  };

  const handleNumberBlur = () => {
    const numValue = number ? parseInt(number, 10) : 0;
    setNumber(clampQty(Number.isNaN(numValue) ? 0 : numValue));
  };

  const stepQty = (delta) => () => {
    const current = typeof number === 'number' ? number : parseInt(number, 10) || 0;
    setNumber(clampQty(current + delta));
  };

  const handleNameBlur = () => {
    if (itemName.length > MAX_NAME_LENGTH) setItemName(itemName.slice(0, MAX_NAME_LENGTH));
    setIsFocused(false);
  };

  const shouldShowSuggestions =
    isFocused &&
    (suggestions.length > 1 ||
      (suggestions.length === 1 &&
        suggestions[0].Name.toLowerCase() !== itemName.toLowerCase()));

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Inventory"
      title="Add item"
      footer={
        <div className="sh-row-h" style={{ gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            icon="add_shopping_cart"
            onClick={handleAddItemClick}
            disabled={!itemName.trim()}
          >
            Add
          </Button>
        </div>
      }
    >
      <div className="sh-stack" style={{ gap: 'var(--space-3)' }}>
        <label className="sh-field">
          <span className="sh-label">Name</span>
          <div className="suggestions-anchor">
            <input
              type="text"
              placeholder="Item name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={handleNameBlur}
              className="sh-input"
              autoFocus
            />
            {shouldShowSuggestions && (
              <ul className="suggestions">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    onMouseDown={() => handleSuggestionClick(suggestion)}
                    className="suggestion-item"
                  >
                    {suggestion.Name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </label>
        <label className="sh-field">
          <span className="sh-label">Type</span>
          <select
            value={itemType}
            onChange={(e) => setItemType(e.target.value)}
            className="sh-select"
          >
            {itemTypes.map((type, index) => (
              <option key={index} value={type}>{type}</option>
            ))}
          </select>
        </label>
        <div className="sh-field">
          <span className="sh-label">Quantity</span>
          <div className="sh-qty-stepper">
            <button
              type="button"
              className="sh-qty-btn"
              onClick={stepQty(-1)}
              aria-label="Decrease quantity"
              disabled={(typeof number === 'number' ? number : parseInt(number, 10) || 0) <= 0}
            >
              <span className="material-symbols-outlined">remove</span>
            </button>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_NUMBER}
              value={number}
              onChange={handleQtyChange}
              onBlur={handleNumberBlur}
              className="sh-input sh-qty-input"
            />
            <button
              type="button"
              className="sh-qty-btn"
              onClick={stepQty(1)}
              aria-label="Increase quantity"
              disabled={(typeof number === 'number' ? number : parseInt(number, 10) || 0) >= MAX_NUMBER}
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
