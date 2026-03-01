import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { order, isMobile } from '../../../../lib/utils';
import {
  onCreateNote,
  onDeleteNote,
  onSelectNote,
} from '../../../../store/thunks/playerSheetThunks';
import { setPlayerSheetMainView, setIsPlayerSheetSidebarCollapsed } from '../../../../store/slices/playerSheetSlice';
import CreateComponent from '../../../common/create_component';
import SelectComponent from '../../../common/select_component';
import '../../../../style/menu_cards.css';

export default function MenuCardNotes() {
  const dispatch = useDispatch();
  const [isNewVisible, setIsNewVisible] = useState(false);
  const player = useSelector(state => state.playerSheet.player);
  const mainView = useSelector(state => state.playerSheet.mainView ?? 'none');

  const noteNames = useMemo(() => player?.getNoteNames() ?? [], [player]);
  const selectedNoteName = player?.getSelectedNoteName() ?? '';
  const saved = useMemo(
    () => order([...noteNames], selectedNoteName),
    [noteNames, selectedNoteName]
  );
  const isNoteActive = mainView === 'note';

  const handleCreate = (name) => {
    dispatch(onCreateNote(name));
    setIsNewVisible(false);
    dispatch(setPlayerSheetMainView('note'));
    if (isMobile()) dispatch(setIsPlayerSheetSidebarCollapsed(true));
  };

  const handleSelect = (name) => {
    dispatch(onSelectNote(name));
    dispatch(setPlayerSheetMainView('note'));
    if (isMobile()) dispatch(setIsPlayerSheetSidebarCollapsed(true));
  };

  const handleDelete = () => {
    dispatch(onDeleteNote());
  };

  const handleOpenNote = () => {
    dispatch(setPlayerSheetMainView('note'));
    if (isMobile()) {
      dispatch(setIsPlayerSheetSidebarCollapsed(true));
    }
  };

  const showOpenButton = noteNames.length > 0 && selectedNoteName;

  return (
    <>
      {isNewVisible ? (
        <CreateComponent
          props={{
            saved: noteNames,
            tabName: 'note',
            onNew: handleCreate,
            setIsVisible: setIsNewVisible,
          }}
        />
      ) : (
        <>
          <SelectComponent
            props={{
              saved,
              tabName: 'note',
              setIsVisible: setIsNewVisible,
              onSelect: handleSelect,
              onDeleteItem: handleDelete,
            }}
          />
          {showOpenButton && (
            <div className="card-side-div margin-top buttons-row-center">
              <button
                type="button"
                className={`modern-button small-middle-long2${isNoteActive ? ' opacity-50' : ''}`}
                onClick={handleOpenNote}
                disabled={isNoteActive}
                title="Open note"
              >
                <span className="material-symbols-outlined">note_stack</span>
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
