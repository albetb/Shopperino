import { useDispatch } from 'react-redux';
import '../../style/shop_inventory.css';
import { setStateCurrentTab } from '../../store/slices/appSlice';
import { isMobile } from '../../lib/utils';

export default function MainPage() {
  const dispatch = useDispatch();

  const handleShopClick = () => dispatch(setStateCurrentTab(1));;
  const handleSpellbookClick = () => dispatch(setStateCurrentTab(2));

  const isMobileNow = isMobile();
  const ww = isMobileNow ? "80%" : "20%";
  const plr = isMobileNow ? "5%" : "3%";
  const pp = isMobileNow ? "2%" : "1%";

  return (
    <>
      <h1>Welcome to Shopperino!</h1>

      <p style={{ color: "#f9f9f9", width: "90%", textAlign: "center" }}>A collection of tools for Dungeons and Dragons 3.5</p>

      <div className="card" style={{ width: ww, padding: pp, paddingLeft: plr, paddingRight: plr, cursor: "pointer" }} onClick={handleShopClick}>
        <p style={{ textShadow: "1px 1px #0d0d0d1a" }}><b>Shop generator</b></p>
        <span className="material-symbols-outlined" style={{ color: "#0d0d0d" }}>shopping_cart</span>
        <p style={{ textAlign: "center" }}>Generates randomized shops whose inventory dynamically scales to the player’s level.</p>
      </div>

      <div className="card" style={{ width: ww, padding: pp, paddingLeft: plr, paddingRight: plr, cursor: "pointer" }} onClick={handleSpellbookClick}>
        <p style={{ textShadow: "1px 1px #0d0d0d1a" }}><b>Spellbook</b><sup>BETA</sup></p>
        <span className="material-symbols-outlined" style={{ color: "#0d0d0d" }}>menu_book</span>
        <p style={{ textAlign: "center" }}>A spellbook that lets players organize and track their learned spells.</p>
      </div>

      <p style={{ color: "#f9f9f9", width: "90%", textAlign: "center" }}>
        If you encounter any bugs or inaccurate descriptions, please report them on our{" "}
        <a href="https://github.com/albetb/Shopperino/issues" target="_blank" rel="noopener noreferrer" style={{ color: "#f9f9f9", textDecoration: "underline" }}>
          GitHub issues page
        </a>.
      </p>
    </>
  );
}
