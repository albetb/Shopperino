import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadFile, isMobile, order } from '../../../../lib/utils';
import {
  onCreateCharacter,
  onDeleteCharacter,
  onSelectCharacter,
  onSetCharacterClass,
  onSetCharacterLevel,
  onSetCharacterRace,
} from '../../../../store/thunks/playerSheetThunks';
import { setIsPlayerSheetSidebarCollapsed, setPlayerSheetMainView } from '../../../../store/slices/playerSheetSlice';
import CreateComponent from '../../../common/create_component';
import LevelComponent from '../../../common/level_component';
import SelectComponent from '../../../common/select_component';
import SelectDisplayComponent from '../../../common/select_display_component';
import '../../../../style/menu_cards.css';

export default function MenuCardPlayerSheet() {
  const dispatch = useDispatch();
  const [isNewVisible, setIsNewVisible] = useState(false);

  const characters = useSelector(state => state.playerSheet.characters);
  const selectedCharacterName = useSelector(state => state.playerSheet.selectedCharacter?.name) ?? null;
  const player = useSelector(state => state.playerSheet.player);

  const raceList = useMemo(() => Object.keys(loadFile('races') ?? {}), []);
  const classList = useMemo(() => Object.keys(loadFile('classes') ?? {}).sort(), []);

  const saved = useMemo(() => order((characters || []).map(c => c?.name ?? ''), selectedCharacterName), [characters, selectedCharacterName]);

  const toggleNew = (visible) => setIsNewVisible(visible);

  const handleCreate = (name) => {
    dispatch(onCreateCharacter(name));
  };

  const handleSelect = (name) => {
    dispatch(onSelectCharacter(name));
  };

  const handleDelete = () => dispatch(onDeleteCharacter());

  const hasCharacter = !!player?.getName?.();
  const race = player?.getRace?.() ?? '';
  const _class = player?.getClass?.() ?? '';
  const level = player?.getLevel?.() ?? 1;

  const handleRaceSelect = (value) => {
    dispatch(onSetCharacterRace(value));
  };

  const handleClassSelect = (value) => {
    dispatch(onSetCharacterClass(value));
  };

  const handleLevelChange = (lvl) => {
    dispatch(onSetCharacterLevel(lvl));
  };

  const createProps = {
    saved,
    tabName: 'character',
    onNew: handleCreate,
    setIsVisible: toggleNew,
  };

  const selectProps = {
    saved,
    tabName: 'character',
    setIsVisible: toggleNew,
    onSelect: handleSelect,
    onDeleteItem: handleDelete,
  };

  return (
    <>
      {isNewVisible ? (
        <CreateComponent props={createProps} />
      ) : (
        <>
          <SelectComponent props={selectProps} />

          {hasCharacter && (
            <SelectDisplayComponent
              label="Race"
              options={raceList}
              value={race}
              onSelect={handleRaceSelect}
              onOpenDisplay={() => {
                dispatch(setPlayerSheetMainView('race'));
                if (isMobile()) {
                  dispatch(setIsPlayerSheetSidebarCollapsed(true));
                }
              }}
            />
          )}

          {hasCharacter && !!race && (
            <SelectDisplayComponent
              label="Class"
              options={classList}
              value={_class}
              onSelect={handleClassSelect}
              onOpenDisplay={() => {
                dispatch(setPlayerSheetMainView('class'));
                if (isMobile()) {
                  dispatch(setIsPlayerSheetSidebarCollapsed(true));
                }
              }}
            />
          )}

          {hasCharacter && !!race && !!_class && (
            <LevelComponent props={{ level, levelName: 'Level', onLevelChange: handleLevelChange }} />
          )}
        </>
      )}
    </>
  );
}

