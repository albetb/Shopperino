import { t, tx, tName } from './index';

/**
 * A breakdown label, in the reading language.
 *
 * The stat breakdown is built in the model, and the model must not read the
 * current language — a Player that answers differently depending on a global
 * is a Player whose numbers cannot be tested. So it composes labels as *data*
 * (see `named` and `asLabel` in lib/player/contributions.js) and this turns
 * that data into a sentence, at render, in the component layer.
 *
 * Three shapes, matching the three the model may emit:
 *
 *   'base score'                       →  t('base score')
 *   named('classes', 'Fighter')        →  tName('classes', 'Fighter')
 *   ['{0} base save', named('classes', 'Fighter')]
 *                                      →  tx('{0} base save', 'Guerriero')
 *
 * Why a template rather than the finished English string: "Fighter base save"
 * is not a key a pack could hold — there is one per class, and per size, and
 * per race — whereas `'{0} base save'` is one key, and Italian is free to put
 * the halves in the other order (*base da Guerriero*).
 *
 * A number inside a template is left alone; a plain string is translated,
 * because that is the shape the fixed words of a sentence arrive in.
 */
function part(value) {
  if (value && typeof value === 'object' && typeof value.domain === 'string') {
    return tName(value.domain, value.en);
  }
  return typeof value === 'string' ? t(value) : value;
}

export default function resolveLabel(label) {
  if (Array.isArray(label)) {
    const [template, ...values] = label;
    return tx(String(template ?? ''), ...values.map(part));
  }
  return part(label);
}
