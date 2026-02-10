import { useDispatch, useSelector } from 'react-redux';
import '../../style/shop_inventory.css';
import { setStateCurrentTab, setMasterMode } from '../../store/slices/appSlice';
import { isMobile } from '../../lib/utils';

export default function MainPage() {
  const dispatch = useDispatch();
  const isMasterMode = useSelector(state => state.app.isMasterMode);

  const handleShopClick = () => dispatch(setStateCurrentTab(1));
  const handleSpellbookClick = () => dispatch(setStateCurrentTab(2));
  const handleLootClick = () => dispatch(setStateCurrentTab(3));
  const handleSearchClick = () => dispatch(setStateCurrentTab(4));

  const isMobileNow = isMobile();
  const ww = isMobileNow ? "80%" : "20%";
  const plr = isMobileNow ? "5%" : "3%";
  const pp = isMobileNow ? "2%" : "1%";

  return (
    <>
      <h1>Welcome to Shopperino!</h1>

      <p style={{ color: "#f9f9f9", width: "90%", textAlign: "center" }}>A collection of tools for Dungeons and Dragons 3.5</p>

      <div className="master-player-toggle" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
        <span className={isMasterMode ? 'master-player-label active' : 'master-player-label'} onClick={() => dispatch(setMasterMode(true))}>Master</span>
        <span className={!isMasterMode ? 'master-player-label active' : 'master-player-label'} onClick={() => dispatch(setMasterMode(false))}>Player</span>
      </div>

      <div className="card" style={{ width: ww, padding: pp, paddingLeft: plr, paddingRight: plr, cursor: "pointer" }} onClick={handleSearchClick}>
        <p style={{ textShadow: "1px 1px #0d0d0d1a" }}><b>Search</b></p>
        <span className="material-symbols-outlined" style={{ color: "#0d0d0d" }}>search</span>
        <p style={{ textAlign: "center" }}>Search and browse spells, items, feats and skills in one place.</p>
      </div>

      {isMasterMode && (
      <div className="card" style={{ width: ww, padding: pp, paddingLeft: plr, paddingRight: plr, cursor: "pointer" }} onClick={handleShopClick}>
        <p style={{ textShadow: "1px 1px #0d0d0d1a" }}><b>Shop generator</b></p>
        <span className="material-symbols-outlined" style={{ color: "#0d0d0d" }}>shopping_cart</span>
        <p style={{ textAlign: "center" }}>Generates randomized shops whose inventory dynamically scales to the player’s level.</p>
      </div>
      )}

      <div className="card" style={{ width: ww, padding: pp, paddingLeft: plr, paddingRight: plr, cursor: "pointer" }} onClick={handleSpellbookClick}>
        <p style={{ textShadow: "1px 1px #0d0d0d1a" }}><b>Spellbook</b></p>
        <span className="material-symbols-outlined" style={{ color: "#0d0d0d" }}>menu_book</span>
        <p style={{ textAlign: "center" }}>A spellbook that lets players organize and track their learned spells.</p>
      </div>

      {isMasterMode && (
      <div className="card" style={{ width: ww, padding: pp, paddingLeft: plr, paddingRight: plr, cursor: "pointer" }} onClick={handleLootClick}>
        <p style={{ textShadow: "1px 1px #0d0d0d1a" }}><b>Loot generator</b></p>
        <span className="material-symbols-outlined" style={{ color: "#0d0d0d" }}>money_bag</span>
        <p style={{ textAlign: "center" }}>Generates randomized loot tailored to the player’s level, including gold, goods, and magic items.</p>
      </div>
      )}

      <p style={{ color: "#f9f9f9", width: "90%", textAlign: "center" }}>
        If you encounter any bugs or inaccurate descriptions, please report them on our{" "}
        <a href="https://github.com/albetb/Shopperino/issues" target="_blank" rel="noopener noreferrer" style={{ color: "#f9f9f9", textDecoration: "underline" }}>
          GitHub issues page
        </a>.
      </p>
    </>
  );
}
