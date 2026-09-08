import { useEffect, useRef, useState } from 'react';
import { t } from '../../lib/i18n';

/* tabName is always one of a small fixed set of English words (see callers).
   Each combination is its own key so gender agrees in Italian ("nuova città"
   vs "nuovo mondo") rather than being glued around a single translated hole. */
const PLACEHOLDER_KEYS = {
  world: 'Insert new world name',
  city: 'Insert new city name',
  shop: 'Insert new shop name',
  player: 'Insert new player name',
  character: 'Insert new character name',
  note: 'Insert new note name',
};

const CreateComponent = ({ props }) => {
  const [name, setName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleOkClick = () => {
    props.onNew(name);
    props.setIsVisible(false);
    setName('');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleOkClick();
    }
  };

  const placeholder = () => {
    const key = PLACEHOLDER_KEYS[props.tabName] ?? `Insert new ${props.tabName} name`;
    return t(key);
  };

  return (
    <div className='card-side-div'>

      <input
        ref={inputRef}
        className='modern-dropdown small-longer padding-left'
        type='text'
        placeholder={placeholder()}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <button className='modern-button small-middle' onClick={handleOkClick}>
        <span className='material-symbols-outlined'>
          check
        </span>
      </button>

    </div>
  );
};

export default CreateComponent;
