import { useEffect, useRef } from 'react';
import { isMobile } from 'lib/utils';

export function useBackButtonHandler(active, onBack) {
  const hasPushed = useRef(false);

  useEffect(() => {
    if (!isMobile()) return;

    const handlePop = () => {
      if (hasPushed.current) {
        onBack();
        hasPushed.current = false;
      }
    };

    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [onBack]);

  useEffect(() => {
    if (!isMobile()) return;

    if (active && !hasPushed.current) {
      window.history.pushState({}, '');
      hasPushed.current = true;
    }

    if (!active && hasPushed.current) {
      window.history.back();
      hasPushed.current = false;
    }

    return () => {
      if (hasPushed.current) {
        window.history.back();
        hasPushed.current = false;
      }
    };
  }, [active]);
}
