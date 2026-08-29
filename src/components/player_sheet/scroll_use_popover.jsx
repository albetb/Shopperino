import { useDispatch } from 'react-redux';
import BottomSheet from '../common/BottomSheet';
import Button from '../common/Button';
import Icon from '../common/Icon';
import Pill from '../common/Pill';
import SpellLink from '../common/spell_link';
import { onUseScroll } from '../../store/thunks/playerSheetThunks';
import '../../style/scrolls.css';

/**
 * The box that opens when a scroll's **read** button is pressed.
 *
 * It confirms, and it explains. There is no roll to make and no target to
 * pick, because a scroll casts its spell as written and what the spell then
 * does happens at the table, not on this page — so the box's job is to put
 * the spell in front of the reader before they spend it, and to say plainly
 * when they are not entitled to read it.
 *
 * **The warning is the reason this box is not a one-line confirm.** The row's
 * pill says only *that* something is wrong; here it says which of the two
 * spell-completion conditions failed, and what the Use Magic Device check
 * would be — `20 + caster level`, which is the scroll's number and not the
 * flat 20 a wand asks for.
 */
export default function ScrollUsePopover({ scroll, onClose }) {
  const dispatch = useDispatch();
  if (!scroll) return null;

  const confirm = () => {
    dispatch(onUseScroll(scroll.ref));
    onClose();
  };

  return (
    <BottomSheet open onClose={onClose} title={scroll.spellName} eyebrow={`${scroll.source} scroll`}>
      <div className="scroll-use">
        <p className="scroll-use-desc">{scroll.description}</p>

        <div className="scroll-use-meta">
          <Pill tone="ghost">Level {scroll.spellLevel}</Pill>
          {scroll.casterLevel > 0 && <Pill tone="ghost">CL {scroll.casterLevel}</Pill>}
          {scroll.number > 1 && <Pill tone="ghost">{scroll.number} carried</Pill>}
        </div>

        {/* The spell's own page, one tap away — everything this box does not
            repeat (range, duration, the full text) lives there. */}
        <div className="scroll-use-link">
          <Icon name="menu_book" size={16} />
          <SpellLink link={`spells#${scroll.link}`}>Open {scroll.spellName}</SpellLink>
        </div>

        {scroll.school && (
          <div className="scroll-use-note">
            <Icon name="auto_stories" size={16} />
            <span>{scroll.school}</span>
          </div>
        )}

        {/* Said in full here, because this is where the player decides. Each
            failed condition gets its own line: a scroll can be both off your
            list and above your level, and "you can't read this" would leave
            the player guessing which. */}
        {!scroll.usable && (
          <div className="sh-warn-strip scroll-use-warn">
            <Icon name="warning" size={16} />
            <div className="scroll-use-warn-body">
              <strong>Reading this is beyond you.</strong>
              <ul className="scroll-use-reasons">
                {scroll.reasons.map((reason) => <li key={reason}>{reason}</li>)}
              </ul>
              <span>
                A scroll is spell completion, so both must hold. You can still try
                with Use Magic Device, DC {scroll.umdDC} — failing it by 10 or more
                is a mishap.
              </span>
            </div>
          </div>
        )}

        {/* The button stays live either way. The sheet reports, the table
            rules — the same bargain every other over-limit input on this page
            makes. */}
        <div className="scroll-use-actions">
          <Button variant="ghost" icon="close" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon="draw" onClick={confirm}>Read</Button>
        </div>
      </div>
    </BottomSheet>
  );
}
