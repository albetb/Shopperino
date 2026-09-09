import { useCallback } from 'react';
import { tx } from 'lib/i18n';
import { isMobile, trimLine } from 'lib/utils';

/**
 * Returns label formatters for shop and city, trimmed for mobile/desktop.
 */
export function useShopLabels(shopName, cityName) {
  const shopLabel = useCallback(
    () => trimLine(shopName || '', isMobile() ? 20 : 30),
    [shopName]
  );
  const cityLabel = useCallback(
    () => (cityName
      ? tx('from {0}', trimLine(cityName, isMobile() ? 26 : 40))
      : ''),
    [cityName]
  );
  return { shopLabel, cityLabel };
}
