import { useEffect, useRef } from 'react';
import { isMobile } from '../../lib/utils';

/**
 * Calls onBack() when the user presses the device back button (popstate),
 * but only when `active` is true.  Pushes a single history entry when active,
 * and cleans it up when inactive.
 */
export function useBackButtonHandler(active, onBack) {
  const hasPushed = useRef(false);

  useEffect(() => {
    if (!isMobile()) return;      // only on mobile
    if (active && !hasPushed.current) {
      // push when we become active
      window.history.pushState({ sidebarOpen: true }, '');
      hasPushed.current = true;
    }
    if (!active && hasPushed.current) {
      // clean up when we become inactive
      window.history.back();
      hasPushed.current = false;
    }

    const onPopState = event => {
      if (active && event.state?.sidebarOpen) {
        // back was pressed: call our callback and remove the pushed entry
        onBack();
        window.history.back();
        hasPushed.current = false;
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      // if component unmounts while active, clean up
      if (hasPushed.current) {
        window.history.back();
        hasPushed.current = false;
      }
    };
  }, [active, onBack]);
}
