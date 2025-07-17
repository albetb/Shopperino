import { useEffect, useRef, useState } from 'react';
import '../../style/menu_cards.css';

const SelectComponent = ({ props }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setConfirmDelete(false);
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
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

  return (
    <div ref={selectRef} className='card-side-div' style={{justifyContent: `${isSavedEmpty ? "center" : ""}`}}>
      {!isSavedEmpty && (
        <>
          <select
            className='modern-dropdown small-long'
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
        </>
      )}

      {!confirmDelete && (
        <button title="New" className={isSavedEmpty ? 'modern-button small-long' : 'levels-button small-middle'} onClick={handleNewClick}>
          <span className="material-symbols-outlined">
            new_window
          </span>
        </button>
      )}

      {!isSavedEmpty && (
        <>
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
        </>
      )}
    </div>
  );
};

export default SelectComponent;
