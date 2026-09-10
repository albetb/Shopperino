/**
 * Handing an effect to another player, by QR code.
 *
 * The same shape as the item code beside it, and for the same reason: the two
 * phones never talk, so the code on the screen carries everything the other
 * sheet needs. For an effect that is very little — the id of a row in
 * `lib/player/sharedEffects.js`, the size the sharer's own level gave it, the
 * skill it was pointed at, and whose it is. The arithmetic is not sent because
 * both phones already hold the same table, and no word of it is sent because
 * each phone names it in its own language.
 *
 * Unlike an item, an effect is not *lost* by being given: a bard singing to
 * four allies hands out the same code four times and keeps nothing back. So
 * there is no "keep or give" at this end — only a code, and whoever reads it.
 */
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { SHARED_EFFECTS, makeSharedEffect } from '../player/sharedEffects';

/* Its own prefix beside the item code's `gift1:`, so the reader can tell the
   two apart before it tries to understand either. */
export const EFFECT_PREFIX = 'buff1:';

/** Whether a scanned string claims to be an effect at all. */
export function isEffectSharePayload(text) {
  return typeof text === 'string' && text.trim().startsWith(EFFECT_PREFIX);
}

/**
 * The string that goes into the QR image.
 *
 * @param {{id: string, bonus?: number, skill?: string, from?: string}} effect
 */
export function encodeEffectShare(effect) {
  const entry = makeSharedEffect(effect?.id, effect || {});
  if (!entry) return { ok: false, error: 'Nothing to share' };
  const compact = { i: entry.id };
  if (entry.bonus) compact.n = entry.bonus;
  if (entry.skill) compact.s = entry.skill;
  if (entry.from) compact.f = entry.from;
  const body = compressToEncodedURIComponent(JSON.stringify(compact));
  if (!body) return { ok: false, error: 'Could not build the code' };
  return { ok: true, payload: `${EFFECT_PREFIX}${body}` };
}

/**
 * Read a scanned effect back.
 *
 * An id this build does not know is refused rather than carried as an inert
 * entry: a code from a newer version of the app should say so, not appear on
 * the sheet as an effect that does nothing.
 */
export function parseEffectShare(text) {
  if (!isEffectSharePayload(text)) return { ok: false, error: 'Not an effect code' };
  const body = text.trim().slice(EFFECT_PREFIX.length);
  let compact = null;
  try {
    const json = decompressFromEncodedURIComponent(body);
    compact = json ? JSON.parse(json) : null;
  } catch (_) {
    compact = null;
  }
  if (!compact || typeof compact !== 'object' || !SHARED_EFFECTS[compact.i]) {
    return { ok: false, error: 'Invalid or corrupted data' };
  }
  return {
    ok: true,
    effect: makeSharedEffect(compact.i, {
      bonus: compact.n,
      skill: compact.s ? String(compact.s) : '',
      from: compact.f ? String(compact.f) : '',
    }),
  };
}
