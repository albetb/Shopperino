import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import logo from '../../data/logo-shopperino.png';
import { downloadLocalStorage, handleFileUpload } from '../../lib/storage';
import { isMobile } from '../../lib/utils';
import { setMasterMode, setSharedShop, setStateCurrentTab } from '../../store/slices/appSlice';
import '../../style/sidebar.css';
import { ScanShopScanner } from '../shop/ShareShopModal';
import ColorPicker from './colorPicker';

export default function TopMenu() {
    const dispatch = useDispatch();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [optionsOpen, setOptionsOpen] = useState(false);
    const [showScan, setShowScan] = useState(false);

    const handleLogoClick = () => dispatch(setStateCurrentTab(0));
    const handleShopClick = () => {
        dispatch(setStateCurrentTab(1));
        setMobileMenuOpen(false);
    };
    const handleSpellbookClick = () => {
        dispatch(setStateCurrentTab(2));
        setMobileMenuOpen(false);
    };
    const handleLootClick = () => {
        dispatch(setStateCurrentTab(3));
        setMobileMenuOpen(false);
    };
    const handleSearchClick = () => {
        dispatch(setStateCurrentTab(4));
        setMobileMenuOpen(false);
    };
    const handlePlayerSheetClick = () => {
        dispatch(setStateCurrentTab(5));
        setMobileMenuOpen(false);
    };

    const handleUploadClick = () => {
        document.getElementById('upload').click();
        setOptionsOpen(false);
    };
    const handleDownloadClick = () => {
        downloadLocalStorage();
        setOptionsOpen(false);
    };
    const handleScanClick = () => {
        setShowScan(true);
        setOptionsOpen(false);
    };
    const handleScanSuccess = (shop) => {
        dispatch(setSharedShop(shop));
        dispatch(setStateCurrentTab(1));
        setShowScan(false);
    };
    const handleToggleMobileMenu = () => setMobileMenuOpen(prev => !prev);
    const handleToggleOptions = () => setOptionsOpen(prev => !prev);

    const currentTab = useSelector(state => state.app.currentTab);
    const sharedShop = useSelector(state => state.app.sharedShop);
    const isMasterMode = useSelector(state => state.app.isMasterMode);

    // On mobile: show hamburger so user can always open the nav menu (Shop, Spellbook, Loot, Search).
    // Only hide it when viewing a shared shop (no sidebar to toggle; options move into its place; user has Close).
    const showLeftMenuButton = isMobile() ? !sharedShop : true;

    const optionsButtonRef = useRef(null);
    const optionsBoxRef = useRef(null);
    const menuButtonRef = useRef(null);
    const menuBoxRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = event => {
            if (mobileMenuOpen
                && menuButtonRef.current
                && !menuButtonRef.current.contains(event.target)
                && !menuBoxRef.current.contains(event.target)
            ) {
                handleToggleMobileMenu();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    });

    useEffect(() => {
        const handleClickOutside = event => {
            if (optionsOpen
                && optionsButtonRef.current
                && !optionsButtonRef.current.contains(event.target)
                && !optionsBoxRef.current.contains(event.target)
            ) {
                handleToggleOptions();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    });

    const topLogo =
        <img
            src={logo}
            alt="Shopperino"
            className="top-logo"
            onClick={handleLogoClick}
        />;

    const exportButton =
        <button
            className="modern-dropdown small-middle"
            onClick={handleDownloadClick}
            title="Export save file"
        >
            <span className="material-symbols-outlined">download</span>
        </button>;

    const importButton =
        <button
            className="modern-dropdown small-middle"
            onClick={handleUploadClick}
            title="Import save file"
        >
            <span className="material-symbols-outlined">drive_folder_upload</span>
        </button>;

    const buttonDimension = isMobile() ? "small-middle" : "small-long";

    const shopButton =
        <button
            className={`modern-dropdown ${buttonDimension} ${currentTab === 1 ? "opacity-50" : ""}`}
            onClick={handleShopClick}
            title="Shop generator"
            disabled={currentTab === 1}
        >
            <span className="material-symbols-outlined">shopping_cart</span>
        </button>

    const spellbookButton =
        <button
            className={`modern-dropdown ${buttonDimension} ${currentTab === 2 ? "opacity-50" : ""}`}
            onClick={handleSpellbookClick}
            title="Spellbook"
            disabled={currentTab === 2}
        >
            <span className="material-symbols-outlined">menu_book</span>
        </button>

    const lootButton =
        <button
            className={`modern-dropdown ${buttonDimension} ${currentTab === 3 ? "opacity-50" : ""}`}
            onClick={handleLootClick}
            title="Loot generator"
            disabled={currentTab === 3}
        >
            <span className="material-symbols-outlined">money_bag</span>
        </button>

    const searchButton =
        <button
            className={`modern-dropdown ${buttonDimension} ${currentTab === 4 ? "opacity-50" : ""}`}
            onClick={handleSearchClick}
            title="Search"
            disabled={currentTab === 4}
        >
            <span className="material-symbols-outlined">search</span>
        </button>

    const playerSheetButton =
        <button
            className={`modern-dropdown ${buttonDimension} ${currentTab === 5 ? "opacity-50" : ""}`}
            onClick={handlePlayerSheetClick}
            title="Player sheet"
            disabled={currentTab === 5}
        >
            <span className="material-symbols-outlined">badge</span>
        </button>

    const buttons = (
        <>
            {searchButton}
            {playerSheetButton}
            {isMasterMode && shopButton}
            {isMasterMode && lootButton}
            {spellbookButton}
        </>
    );

    const mobileButtons = (
        <>
            <div className="menu-side-by-side">
                <p className="menu-item-text">Search</p>
                {searchButton}
            </div>
            <div className="menu-side-by-side">
                <p className="menu-item-text">Player sheet</p>
                {playerSheetButton}
            </div>
            {isMasterMode && (
            <div className="menu-side-by-side">
                <p className="menu-item-text">Shop generator</p>
                {shopButton}
            </div>
            )}
            {isMasterMode && (
            <div className="menu-side-by-side">
                <p className="menu-item-text">Loot generator</p>
                {lootButton}
            </div>
            )}
            <div className="menu-side-by-side">
                <p className="menu-item-text">Spellbook</p>
                {spellbookButton}
            </div>
        </>
    );

    const scanButton =
        <button
            className="modern-dropdown small-middle"
            onClick={handleScanClick}
            title="Scan shop QR code"
        >
            <span className="material-symbols-outlined">qr_code_scanner</span>
        </button>;

    const optionsButtons = (
        <>
            <div className="menu-side-by-side flex-center width-100">
                <div className="master-player-toggle">
                    <span className={isMasterMode ? 'master-player-label active' : 'master-player-label'} onClick={() => dispatch(setMasterMode(true))}>Master</span>
                    <span className={!isMasterMode ? 'master-player-label active' : 'master-player-label'} onClick={() => dispatch(setMasterMode(false))}>Player</span>
                </div>
            </div>
            <div className="menu-side-by-side">
                <p className="menu-item-text">Export save</p>
                {exportButton}
            </div>

            <div className="menu-side-by-side">
                <p className="menu-item-text">Import save</p>
                {importButton}
            </div>

            {isMobile() && (
            <div className="menu-side-by-side">
                <p className="menu-item-text">Scan shop</p>
                {scanButton}
            </div>
            )}

            <div className="menu-side-by-side">
                <p className="menu-item-text">Change theme</p>
                <ColorPicker />
            </div>
        </>
    );

    const optionsButton =
        <>
            <button
                className="modern-dropdown small"
                onClick={handleToggleOptions}
                title="Open options"
                ref={optionsButtonRef}
            >
                <span className="material-symbols-outlined">settings</span>
            </button>
            {optionsOpen && (
                <div className="mobile-dropdown" ref={optionsBoxRef}>
                    {optionsButtons}
                </div>
            )}
        </>;

    const mobileMenuButton =
        <>
            <button
                className="mobile-menu-button modern-dropdown small-middle"
                onClick={handleToggleMobileMenu}
                title="Open menu"
                ref={menuButtonRef}
            >
                <span className="material-symbols-outlined">menu</span>
            </button>
            {mobileMenuOpen && (
                <div className="mobile-dropdown" ref={menuBoxRef}>
                    {mobileButtons}
                </div>
            )}
        </>;

    const fileInput = (
        <input
            type="file"
            id="upload"
            className="hidden-input"
            accept=".json,application/json"
            onChange={handleFileUpload}
        />
    );

    if (isMobile()) {
        return (
            <div className="top-menu">
                {fileInput}
                {topLogo}
                {showLeftMenuButton ? mobileMenuButton : null}
                <div className={showLeftMenuButton ? '' : 'mobile-options-in-place-of-menu'}>
                    {optionsButton}
                </div>
                {showScan && (
                    <ScanShopScanner
                        onClose={() => setShowScan(false)}
                        onSuccess={handleScanSuccess}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="top-menu">
            {fileInput}
            {topLogo}
            <div className="top-menu-button-container">
                {buttons}
                <br></br>
                {optionsButton}
            </div>
            {showScan && (
                <ScanShopScanner
                    onClose={() => setShowScan(false)}
                    onSuccess={handleScanSuccess}
                />
            )}
        </div>
    );
}
