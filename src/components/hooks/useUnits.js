import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectUnits } from '../../store/slices/appSlice';
import {
  formatDistance,
  formatWeight,
  convertUnitsInText,
  convertUnitsInHtml,
} from '../../lib/units';

/**
 * The reader's chosen units, and the four formatters bound to them.
 *
 * Two shapes of call site, and they are different jobs:
 *
 * - `distance` / `weight` take a **number** the model computed, in the
 *   canonical units the model works in — feet and kilograms — and say it in
 *   words. This is the speeds, the ranges and the carrying capacity.
 * - `text` / `prose` take a **string** that already has units written into it,
 *   and rewrite the measurements inside it. This is every description in
 *   src/data, and also the handful of sentences the models compose themselves
 *   (a monster's full speed line, a trap's board caption). Rewriting them at
 *   render rather than converting the data keeps one source of truth and
 *   leaves every `Link` / `ref` slug alone.
 *
 * `prose` is the one for HTML and leaves tags untouched; `text` is for plain
 * strings.
 */
export function useUnits() {
  const units = useSelector(selectUnits);
  return useMemo(() => ({
    units,
    distance: (feet, opts) => formatDistance(feet, units, opts),
    weight: (kg) => formatWeight(kg, units),
    text: (value) => convertUnitsInText(value, units),
    prose: (html) => convertUnitsInHtml(html, units),
  }), [units]);
}

export default useUnits;
