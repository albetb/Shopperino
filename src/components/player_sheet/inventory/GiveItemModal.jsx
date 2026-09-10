import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { encodeItemGift } from '../../../lib/share';
import displayItemName from '../../../lib/item/displayItemName';
import { t, tx, tName } from '../../../lib/i18n';
import '../../../style/menu_cards.css';

/**
 * The code that hands an item to another player, and the one decision that
 * follows it.
 *
 * The two presses are not the same act. Scanning is the other player's; giving
 * is this one's, and it happens *after* — the code can be read, discussed,
 * refused across the table, and only then does the item actually leave the
 * bag. "Keep" is what closes the exchange that did not happen, which is why
 * the panel cannot simply be dismissed into a subtraction.
 *
 * The quantity is the one the menu's slider was showing when the code was
 * asked for: it is baked into the code the other player scans, so the two
 * halves of the trade can never disagree about how many.
 */
export default function GiveItemModal({ gift, onKeep, onGive }) {
  const [dataUrl, setDataUrl] = useState(null);
  const [error, setError] = useState(null);

  const payload = gift ? encodeItemGift(gift).payload : null;

  useEffect(() => {
    if (!payload) return;
    setError(null);
    QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', margin: 2 })
      .then(setDataUrl)
      .catch(() => setError(t('Could not generate QR code')));
  }, [payload]);

  if (!gift) return null;

  const name = displayItemName(gift.overrides?.Name ?? gift.name, {
    masterwork: gift.masterwork,
    bonus: gift.bonus,
    effectIds: gift.effectIds,
  });

  const modal = (
    <div
      className="qr-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={t('Give item QR code')}
    >
      <div className="qr-modal-box">
        <h3 className="modal-heading">{t('Give item')}</h3>
        <p className="qr-modal-item">
          <b>{name}</b>
          <span className="qr-modal-item-note">
            {tx('{0} × {1}', tName('itemTypes', gift.type), gift.number)}
          </span>
        </p>
        {error && <p className="modal-error">{error}</p>}
        {dataUrl && !error && (
          <img src={dataUrl} alt={t('QR code for the item being given')} className="modal-qr-img" />
        )}
        <p className="modal-body-muted">
          {t('Let the other player scan this code. Then press Give to hand it over, or Keep if it stays with you.')}
        </p>
        <div className="qr-modal-actions">
          <button type="button" className="modern-button small-long" onClick={onKeep}>
            {t('Keep')}
          </button>
          <button type="button" className="modern-button small-long" onClick={onGive}>
            <b>{t('Give')}</b>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
