// Material Symbols Outlined wrapper. Used by all atom components for iconography.
// Renders a span the icon font interprets via the `liga` feature.
export default function Icon({ name, size, color, className = '', style, ...rest }) {
  const computedStyle = {
    ...(size != null ? { fontSize: typeof size === 'number' ? `${size}px` : size } : null),
    ...(color ? { color } : null),
    ...style,
  };
  return (
    <span className={`material-symbols-outlined mi ${className}`.trim()} style={computedStyle} {...rest}>
      {name}
    </span>
  );
}
