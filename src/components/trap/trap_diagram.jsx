import PropTypes from 'prop-types';
import { trapGrid, footprintCaveat, TRIGGER_SHAPE_NOTE } from '../../lib/trap';

/**
 * The trap on the board.
 *
 * An SVG grid of 5-ft squares: the squares the trap catches, and the trigger
 * drawn from its type — because the footprint says where the *effect* is and
 * nothing in the data says where the trigger is. A location trigger is the
 * trapped square itself; a proximity trigger is the ring outside it, which is
 * what makes it the one that catches a flyer.
 *
 * The footprints were inferred from the book's multiple-target prose rather
 * than authored, so the caveat under the grid is not boilerplate — where a
 * trap carries a free-text note, the diagram is genuinely not the whole story.
 */
export default function TrapDiagram({ trap }) {
  if (!trap) return null;
  const grid = trapGrid(trap);
  const caveat = footprintCaveat(trap);

  const cell = 34;
  const pad = 6;
  const width = grid.cols * cell + pad * 2;
  const height = grid.rows * cell + pad * 2;

  return (
    <div className="trap-diagram">
      <svg
        className="trap-diagram-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Board diagram: ${grid.caption}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {grid.cells.map((c) => {
          const classes = ['trap-cell'];
          if (c.effect) classes.push('is-effect');
          if (c.trigger) classes.push('is-trigger');
          if (c.wall) classes.push('is-wall');
          return (
            <rect
              key={`${c.x}-${c.y}`}
              className={classes.join(' ')}
              x={pad + c.x * cell}
              y={pad + c.y * cell}
              width={cell}
              height={cell}
              rx="2"
            />
          );
        })}
      </svg>

      <div className="trap-diagram-legend">
        <span className="trap-legend-item">
          <span className="trap-swatch is-effect" aria-hidden="true" />
          Caught by the trap
        </span>
        {grid.triggerShape !== 'none' && (
          <span className="trap-legend-item">
            <span className="trap-swatch is-trigger" aria-hidden="true" />
            Trigger
          </span>
        )}
        {grid.kind === 'room' && (
          <span className="trap-legend-item">
            <span className="trap-swatch is-wall" aria-hidden="true" />
            Wall
          </span>
        )}
      </div>

      <p className="trap-diagram-caption">
        {grid.caption} Each square is {grid.cellFt} ft.
      </p>
      <p className="trap-diagram-caption trap-diagram-trigger-note">
        {TRIGGER_SHAPE_NOTE[grid.triggerShape]}
      </p>
      {caveat && <p className="trap-diagram-caveat">{caveat}</p>}
    </div>
  );
}

TrapDiagram.propTypes = {
  trap: PropTypes.object,
};
