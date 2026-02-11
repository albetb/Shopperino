import PropTypes from 'prop-types';
import { setSearchSpellName, setSearchSpellSchool } from '../../store/slices/spellbookSlice';

export default function SpellFilters({ filters, dispatch }) {
    const { name, school } = filters;

    if (!name && !school) {
        return null;
    }

    return (
        <div className="filter-box">
            {name && (
                <div className="card-side-div card-expand-div card-expand-full">
                    <button
                        className="close-button no-margin-left"
                        onClick={() => dispatch(setSearchSpellName(''))}
                    >
                        <span className="material-symbols-outlined filter-icon-white">
                            close_small
                        </span>
                    </button>
                    <p className="filter-icon-white">
                        Filter by name: <b>{name}</b>
                    </p>
                </div>
            )}

            {school && (
                <div className="card-side-div card-expand-div card-expand-full">
                    <button
                        className="close-button no-margin-left"
                        onClick={() => dispatch(setSearchSpellSchool(''))}
                    >
                        <span className="material-symbols-outlined filter-icon-white">
                            close_small
                        </span>
                    </button>
                    <p className="filter-icon-white">
                        Filter by school: <b>{school}</b>
                    </p>
                </div>
            )}
        </div>
    );
}

SpellFilters.propTypes = {
    filters: PropTypes.shape({
        name: PropTypes.string,
        school: PropTypes.string,
    }).isRequired,
    dispatch: PropTypes.func.isRequired,
};
