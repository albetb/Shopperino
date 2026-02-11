import { useDispatch, useSelector } from 'react-redux';
import Loot from '../../lib/loot';
import { isMobile, trimLine } from '../../lib/utils';
import { addCardByLink } from '../../store/slices/appSlice';
import '../../style/shop_inventory.css';

export default function LootInventory() {
  const dispatch = useDispatch();
  const rawLoot = useSelector(state => state.loot.loot);
  const lootInst = rawLoot ? new Loot().load(rawLoot) : null;
  const lootName = rawLoot?.Timestamp || '';
  const gold = rawLoot?.Gold ?? 0;
  const goodsObj = lootInst?.Goods || {};
  const goodsList = goodsObj.gems || goodsObj.art || [];
  const itemsList = lootInst?.Items?.items || [];
  const goodsValue = goodsList.map(x => x.Cost).reduce((sum, cost) => sum + cost, 0);

  if (!lootName) {
    return (
      <p className="search-hint">
        Select players level and generate a loot.
      </p>
    );
  }

  const formatNumber = num => {
    const n = parseFloat(num);
    if (isNaN(n)) return '0';
    let [intPart, decPart] = n.toFixed(2).split('.');
    const sep = "'";
    const rev = intPart.split('').reverse().join('');
    const fmtInt = rev.match(/.{1,3}/g).join(sep).split('').reverse().join('');
    return `${fmtInt}.${decPart}`.replace('.00', '');
  };

  const timeLabel = () => trimLine(lootName, isMobile() ? 20 : 30);

  return (
    <>
      <div className="header-container">
        <div className="label-container">
          <h2>Generated at {timeLabel()}</h2>
        </div>
        <div className="money-box money-box-column">
          <h4 className="loot-gold-margin"><b>Gold: {formatNumber(gold)}gp</b></h4>
          {goodsList.length > 0 &&
            <h2 className="loot-gold-margin">+ goods {formatNumber(goodsValue)}gp</h2>
          }
        </div>
      </div>

      {/* Goods Table */}
      {goodsList.length > 0 &&

        <table className="shop-table table-margin-sm">
          <thead>
            <tr>
              <th className="number-size td-muted">#</th>
              <th className="name-size td-muted">Goods</th>
              <th className="cost-size td-muted">Cost</th>
            </tr>
          </thead>
          <tbody>
            {goodsList.map((g, idx) => (
              <tr key={idx}>
                <td className="align-right td-muted">{g.Quantity ?? '1'}</td>
                <td className="td-muted">{g.Name}</td>
                <td className="td-muted">{formatNumber(g.Cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }

      {/* Items Table */}
      {itemsList.filter(x => x && x.Name).length > 0 &&

        <table className="shop-table table-margin-sm">
          <thead>
            <tr>
              <th className="number-size td-muted">#</th>
              <th className="name-size td-muted">Items</th>
              <th className="cost-size td-muted">Cost</th>
            </tr>
          </thead>
          <tbody>
            {itemsList.map((item, idx) => {
              if (!item?.Name || (item.Quantity ?? 1) <= 0) return null;
              const itemBonus = item.Name.includes("+")
                ? parseInt(item.Name.split("+")[1], 10)
                : item.Name.toLowerCase().includes("perfect")
                  ? -1
                  : 0;

              return (
                <tr key={idx}>
                  <td className="align-right td-muted">{item.Quantity ?? 1}</td>
                  <td className="td-muted">
                    {item.Link ? (
                      <button
                        type="button"
                        className="button-link"
                        onClick={() => dispatch(addCardByLink({ links: item.Link, bonus: itemBonus }))}
                      >
                        {item.Name}
                      </button>
                    ) : (
                      item.Name
                    )}
                  </td>
                  <td className="td-muted">{formatNumber(item.Cost)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      }
    </>
  );
}
