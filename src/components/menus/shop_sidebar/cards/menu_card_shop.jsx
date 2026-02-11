import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { compressShopForShare } from '../../../../lib/shopShare';
import { isMobile, order, shopTypes } from '../../../../lib/utils';
import {
  onCreateShop,
  updateShop
} from '../../../../store/slices/shopSlice';
import {
  onDeleteShop,
  onNewShop,
  onSelectShop
} from '../../../../store/thunks/shopThunks';
import CreateComponent from '../../../common/create_component';
import LevelComponent from '../../../common/level_component';
import SelectComponent from '../../../common/select_component';
import ShareShopModal from '../../../common/ShareShopModal';
import '../../../../style/menu_cards.css';
import { toggleSidebar } from '../../../../store/slices/appSlice';

export default function MenuCardShop() {
  const dispatch = useDispatch();
  const [isNewVisible, setIsNewVisible] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePayload, setSharePayload] = useState(null);

  // Redux state
  const shops = useSelector(state => state.city.city?.Shops.map(s => s.Name) || []);
  const selectedName = useSelector(state => state.city.city?.SelectedShop?.Name);
  const saved = order(shops, selectedName);
  const rawShop = useSelector(state => state.shop.shop);
  const shopGenerated = useSelector(state => state.shop.shopGenerated);

  const shopLevel = useSelector(state => state.shop.shop?.Level) ?? 0;
  const reputation = useSelector(state => state.shop.shop?.Reputation) ?? 0;
  const shopType = useSelector(state => state.shop.shop?.ShopType) ?? '';
  const types = shopTypes() || [];
  const canGenerate = useSelector(state => state.city.city) != null;

  // Handlers
  const showCreate = () => setIsNewVisible(true);
  const hideCreate = () => setIsNewVisible(false);
  const handleNew = name => dispatch(onNewShop(name));
  const handleSelect = name => dispatch(onSelectShop(name));
  const handleDelete = () => dispatch(onDeleteShop());
  const handleLevelChange = lvl => dispatch(updateShop(['setShopLevel', lvl]));
  const handleReputationChange = lvl => dispatch(updateShop(['setReputation', lvl]));
  const handleTypeChange = event => dispatch(updateShop(['setShopType', event.target.value]));
  const handleGenerate = () => {
    dispatch(onCreateShop());
    if (isMobile()) {
      dispatch(toggleSidebar());
    }
  };

  const handleShare = () => {
    const result = compressShopForShare(rawShop);
    if (!result.ok) {
      alert(result.error);
      return;
    }
    setSharePayload(result.payload);
    setShowShareModal(true);
    // Do not close sidebar here on mobile: closing would unmount this component and the modal would never show
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
    setSharePayload(null);
    if (isMobile()) {
      dispatch(toggleSidebar());
    }
  };

  if (isNewVisible) {
    return (
      <CreateComponent
        props={{
          saved,
          tabName: 'shop',
          onNew: handleNew,
          setIsVisible: hideCreate
        }}
      />
    );
  }

  return (
    <>
      <SelectComponent
        props={{
          saved,
          tabName: 'shop',
          setIsVisible: showCreate,
          onSelect: handleSelect,
          onDeleteItem: handleDelete
        }}
      />

      {saved.length > 0 && (
        <>
          <LevelComponent
            props={{
              level: shopLevel,
              levelName: 'Shop Level',
              onLevelChange: handleLevelChange
            }}
          />
          <LevelComponent
            props={{
              level: reputation,
              levelName: 'Reputation',
              onLevelChange: handleReputationChange
            }}
          />

          <div className="card-side-div margin-top">
            <label className="modern-label">Shop Type:</label>
            <select
              className="modern-dropdown small-long"
              value={shopType}
              onChange={handleTypeChange}
            >
              {types.map((type, idx) => (
                <option key={idx} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="card-side-div margin-top buttons-row buttons-row-around">
            <button
              className={`modern-button ${shopGenerated ? 'small-middle-long2' : 'small-long'}`}
              onClick={handleGenerate}
              disabled={!canGenerate}
            >
              <b>Generate</b>
            </button>
            {shopGenerated && (
              <button
                className="modern-button small-middle"
                onClick={handleShare}
                title="Share shop"
              >
                <span className="material-symbols-outlined">qr_code</span>
              </button>
            )}
          </div>
        </>
      )}

      {showShareModal && (
        <ShareShopModal
          payload={sharePayload}
          onClose={handleCloseShareModal}
        />
      )}
    </>
  );
}
