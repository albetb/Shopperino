import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { order } from '../../../../lib/utils';
import {
  onDeleteWorld,
  onNewWorld,
  onPlayerLevelChange,
  onSelectWorld,
  onWaitTime
} from '../../../../store/thunks/worldThunks';
import CreateComponent from '../../../common/create_component';
import LevelComponent from '../../../common/level_component';
import SelectComponent from '../../../common/select_component';

export default function MenuCardWorld() {
  const dispatch = useDispatch();
  const [isNewVisible, setIsNewVisible] = useState(false);
  const [buttonIcon, setButtonIcon] = useState(
    <span className="material-symbols-outlined">fast_forward</span>
  );
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hours, setHours] = useState('');
  const [days, setDays] = useState('');

  // Redux state selectors
  const worlds = useSelector(state => state.world.worlds);
  const selected = useSelector(state => state.world.selectedWorld?.Name);
  const playerLevel = useSelector(state => state.world.world?.Level) ?? 1;
  const isShopGenerated = useSelector(state => state.shop.shopGenerated);

  // Handlers
  const toggleNew = visible => setIsNewVisible(visible);
  const onCreate = name => dispatch(onNewWorld(name));
  const onSelect = name => dispatch(onSelectWorld(name));
  const onDelete = () => dispatch(onDeleteWorld());

  const handleBlur = (value, setter, max) => {
    let num = parseInt(value, 10) || 0;
    num = Math.max(0, Math.min(max, num));
    setter(num.toString());
  };

  const handleWait = () => {
    if (hours || days) {
      setIsTransitioning(true);
      setTimeout(() => {
        setButtonIcon(
          <span className="material-symbols-outlined">check</span>
        );
        setIsTransitioning(false);
        setTimeout(
          () => setButtonIcon(
            <span className="material-symbols-outlined">fast_forward</span>
          ),
          1000
        );
      }, 300);
      const h = parseInt(hours, 10) || 0;
      const d = parseInt(days, 10) || 0;
      dispatch(onWaitTime([d, h]));
    }
  };

  // Props for common components
  const createProps = {
    saved: order(worlds.map(w => w.Name), selected),
    tabName: 'world',
    onNew: onCreate,
    setIsVisible: toggleNew
  };

  const selectProps = {
    saved: order(worlds.map(w => w.Name), selected),
    tabName: 'world',
    setIsVisible: toggleNew,
    onSelect,
    onDeleteItem: onDelete
  };

  const levelProps = {
    level: playerLevel,
    levelName: 'Player Level',
    onLevelChange: lvl => dispatch(onPlayerLevelChange(lvl))
  };

  return (
    <>
      {isNewVisible ? (
        <CreateComponent props={createProps} />
      ) : (
        <>
          <SelectComponent props={selectProps} />
          {worlds.length > 0 && (
            <>
              <LevelComponent props={levelProps} />

              <div className={`card-side-div margin-top ${isShopGenerated ? '' : 'opacity-50'}`}>
                <input
                  type="number"
                  placeholder="hours"
                  value={hours}
                  min={0}
                  max={23}
                  onChange={e => setHours(e.target.value)}
                  onBlur={() => handleBlur(hours, setHours, 23)}
                  className="modern-dropdown small-middle padding-left"
                  disabled={!isShopGenerated}
                />
                <input
                  type="number"
                  placeholder="days"
                  value={days}
                  min={0}
                  max={7}
                  onChange={e => setDays(e.target.value)}
                  onBlur={() => handleBlur(days, setDays, 7)}
                  className="modern-dropdown small-middle padding-left"
                  disabled={!isShopGenerated}
                />
                <button
                  onClick={handleWait}
                  className={`modern-dropdown small-middle ${isTransitioning ? 'transition' : ''}`}
                  disabled={!isShopGenerated}
                >
                  {buttonIcon}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
