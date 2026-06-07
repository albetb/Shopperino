import { useEffect, useState } from 'react';
import { getItem, itemRefLink } from 'lib/item';
import { itemTypes } from 'lib/utils';
import { magicTypeFor } from 'lib/item/formatItemName';
import { getEffectIdBySlug } from 'lib/item/effectsUtils';
import BottomSheet from '../../common/BottomSheet';
import Button from '../../common/Button';
import EquipBonusControls from './EquipBonusControls';
import 'style/shop_inventory.css';

export default function AddItemFormInventory({ open, onAddItem, items, onClose }) {
  const [number, setNumber] = useState(1);
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState('Good');
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [link, setLink] = useState('');
  const [baseLink, setBaseLink] = useState('');
  const [masterwork, setMasterwork] = useState(false);
  const [bonus, setBonus] = useState(0);
  const [effectIds, setEffectIds] = useState([]);

  const MAX_NUMBER = 99;
  const MAX_NAME_LENGTH = 64;

  useEffect(() => {
    if (!open) {
      setNumber(1);
      setItemName('');
      setItemType('Good');
      setLink('');
      setBaseLink('');
      setSuggestions([]);
      setIsFocused(false);
      setMasterwork(false);
      setBonus(0);
      setEffectIds([]);
    }
  }, [open]);

  // Bonus / masterwork / effects only apply to weapon-armor-shield instances.
  const isBonusCandidate = (
    ['Weapon', 'Specific Weapon', 'Armor', 'Specific Armor', 'Shield', 'Specific Shield'].includes(itemType)
    && !!link
  );
  const magicLabel = isBonusCandidate
    ? magicTypeFor(itemType, { bonus, effectIds })
    : null;
  const displayType = magicLabel || itemType;

  const handleBonusChange = (patch) => {
    if (patch.masterwork !== undefined) setMasterwork(patch.masterwork);
    if (patch.bonus !== undefined) {
      setBonus(patch.bonus);
      // Effects require an enhancement bonus; the control also calls us with
      // effectIds when dropping to 0, but guard here too so external callers
      // can't desync.
      if (patch.bonus === 0 && patch.effectIds === undefined) setEffectIds([]);
    }
    if (patch.effectIds !== undefined) setEffectIds(patch.effectIds);
  };

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
    const opts = isBonusCandidate
      ? {
          masterwork: bonus > 0 ? true : masterwork,
          bonus,
          effectIds,
          ...(baseLink ? { baseLink } : {}),
        }
      : undefined;
    onAddItem(itemName, itemType, number, link, opts);
    onClose?.();
  };

  const handleSuggestionClick = (suggestion) => {
    setItemName(suggestion.Name);
    setItemType(suggestion.ItemType);
    setLink(itemRefLink(suggestion) || suggestion.Link || '');
    // Pre-fill magical metadata from Specific items (auto-detect base + bonus
    // + effects from items.json so the user doesn't re-enter them).
    const spec = suggestion.Specific;
    if (spec && typeof spec === 'object') {
      setBaseLink(typeof spec.Base === 'string' ? spec.Base : '');
      const b = Math.max(0, Math.min(5, parseInt(spec.Bonus, 10) || 0));
      setBonus(b);
      setMasterwork(b > 0 ? true : !!spec.Masterwork);
      const ids = Array.isArray(spec.Effects)
        ? spec.Effects.map(getEffectIdBySlug).filter((n) => typeof n === 'number')
        : [];
      setEffectIds(ids);
    } else {
      setBaseLink('');
      setMasterwork(false);
      setBonus(0);
      setEffectIds([]);
    }
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
    <BottomSheet
      open={open}
      onClose={onClose}
      eyebrow="Inventory"
      title="Add item"
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
          <span className="sh-label">
            Type
            {magicLabel && (
              <span className="sh-magic-type-badge" title="Item carries an enhancement bonus or effects">
                {magicLabel}
              </span>
            )}
          </span>
          <select
            value={itemType}
            onChange={(e) => setItemType(e.target.value)}
            className="sh-select"
            aria-label={magicLabel ? `Type: ${displayType}` : 'Type'}
          >
            {itemTypes.map((type, index) => (
              <option key={index} value={type}>{type}</option>
            ))}
          </select>
        </label>
        {isBonusCandidate && (
          <div className="sh-field">
            <span className="sh-label">Magical properties</span>
            <EquipBonusControls
              itemLink={link}
              masterwork={masterwork}
              bonus={bonus}
              effectIds={effectIds}
              onChange={handleBonusChange}
            />
          </div>
        )}
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
      </div>
    </BottomSheet>
  );
}
