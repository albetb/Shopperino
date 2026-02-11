import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import '../../style/menu_cards.css';

export default function ShareShopModal({ payload, onClose }) {
  const [dataUrl, setDataUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!payload) return;
    setError(null);
    QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', margin: 2 })
      .then(setDataUrl)
      .catch(() => setError('Could not generate QR code'));
  }, [payload]);

  const modal = (
    <div
      className="share-shop-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Share shop QR code"
    >
      <div
        className="share-shop-modal-box"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="modal-heading">Share shop</h3>
        {error && <p className="modal-error">{error}</p>}
        {dataUrl && !error && (
          <img
            src={dataUrl}
            alt="QR code for shared shop"
            className="modal-qr-img"
          />
        )}
        <p className="modal-body-muted">
          Scan this QR code with your phone to access the shop using the button in the Options menu.
        </p>
        <button
          type="button"
          className="modern-button small-long"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
