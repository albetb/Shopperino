import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { encodeEffectShare } from '../../lib/share';
import { resolveSharedEffect } from '../../lib/player/sharedEffects';
import resolveLabel from '../../lib/i18n/resolveLabel';
import { loadFile } from '../../lib/utils';
import { t, tName } from '../../lib/i18n';
import '../../style/menu_cards.css';

/* The skills inspire competence can be pointed at. Read from the data rather
   than listed here, and sorted the way the reader sees them. Knowledge is one
   row with sub-skills elsewhere in the app; a bard inspiring "Knowledge" is
   inspiring the check that gets rolled, so it stays as it is spelled. */
function skillOptions() {
  const list = loadFile('skills');
  return (Array.isArray(list) ? list : [])
    .filter((s) => s?.Name && s.Name !== 'Speak Language')
    .map((s) => ({ name: s.Name, label: tName('skills', s.Name) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * The code that hands an effect to another player.
 *
 * Simpler than the item panel next to it, and the difference is the point: an
 * effect is not *lost* by being given. A bard singing to four allies shows the
 * same code four times and keeps nothing back, so there is nothing to confirm
 * at this end — no "keep or give", just a code and a way out.
 *
 * What travels is the id of the performance and the size the bard's own level
 * gave it. The receiving sheet does the arithmetic from its own copy of the
 * table, which is why nothing here is a translated word.
 */
export default function ShareEffectModal({ effect, onClose }) {
  const [skill, setSkill] = useState('');
  const [dataUrl, setDataUrl] = useState(null);
  const [error, setError] = useState(null);

  const skills = useMemo(() => skillOptions(), []);
  const needsSkill = Boolean(effect && resolveSharedEffect(effect)?.needsSkill);
  /* Pointed at the first skill by default rather than at nothing: a code that
     grants "+2 competence on —" is a code nobody wants to have scanned. */
  const chosen = needsSkill ? (skill || skills[0]?.name || '') : '';

  const payload = useMemo(() => (
    effect ? encodeEffectShare({ ...effect, skill: chosen }).payload : null
  ), [effect, chosen]);

  useEffect(() => {
    if (!payload) return;
    setError(null);
    QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', margin: 2 })
      .then(setDataUrl)
      .catch(() => setError(t('Could not generate QR code')));
  }, [payload]);

  if (!effect) return null;
  const resolved = resolveSharedEffect({ ...effect, skill: chosen });
  if (!resolved) return null;

  const modal = (
    <div
      className="qr-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t('Share effect QR code')}
    >
      <div className="qr-modal-box" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-heading">{tName('classFeatures', resolved.name)}</h3>
        <p className="qr-modal-item">
          <span className="qr-modal-item-note">{resolveLabel(resolved.summary)}</span>
        </p>

        {needsSkill && (
          <label className="qr-modal-choice">
            <span className="qr-modal-item-note">{t('Which skill')}</span>
            <select
              className="modern-dropdown small-middle"
              value={chosen}
              onChange={(e) => setSkill(e.target.value)}
            >
              {skills.map((s) => (
                <option key={s.name} value={s.name}>{s.label}</option>
              ))}
            </select>
          </label>
        )}

        {error && <p className="modal-error">{error}</p>}
        {dataUrl && !error && (
          <img src={dataUrl} alt={t('QR code for the effect being shared')} className="modal-qr-img" />
        )}
        <p className="modal-body-muted">
          {t('Whoever scans this is asked whether to take it. Nothing leaves your own sheet.')}
        </p>
        <button type="button" className="modern-button small-long" onClick={onClose}>
          {t('Close')}
        </button>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
