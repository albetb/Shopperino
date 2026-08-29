import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { addCardByLink } from '../../store/slices/appSlice';
import InfoPopover from '../common/InfoPopover';
import TrapBreakdown from './trap_breakdown';
import TrapDiagram from './trap_diagram';
import {
  trapCR,
  trapPrice,
  craftDC,
  isMagicTrap,
  formatGp,
  getTrapTables,
  trapTypeLabel,
  triggerNote,
  resetNote,
  resolveTrapSpell,
} from '../../lib/trap';

/**
 * One trap, its diagram, and the two numbers that price it.
 *
 * Every field the CR calculator reads is editable, and the CR, the market
 * price and the Craft DC recompute from the edit. That is the whole reason to
 * roll and then edit rather than roll and re-roll: a master who wants *this*
 * trap but two points harder to find changes the Search DC and watches what it
 * costs.
 *
 * Nothing is enforced. A Search DC of 40 is accepted and priced, the same way
 * the character sheet accepts more skill points than the rules allow.
 */
export default function TrapSheet({ trap, onChange }) {
  const dispatch = useDispatch();
  if (!trap) return null;

  const tables = getTrapTables();
  const { cr, parts } = trapCR(trap);
  const price = trapPrice(trap, cr);
  const craft = craftDC(trap, cr);
  const magic = isMagicTrap(trap);

  const edit = (patch) => onChange({ ...trap, ...patch });
  const editAttack = (patch) => edit({
    attacks: [{ ...(trap.attacks?.[0] || {}), ...patch }, ...(trap.attacks || []).slice(1)],
  });

  const triggerOptions = (tables.triggers || []).filter((t) => (
    magic ? true : ['location', 'proximity', 'touch', 'timed'].includes(t.id)
  ));

  const numberField = (label, value, onValue, extra = {}) => (
    <label className="trap-field">
      <span className="trap-field-label">{label}</span>
      <input
        className="modern-input trap-number"
        type="number"
        value={value ?? ''}
        onChange={(e) => onValue(e.target.value === '' ? 0 : Number(e.target.value))}
        {...extra}
      />
    </label>
  );

  return (
    <div className="trap-sheet">
      <div className="card trap-card">
        <div className="trap-sheet-head">
          <input
            className="modern-input trap-name"
            value={trap.name || ''}
            onChange={(e) => edit({ name: e.target.value })}
            aria-label="Trap name"
          />
          <div className="trap-sheet-badges">
            <span className="trap-badge trap-badge-cr">CR {cr}</span>
            <span className="trap-badge">{trapTypeLabel(trap.type)}</span>
            {trap.rolled && trap.targetCR !== cr && (
              <span className="trap-badge is-warn" title="The roll aimed elsewhere">
                asked for CR {trap.targetCR}
              </span>
            )}
          </div>
        </div>

        {trap.ref && trap.cr !== cr && (
          <p className="trap-sheet-mismatch">
            The book prints this as <b>CR {trap.cr}</b>. Its own tables add up
            to {cr} — one of the ten samples where the two disagree.
          </p>
        )}
      </div>

      <div className="card trap-card">
        <h3 className="card-title trap-card-title">Elements</h3>
        <div className="trap-fields">
          <label className="trap-field">
            <span className="trap-field-label">
              Trigger
              <InfoPopover label="the trigger">
                <p>{triggerNote(trap.trigger?.type) || 'How the trap knows to go off.'}</p>
              </InfoPopover>
            </span>
            <select
              className="modern-dropdown"
              aria-label="Trigger"
              value={trap.trigger?.type || ''}
              onChange={(e) => edit({ trigger: { ...(trap.trigger || {}), type: e.target.value } })}
            >
              {triggerOptions.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </label>

          <label className="trap-field">
            <span className="trap-field-label">
              Reset
              <InfoPopover label="the reset">
                <p>{resetNote(trap.reset) || 'What it takes to make the trap work again.'}</p>
              </InfoPopover>
            </span>
            <select
              className="modern-dropdown"
              aria-label="Reset"
              value={trap.reset || ''}
              onChange={(e) => edit({ reset: e.target.value })}
            >
              {(tables.resets || []).map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </label>

          {numberField('Search DC', trap.searchDC, (v) => edit({ searchDC: v }))}
          {numberField('Disable Device DC', trap.disableDeviceDC, (v) => edit({ disableDeviceDC: v }))}

          {trap.save && numberField(`${trap.save.type} save DC`, trap.save.dc,
            (v) => edit({ save: { ...trap.save, dc: v } }))}

          {trap.attacks?.length > 0 && (
            <>
              {numberField('Attack bonus', trap.attacks[0].bonus, (v) => editAttack({ bonus: v }))}
              <label className="trap-field">
                <span className="trap-field-label">Damage</span>
                <input
                  className="modern-input"
                  value={trap.attacks[0].damage ?? ''}
                  onChange={(e) => editAttack({ damage: e.target.value })}
                  aria-label="Damage"
                />
              </label>
            </>
          )}

          {trap.pit && (
            <>
              {numberField('Pit depth (ft.)', trap.pit.depthFt, (v) => edit({
                pit: { ...trap.pit, depthFt: v, fallDamage: `${Math.max(1, Math.round(v / 10))}d6` },
              }), { step: 10, min: 10 })}
              <label className="trap-field">
                <span className="trap-field-label">Fall damage</span>
                <input
                  className="modern-input"
                  value={trap.pit.fallDamage ?? ''}
                  onChange={(e) => edit({ pit: { ...trap.pit, fallDamage: e.target.value } })}
                  aria-label="Fall damage"
                />
              </label>
            </>
          )}

          {trap.onsetDelayRounds != null && numberField('Onset delay (rounds)',
            trap.onsetDelayRounds, (v) => edit({ onsetDelayRounds: v }), { min: 0 })}
        </div>

        <div className="trap-toggles">
          <label className="trap-toggle">
            <input
              type="checkbox"
              checked={Boolean(trap.multipleTargets)}
              onChange={(e) => edit({
                multipleTargets: e.target.checked
                  ? 'first target in each of two adjacent 5-ft. squares'
                  : undefined,
                footprint: e.target.checked
                  ? { kind: 'squares', squares: 2, layout: 'adjacent' }
                  : { kind: 'single', squares: 1 },
              })}
            />
            <span>Multiple targets</span>
          </label>
          <label className="trap-toggle">
            <input
              type="checkbox"
              checked={Boolean(trap.neverMiss)}
              onChange={(e) => edit({
                neverMiss: e.target.checked || undefined,
                /* Never miss is always paired with an onset delay — the rules
                   give no version of it without one. */
                onsetDelayRounds: e.target.checked ? (trap.onsetDelayRounds || 1) : undefined,
              })}
            />
            <span>Never miss</span>
          </label>
        </div>

        {trap.bypass && (
          <p className="trap-line">
            <b>Bypass:</b> {trap.bypass.type}
            {trap.bypass.searchDC ? ` (Search DC ${trap.bypass.searchDC})` : ''}
            {trap.bypass.openLockDC ? ` (Open Lock DC ${trap.bypass.openLockDC})` : ''}
          </p>
        )}
        {trap.poison && (
          <p className="trap-line">
            <b>Poison:</b> {trap.poison.name}
            {trap.poison.saveDC ? ` — DC ${trap.poison.saveDC} ${trap.poison.save || 'Fortitude'}` : ''}
            {trap.poison.initial ? `, ${trap.poison.initial} initial` : ''}
            {trap.poison.secondary ? `, ${trap.poison.secondary} secondary` : ''}
          </p>
        )}
        {(trap.spellEffects || []).map((sp, i) => {
          const resolved = resolveTrapSpell(sp.spell, sp.casterClass);
          const link = sp.link || resolved?.link;
          return (
            <p className="trap-line" key={`${sp.spell}-${i}`}>
              <b>Spell:</b>{' '}
              {link ? (
                <button
                  className="button-link"
                  onClick={() => dispatch(addCardByLink({ links: link, bonus: 0 }))}
                >
                  {resolved?.name || sp.spell}
                </button>
              ) : (resolved?.name || sp.spell)}
              {' '}(caster level {sp.casterLevel}, {sp.casterClass})
              {sp.effect ? ` — ${sp.effect}` : ''}
            </p>
          );
        })}
        {trap.multipleTargets && (
          <p className="trap-line"><b>Targets:</b> {trap.multipleTargets}</p>
        )}
        {trap.multipleTraps && (
          <p className="trap-line is-note"><b>Really two traps:</b> {trap.multipleTraps}</p>
        )}
        {trap.note && <p className="trap-line is-note">{trap.note}</p>}
      </div>

      <div className="card trap-card">
        <h3 className="card-title trap-card-title">On the board</h3>
        <TrapDiagram trap={trap} />
      </div>

      <div className="card trap-card">
        <TrapBreakdown
          title="Challenge Rating"
          total={cr}
          rows={parts.map((p) => ({ key: p.key, label: p.label, value: p.cr }))}
        />
      </div>

      <div className="card trap-card">
        {price?.kind === 'mechanical' && (
          <TrapBreakdown
            title="Market price"
            total={formatGp(price.gp)}
            rows={[
              ...price.lines.map((l) => ({
                key: l.key,
                label: l.label,
                value: l.gp,
                display: `${l.gp >= 0 ? '+' : '−'}${Math.abs(l.gp).toLocaleString('en-US')} gp`,
              })),
              {
                key: 'multiply',
                label: `Subtotal ${price.subtotal.toLocaleString('en-US')} gp × CR ${price.cr}`,
                value: 0,
                display: formatGp(price.subtotal * price.cr),
              },
            ]}
            note={[
              price.floored ? `Floored at CR × 100 gp — nothing is ever free.` : '',
              price.excludesPoison
                ? 'The poison costs extra on top of this, at whatever the poison itself sells for.'
                : '',
            ].filter(Boolean).join(' ')}
          />
        )}
        {price?.kind === 'magic' && (
          <TrapBreakdown
            title="Cost to create"
            total={formatGp(price.gp)}
            rows={[
              ...price.perSpell.map((p, i) => ({
                key: `spell-${i}`,
                label: `${p.spell} — ${price.automatic ? 500 : 50} gp × CL ${p.casterLevel} × level ${p.spellLevel}`,
                value: p.gp,
                display: formatGp(p.gp),
              })),
              {
                key: 'xp',
                label: 'Experience burned',
                value: price.xp,
                display: `${price.xp.toLocaleString('en-US')} XP`,
              },
            ]}
            note={price.automatic
              ? 'An automatic reset costs ten times a one-shot, and burns ten times the XP.'
              : 'A one-shot trap. Material and XP components cost extra on top.'}
          />
        )}
        {price?.kind === 'spell' && (
          <p className="trap-line">
            <b>Cost:</b> free — a spell trap is cast, not built.
            {price.hired && ` The book prices an NPC caster at ${formatGp(price.gp)}.`}
          </p>
        )}
        {craft && (
          <TrapBreakdown
            title="Craft (trapmaking) DC"
            total={craft.dc}
            rows={craft.lines.map((l) => ({ key: l.key, label: l.label, value: l.gp }))}
            note="Repairing it uses the same DC, with raw materials at one-fifth of the market price."
          />
        )}
      </div>
    </div>
  );
}

TrapSheet.propTypes = {
  trap: PropTypes.object,
  onChange: PropTypes.func.isRequired,
};
