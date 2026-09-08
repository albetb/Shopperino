import PropTypes from 'prop-types';
import { tx, tName } from '../../lib/i18n';

export default function SpellFilters({ filters, onClearSearchName, onClearSearchSchool }) {
    const { name, school } = filters;

    if (!name && !school) {
        return null;
    }

    return (   
        <>
            {name && onClearSearchName && (
                <div className="filter-box">
                    <div className="card-side-div card-expand-div card-expand-full rest-box-full">
                        <button
                            className="close-button no-margin-left"
                            onClick={() => onClearSearchName('')}
                            >
                            <span className="material-symbols-outlined filter-icon-white">
                                close_small
                            </span>
                        </button>
                        <p className="filter-icon-white">
                            {tx('Filter by name: {0}', <b>{name}</b>)}
                        </p>
                    </div>
                </div>
            )}
            {school && onClearSearchSchool && (
                <div className="filter-box">
                    <div className="card-side-div card-expand-div card-expand-full rest-box-full">
                        <button
                            className="close-button no-margin-left"
                            onClick={() => onClearSearchSchool('')}
                            >
                            <span className="material-symbols-outlined filter-icon-white">
                                close_small
                            </span>
                        </button>
                        <p className="filter-icon-white">
                            {tx('Filter by school: {0}', <b>{tName('schools', school)}</b>)}
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
    onClearSearchName: PropTypes.func,
    onClearSearchSchool: PropTypes.func,
};
