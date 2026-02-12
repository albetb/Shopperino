import { useState, useCallback } from 'react';

const useLongPress = (onLongPress, onClick, { shouldPreventDefault = true, delay = 500 } = {}) => {
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

  const start = useCallback((event, params = []) => {
    if (shouldPreventDefault && event.target) {
      event.target.addEventListener('touchend', preventDefault, { passive: false });
      event.target.addEventListener('touchmove', preventDefault, { passive: false });
    }
    setLongPressTriggered(false);
    const id = setTimeout(() => {
      onLongPress(...params);
      setLongPressTriggered(true);
    }, delay);
    setTimeoutId(id);
  }, [onLongPress, delay, shouldPreventDefault]);

  const clear = useCallback((event, shouldTriggerClick = true) => {
    if (timeoutId) clearTimeout(timeoutId);
    if (shouldTriggerClick && !longPressTriggered) onClick();
    if (shouldPreventDefault && event.target) {
      event.target.removeEventListener('touchend', preventDefault);
      event.target.removeEventListener('touchmove', preventDefault);
    }
  }, [longPressTriggered, onClick, shouldPreventDefault, timeoutId]);

  const preventDefault = (event) => {
    if (!event.cancelable) return;
    event.preventDefault();
  };

  return {
    onMouseDown: (e, params) => start(e, params),
    onTouchStart: (e, params) => start(e, params),
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchEnd: clear,
  };
};

export default useLongPress;
