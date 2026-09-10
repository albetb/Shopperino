import { useDispatch, useSelector } from 'react-redux';
import { clearIncomingEffect } from '../../store/slices/appSlice';
import { onAcceptEffect } from '../../store/thunks/playerSheetThunks';
import { resolveSharedEffect } from '../../lib/player/sharedEffects';
import resolveLabel from '../../lib/i18n/resolveLabel';
import { t, tx, tName } from '../../lib/i18n';
import BottomSheet from '../common/BottomSheet';
import Button from '../common/Button';
import '../../style/shared_shop.css';

/**
 * An effect somebody is running on this character, waiting to be taken.
 *
 * The same question the received item asks, and asked for the same reason: a
 * code can be scanned by mistake, or read off a screen across the table that
 * was meant for the person sitting next to you. Accepting is what puts it
 * among the conditions and into the numbers.
 */
export default function ReceiveEffectSheet() {
  const dispatch = useDispatch();
  const offered = useSelector((state) => state.app?.incomingEffect);
  const characterName = useSelector((state) => state.playerSheet?.player?.getName?.() ?? '');

  const effect = offered ? resolveSharedEffect(offered) : null;
  if (!effect) return null;

  return (
    <BottomSheet
      open
      onClose={() => dispatch(clearIncomingEffect())}
      eyebrow={t('Offered to you')}
      title={characterName
        ? tx('{0} is being offered an effect', characterName)
        : t('An effect is being offered')}
    >
      <div className="incoming-gift">
        <p className="incoming-gift-item">
          <b>{tName('classFeatures', effect.name)}</b>
          <span className="incoming-gift-note">
            {effect.from
              ? tx('{0} · from {1}', tName('classFeatures', effect.feature), effect.from)
              : tName('classFeatures', effect.feature)}
          </span>
        </p>
        <p className="incoming-gift-hint">{resolveLabel(effect.summary)}</p>
        <p className="incoming-gift-hint">
          {t('Accepting applies it to your numbers until you take it off or rest.')}
        </p>
        <div className="incoming-gift-actions">
          <Button block variant="ghost" onClick={() => dispatch(clearIncomingEffect())}>
            {t('Decline')}
          </Button>
          <Button block variant="primary" icon="music_note" onClick={() => dispatch(onAcceptEffect())}>
            {t('Accept')}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
