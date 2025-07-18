import PropTypes from 'prop-types';
import { isMobile } from '../../lib/utils';
import { addCardByLink } from '../../store/slices/appSlice';

export default function SpontaneousSpells({ spontaneousByLevel, spontaneousLevels, dispatch }) {
    if (spontaneousLevels.length === 0) return null;

    return (
        <>
            {spontaneousLevels.map(lvl => (
                <table key={lvl} className="spellbook-table">
                    <thead>
                        <tr>
                            <th className="dark-grey" style={{ width: 'var(--btn-width-sm)' }}></th>
                            <th className="dark-grey" style={{ fontSize: "small", width: "auto", textAlign: "left" }}>Spontaneous spells</th>
                            {!isMobile() && (<th className="dark-grey" style={{ width: "30%" }}></th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {spontaneousByLevel[lvl].map((item, i) => (
                            <tr key={i}>


                                <td className={i === 0 ? 'first' : ''} style={{ width: 'var(--btn-width-sm)', maxWidth: 'calc(var(--btn-width-sm)*1.4)', paddingRight: 0 }}>
                                    <div className='card-side-div'>
                                        <div className='spell-slot-div2' style={{ justifyContent: "center" }}>
                                            <span className='material-symbols-outlined'>wand_stars</span>
                                        </div>
                                    </div>
                                </td>

                                <td className={i === 0 ? 'first' : ''} style={{ width: 'auto' }}>
                                    <button
                                        className="button-link"
                                        style={{ color: 'var(--black)' }}
                                        onClick={() => dispatch(addCardByLink({ links: item.Link, bonus: 0 }))}
                                    >
                                        {item.Name}
                                    </button>
                                </td>
                                {!isMobile() && (
                                    <td className={i === 0 ? 'first' : ''} style={{ width: '30%', fontSize: 'small' }}>
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
};
