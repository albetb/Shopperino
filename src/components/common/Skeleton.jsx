export default function Skeleton({ width, height = '1.5rem', count = 1, className = '', style }) {
  if (count <= 1) {
    return <div className={`sh-skeleton ${className}`.trim()} style={{ width, height, ...style }} />;
  }
  return (
    <div className="sh-stack" style={style}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`sh-skeleton ${className}`.trim()} style={{ width, height }} />
      ))}
    </div>
  );
}
