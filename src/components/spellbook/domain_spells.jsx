import PropTypes from 'prop-types';
import { isMobile } from '../../lib/utils';
import { addCardByLink } from '../../store/slices/appSlice';
import { onUseDomainSpell } from '../../store/thunks/spellbookThunks';

export default function DomainSpells({ preparedByLevel, preparedLevels, dispatch, showShortDescriptions }) {
    if (!preparedLevels || preparedLevels.length === 0) return null;

    return (
        <>
            {preparedLevels.map(lvl => {
                const list = preparedByLevel[lvl] || [];
                if (list.length === 0) return null;
                return (
                    <table key={lvl} className="spellbook-table">
                        <thead>
                            <tr>
                                <th className="dark-grey col-btn-sm"></th>
                                <th className="dark-grey spell-table-header-title">Domain spell</th>
                                {!isMobile() && (<th className="dark-grey col-30"></th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {list.map(({ spell: item, Prepared, Used }, i) => {
                                const remaining = Math.max(0, Prepared - Used);
                                return (
                                    <tr key={i}>
                                        <td className={`${i === 0 ? 'first' : ''} col-btn-sm-max`}>
                                            <div className='card-side-div'>
                                                <div className='spell-slot-div2'>
                                                    <button
                                                        className={`flat-button smaller ${remaining <= 0 ? 'opacity-50' : ''}`}
                                                        onClick={() => dispatch(onUseDomainSpell(item.Link))}
                                                        disabled={remaining <= 0}
                                                    >
                                                        <span className='material-symbols-outlined'>wand_stars</span>
                                                    </button>
                                                    <label className='level-text'>{remaining}</label>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={`${i === 0 ? 'first' : ''} col-auto`}>
                                            <button
                                                className="button-link spell-table-cell-name"
                                                onClick={() => dispatch(addCardByLink({ links: item.Link, bonus: 0 }))}
                                            >
                                                {item.Name}
                                            </button>
                                            {showShortDescriptions && item['Short Description'] && (
                                                <div className="spell-table-cell-desc">
                                                    {item['Short Description']}
                                                </div>
                                            )}
                                        </td>
                                        {!isMobile() && (
                                            <td className={`${i === 0 ? 'first' : ''} col-30`}>
                                                {item.School.split(' ')[0]}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                );
            })}
        </>
    );
}

DomainSpells.propTypes = {
    preparedByLevel: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.shape({
        spell: PropTypes.object.isRequired,
        Prepared: PropTypes.number.isRequired,
        Used: PropTypes.number.isRequired
    }))).isRequired,
    preparedLevels: PropTypes.arrayOf(PropTypes.number).isRequired,
    dispatch: PropTypes.func.isRequired,
    showShortDescriptions: PropTypes.bool.isRequired,
};
