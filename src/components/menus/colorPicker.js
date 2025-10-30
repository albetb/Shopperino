import { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setMainColor, resetMainColor, selectMainColor } from '../../store/slices/appSlice';
import { applyColors } from '../../lib/colorUtils';

const LS_KEY = 'app_main_color';
const LONGPRESS_DELAY = 600; // ms - tweak as needed

export default function ColorPicker() {
  const dispatch = useDispatch();
  const storeMain = useSelector(selectMainColor);
  const [value, setValue] = useState(storeMain || localStorage.getItem(LS_KEY) || '');

  const inputRef = useRef(null);
  const timeoutRef = useRef(null);
  const longPressedRef = useRef(false);

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
    // eslint-disable-next-line
  }, []);

  const onChange = (e) => {
    const newHex = e.target.value;
    setValue(newHex);
    dispatch(setMainColor(newHex));
    localStorage.setItem(LS_KEY, newHex);
    applyColors(newHex);
  };

  const doReset = useCallback(() => {
    localStorage.removeItem(LS_KEY);
    dispatch(resetMainColor());
    applyColors(null);
    setValue('');
  }, [dispatch]);

  // Start long-press timer
  const startPress = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    longPressedRef.current = false;
    timeoutRef.current = setTimeout(() => {
      longPressedRef.current = true;
      doReset();
    }, LONGPRESS_DELAY);
  }, [doReset]);

  // Clear timer and handle short-press behavior
  // NOTE: we no longer try to prevent click here; instead we handle suppression in onClick
  const clearPress = useCallback((isTouch = false) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (!longPressedRef.current) {
      if (isTouch) {
        // For touch we had prevented the native open earlier; open manually
        if (inputRef.current) inputRef.current.click();
      } else {
        // desktop: don't do anything here; onClick will open picker if not suppressed
      }
    }
    // do NOT reset longPressedRef here — we need it to survive until onClick fires
  }, []);

  // Native touch listeners (passive: false so preventDefault works)
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    const onTouchStart = (ev) => {
      if (ev.cancelable) ev.preventDefault(); // stop native immediate opening
      startPress();
    };

    const onTouchEnd = (ev) => {
      ev.preventDefault?.();
      clearPress(true);
    };

    const onTouchMove = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, [startPress, clearPress]);

  // Mouse handlers for desktop
  const onMouseDown = useCallback(() => startPress(), [startPress]);
  const onMouseUpOrLeave = useCallback(() => clearPress(false), [clearPress]);

  // IMPORTANT: suppress the click if a long-press just occurred
  const onClick = useCallback((e) => {
    if (longPressedRef.current) {
      // Prevent the color picker from opening after long-press
      e.preventDefault();
      e.stopPropagation?.();
      // reset the flag so subsequent clicks work normally
      longPressedRef.current = false;
    }
    // If not longPressed, allow click to open the picker as usual
  }, []);

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          ref={inputRef}
          type="color"
          value={value || '#017474'}
          onChange={onChange}
          aria-label="Choose app main color (long-press to reset)"
          className="modern-dropdown small-middle"
          title="Short tap: open picker. Long-press: reset to default"
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUpOrLeave}
          onMouseLeave={onMouseUpOrLeave}
          onClick={onClick} // <-- suppress click after a long-press
          // touch events handled by native listeners
        />
      </label>
    </div>
  );
}
