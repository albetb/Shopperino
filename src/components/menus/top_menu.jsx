import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import logo from '../../data/logo-shopperino.png';
import { downloadLocalStorage, handleFileUpload } from '../../lib/storage';
import { isMobile } from '../../lib/utils';
import { t, tx } from '../../lib/i18n';
import { setMasterMode, setSharedShop, setSharedShopSheetOpen, setStateCurrentTab, setUnits, selectUnits, setLang, selectLang } from '../../store/slices/appSlice';
import { setPlayerSheetMainView } from '../../store/slices/playerSheetSlice';
import { UNIT_MODES, UNIT_MODE_LABELS, UNIT_MODE_HINTS } from '../../lib/units';
import { LANGUAGES } from '../../lib/i18n';
import { ScanShopScanner } from '../shop/ShareShopModal';
import { scanLanding } from '../../lib/shop';
import ColorPicker from './colorPicker';
import IconButton from '../common/IconButton';
import BottomSheet from '../common/BottomSheet';
import Button from '../common/Button';
import DiceRollerSheet from '../common/DiceRollerSheet';
import InfoPopover from '../common/InfoPopover';

/* Listed in the order they are used at the table, not by tab id: reference
   first, the master's generators next, the character's own pages last. The
   home tiles carry the same order minus Home itself. */
export const TABS = [
  { id: 0, label: 'Home',         icon: 'home',          masterOnly: false },
  { id: 8, label: 'Rules',        icon: 'menu_book',     masterOnly: false },
  { id: 4, label: 'Search',       icon: 'search',        masterOnly: false },
  { id: 1, label: 'Shop',         icon: 'shopping_cart', masterOnly: true  },
  { id: 3, label: 'Loot',         icon: 'paid',          masterOnly: true  },
  { id: 6, label: 'Monsters',     icon: 'skull',         masterOnly: true  },
  { id: 7, label: 'Traps',        icon: 'crisis_alert',  masterOnly: true  },
  { id: 2, label: 'Spellbook',    icon: 'auto_stories',  masterOnly: false },
  { id: 5, label: 'Player sheet', icon: 'badge',  masterOnly: false },
];

