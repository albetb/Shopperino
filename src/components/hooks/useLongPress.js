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

  /* Leaving the button cancels the press, it does not complete it. With a
     mouse the pointer leaves on the way to anywhere else — including straight
     after a click, which fired the action a second time — and a press the
     reader dragged off is the standard way to say "no, not that one". */
  const cancel = useCallback(event => clear(event, false), [clear]);

  return {
    onMouseDown: (e, params) => start(e, params),
    onTouchStart: (e, params) => start(e, params),
    onMouseUp: clear,
    onMouseLeave: cancel,
    onTouchEnd: clear,
  };
};

export default useLongPress;
