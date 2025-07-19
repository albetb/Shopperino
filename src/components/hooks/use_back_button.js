import { useEffect, useRef } from 'react';
import { isMobile } from '../../lib/utils';

export function useBackButtonHandler(active, onBack) {
  const hasPushed = useRef(false);
  hasPushed.current = active;

  // 1) Install the popstate listener once
  useEffect(() => {
    if (!isMobile()) return;

    const handlePop = () => {
      if (hasPushed.current) {
        // We had pushed a dummy entry → this back press closes the sidebar
        onBack();
        hasPushed.current = false;
      }
    };

    window.addEventListener('popstate', handlePop);
    return () => {
      window.removeEventListener('popstate', handlePop);
    };
  }, [onBack]);

  // 2) Push / cleanup entry when `active` changes
  useEffect(() => {
    if (!isMobile()) return;

    if (active && !hasPushed.current) {
      // Sidebar opened → push one dummy entry
      window.history.pushState({}, '');
      hasPushed.current = true;
    }

    if (!active && hasPushed.current) {
      // Sidebar closed by UI → pop our dummy entry
      window.history.back();
      hasPushed.current = false;
    }

    // On unmount, also clean up if still pushed
    return () => {
      if (hasPushed.current) {
        window.history.back();
        hasPushed.current = false;
      }
    };
  }, [active]);
}
