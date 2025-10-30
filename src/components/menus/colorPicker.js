import { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setMainColor, resetMainColor, selectMainColor } from '../../store/slices/appSlice';
import { applyColors } from '../../lib/colorUtils';
import useLongPress from '../hooks/use_long_press';

const LS_KEY = 'app_main_color';

export default function ColorPicker() {
  const dispatch = useDispatch();
  const storeMain = useSelector(selectMainColor); // either null or '#rrggbb'
  const [value, setValue] = useState(storeMain || localStorage.getItem(LS_KEY) || '');

  useEffect(() => {
    const persisted = localStorage.getItem(LS_KEY);
    if (storeMain) {
      applyColors(storeMain);
      setValue(storeMain);
    } else if (persisted) {
      dispatch(setMainColor(persisted));
      applyColors(persisted);
      setValue(persisted);
    } else {
      applyColors(null);
      setValue('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (e) => {
    const newHex = e.target.value;
    setValue(newHex);
    dispatch(setMainColor(newHex));
    localStorage.setItem(LS_KEY, newHex);
    applyColors(newHex);
  };

  const onReset = useCallback(() => {
    // same behavior as your old onReset, memoized so the hook has a stable callback
    localStorage.removeItem(LS_KEY);
    dispatch(resetMainColor());
    applyColors(null);
    setValue('');
  }, [dispatch]);

  // No-op click handler so short press behaves normally (native color dialog opens)
  const noopClick = useCallback(() => {}, []);

  // Use the long press hook. Adjust delay if you want longer/shorter press threshold.
  const longPressHandlers = useLongPress(onReset, noopClick, { shouldPreventDefault: true, delay: 600 });

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="color"
          value={value || '#017474'}
          onChange={onChange}
          aria-label="Choose app main color (long-press to reset)"
          className="modern-dropdown small-middle"
          // spread the long-press handlers onto the input element
          {...longPressHandlers}
          title="Long-press: reset to default"
        />
      </label>
    </div>
  );
}
