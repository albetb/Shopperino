import PropTypes from 'prop-types';
import { setSearchSpellName, setSearchSpellSchool } from '../../store/slices/spellbookSlice';

export default function SpellFilters({ filters, dispatch }) {
    const { name, school } = filters;

    if (!name && !school) return null;

    return (
        <>
            {name && (
                <div className="filter-box">
                    <div className="card-side-div card-expand-div" style={{ width: '100%' }}>
                        <button
                            className="close-button no-margin-left"
                            onClick={() => dispatch(setSearchSpellName(''))}
                        >
                            <span style={{ color: 'var(--white)' }} className="material-symbols-outlined">
                                close_small
                            </span>
                        </button>
                        <p style={{ color: 'var(--white)' }}>
                            Filter by name: <b>{name}</b>
                        </p>
                    </div>
                </div>
            )}

            {school && (
                <div className="filter-box">
                    <div className="card-side-div card-expand-div" style={{ width: '100%' }}>
                        <button
                            className="close-button no-margin-left"
                            onClick={() => dispatch(setSearchSpellSchool(''))}
                        >
                            <span style={{ color: 'var(--white)' }} className="material-symbols-outlined">
                                close_small
                            </span>
                        </button>
                        <p style={{ color: 'var(--white)' }}>
                            Filter by school: <b>{school}</b>
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}

SpellFilters.propTypes = {
    filters: PropTypes.shape({
        name: PropTypes.string,
        school: PropTypes.string,
    }).isRequired,
    dispatch: PropTypes.func.isRequired,
};
