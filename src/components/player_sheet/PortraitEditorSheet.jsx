import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BottomSheet from '../common/BottomSheet';
import Button from '../common/Button';
import {
  decodeFile,
  composePortrait,
  clampCoverOffset,
} from '../../lib/player/portraitImage';
import '../../style/portrait_editor.css';

const VIEWPORT_PX = 320;

export default function PortraitEditorSheet({ open, onClose, currentPortrait, onSave, onRemove }) {
  const fileInputRef = useRef(null);
  const viewportRef = useRef(null);
  const imgRef = useRef(null);
  const dragStateRef = useRef(null);

  // Decoded source for the in-progress edit (null when not editing).
  const [edit, setEdit] = useState(null); // { source, srcW, srcH, previewUrl }
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Reset transient state when the sheet closes.
  useEffect(() => {
    if (!open) {
      setEdit((prev) => {
        if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
        return null;
      });
      setOffset({ x: 0, y: 0 });
      setError('');
      setDragging(false);
      setBusy(false);
      dragStateRef.current = null;
    }
  }, [open]);

  // Free the preview URL on unmount / when replacing the edit.
  useEffect(() => () => {
    if (edit?.previewUrl) URL.revokeObjectURL(edit.previewUrl);
  }, [edit]);

  const { scale, displayOffset } = useMemo(() => {
    if (!edit) return { scale: 1, displayOffset: { x: 0, y: 0 } };
    const { scale: s, offset: o } = clampCoverOffset({
      srcW: edit.srcW,
      srcH: edit.srcH,
      viewport: VIEWPORT_PX,
      offset,
    });
    return { scale: s, displayOffset: o };
  }, [edit, offset]);

  const handlePickFile = useCallback(() => {
    setError('');
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file later
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      const decoded = await decodeFile(file);
      // Generate a preview URL for the <img> element used inside the viewport.
      const previewUrl = URL.createObjectURL(file);
      setEdit((prev) => {
        if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
        return {
          source: decoded.source,
          srcW: decoded.width,
          srcH: decoded.height,
          previewUrl,
        };
      });
      // Center the image by default.
      const s = Math.max(VIEWPORT_PX / decoded.width, VIEWPORT_PX / decoded.height);
      const drawW = decoded.width * s;
      const drawH = decoded.height * s;
      setOffset({ x: (VIEWPORT_PX - drawW) / 2, y: (VIEWPORT_PX - drawH) / 2 });
    } catch (err) {
      setError(err?.message || 'Could not read the image');
    } finally {
      setBusy(false);
    }
  }, []);

  const handlePointerDown = useCallback((e) => {
    if (!edit) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startOffset: displayOffset,
    };
    setDragging(true);
  }, [edit, displayOffset]);

  const handlePointerMove = useCallback((e) => {
    const drag = dragStateRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    setOffset({ x: drag.startOffset.x + dx, y: drag.startOffset.y + dy });
  }, []);

  const handlePointerUp = useCallback((e) => {
    const drag = dragStateRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    dragStateRef.current = null;
    setDragging(false);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }, []);

  const handleSave = useCallback(() => {
    if (!edit) return;
    try {
      const dataUrl = composePortrait({
        source: edit.source,
        srcW: edit.srcW,
        srcH: edit.srcH,
        offset: displayOffset,
        viewport: VIEWPORT_PX,
      });
      onSave?.(dataUrl);
    } catch (err) {
      setError(err?.message || 'Could not save the portrait');
    }
  }, [edit, displayOffset, onSave]);

  const handleCancelEdit = useCallback(() => {
    setEdit((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
    setOffset({ x: 0, y: 0 });
    setError('');
  }, []);

  const hasExisting = Boolean(currentPortrait);
  const isEditing = Boolean(edit);

  return (
    <BottomSheet open={open} onClose={onClose} title="Portrait" eyebrow="Character">
      <div className="portrait-editor">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="portrait-editor-file-input"
          onChange={handleFileChange}
          aria-hidden="true"
          tabIndex={-1}
        />

        {isEditing ? (
          <>
            <div
              ref={viewportRef}
              className="portrait-editor-viewport"
              data-dragging={dragging ? 'true' : 'false'}
              style={{ width: `${VIEWPORT_PX}px`, height: `${VIEWPORT_PX}px`, maxWidth: '80vw', aspectRatio: '1' }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <img
                ref={imgRef}
                className="portrait-editor-canvas"
                src={edit.previewUrl}
                alt=""
                draggable={false}
                style={{
                  width: `${edit.srcW}px`,
                  height: `${edit.srcH}px`,
                  transform: `translate(${displayOffset.x}px, ${displayOffset.y}px) scale(${scale})`,
                }}
              />
            </div>
            <div className="portrait-editor-hint">Drag to reposition</div>
            {error && <div className="portrait-editor-error">{error}</div>}
            <div className="portrait-editor-actions">
              <Button variant="ghost" onClick={handleCancelEdit}>Cancel</Button>
              <Button variant="ghost" icon="image" onClick={handlePickFile}>Choose another</Button>
              <Button variant="primary" icon="check" onClick={handleSave}>Save</Button>
            </div>
          </>
        ) : hasExisting ? (
          <>
            <div className="portrait-editor-preview">
              <img src={currentPortrait} alt="Current portrait" />
            </div>
            {error && <div className="portrait-editor-error">{error}</div>}
            <div className="portrait-editor-actions">
              <Button variant="danger" icon="delete" onClick={onRemove}>Remove</Button>
              <Button variant="primary" icon="image" onClick={handlePickFile} disabled={busy}>Replace</Button>
            </div>
          </>
        ) : (
          <>
            <div className="portrait-editor-hint">Pick an image from your device. It will be cropped to a square.</div>
            {error && <div className="portrait-editor-error">{error}</div>}
            <div className="portrait-editor-actions">
              <Button variant="primary" icon="image" onClick={handlePickFile} disabled={busy}>Choose image</Button>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
