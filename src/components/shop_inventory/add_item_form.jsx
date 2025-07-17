import { useEffect, useState } from 'react';
import { getItem } from '../../lib/item';
import { itemTypes } from '../../lib/utils';
import '../../style/shop_inventory.css';

const AddItemForm = ({ onAddItem, items, setShowAddItemForm }) => {
  const [number, setNumber] = useState(1);
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState('Good');
  const [cost, setCost] = useState(1);
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [link, setLink] = useState('');

  const MAX_NUMBER = 99;
  const MAX_COST = 999999999;
  const MAX_NAME_LENGTH = 64;

  useEffect(() => {
    if (itemName.length >= 2) {
      const filteredSuggestions = items.filter(item =>
        item.Name.toLowerCase().includes(itemName.toLowerCase())
      );
      const otherItems = getItem(itemName, itemType);

      const namesInFilteredSuggestions = new Set(filteredSuggestions.map(item => item.Name));
      const filteredOtherItems = otherItems.filter(item => !namesInFilteredSuggestions.has(item.Name));

      setSuggestions([...filteredSuggestions, ...filteredOtherItems]);
    } else {
      setSuggestions([]);
    }
  }, [itemName, itemType, items]);

  const handleAddItemClick = () => {
    onAddItem(itemName, itemType, cost, number, link);
    setNumber(1);
    setItemName('');
    setItemType('Good');
    setCost(1);
    setShowAddItemForm(false);
  };

  const handleSuggestionClick = (suggestion) => {
    setItemName(suggestion.Name);
    setItemType(suggestion.ItemType);
    setCost(suggestion.Cost);
    setLink(suggestion.Link);
    setSuggestions([]);
    setIsFocused(false);
  };

  const handleNumberBlur = () => {
    const numValue = number ? parseInt(number, 10) : 0;
    if (numValue < 0) {
      setNumber(0);
    } else if (numValue > MAX_NUMBER) {
      setNumber(MAX_NUMBER);
    } else {
      setNumber(numValue);
    }
  };

  const handleCostBlur = () => {
    const numValue = cost ? parseInt(cost, 10) : 0;
    if (numValue < 0) {
      setCost(0);
    } else if (numValue > MAX_COST) {
      setCost(MAX_COST);
    } else {
      setCost(numValue);
    }
  };

  const handleNameBlur = () => {
    if (itemName.length > MAX_NAME_LENGTH) {
      setItemName(itemName.slice(0, MAX_NAME_LENGTH));
    }
    setIsFocused(false);
  };

  const shouldShowSuggestions = isFocused && (suggestions.length > 1 ||
    (suggestions.length === 1 && suggestions[0].Name.toLowerCase() !== itemName.toLowerCase()));

  return (
    <tr className='add-item'>
      <td className='no-border-top'>
        <input
          type='number'
          min={0}
          max={MAX_NUMBER}
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          onBlur={handleNumberBlur}
          className='modern-input add-item-height'
          style={{ width: "80%" }}
        />
      </td>
      <td className='name-size name-small no-border-top'>
        <input
          type='text'
          placeholder='Item name'
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={handleNameBlur}
          className='name-size modern-input add-item-height'
          style={{ width: "98%" }}
        />
        {shouldShowSuggestions && (
          <ul className='suggestions'>
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                onMouseDown={() => handleSuggestionClick(suggestion)}
                className='suggestion-item'
              >
                {suggestion.Name}
              </li>
            ))}
          </ul>
        )}
      </td>
      <td className='type-size no-border-top'>
        <select
          value={itemType}
          onChange={(e) => setItemType(e.target.value)}
          className='type-size modern-input add-item-height'
          style={{ width: "104%", height: "2.26rem", maxHeight: "2.26rem" }}
        >
          {itemTypes.map((type, index) => (
            <option key={index} value={type}>
              {type}
            </option>
          ))}
        </select>
      </td>
      <td className='cost-size no-border-top'>
        <input
          type='number'
          value={cost}
          min={0}
          max={MAX_COST}
          onChange={(e) => setCost(e.target.value)}
          onBlur={handleCostBlur}
          className='cost-size modern-input add-item-height'
        />
      </td>
      <td className='action-size no-border-top'>
        <button className='item-number-button medium-short' style={{ height: "2.26rem !important", maxHeight: "2.26rem !important" }} onClick={handleAddItemClick}>
          <span className='material-symbols-outlined'>
            add_shopping_cart
          </span>
        </button>
      </td>
    </tr>
  );
};

export default AddItemForm;
