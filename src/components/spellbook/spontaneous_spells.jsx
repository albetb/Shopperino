import PropTypes from 'prop-types';
import { isMobile } from '../../lib/utils';
import { addCardByLink } from '../../store/slices/appSlice';
import { StarOrbitCast } from './row_actions';

export default function SpontaneousSpells({
    spontaneousByLevel,
    spontaneousLevels,
    dispatch,
    showShortDescriptions,
    getRemaining,
    totalForLevel = 0,
    onUseSpell,
}) {
    if (spontaneousLevels.length === 0) return null;

    return (
        <>
            {spontaneousLevels.map(lvl => (
                <table key={lvl} className="spellbook-table">
                    <thead>
                        <tr>
                            <th className="dark-grey col-btn-sm"></th>
                            <th className="dark-grey spell-table-header-title">Spontaneous spells</th>
                            {!isMobile() && (<th className="dark-grey col-30"></th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {spontaneousByLevel[lvl].map((item, i) => {
                            const remaining = getRemaining ? getRemaining(item.Link) : 0;
                            return (
                                <tr key={i}>
                                    <td className={`${i === 0 ? 'first' : ''} col-btn-sm-max action-cell`}>
                                        <StarOrbitCast
                                            remaining={remaining}
                                            total={totalForLevel}
                                            onClick={() => onUseSpell?.(item.Link)}
                                        />
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
            ))}
        </>
    );
}

SpontaneousSpells.propTypes = {
    spontaneousByLevel: PropTypes.objectOf(PropTypes.array).isRequired,
    spontaneousLevels: PropTypes.arrayOf(PropTypes.number).isRequired,
    dispatch: PropTypes.func.isRequired,
    showShortDescriptions: PropTypes.bool.isRequired,
    getRemaining: PropTypes.func,
    totalForLevel: PropTypes.number,
    onUseSpell: PropTypes.func,
};
