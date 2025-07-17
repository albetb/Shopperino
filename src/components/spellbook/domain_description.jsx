import PropTypes from 'prop-types';

export default function DomainDescriptionCard({ description, collapsed, toggle }) {
    return (
        <div className={`card card-width-spellbook ${collapsed ? 'collapsed' : ''}`}>
            <div className="card-side-div card-expand-div" onClick={toggle}>
                <h3 className="card-title">Domains</h3>
                <button className="collapse-button">
                    <span className="material-symbols-outlined">
                        {collapsed ? 'expand_more' : 'expand_less'}
                    </span>
                </button>
            </div>

            {!collapsed && (
                <div
                    className="class-desc"
                    dangerouslySetInnerHTML={{ __html: description }}
                />
            )}
        </div>
    );
}

DomainDescriptionCard.propTypes = {
    description: PropTypes.string.isRequired,
    collapsed: PropTypes.bool.isRequired,
    toggle: PropTypes.func.isRequired,
};
