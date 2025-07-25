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

  if (!lootName) return null;

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
        <div className="money-box">
          <h4><b>Gold: {formatNumber(gold)}</b></h4>
        </div>
      </div>

      {/* Goods Table */}
      {goodsList.length > 0 &&

        <table className="shop-table" style={{ marginBottom: "0.5rem" }}>
          <thead>
            <tr>
              <th className="number-size" style={{ color: "#c0c0c0" }}>#</th>
              <th className="name-size" style={{ color: "#c0c0c0" }}>Goods</th>
              <th className="cost-size" style={{ color: "#c0c0c0" }}>Cost</th>
            </tr>
          </thead>
          <tbody>
            {goodsList.map((g, idx) => (
              <tr key={idx}>
                <td className="align-right" style={{ color: "#c0c0c0" }}>{g.Quantity ?? '1'}</td>
                <td style={{ color: "#c0c0c0" }}>
                  {g.Name}
                </td>
                <td style={{ color: "#c0c0c0" }}>{formatNumber(g.Cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }

      {/* Items Table */}
      {itemsList.filter(x => x).length > 0 &&

        <table className="shop-table">
          <thead>
            <tr>
              <th className="number-size" style={{ color: "#c0c0c0" }}>#</th>
              <th className="name-size" style={{ color: "#c0c0c0" }}>Items</th>
              <th className="cost-size" style={{ color: "#c0c0c0" }}>Cost</th>
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
                <tr>
                  <td className="align-right" style={{ color: "#c0c0c0" }}>{item.Quantity ?? 1}</td>
                  <td>
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
                  <td style={{ color: "#c0c0c0" }}>{formatNumber(item.Cost)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      }
    </>
  );
}
