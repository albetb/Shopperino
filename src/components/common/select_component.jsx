import { useEffect, useRef, useState } from 'react';
import '../../style/menu_cards.css';

const SelectComponent = ({ props }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    // mousedown (not click): fires before React re-renders the cluster,
    // so event.target is still in the DOM and contains() can correctly
    // tell whether the press was inside this component.
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setConfirmDelete(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNewClick = () => {
    props.setIsVisible(true);
  };

  const handleDropdownChange = (event) => {
    props.onSelect(event.target.value);
  };

  const handleDropdownClick = () => {
    setConfirmDelete(false);
  };

  const handleDelete = () => {
    props.onDeleteItem();
    setConfirmDelete(false);
  };

  const handleConfirmClick = () => {
    setConfirmDelete(true);
  };

  const handleCancelClick = () => {
    setConfirmDelete(false);
  };

  const isSavedEmpty = !Array.isArray(props.saved) || props.saved.length === 0;

  if (isSavedEmpty) {
    return (
      <div ref={selectRef} className="card-side-div justify-center">
        <button title="New" className="modern-button small-long" onClick={handleNewClick}>
          <span className="material-symbols-outlined">
            new_window
          </span>
        </button>
      </div>
    );
  }

  return (
    <div ref={selectRef} className="card-side-div select-row">
      <div className="select-cluster">
        <select
          className='modern-dropdown'
          onChange={handleDropdownChange}
          onClick={handleDropdownClick}
          value={props.saved?.[0] || ''}
        >
          {props.saved.map((item, index) => (
            <option key={index} value={item}>
              {item}
            </option>
          ))}
        </select>

        {!confirmDelete && (
          <button title="New" className="levels-button small-middle" onClick={handleNewClick}>
            <span className="material-symbols-outlined">
              new_window
            </span>
          </button>
        )}

        {confirmDelete ? (
          <>
            <button title="Confirm" className='levels-button small' onClick={handleDelete}>
              <span className="material-symbols-outlined">
                delete
              </span>
            </button>
            <button title="Back" className='levels-button small-middle' onClick={handleCancelClick}>
              <span className="material-symbols-outlined">
                close
              </span>
            </button>
          </>
        ) : (
          <button title="Delete" className='levels-button small' onClick={handleConfirmClick}>
            <span className="material-symbols-outlined">
              delete
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default SelectComponent;
