import { useState } from 'react';
import { useSelector } from 'react-redux';
import Card from '../common/Card';
import Pill from '../common/Pill';
import Button from '../common/Button';
import Icon from '../common/Icon';
import SpellLink from '../common/spell_link';
import useCardCollapse from './hooks/useCardCollapse';
import ScrollUsePopover from './scroll_use_popover';
import '../../style/scrolls.css';

/**
 * The scrolls in the bag, on the combat page beside the potions card.
 *
 * A scroll is a potion's sibling in every way that matters to this page — it
 * is carried rather than worn, it is spent once, and reading one is a thing a
 * character *does* on their turn — so it gets the same quiet row: a use
 * button, the spell's name, and the count.
 *
 * What it adds is the **gate**. A scroll is activated by spell completion,
 * which asks both whether the spell is on your class list and whether you can
 * already cast spells of that level. When the answer is no the row carries a
 * small warning pill rather than a sentence, because the full explanation
 * belongs in the box that opens — a bag of nine scrolls would otherwise be
 * nine paragraphs.
 *
 * Never blocked. The button reads the scroll either way, per the project's
 * rule of computing without enforcing: a rogue with Use Magic Device really
 * can read a wizard's scroll, and the sheet is not the table.
 */
export default function ScrollsCard() {
  const player = useSelector((state) => state.playerSheet?.player);
  const [collapsed, toggle] = useCardCollapse('scrolls', 'scrolls');
  const [using, setUsing] = useState(null);

  const scrolls = player?.getCarriedScrolls?.() ?? [];
  if (scrolls.length === 0) return null;

  return (
    <>
      <Card
        title="Scrolls"
        className="sh-card--head-spread"
        onHeadClick={() => toggle.props.onClick()}
        action={toggle}
      >
        {!collapsed && (
          <div className="scrolls-list">
            {scrolls.map((scroll) => (
              <div className="scroll-row" key={scroll.ref}>
                <Button
                  variant="ghost"
                  size="sm"
                  icon="draw"
                  onClick={() => setUsing(scroll)}
                  aria-label={`Read ${scroll.name}`}
                >
                  Read
                </Button>
                <span className="scroll-row-name">
                  <span className="scroll-row-title">
                    <SpellLink link={`spells#${scroll.link}`}>
                      <span className="sh-display">{scroll.spellName}</span>
                    </SpellLink>
                    {/* Small, and only when there is something to say. The
                        reason itself is in the box — this is the flag. */}
                    {!scroll.usable && (
                      <span
                        className="scroll-row-warn"
                        title={scroll.reason}
                        aria-label={`Cannot read unaided: ${scroll.reason}`}
                      >
                        <Icon name="warning" size={12} />
                        Can’t read
                      </span>
                    )}
                  </span>
                  <span className="sh-faint scroll-row-desc">{scroll.description}</span>
                </span>
                {/* The source and level are what tell two same-named scrolls
                    apart, so they sit on the row rather than only in the box. */}
                <Pill tone="ghost">{scroll.source[0]}{scroll.spellLevel}</Pill>
                <Pill tone={scroll.number > 1 ? 'accent' : 'ghost'}>{scroll.number}</Pill>
              </div>
            ))}
          </div>
        )}
      </Card>

      {using && (
        <ScrollUsePopover scroll={using} onClose={() => setUsing(null)} />
      )}
    </>
  );
}
