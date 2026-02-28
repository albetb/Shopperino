import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { onUpdateNoteContent } from '../../store/thunks/playerSheetThunks';
import '../../style/menu_cards.css';

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
  const noteName = player?.getSelectedNoteName() ?? '';
  const note = noteName ? player?.getNote(noteName) : null;

  const [localText, setLocalText] = useState(note?.text ?? '');

  useEffect(() => {
    setLocalText(note?.text ?? '');
  }, [noteName, note?.text]);

  const handleSave = () => {
    if (!noteName) return;
    dispatch(onUpdateNoteContent(noteName, localText));
  };

  if (!noteName || !note) {
    return (
      <div className="card">
        <p className="text-center modal-body-muted">Select a note from the sidebar.</p>
      </div>
    );
  }

  const lastModified = formatLastModified(note.updatedAt);
  const savedText = note?.text ?? '';
  const isUnchanged = localText === savedText;

  return (
    <div className="card player-sheet-note-editor">
      <h2 className="player-sheet-note-title">{noteName}</h2>
      <div className="player-sheet-note-meta">
        <p className="player-sheet-note-modified">
          <em>{lastModified}</em>
        </p>
        <button
          type="button"
          className="modern-button small-middle"
          onClick={handleSave}
          disabled={isUnchanged}
        >
          <span className="material-symbols-outlined">save</span>
        </button>
      </div>
      <textarea
        className="player-sheet-note-textarea"
        value={localText}
        onChange={(e) => setLocalText(e.target.value)}
        placeholder="Write your note here..."
      />
    </div>
  );
}
