import PropTypes from 'prop-types';
import { isMobile } from '../../lib/utils';
import { addCardByLink } from '../../store/slices/appSlice';
import { onUseDomainSpell } from '../../store/thunks/spellbookThunks';

export default function DomainSpells({ domainByLevel, domainLevels, usedDomain, dispatch }) {
    if (domainLevels.length === 0) return null;

    const getRemaining = lvl => {
        return Math.max(0, 1 - usedDomain[lvl]);
    };

    return (
        <>
            {domainLevels.map(lvl => (
                <table key={lvl} className="spellbook-table">
                    <thead>
                        <tr>
                            <th style={{ width: 'var(--btn-width-sm)' }}></th>
                            <th style={{ fontSize: "small", width: "auto", textAlign: "left" }}>Domain spells</th>
                            {!isMobile() && (<th style={{ width: "30%" }}></th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {domainByLevel[lvl].map((item, i) => (
                            <tr key={i}>

                                <td className={i === 0 ? 'first' : ''} style={{ width: 'var(--btn-width-sm)', maxWidth: 'calc(var(--btn-width-sm)*1.4)', paddingRight: 0 }}>
                                    <div className='card-side-div'>
                                        <div className='spell-slot-div2'>
                                            <button
                                                className={`item-number-button smaller ${getRemaining(lvl) <= 0 ? 'opacity-50' : ''}`}
                                                onClick={() => dispatch(onUseDomainSpell(lvl))}
                                                disabled={getRemaining(lvl) <= 0}
                                            >
                                                <span className='material-symbols-outlined'>wand_stars</span>
                                            </button>
                                            <label className='level-text'>{getRemaining(lvl)}</label>
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

DomainSpells.propTypes = {
    domainByLevel: PropTypes.objectOf(PropTypes.array).isRequired,
    domainLevels: PropTypes.arrayOf(PropTypes.number).isRequired,
    usedDomain: PropTypes.arrayOf(PropTypes.number).isRequired,
    dispatch: PropTypes.func.isRequired,
};
