import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import logo from '../../data/logo-shopperino.png';
import { downloadLocalStorage, handleFileUpload } from '../../lib/storage';
import { isMobile } from '../../lib/utils';
import { setMasterMode, setSharedShop, setStateCurrentTab } from '../../store/slices/appSlice';
import { ScanShopScanner } from '../shop/ShareShopModal';
import ColorPicker from './colorPicker';
import IconButton from '../common/IconButton';
import BottomSheet from '../common/BottomSheet';
import Button from '../common/Button';
import DiceRollerSheet from '../common/DiceRollerSheet';

const TABS = [
  { id: 0, label: 'Home',         icon: 'home',          masterOnly: false },
  { id: 1, label: 'Shop',         icon: 'shopping_cart', masterOnly: true  },
  { id: 2, label: 'Spellbook',    icon: 'auto_stories',  masterOnly: false },
  { id: 3, label: 'Loot',         icon: 'paid',          masterOnly: true  },
  { id: 4, label: 'Search',       icon: 'search',        masterOnly: false },
  { id: 5, label: 'Player sheet - BETA', icon: 'badge',  masterOnly: false },
  { id: 6, label: 'Monsters',     icon: 'skull',         masterOnly: true  },
];

export default function TopMenu() {
  const dispatch = useDispatch();
  const currentTab = useSelector(state => state.app.currentTab);
  const sharedShop = useSelector(state => state.app.sharedShop);
  const isMasterMode = useSelector(state => state.app.isMasterMode);

  const [navOpen, setNavOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [diceOpen, setDiceOpen] = useState(false);

  const settingsBtnRef = useRef(null);
  const settingsBoxRef = useRef(null);

  const visibleTabs = TABS.filter(t => !t.masterOnly || isMasterMode);
  const mobile = isMobile();
  const showLeftMenu = mobile ? !sharedShop : false;

  const gotoTab = id => {
    dispatch(setStateCurrentTab(id));
    setNavOpen(false);
  };

  const handleUploadClick = () => {
    document.getElementById('upload')?.click();
    setSettingsOpen(false);
  };
  const handleDownloadClick = () => {
    downloadLocalStorage();
    setSettingsOpen(false);
  };
  const handleScanClick = () => {
    setShowScan(true);
    setSettingsOpen(false);
  };
  const handleScanSuccess = shop => {
    dispatch(setSharedShop(shop));
    dispatch(setStateCurrentTab(1));
    setShowScan(false);
  };

  useEffect(() => {
    // Desktop-only outside-click handler for the popover. On mobile the
    // settings menu renders inside a <BottomSheet>, which has its own
    // scrim/escape dismissal; running this handler there would close the
    // sheet on every tap because the sheet lives outside settingsBoxRef.
    if (!settingsOpen || mobile) return undefined;
    const onDown = ev => {
      if (settingsBoxRef.current?.contains(ev.target)) return;
      if (settingsBtnRef.current?.contains(ev.target)) return;
      setSettingsOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [settingsOpen, mobile]);

  const fileInput = (
    <input
      type="file"
      id="upload"
      className="hidden-input"
      accept=".json,application/json"
      onChange={handleFileUpload}
    />
  );

  const brand = (
    <button type="button" className="sh-topbar-brand" onClick={() => gotoTab(0)} aria-label="Shopperino · home">
      <img src={logo} alt="" className="sh-brand-logo" />
      <span className="sh-brand-word">Shopperino</span>
    </button>
  );

  const masterPlayerToggle = (
    <div className="sh-mode-toggle" role="group" aria-label="Master / Player mode">
      <button type="button" aria-pressed={isMasterMode}  onClick={() => dispatch(setMasterMode(true))}>Master</button>
      <button type="button" aria-pressed={!isMasterMode} onClick={() => dispatch(setMasterMode(false))}>Player</button>
    </div>
  );

  const settingsMenuItems = (
    <>
      {mobile && (
        <div className="sh-row-h sh-spread" style={{ marginBottom: 'var(--space-3)' }}>
          <span className="sh-eyebrow">Mode</span>
          {masterPlayerToggle}
        </div>
      )}
      <Button block variant="ghost" icon="download"             onClick={handleDownloadClick}>Export save</Button>
      <Button block variant="ghost" icon="drive_folder_upload"  onClick={handleUploadClick}  >Import save</Button>
      {mobile && (
        <Button block variant="ghost" icon="qr_code_scanner" onClick={handleScanClick}>Scan shop QR</Button>
      )}
      <div className="sh-row-h sh-spread" style={{ marginTop: 'var(--space-2)' }}>
        <span className="sh-eyebrow">Accent &amp; theme</span>
        <ColorPicker />
      </div>
    </>
  );

  /* Sits directly left of the settings gear in both layouts — on mobile that
     puts it between the navigation menu and settings, so its position is the
     same wherever you are. */
  const diceButton = (
    <IconButton
      ghost
      icon="casino"
      aria-label="Roll dice"
      title="Roll dice"
      onClick={() => setDiceOpen(true)}
    />
  );

  const settingsButton = (
    <span ref={settingsBtnRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <IconButton
        ghost
        icon="settings"
        aria-label="Settings"
        title="Settings"
        onClick={() => setSettingsOpen(v => !v)}
      />
      {!mobile && settingsOpen && (
        <div className="sh-accent-popover-anchor" ref={settingsBoxRef} style={{ width: '16rem' }}>
          <div className="sh-accent-popover" style={{ width: '16rem' }}>
            <div className="sh-stack">{settingsMenuItems}</div>
          </div>
        </div>
      )}
    </span>
  );

  const tabBar = (
    <nav className="sh-tabs" aria-label="Primary">
      {visibleTabs.map(t => (
        <button
          key={t.id}
          type="button"
          className="sh-tab"
          aria-current={currentTab === t.id ? 'page' : undefined}
          onClick={() => gotoTab(t.id)}
        >
          <span className="material-symbols-outlined">{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );

  return (
    <>
      <header className="sh-topbar" role="banner">
        {fileInput}

        {brand}

        {!mobile && (
          <>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>{tabBar}</div>
            <div className="sh-topbar-actions">
              {masterPlayerToggle}
              {diceButton}
              {settingsButton}
            </div>
          </>
        )}

        {mobile && (
          <div className="sh-topbar-actions">
            {showLeftMenu && (
              <IconButton ghost icon="menu" aria-label="Open navigation" onClick={() => setNavOpen(true)} />
            )}
            {diceButton}
            {settingsButton}
          </div>
        )}
      </header>

      {/* Mobile navigation bottom sheet — tab switcher */}
      {mobile && (
        <BottomSheet
          open={navOpen}
          onClose={() => setNavOpen(false)}
          eyebrow="Navigate"
          title="Where to?"
        >
          <div className="sh-stack">
            {visibleTabs.map(t => (
              <Button
                key={t.id}
                block
                variant={currentTab === t.id ? 'primary' : 'ghost'}
                icon={t.icon}
                onClick={() => gotoTab(t.id)}
              >
                {t.label}
              </Button>
            ))}
          </div>
        </BottomSheet>
      )}

      {/* Mobile settings bottom sheet */}
      {mobile && (
        <BottomSheet
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          eyebrow="Preferences"
          title="Settings"
        >
          <div className="sh-stack">{settingsMenuItems}</div>
        </BottomSheet>
      )}

      {/* Reachable from every tab, on both layouts — not tied to a character. */}
      <DiceRollerSheet open={diceOpen} onClose={() => setDiceOpen(false)} />

      {showScan && (
        <ScanShopScanner
          onClose={() => setShowScan(false)}
          onSuccess={handleScanSuccess}
        />
      )}
    </>
  );
}
