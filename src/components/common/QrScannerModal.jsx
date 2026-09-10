import { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { readScannedPayload } from '../../lib/share';
import '../../style/menu_cards.css';
import { t } from '../../lib/i18n';

/**
 * The camera, and one reading of what it saw.
 *
 * There is a single scan button in the app and there will go on being one: the
 * codes it can meet — a master's shop, an item another player is handing over,
 * an effect later — are told apart by `readScannedPayload`, not by asking the
 * reader to pick the right button first. So this component knows nothing about
 * any of them; it hands the caller whatever the code turned out to be.
 *
 * @param {(result: {kind: string}) => boolean|void} onSuccess called with the
 *   decoded payload. Returning `false` keeps the camera running — for a code
 *   that scanned perfectly but cannot be acted on, such as an item offered to
 *   a device with no character saved on it.
 * @param {string} [notice] a line to show above the feed. That refused code is
 *   what it is for: the reason belongs where the reader is still looking.
 */
export default function QrScannerModal({ onClose, onSuccess, notice }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const [error, setError] = useState(null);

  /* Held in a ref rather than read from the closure: the handler is rebuilt on
     every render of the menu that owns it, and an effect that depended on it
     would tear the camera down and ask for it again each time — including on
     the very render that reports a code it could not use. */
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setError(null);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        streamRef.current = stream;
        video.srcObject = stream;
        video.play();
      })
      .catch(() => {
        setError(t('Could not access camera.'));
      });

    const tick = () => {
      if (!videoRef.current || !streamRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
        animationRef.current = requestAnimationFrame(tick);
        return;
      }
      const feed = videoRef.current;
      const frame = canvasRef.current;
      const w = feed.videoWidth;
      const h = feed.videoHeight;
      if (w === 0 || h === 0) {
        animationRef.current = requestAnimationFrame(tick);
        return;
      }
      frame.width = w;
      frame.height = h;
      ctx.drawImage(feed, 0, 0);
      const imageData = ctx.getImageData(0, 0, w, h);
      const code = jsQR(imageData.data, w, h);
      if (code && code.data) {
        const result = readScannedPayload(code.data);
        /* A code that reads as nothing is not an error the reader should see:
           a camera sweeping a table finds half-codes constantly. It keeps
           looking until it finds one it understands. */
        if (result.ok && onSuccessRef.current(result) !== false) {
          stopStream();
          return;
        }
      }
      animationRef.current = requestAnimationFrame(tick);
    };

    const startTicking = () => {
      animationRef.current = requestAnimationFrame(tick);
    };
    video.addEventListener('loadeddata', startTicking);

    return () => {
      video.removeEventListener('loadeddata', startTicking);
      stopStream();
    };
  }, [stopStream]);

  const handleClose = () => {
    stopStream();
    onClose();
  };

  return (
    <div
      className="qr-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={t('Scan a QR code')}
    >
      <div className="qr-modal-box">
        <h3 className="modal-heading">{t('Scan')}</h3>
        {(error || notice) && (
          <p className="modal-error modal-error-margin">{error || notice}</p>
        )}
        {!error && (
          <>
            <p className="modal-body-muted">
              {t('Point your camera at a shop or item QR code.')}
            </p>
            <div className="modal-qr-wrapper">
              <video
                ref={videoRef}
                muted
                playsInline
                className="modal-video"
              />
              <canvas
                ref={canvasRef}
                className="hidden-canvas"
                width={0}
                height={0}
              />
            </div>
          </>
        )}
        <button
          type="button"
          className="modern-button small-long"
          onClick={handleClose}
        >
          {t('Cancel')}
        </button>
      </div>
    </div>
  );
}
