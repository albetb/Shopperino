import { useEffect, useState } from 'react';
import { getItem, itemRefLink } from 'lib/item';
import { itemTypes } from 'lib/utils';
import 'style/shop_inventory.css';

export default function AddItemFormInventory({ onAddItem, items, setShowAddItemForm }) {
  const [number, setNumber] = useState(1);
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState('Good');
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [link, setLink] = useState('');

  const MAX_NUMBER = 99;
  const MAX_NAME_LENGTH = 64;

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
    onAddItem(itemName, itemType, number, link);
    setNumber(1);
    setItemName('');
    setItemType('Good');
    setLink('');
    setShowAddItemForm(false);
  };

  const handleSuggestionClick = (suggestion) => {
    setItemName(suggestion.Name);
    setItemType(suggestion.ItemType);
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
    <tr className="add-item add-item-inventory">
      <td className="no-border-top">
        <input
          type="number"
          min={0}
          max={MAX_NUMBER}
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          onBlur={handleNumberBlur}
          className="modern-input add-item-height margin-left-sm"
        />
      </td>
      <td className="name-size name-small no-border-top">
        <input
          type="text"
          placeholder="Item name"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={handleNameBlur}
          className="name-size modern-input add-item-height"
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
      </td>
      <td className="type-size no-border-top">
        <select
          value={itemType}
          onChange={(e) => setItemType(e.target.value)}
          className="type-size modern-input add-item-height"
        >
          {itemTypes.map((type, index) => (
            <option key={index} value={type}>
              {type}
            </option>
          ))}
        </select>
      </td>
      <td className="action-size no-border-top">
        <button className="item-number-button medium-short" onClick={handleAddItemClick}>
          <span className="material-symbols-outlined">add_shopping_cart</span>
        </button>
      </td>
    </tr>
  );
}
