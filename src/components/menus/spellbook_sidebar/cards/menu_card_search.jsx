import { useDispatch, useSelector } from 'react-redux';
import { MAGICSCHOOLS } from '../../../../lib/spellbook';
import { setSearchSpellName, setSearchSpellSchool, setShowShortDescriptions } from '../../../../store/slices/spellbookSlice';
import '../../../../style/menu_cards.css';

/** Set to true to show the "Show spell descriptions" checkbox in the filter card. */
const SHOW_DESCRIPTION_UI = false;

export default function MenuCardSearch() {
  const dispatch = useDispatch();

  const searchSpellName = useSelector(s => s.spellbook.searchSpellName);
  const searchSpellSchool = useSelector(state => state.spellbook.searchSpellSchool);
  const showShortDescriptions = useSelector(state => state.spellbook.showShortDescriptions);

  const handleNameChange = name => dispatch(setSearchSpellName(name));
  const handleSchoolChange = cls => dispatch(setSearchSpellSchool(cls));
  const handleToggleShortDescriptions = checked => dispatch(setShowShortDescriptions(checked));

  return (
    <>
      <div className="card-side-div">
        <label className="modern-label">Name:</label>
        <input
          className='modern-dropdown small-longer padding-left'
          type='text'
          placeholder={"Search spell name"}
          value={searchSpellName}
          onChange={(e) => handleNameChange(e.target.value)}
        />
      </div>

      <div className="card-side-div margin-top">
        <label className="modern-label">School:</label>
        <select
          className="modern-dropdown small-long"
          value={searchSpellSchool}
          onChange={e => handleSchoolChange(e.target.value)}
        >
          <option value="">-</option>
          {MAGICSCHOOLS.map(cls => (
            <option key={cls} value={cls}>
              {cls}
            </option>
          ))}
        </select>
      </div>

      {/* Hidden for now; set SHOW_DESCRIPTION_UI to true to re-enable */}
      {SHOW_DESCRIPTION_UI && (
        <div className="card-side-div margin-top">
          <label className="modern-label flex-center">
            <input
              type="checkbox"
              checked={!!showShortDescriptions}
              onChange={e => handleToggleShortDescriptions(e.target.checked)}
              className="margin-right-sm"
            />
            Show spell descriptions
          </label>
        </div>
      )}
    </>
  );
}
