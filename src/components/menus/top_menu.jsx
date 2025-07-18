import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import logo from '../../data/logo-shopperino.png';
import { downloadLocalStorage, handleFileUpload } from '../../lib/storage';
import { isMobile } from '../../lib/utils';
import { setStateCurrentTab } from '../../store/slices/appSlice';
import '../../style/sidebar.css';

export default function TopMenu() {
    const dispatch = useDispatch();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [optionsOpen, setOptionsOpen] = useState(false);

    const handleLogoClick = () => dispatch(setStateCurrentTab(0));
    const handleShopClick = () => {
        dispatch(setStateCurrentTab(1));
        setMobileMenuOpen(false);
    };
    const handleSpellbookClick = () => {
        dispatch(setStateCurrentTab(2));
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
    const handleToggleMobileMenu = () => setMobileMenuOpen(prev => !prev);
    const handleToggleOptions = () => setOptionsOpen(prev => !prev);

    const currentTab = useSelector(state => state.app.currentTab);

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
        <>
            <input
                type="file"
                id="upload"
                style={{ display: 'none' }}
                accept="application/json"
                onChange={handleFileUpload}
            />
            <button
                className="modern-dropdown small-middle"
                onClick={handleUploadClick}
                title="Import save file"
            >
                <span className="material-symbols-outlined">drive_folder_upload</span>
            </button>
        </>;

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

    const buttons = (
        <>
            {shopButton}
            {spellbookButton}
        </>
    );

    const mobileButtons = (
        <>
            <div className="menu-side-by-side">
                <p style={{ textShadow: "1px 1px #12121366" }}>Shop generator</p>
                {shopButton}
            </div>
            <div className="menu-side-by-side">
                <p style={{ textShadow: "1px 1px #12121366" }}>Spellbook</p>
                {spellbookButton}
            </div>
        </>
    );

    const optionsButtons = (
        <>
            <div className="menu-side-by-side">
                <p style={{ textShadow: "1px 1px #12121366" }}>Export save</p>
                {exportButton}
            </div>

            <div className="menu-side-by-side">
                <p style={{ textShadow: "1px 1px #12121366" }}>Import save</p>
                {importButton}
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

    if (isMobile()) {
        return (
            <div className="top-menu">
                {topLogo}

                {mobileMenuButton}

                {optionsButton}
            </div>
        );
    }

    return (
        <div className="top-menu">
            {topLogo}
            <div className="top-menu-button-container">
                {buttons}
                <br></br>
                {optionsButton}
            </div>
        </div>
    );
}
