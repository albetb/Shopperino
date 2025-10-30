import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setMainColor, resetMainColor, selectMainColor } from '../../store/slices/appSlice';
import { applyColors } from '../../lib/colorUtils';

const LS_KEY = 'app_main_color';

export default function ColorPicker() {
  const dispatch = useDispatch();
  const storeMain = useSelector(selectMainColor); // either null or '#rrggbb'
  const [value, setValue] = useState(storeMain || localStorage.getItem(LS_KEY) || '');

  useEffect(() => {
    // On mount, prefer stored redux value -> localStorage -> do nothing (use CSS defaults)
    const persisted = localStorage.getItem(LS_KEY);
    if (storeMain) {
      applyColors(storeMain);
      setValue(storeMain);
    } else if (persisted) {
      // If redux has no value but localStorage does, apply it and sync redux
      dispatch(setMainColor(persisted));
      applyColors(persisted);
      setValue(persisted);
    } else {
      // no user color selected: ensure defaults (remove overrides)
      applyColors(null);
      setValue('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When user picks a color
  function onChange(e) {
    const newHex = e.target.value; // e.g. '#1a2b3c'
    setValue(newHex);
    dispatch(setMainColor(newHex));
    localStorage.setItem(LS_KEY, newHex);
    applyColors(newHex);
  }

  function onReset() {
    localStorage.removeItem(LS_KEY);
    dispatch(resetMainColor());
    applyColors(null);
    setValue('');
  }

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="color"
          value={value || '#017474'} // color input requires a value; show default if empty
          onChange={onChange}
          aria-label="Choose app main color"
          className={`modern-dropdown small-middle`}
        />
        {//<span>{value || 'Default'}</span>
        }
      </label>
      {//<button onClick={onReset} type="button">Reset</button>
}
    </div>
  );
}
