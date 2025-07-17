import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { order } from '../../../../lib/utils';
import {
  onCityLevelChange,
  onDeleteCity,
  onNewCity,
  onSelectCity
} from '../../../../store/thunks/cityThunks';
import CreateComponent from '../../../common/create_component';
import SelectComponent from '../../../common/select_component';
import '../../../../style/menu_cards.css';

export default function MenuCardCity() {
  const dispatch = useDispatch();
  const [isNewVisible, setIsNewVisible] = useState(false);

  // Redux state
  const world = useSelector(state => state.world.world);
  const city = useSelector(state => state.city.city);

  const cities = world?.Cities.map(c => c.Name) || [];
  const selectedName = city?.Name;
  const saved = order(cities, selectedName);
  const cityLevel = city?.Level ?? 1;

  // Handlers
  const showCreate = () => setIsNewVisible(true);
  const hideCreate = () => setIsNewVisible(false);
  const handleNew = name => dispatch(onNewCity(name));
  const handleSelect = name => dispatch(onSelectCity(name));
  const handleDelete = () => dispatch(onDeleteCity());
  const handleLevelChange = lvl => dispatch(onCityLevelChange(lvl));

  if (isNewVisible) {
    return (
      <CreateComponent
        props={{
          saved,
          tabName: 'city',
          onNew: handleNew,
          setIsVisible: hideCreate
        }}
      />
    );
  }

  return (
    <>
      <SelectComponent
        props={{
          saved,
          tabName: 'city',
          setIsVisible: showCreate,
          onSelect: handleSelect,
          onDeleteItem: handleDelete
        }}
      />

      {saved.length > 0 && (
        <div className="card-side-div margin-top">
          <label className="modern-label">City Level:</label>
          <select
            className="modern-dropdown small-long"
            value={cityLevel}
            onChange={e => handleLevelChange(Number(e.target.value))}
          >
            <option value={1}>Village</option>
            <option value={2}>Burg</option>
            <option value={3}>Town</option>
            <option value={4}>City</option>
            <option value={5}>Metropolis</option>
          </select>
        </div>
      )}
    </>
  );
}
