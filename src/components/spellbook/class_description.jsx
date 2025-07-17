import React from 'react';
import PropTypes from 'prop-types';

export default function ClassDescriptionCard({ className, description, collapsed, toggle }) {
    return (
        <div className={`card card-width-spellbook ${collapsed ? 'collapsed' : ''}`}>
            <div className="card-side-div card-expand-div" onClick={toggle}>
                <h3 className="card-title">{className}</h3>
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

ClassDescriptionCard.propTypes = {
    className: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    collapsed: PropTypes.bool.isRequired,
    toggle: PropTypes.func.isRequired,
};
