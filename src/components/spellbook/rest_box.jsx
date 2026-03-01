import PropTypes from 'prop-types';

export default function RestBox({ page, hasUsedSpells, onRefreshSpell }) {
    if (page !== 2) return null;

    const handleRest = () => {
        if (hasUsedSpells && onRefreshSpell) onRefreshSpell();
    };

    return (
        <div
            className={`filter-box rest-box ${!hasUsedSpells ? 'opacity-50' : ''}`}
            onClick={handleRest}
        >
            <div className="card-side-div card-expand-div card-expand-full rest-box-full">
                <button className="close-button no-margin-left">
                    <span className="material-symbols-outlined filter-icon-white">
                        bedtime
                    </span>
                </button>
                <p className="filter-icon-white">Long rest</p>
            </div>
        </div>
    );
}

RestBox.propTypes = {
    page: PropTypes.number.isRequired,
    hasUsedSpells: PropTypes.bool.isRequired,
    onRefreshSpell: PropTypes.func,
};
