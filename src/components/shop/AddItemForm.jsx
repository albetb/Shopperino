import { useEffect, useMemo, useState } from 'react';
import { getItem, itemRefLink, getItemByRef } from 'lib/item';
import { itemName as translateItemName } from 'lib/item/displayItemName';
import { itemTypes } from 'lib/utils';
import Modal from '../common/Modal';
import Button from '../common/Button';
import 'style/shop_inventory.css';
import { t, tx, tName } from 'lib/i18n';

export default function AddItemForm({ open, onAddItem, items, onClose }) {
  const [number, setNumber] = useState(1);
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState('Good');
  const [cost, setCost] = useState(1);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionOverflow, setSuggestionOverflow] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [link, setLink] = useState('');

  const MAX_SUGGESTIONS = 40;
  const MAX_NUMBER = 99;
  const MAX_COST = 999999999;
  const MAX_NAME_LENGTH = 64;

  useEffect(() => {
    if (!open) {
      setNumber(1);
      setItemName('');
      setItemType('Good');
      setCost(1);
      setLink('');
      setSuggestions([]);
      setSuggestionOverflow(0);
      setIsFocused(false);
    }
  }, [open]);

  /* Every item the shop can stock, of every type, gathered once.
     The box used to search only the type in the dropdown, so finding a
     longsword meant knowing to pick "Weapon" first -- knowing the answer
     before asking the question -- and scrolls, which live in their own file,
     were unreachable unless the dropdown already said "Scroll". The type is
     an answer the suggestion gives, not a question it asks. */
  const catalogue = useMemo(
    () => itemTypes.flatMap((type) => getItem('', type)), []);

  useEffect(() => {
    if (itemName.length < 2) {
      setSuggestions([]);
      setSuggestionOverflow(0);
      return;
    }
    const typed = itemName.toLowerCase();
    /* Both languages, always: a reader who sees *Spada lunga* on the shelf
       types *spada*, and one who knows the SRD types *longsword*. */
    const matches = (name) => String(name).toLowerCase().includes(typed)
      || translateItemName(String(name)).toLowerCase().includes(typed);

    const inStock = items.filter((item) => matches(item.Name));
    const seen = new Set(inStock.map((item) => item.Name));
    const fromData = catalogue.filter(
      (item) => !seen.has(item.Name) && matches(item.Name));

    /* Capped: every one of the 752 scrolls begins with "Scroll of", so a
       two-letter query matches all of them and a list that long is worse than
       no list. The row below says how many were left out. */
    const all = [...inStock, ...fromData];
    setSuggestions(all.slice(0, MAX_SUGGESTIONS));
    setSuggestionOverflow(Math.max(0, all.length - MAX_SUGGESTIONS));
  }, [itemName, items, catalogue]);

  const handleAddItemClick = () => {
    if (!itemName.trim()) return;
    /* The name is taken off the link rather than out of the box: it is the
       item's identity, and it must not depend on which language the box was
       filled in. Only a name with no link -- something the shopkeeper
       invented -- is stored as typed. */
    const canonical = link ? getItemByRef(link)?.raw?.Name : null;
    onAddItem(canonical || itemName, itemType, cost, number, link);
    onClose?.();
  };

  const handleSuggestionClick = (suggestion) => {
    setItemName(translateItemName(suggestion.Name));
    setItemType(suggestion.ItemType);
    setCost(suggestion.Cost);
    setLink(itemRefLink(suggestion) || suggestion.Link || '');
    setSuggestions([]);
    setIsFocused(false);
  };

  const handleNumberBlur = () => {
    const numValue = number ? parseInt(number, 10) : 0;
    if (numValue < 0) setNumber(0);
    else if (numValue > MAX_NUMBER) setNumber(MAX_NUMBER);
    else setNumber(numValue);
  };

  const handleCostBlur = () => {
    const numValue = cost !== '' && cost != null ? parseFloat(cost) : 0;
    let clamped = Number.isNaN(numValue) ? 0 : numValue;
    if (clamped < 0) clamped = 0;
    if (clamped > MAX_COST) clamped = MAX_COST;
    const rounded = clamped % 1 === 0 ? Math.trunc(clamped) : parseFloat(clamped.toFixed(2));
    setCost(rounded);
  };

  const handleNameBlur = () => {
    if (itemName.length > MAX_NAME_LENGTH) setItemName(itemName.slice(0, MAX_NAME_LENGTH));
    setIsFocused(false);
  };

  const shouldShowSuggestions =
    isFocused &&
    (suggestions.length > 1
      || (suggestions.length === 1
        && suggestions[0].Name.toLowerCase() !== itemName.toLowerCase()
        && translateItemName(suggestions[0].Name).toLowerCase() !== itemName.toLowerCase()));

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow={t('Shop')}
      title={t('Add item')}
      footer={
        <div className="sh-row-h" style={{ gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>{t('Cancel')}</Button>
          <Button
            variant="primary"
            icon="add_shopping_cart"
            onClick={handleAddItemClick}
            disabled={!itemName.trim()}
          >
            {t('Add')}
          </Button>
        </div>
      }
    >
      <div className="sh-stack" style={{ gap: 'var(--space-3)' }}>
        <label className="sh-field">
          <span className="sh-label">{t('Name')}</span>
          <div className="suggestions-anchor">
            <input
              type="text"
              placeholder={t('Item name')}
              value={itemName}
              onChange={(e) => { setItemName(e.target.value); setLink(''); }}
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
                    {translateItemName(suggestion.Name)}
                  </li>
                ))}
                {suggestionOverflow > 0 && (
                  <li className="suggestion-item suggestion-item--more">
                    {tx('{0} more — keep typing to narrow it', suggestionOverflow)}
                  </li>
                )}
              </ul>
            )}
          </div>
        </label>
        <label className="sh-field">
          <span className="sh-label">{t('Type')}</span>
          <select
            value={itemType}
            onChange={(e) => setItemType(e.target.value)}
            className="sh-select"
          >
            {itemTypes.map((type, index) => (
              <option key={index} value={type}>{tName('itemTypes', type)}</option>
            ))}
          </select>
        </label>
        <label className="sh-field">
          <span className="sh-label">{t('Quantity')}</span>
          <input
            type="number"
            min={0}
            max={MAX_NUMBER}
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            onBlur={handleNumberBlur}
            className="sh-input"
          />
        </label>
        <label className="sh-field">
          <span className="sh-label">{t('Cost (gp)')}</span>
          <input
            type="number"
            step="0.01"
            value={cost}
            min={0}
            max={MAX_COST}
            onChange={(e) => setCost(e.target.value)}
            onBlur={handleCostBlur}
            className="sh-input"
          />
        </label>
      </div>
    </Modal>
  );
}
