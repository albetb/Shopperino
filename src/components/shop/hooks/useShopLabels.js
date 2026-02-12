import { useCallback } from 'react';
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
    () => (cityName ? `from ${trimLine(cityName, isMobile() ? 26 : 40)}` : ''),
    [cityName]
  );
  return { shopLabel, cityLabel };
}
