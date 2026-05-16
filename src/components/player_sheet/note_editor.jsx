import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { onUpdateNoteContent } from '../../store/thunks/playerSheetThunks';
import Card from '../common/Card';
import Filigree from '../common/Filigree';
import Pill from '../common/Pill';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';

const IDLE_SAVE_MS = 2000;

function formatLastModified(timestamp) {
  if (!Number.isFinite(timestamp)) return '—';
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${M}-${day} ${h}:${m}`;
}

export default function NoteEditor() {
  const dispatch = useDispatch();
  const player = useSelector(state => state.playerSheet.player);
  const noteName = player?.getSelectedNoteName?.() ?? '';
  const note = noteName ? player?.getNote?.(noteName) : null;

  const [localText, setLocalText] = useState(note?.text ?? '');
  const idleTimer = useRef(null);

  useEffect(() => {
    setLocalText(note?.text ?? '');
  }, [noteName, note?.text]);

  const handleSave = (textOverride) => {
    if (!noteName) return;
    const text = typeof textOverride === 'string' ? textOverride : localText;
    dispatch(onUpdateNoteContent(noteName, text));
  };

  const handleChange = e => {
    const next = e.target.value;
    setLocalText(next);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => handleSave(next), IDLE_SAVE_MS);
  };

  const handleBlur = () => {
    if (idleTimer.current) { clearTimeout(idleTimer.current); idleTimer.current = null; }
    if (noteName && localText !== (note?.text ?? '')) handleSave();
  };

  if (!noteName || !note) {
    return (
      <div className="sh-stack" style={{ padding: 'var(--space-4)' }}>
        <EmptyState icon="edit_note" title="No note selected" hint="Pick or create one from the sidebar." />
      </div>
    );
  }

  const savedText = note?.text ?? '';
  const isUnchanged = localText === savedText;
  const lastModified = formatLastModified(note.updatedAt);

  return (
    <div className="sh-stack" style={{ padding: 'var(--space-4)', paddingBottom: 'var(--space-12)' }}>
      <div className="sh-row-h sh-spread">
        <div>
          <Filigree>Note</Filigree>
          <div className="sh-display" style={{ fontSize: 'var(--font-size-2xl)' }}>{noteName}</div>
        </div>
        <Pill tone="ghost">Local only</Pill>
      </div>

      <Card padding>
        <div className="sh-stack">
          <textarea
            className="sh-textarea"
            value={localText}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Write your note here…"
            style={{ minHeight: '11rem' }}
          />
          <div className="sh-row-h sh-spread">
            <span className="sh-mono sh-faint" style={{ fontSize: 'var(--font-size-2xs)' }}>
              edited {lastModified}
            </span>
            <Button
              variant="primary"
              size="sm"
              icon="save"
              disabled={isUnchanged}
              onClick={() => handleSave()}
            >
              Save
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
