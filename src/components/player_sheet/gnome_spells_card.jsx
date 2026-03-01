import { useDispatch, useSelector } from 'react-redux';
import { addCardByLink } from '../../store/slices/appSlice';
import { onPlayerUseGnomeSpell } from '../../store/thunks/playerSheetThunks';
import '../../style/menu_cards.css';
import '../../style/shop_inventory.css';

const GNOME_SPELLS = [
  { name: 'Speak with Animals', link: 'speak-with-animals', school: 'Divination', shortDesc: 'You can communicate with animals. Burrowing mammal only, duration 1 minute.' },
  { name: 'Dancing Lights', link: 'dancing-lights', school: 'Evocation', shortDesc: 'Creates torches or other lights.', requiresCha: true },
  { name: 'Ghost Sound', link: 'ghost-sound', school: 'Illusion', shortDesc: 'Figment sounds.', requiresCha: true },
  { name: 'Prestidigitation', link: 'prestidigitation', school: 'Universal', shortDesc: 'Performs minor tricks.', requiresCha: true },
];

export default function GnomeSpellsCard() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet.player);
  const gnomeSpellUses = player?.getGnomeSpellUses?.() ?? {};
  const chaMod = player?.getChaMod?.() ?? 0;
  const chaTotal = player?.getAbilityTotal?.('cha') ?? 10;
  const baseDC = 10 + chaMod;

  const openSpell = (link) => {
    dispatch(addCardByLink({ links: `spells#${link}` }));
  };

  const spellsToShow = GNOME_SPELLS.filter(
    (s) => !s.requiresCha || chaTotal >= 10
  );

  return (
    <div className="card card-width-spellbook">
      <div className="card-side-div card-expand-div">
        <h3 className="card-title">
          Gnome spells (1/day each) CD {baseDC} + spell level
        </h3>
      </div>
      <div className="card-content">
        <table className="spellbook-table">
          <tbody>
            {spellsToShow.map((spell, i) => {
              const used = gnomeSpellUses[spell.link] ?? 0;
              const remaining = Math.max(0, 1 - used);
              return (
              <tr key={spell.link}>
                <td className={`${i === 0 ? 'first' : ''} col-btn-sm-max`}>
                  <div className="card-side-div">
                    <div className="spell-slot-div2">
                      <button
                        type="button"
                        className={`flat-button smaller ${remaining <= 0 ? 'opacity-50' : ''}`}
                        onClick={() => dispatch(onPlayerUseGnomeSpell(spell.link))}
                        disabled={remaining <= 0}
                        title="Use (1/day)"
                      >
                        <span className="material-symbols-outlined">wand_stars</span>
                      </button>
                      <label className="level-text">{remaining}</label>
                    </div>
                  </div>
                </td>
                <td className={`${i === 0 ? 'first' : ''} col-auto`}>
                  <button
                    type="button"
                    className="button-link spell-table-cell-name"
                    onClick={() => openSpell(spell.link)}
                  >
                    {spell.name}
                  </button>
                  {spell.shortDesc && (
                    <div className="spell-table-cell-desc">
                      {spell.shortDesc}
                    </div>
                  )}
                </td>
                <td className={`${i === 0 ? 'first' : ''} col-30`}>
                  {spell.school}
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
