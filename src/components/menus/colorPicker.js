import { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setMainColor, selectMainColor } from '../../store/slices/appSlice';
import { applyColors } from '../../lib/colorUtils';

const LS_KEY = 'app_main_color';

// 9 hard-coded theme colors
const PALETTE = [
  '#2fa6a1', // softened teal
  '#60b8ff', // baby-blue accent
  '#ff9e80', // peachy coral
  '#8ecf9e', // mint-green
  '#ad7aff', // lilac purple
  '#ffe066', // soft butter yellow
  '#4fd8c4', // pale aqua
  '#e48fbf', // pastel pink-mauve
  '#9e9ba8', // muted slate-grey
];

export default function ColorPicker() {
  const dispatch = useDispatch();
  const storeMain = useSelector(selectMainColor);

  const wrapperRef = useRef(null);
  const firstColorBtnRef = useRef(null);

  // selected holds the current hex string (always from PALETTE)
  const [selected, setSelected] = useState(() => {
    const persisted = localStorage.getItem(LS_KEY);
    if (storeMain) return storeMain;
    if (persisted) return persisted;
    return PALETTE[0];
  });

  const [isOpen, setIsOpen] = useState(false);

  // Sync redux / css on mount and whenever `selected` changes externally
  useEffect(() => {
    // If redux has no color yet, set it to selected (persisted/default)
    if (!storeMain) {
      dispatch(setMainColor(selected));
    } else if (storeMain && storeMain !== selected) {
      // If redux color exists and differs, prefer redux
      setSelected(storeMain);
      applyColors(storeMain);
      localStorage.setItem(LS_KEY, storeMain);
      return;
    }

    applyColors(selected);
    localStorage.setItem(LS_KEY, selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // When user chooses a color from palette
  const onSelectColor = useCallback((hex) => {
    setSelected(hex);
    dispatch(setMainColor(hex));
    localStorage.setItem(LS_KEY, hex);
    applyColors(hex);
    //setIsOpen(false);
  }, [dispatch]);

  // Toggle popup
  const toggleOpen = useCallback(() => {
    setIsOpen((v) => !v);
  }, []);

  // Close on outside click / touch
  useEffect(() => {
    if (!isOpen) return;

    const onDocDown = (ev) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(ev.target)) {
        setIsOpen(false);
      }
    };

    const onKey = (ev) => {
      if (ev.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('touchstart', onDocDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('touchstart', onDocDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  // When opening, focus first color button for keyboard users
  useEffect(() => {
    if (isOpen && firstColorBtnRef.current) {
      firstColorBtnRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={wrapperRef}>
      {/* The change-color button showing the current color */}
      <button
        type="button"
        onClick={toggleOpen}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Open color palette (current ${selected})`}
        className={"modern-dropdown small-middle"}
        style={{
            padding: '0px'
        }}
      >
        <span
          aria-hidden
          style={{
            width: 54,
            height: 18,
            borderRadius: 6,
            background: selected,
            border: '1px solid rgba(0,0,0,0.12)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)',
          }}
        />
      </button>

      {/* Popup with 3x3 palette */}
      {isOpen && (
        <div
          className="top-menu-button-container"
          role="menu"
          aria-label="Select theme color"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: '-25px',
            zIndex: 9999,
            background: '#fff',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: 8,
            padding: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            // width set to show a 3x3 nicely; override in CSS if needed
            width: 120,
            justifyContent: 'center',
          }}
        >
          {/*
            The .top-menu-button-container CSS below will arrange buttons in a 3x3 grid.
            We also add some inline styles to make each color button look good.
          */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
            }}
          >
            {PALETTE.map((hex, idx) => {
              const isActive = selected && selected.toLowerCase() === hex.toLowerCase();
              return (
                <button
                  key={hex}
                  ref={idx === 0 ? firstColorBtnRef : null}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActive}
                  aria-label={`Choose ${hex}`}
                  onClick={() => onSelectColor(hex)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    border: isActive ? '3px solid #fff' : '2px solid rgba(0,0,0,0.12)',
                    padding: 0,
                    backgroundColor: hex,
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 0 0 2px rgba(0,0,0,0.12) inset' : 'none',
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
