import { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { parseSharedShop } from 'lib/shop';
import '../../../style/menu_cards.css';

export default function ScanShopScanner({ onClose, onSuccess }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const [error, setError] = useState(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
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
        setError('Could not access camera.');
      });

    const tick = () => {
      if (!videoRef.current || !streamRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
        animationRef.current = requestAnimationFrame(tick);
        return;
      }
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (w === 0 || h === 0) {
        animationRef.current = requestAnimationFrame(tick);
        return;
      }
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, w, h);
      const code = jsQR(imageData.data, w, h);
      if (code && code.data) {
        const result = parseSharedShop(code.data);
        if (result.ok) {
          stopStream();
          onSuccess(result.shop);
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
  }, [onSuccess, stopStream]);

  const handleClose = () => {
    stopStream();
    onClose();
  };

  return (
    <div
      className="share-shop-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Scan shop QR code"
    >
      <div className="share-shop-modal-box">
        <h3 className="modal-heading">Scan shop</h3>
        {error && (
          <p className="modal-error modal-error-margin">{error}</p>
        )}
        {!error && (
          <>
            <p className="modal-body-muted">
              Point your camera at a shop QR code.
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
          Cancel
        </button>
      </div>
    </div>
  );
}
