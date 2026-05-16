export default function Slots({ total = 0, used = 0, className = '' }) {
  if (total <= 0) return null;
  const usedCount = Math.max(0, Math.min(total, used));
  return (
    <span className={`sh-slots ${className}`.trim()}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`sh-slot ${i < usedCount ? 'is-used' : ''}`.trim()}
        />
      ))}
    </span>
  );
}
