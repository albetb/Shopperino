import { isMobile } from '../../lib/utils';
import Drawer from './Drawer';

/**
 * Sidebar wrapper: renders as a slide-in drawer on mobile / tablet
 * and as a persistent left rail on desktop (≥ 1024 px).
 * Mobile open state is controlled by the parent (the global
 * `sidebarCollapsed` Redux flag is the source of truth).
 */
export default function Sidebar({ open, onClose, title, children, className = '' }) {
  if (isMobile()) {
    return (
      <Drawer open={open} onClose={onClose} title={title}>
        {children}
      </Drawer>
    );
  }
  return (
    <aside className={`sh-sidebar-persistent ${className}`.trim()} aria-label={title}>
      {children}
    </aside>
  );
}
