import { useRef } from 'react';
import '../../style/range_slider.css';

/**
 * Two-handle range over a list of discrete steps.
 *
 * Steps rather than a numeric range because the values it is built for are not
 * evenly spaced — the challenge-rating scale runs 1/4, 1/3, 1/2, then 1 to 27,
 * so the slider moves over indices and the caller maps them back.
 *
 * The handles cannot cross: pushing one into the other carries both, which is
 * how a range collapses to a single value and then slides as one.
 *
 * Built from two stacked <input type="range"> so keyboard and touch behaviour
 * come from the platform. Only the thumbs take pointer events; the track
 * beneath them is drawn by the wrapper.
 *
 * @param {number} min lowest step index
 * @param {number} max highest step index
 * @param {number} low current lower handle, as a step index
 * @param {number} high current upper handle, as a step index
 * @param {(low: number, high: number) => void} onChange
 * @param {(index: number) => string} formatValue renders a step for display
 */
export default function RangeSlider({
  min = 0,
  max = 100,
  low,
  high,
  onChange,
  formatValue = (v) => String(v),
  label,
}) {
  const wrapRef = useRef(null);
  const lowRef = useRef(null);
  const highRef = useRef(null);

  const span = Math.max(1, max - min);
  const lowPct = ((low - min) / span) * 100;
  const highPct = ((high - min) / span) * 100;

  /* Dragging one handle past the other pushes it along rather than stopping
     dead or swapping the two. The pair then moves together until the dragged
     handle is pulled back. */
  const handleLow = (value) => {
    const next = Math.max(min, Math.min(max, Number(value)));
    onChange(next, Math.max(next, high));
  };

  const handleHigh = (value) => {
    const next = Math.max(min, Math.min(max, Number(value)));
    onChange(Math.min(next, low), next);
  };

  /**
   * With both handles on the same step they overlap exactly, and whichever is
   * on top wins every grab — so a collapsed range could only ever be opened in
   * one direction. Decide from where the press landed instead: press left of
   * the handles and you get the low one, right and you get the high one.
   *
   * Runs in the capture phase and writes z-index straight to the DOM, because
   * the browser begins the drag in this same event — a React re-render would
   * arrive too late to matter.
   */
  const routePress = (event) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const clientX = event.clientX ?? event.touches?.[0]?.clientX;
    if (clientX == null) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    // Midpoint of the two handles: past it the press belongs to the high one.
    const wantHigh = pct > (lowPct + highPct) / 2;
    if (lowRef.current) lowRef.current.style.zIndex = wantHigh ? '2' : '3';
    if (highRef.current) highRef.current.style.zIndex = wantHigh ? '3' : '2';
  };

  const single = low === high;

  return (
    <div className="range-slider">
      <div className="range-slider-head">
        {label && <span className="sh-eyebrow">{label}</span>}
        <span className="range-slider-value">
          {single ? formatValue(low) : `${formatValue(low)} – ${formatValue(high)}`}
        </span>
      </div>

      <div
        className="range-slider-track-wrap"
        ref={wrapRef}
        onPointerDownCapture={routePress}
      >
        <div className="range-slider-track" />
        <div
          className="range-slider-fill"
          style={{ left: `${lowPct}%`, width: `${Math.max(0, highPct - lowPct)}%` }}
        />
        <input
          type="range"
          ref={lowRef}
          className="range-slider-input range-slider-input--low"
          min={min}
          max={max}
          step={1}
          value={low}
          aria-label={label ? `${label} minimum` : 'Range minimum'}
          onChange={(e) => handleLow(e.target.value)}
        />
        <input
          type="range"
          ref={highRef}
          className="range-slider-input range-slider-input--high"
          min={min}
          max={max}
          step={1}
          value={high}
          aria-label={label ? `${label} maximum` : 'Range maximum'}
          onChange={(e) => handleHigh(e.target.value)}
        />
      </div>
    </div>
  );
}
