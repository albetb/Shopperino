export default function Field({ label, hint, htmlFor, error, children, className = '' }) {
  return (
    <label className={`sh-field ${className}`.trim()} htmlFor={htmlFor}>
      {label && <span className="sh-label">{label}</span>}
      {children}
      {error
        ? <span className="sh-label sh-warn-text">{error}</span>
        : hint && <span className="sh-label sh-faint">{hint}</span>}
    </label>
  );
}
