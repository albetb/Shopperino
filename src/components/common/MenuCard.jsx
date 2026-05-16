import { useState } from 'react';
import Icon from './Icon';
import Pill from './Pill';

export default function MenuCard({
  title,
  icon,
  open,
  defaultOpen = true,
  onToggle,
  badge,
  children,
  className = '',
}) {
  const controlled = open !== undefined;
  const [internal, setInternal] = useState(defaultOpen);
  const isOpen = controlled ? open : internal;
  const handleClick = () => {
    if (controlled) onToggle?.(!isOpen);
    else {
      setInternal(v => !v);
      onToggle?.(!isOpen);
    }
  };
  return (
    <div className={`sh-menu-card ${className}`.trim()} data-open={String(isOpen)}>
      <button
        type="button"
        className="sh-menu-card-head"
        aria-expanded={isOpen}
        onClick={handleClick}
      >
        {icon && <Icon name={icon} />}
        <span>{title}</span>
        {badge != null && (typeof badge === 'string' || typeof badge === 'number'
          ? <Pill tone="accent">{badge}</Pill>
          : badge)}
        <Icon name="expand_more" className="sh-card-chev" />
      </button>
      <div className="sh-menu-card-body">{children}</div>
    </div>
  );
}
