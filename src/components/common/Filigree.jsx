export default function Filigree({ children, className = '' }) {
  return <span className={`sh-filigree ${className}`.trim()}>{children}</span>;
}