export default function TopMenu() {
  const dispatch = useDispatch();
  const currentTab = useSelector(state => state.app.currentTab);
  const sharedShop = useSelector(state => state.app.sharedShop);
  const units = useSelector(selectUnits);
  const lang = useSelector(selectLang);
  const hasCharacter = useSelector(state => !!state.playerSheet?.player);
  const isMasterMode = useSelector(state => state.app.isMasterMode);

  const [navOpen, setNavOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [diceOpen, setDiceOpen] = useState(false);

  const settingsBtnRef = useRef(null);
  const settingsBoxRef = useRef(null);

  const visibleTabs = TABS.filter(tab => !tab.masterOnly || isMasterMode);
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
  /* Where a scanned shop lands depends on what you were already looking at.
     Scanning with your own sheet in front of you means you are about to buy
     something, so the shop opens right there as the drawer over the Inventory
     page — no tab change, nothing further to press. Scanning from anywhere else
     opens the read-only list on the Shop tab, as it always has. */
  const handleScanSuccess = shop => {
    dispatch(setSharedShop(shop));
    const { openOnSheet, goToTab } = scanLanding({ currentTab, hasCharacter });
    if (openOnSheet) {
      /* The drawer is rendered by a card on the Inventory page, so that page
         has to be the one showing for the sheet to appear at all. */
      dispatch(setPlayerSheetMainView('inventory'));
      dispatch(setSharedShopSheetOpen(true));
    } else {
      dispatch(setStateCurrentTab(goToTab));
    }
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
    <button type="button" className="sh-topbar-brand" onClick={() => gotoTab(0)} aria-label={t('Shopperino · home')}>
      <img src={logo} alt="" className="sh-brand-logo" />
      <span className="sh-brand-word">{t('Shopperino')}</span>
    </button>
  );

  const masterPlayerToggle = (
    <div className="sh-mode-toggle" role="group" aria-label={t('Master / Player mode')}>
      <button type="button" aria-pressed={isMasterMode}  onClick={() => dispatch(setMasterMode(true))}>{t('Master', 'mode')}</button>
      <button type="button" aria-pressed={!isMasterMode} onClick={() => dispatch(setMasterMode(false))}>{t('Player')}</button>
    </div>
  );

  /* Three positions rather than a switch, because "squares" is a real third
     answer and not a variant of either: a master running a grid counts in
     squares and wants neither feet nor metres. Built like the master/player
     toggle above so the settings sheet has one visual language.

     The explanation is behind an info button rather than in a `title`, per the
     project rule — there is no hover on a phone, which is where this control is
     mostly used. */
  const unitToggle = (
    <div className="sh-mode-toggle sh-unit-toggle" role="group" aria-label={t('Units')}>
      {UNIT_MODES.map(mode => (
        <button
          key={mode}
          type="button"
          aria-pressed={units === mode}
          onClick={() => dispatch(setUnits(mode))}
        >
          {t(UNIT_MODE_LABELS[mode])}
        </button>
      ))}
    </div>
  );

  /* Two positions today, and a list rather than a switch so a third language
     is one entry in LANGUAGES and nothing else. Each is written in its own
     language: someone looking for Italian is looking for "Italiano", not for
     the English word for it. */
  const langToggle = (
    <div className="sh-mode-toggle sh-lang-toggle" role="group" aria-label={t('Language')}>
      {LANGUAGES.map(l => (
        <button
          key={l.code}
          type="button"
          lang={l.code}
          aria-pressed={lang === l.code}
          onClick={() => dispatch(setLang(l.code))}
        >
          {l.endonym}
        </button>
      ))}
    </div>
  );

  const settingsMenuItems = (
    <>
      {mobile && (
        <div className="sh-settings-row">
          <span className="sh-eyebrow">{t('Mode')}</span>
          {masterPlayerToggle}
        </div>
      )}

      <div className="sh-settings-row">
        <span className="sh-eyebrow sh-units-label">
          {t('Language')}
          <InfoPopover label={t('language')}>
            <p>
              {t('Which language the interface and the rules text are read in. English is what the app is written in; anything not yet translated is shown in English rather than left blank.')}
            </p>
            <p>
              {t('Names of things — items, spells, conditions — keep their English name inside your saved characters whatever you pick here, so switching language never touches a character sheet.')}
            </p>
          </InfoPopover>
        </span>
        {langToggle}
      </div>

      <div className="sh-units-row">
        <span className="sh-eyebrow sh-units-label">
          {t('Units')}
          <InfoPopover label={t('units')}>
            <p>
              {tx('Which units every distance and weight is read out in — the speeds and ranges the sheet computes {0} the measurements inside spell, item and monster descriptions.', <b>{t('and')}</b>)}
            </p>
            <ul>
              {UNIT_MODES.map(mode => (
                <li key={mode}><b>{t(UNIT_MODE_LABELS[mode])}</b> — {t(UNIT_MODE_HINTS[mode])}</li>
              ))}
            </ul>
            <p>
              {t('The numbers follow the manual\'s own round values rather than a calculator: 5 ft is 1.5 m exactly, and a pound is half a kilo.')}
            </p>
          </InfoPopover>
        </span>
        {unitToggle}
      </div>

      <div className="sh-settings-save-row">
        <Button variant="ghost" icon="download"            onClick={handleDownloadClick}>{t('Export save')}</Button>
        <Button variant="ghost" icon="drive_folder_upload" onClick={handleUploadClick}  >{t('Import save')}</Button>
      </div>
      {mobile && (
        <Button block variant="ghost" icon="qr_code_scanner" onClick={handleScanClick}>{t('Scan shop QR')}</Button>
      )}

      <div className="sh-settings-row">
        <span className="sh-eyebrow">{t('Accent & theme')}</span>
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
      aria-label={t('Roll dice')}
      title={t('Roll dice')}
      onClick={() => setDiceOpen(true)}
    />
  );

  const settingsButton = (
    <span ref={settingsBtnRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <IconButton
        ghost
        icon="settings"
        aria-label={t('Settings')}
        title={t('Settings')}
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
    <nav className="sh-tabs" aria-label={t('Primary')}>
      {visibleTabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          className="sh-tab"
          aria-current={currentTab === tab.id ? 'page' : undefined}
          onClick={() => gotoTab(tab.id)}
        >
          <span className="material-symbols-outlined">{tab.icon}</span>
          <span>{t(tab.label)}</span>
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
              <IconButton ghost icon="menu" aria-label={t('Open navigation')} onClick={() => setNavOpen(true)} />
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
          eyebrow={t('Navigate')}
          title={t('Where to?')}
        >
          <div className="sh-stack">
            {visibleTabs.map(tab => (
              <Button
                key={tab.id}
                block
                variant={currentTab === tab.id ? 'primary' : 'ghost'}
                icon={tab.icon}
                onClick={() => gotoTab(tab.id)}
              >
                {t(tab.label)}
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
          eyebrow={t('Preferences')}
          title={t('Settings')}
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
