import PropTypes from 'prop-types';
import { isMobile } from '../../lib/utils';
import { addCardByLink } from '../../store/slices/appSlice';

export default function SpontaneousSpells({ spontaneousByLevel, spontaneousLevels, dispatch, showShortDescriptions }) {
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
                        {spontaneousByLevel[lvl].map((item, i) => (
                            <tr key={i}>


                                <td className={`${i === 0 ? 'first' : ''} col-btn-sm-max`}>
                                    <div className='card-side-div'>
                                        <div className='spell-slot-div2 justify-center'>
                                            <span className='material-symbols-outlined'>wand_stars</span>
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
                        ))}
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
};
