import { useDispatch, useSelector } from 'react-redux';
import '../../style/shop_inventory.css';
import { setStateCurrentTab, setMasterMode } from '../../store/slices/appSlice';
export default function MainPage() {
  const dispatch = useDispatch();
  const isMasterMode = useSelector(state => state.app.isMasterMode);

  const handleShopClick = () => dispatch(setStateCurrentTab(1));
  const handleSpellbookClick = () => dispatch(setStateCurrentTab(2));
  const handleLootClick = () => dispatch(setStateCurrentTab(3));
  const handleSearchClick = () => dispatch(setStateCurrentTab(4));

  return (
    <div className="main-page">
      <h1>Welcome to Shopperino!</h1>

      <p className="main-intro">A collection of tools for Dungeons & Dragons 3.5</p>

      <div className="master-player-toggle margin-v-1">
        <span className={isMasterMode ? 'master-player-label active' : 'master-player-label'} onClick={() => dispatch(setMasterMode(true))}>Master</span>
        <span className={!isMasterMode ? 'master-player-label active' : 'master-player-label'} onClick={() => dispatch(setMasterMode(false))}>Player</span>
      </div>

      <div className="card" onClick={handleSearchClick}>
        <p className="card-title-shadow"><b>Search</b></p>
        <span className="material-symbols-outlined card-icon-dark">search</span>
        <p className="text-center">Search and browse spells, items, feats and skills in one place.</p>
      </div>

      {isMasterMode && (
      <div className="card" onClick={handleShopClick}>
        <p className="card-title-shadow"><b>Shop generator</b></p>
        <span className="material-symbols-outlined card-icon-dark">shopping_cart</span>
        <p className="text-center">Generates randomized shops whose inventory dynamically scales to the player’s level.</p>
      </div>
      )}

      {isMasterMode && (
      <div className="card" onClick={handleLootClick}>
        <p className="card-title-shadow"><b>Loot generator</b></p>
        <span className="material-symbols-outlined card-icon-dark">money_bag</span>
        <p className="text-center">Generates randomized loot tailored to the player’s level, including gold, goods, and magic items.</p>
      </div>
      )}

      <div className="card" onClick={handleSpellbookClick}>
        <p className="card-title-shadow"><b>Spellbook</b></p>
        <span className="material-symbols-outlined card-icon-dark">menu_book</span>
        <p className="text-center">A spellbook that lets players organize and track their learned spells.</p>
      </div>

      <p className="main-intro">
        If you encounter any bugs or inaccurate descriptions, please report them on our{" "}
        <a href="https://github.com/albetb/Shopperino/issues" target="_blank" rel="noopener noreferrer" className="main-intro-link">
          GitHub issues page
        </a>.
      </p>
    </div>
  );
}
