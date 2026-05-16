import Icon from './Icon';

export default function EmptyState({ icon, title, hint, action, className = '' }) {
  return (
    <div className={`sh-empty ${className}`.trim()}>
      {icon && <Icon name={icon} />}
      {title && <div className="title">{title}</div>}
      {hint && <div className="hint">{hint}</div>}
      {action}
    </div>
  );
}
