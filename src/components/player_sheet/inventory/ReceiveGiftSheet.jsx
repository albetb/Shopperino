import { useDispatch, useSelector } from 'react-redux';
import { clearIncomingGift } from '../../../store/slices/appSlice';
import { onAcceptGift } from '../../../store/thunks/playerSheetThunks';
import displayItemName from '../../../lib/item/displayItemName';
import { t, tx, tName } from '../../../lib/i18n';
import BottomSheet from '../../common/BottomSheet';
import Button from '../../common/Button';
import '../../../style/shared_shop.css';

/**
 * What another player is holding out, and the two answers to it.
 *
 * It opens over the bag rather than adding anything to it: a code can be
 * scanned by mistake, or read off a screen across the table that was meant for
 * somebody else, and an item that arrives without being agreed to is harder to
 * undo than one that has to be accepted.
 *
 * Which character is being offered it was settled before this ever rendered —
 * `onReceiveGift` opens the sheet on the character whose page was in front of
 * the reader, or the last one this phone was used for.
 */
export default function ReceiveGiftSheet() {
  const dispatch = useDispatch();
  const gift = useSelector((state) => state.app?.incomingGift);
  const characterName = useSelector((state) => state.playerSheet?.player?.getName?.() ?? '');

  if (!gift) return null;

  const name = displayItemName(gift.overrides?.Name ?? gift.name, {
    masterwork: gift.masterwork,
    bonus: gift.bonus,
    effectIds: gift.effectIds,
  });

  return (
    <BottomSheet
      open
      onClose={() => dispatch(clearIncomingGift())}
      eyebrow={t('Offered to you')}
      title={characterName ? tx('{0} is being given something', characterName) : t('An item is being given')}
    >
      <div className="incoming-gift">
        <p className="incoming-gift-item">
          <b>{name}</b>
          <span className="incoming-gift-note">
            {tx('{0} × {1}', tName('itemTypes', gift.type), gift.number)}
          </span>
        </p>
        <p className="incoming-gift-hint">
          {t('Accepting puts it in the bag.')}
        </p>
        <div className="incoming-gift-actions">
          <Button block variant="ghost" onClick={() => dispatch(clearIncomingGift())}>
            {t('Decline')}
          </Button>
          <Button block variant="primary" icon="backpack" onClick={() => dispatch(onAcceptGift())}>
            {t('Accept')}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
