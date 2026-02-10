import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import parse, { domToReact } from 'html-react-parser';
import { addCardByLink } from '../../store/slices/appSlice';
import { loadFile, isMobile } from '../../lib/utils';
import SpellLink from '../common/spell_link';
import '../../style/sidebar.css';
import '../../style/menu_cards.css';

const TYPE_OPTIONS = ['', 'Spells', 'Items', 'Feats', 'Skills'];
const SPELL_CLASS_OPTIONS = ['All', 'Sorcerer', 'Wizard', 'Cleric', 'Druid', 'Bard', 'Ranger', 'Paladin', 'Domains'];
const DOMAINS = [
  'Air', 'Animal', 'Chaos', 'Death', 'Destruction',
  'Earth', 'Evil', 'Fire', 'Good', 'Healing',
  'Knowledge', 'Law', 'Luck', 'Magic', 'Plant',
  'Protection', 'Strength', 'Sun', 'Travel', 'Trickery',
  'War', 'Water'
];

const CHARACTERISTIC_FULL = {
  Str: 'Strength',
  Dex: 'Dexterity',
  Con: 'Constitution',
  Int: 'Intelligence',
  Wis: 'Wisdom',
  Cha: 'Charisma',
  None: 'None',
};

const linkParseOptions = {
  replace: domNode => {
    if (domNode.name === 'a' && domNode.attribs?.href) {
      const href = domNode.attribs.href;
      let link = null;
      if (href && href.includes('abilitiesAndConditions#')) {
        link = href;
      } else if (href && href.includes('#')) {
        link = href;
      } else if (href && href.startsWith('#')) {
        link = href.slice(1);
      } else if (href && !href.includes('://')) {
        link = href;
      }
      if (link) {
        return (
          <SpellLink key={href} link={link}>
            {domToReact(domNode.children, linkParseOptions)}
          </SpellLink>
        );
      }
    }
    // Render paragraphs as inline spans so punctuation doesn't get isolated on its own line
    if (domNode.name === 'p') {
      return (
        <span>
          {domToReact(domNode.children, linkParseOptions)}
        </span>
      );
    }
    return undefined;
  },
};

function slugify(name) {
  if (!name || typeof name !== 'string') return '';
  return name.toLowerCase().trim().replace(/\s+/g, '-');
}

export default function SearchPage() {
  const dispatch = useDispatch();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchType, setSearchType] = useState('');
  const [query, setQuery] = useState('');
  const [searchCardCollapsed, setSearchCardCollapsed] = useState(false);
  const [spellClassFilter, setSpellClassFilter] = useState('All');
  const [spellLevelCollapsed, setSpellLevelCollapsed] = useState({});
  const [domainCollapsed, setDomainCollapsed] = useState({});

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  const handleOpenCard = (item) => {
    if (!searchType) return;
    if (searchType === 'Spells') {
      if (!item?.Link) return;
      dispatch(addCardByLink({ links: `spells#${item.Link}`, bonus: 0 }));
      return;
    }
    if (searchType === 'Feats') {
      const slug = slugify(item?.Name);
      if (!slug) return;
      dispatch(addCardByLink({ links: `feats#${slug}` }));
      return;
    }
    if (searchType === 'Skills') {
      const slug = slugify(item?.Name);
      if (!slug) return;
      dispatch(addCardByLink({ links: `skills#${slug}` }));
      return;
    }
    if (searchType === 'Items') {
      if (!item?.Link) return;
      dispatch(addCardByLink({ links: item.Link, bonus: 0 }));
    }
  };

  const results = useMemo(() => {
    if (!searchType) return [];
    const q = query.trim().toLowerCase();

    if (searchType === 'Spells') {
      const spells = loadFile('spells') || [];

      return spells.filter(s => {
        if (q && !s.Name?.toLowerCase().includes(q)) return false;
        if (!spellClassFilter || spellClassFilter === 'All') return true;

        const levelStr = s.Level || '';
        const parts = levelStr.split(',').map(p => p.trim());

        if (spellClassFilter === 'Domains') {
          // any part starting with known domain name
          return parts.some(p =>
            DOMAINS.some(d => p.startsWith(d + ' '))
          );
        }

        const classKeyMap = {
          Sorcerer: 'Sor/Wiz',
          Wizard: 'Sor/Wiz',
          Cleric: 'Clr',
          Druid: 'Drd',
          Bard: 'Brd',
          Ranger: 'Rgr',
          Paladin: 'Pal'
        };
        const key = classKeyMap[spellClassFilter];
        if (!key) return true;
        return parts.some(p => p.startsWith(key + ' '));
      });
    }

    if (searchType === 'Feats') {
      const feats = loadFile('feats') || [];
      return feats.filter(f =>
        !q || f.Name?.toLowerCase().includes(q)
      );
    }

    if (searchType === 'Skills') {
      const skills = loadFile('skills') || [];
      return skills.filter(s =>
        !q || s.Name?.toLowerCase().includes(q)
      );
    }

    if (searchType === 'Items') {
      const itemsData = loadFile('items') || {};
      const types = [
        'Good', 'Ammo', 'Weapon', 'Specific Weapon', 'Armor',
        'Specific Armor', 'Shield', 'Specific Shield', 'Potion',
        'Ring', 'Rod', 'Staff', 'Wand', 'Wondrous Item'
      ];
      const allItems = types.flatMap(type =>
        (itemsData[type] || []).map(it => ({ ...it, ItemType: type }))
      );
      return allItems.filter(it =>
        !q || it.Name?.toLowerCase().includes(q)
      );
    }

    return [];
  }, [searchType, query, spellClassFilter]);

  // For spell class filters (not All / Domains), group spells by level
  const classSpellGroups = useMemo(() => {
    if (searchType !== 'Spells') return [];
    if (!spellClassFilter || spellClassFilter === 'All' || spellClassFilter === 'Domains') return [];

    const classKeyMap = {
      Sorcerer: 'Sor/Wiz',
      Wizard: 'Sor/Wiz',
      Cleric: 'Clr',
      Druid: 'Drd',
      Bard: 'Brd',
      Ranger: 'Rgr',
      Paladin: 'Pal'
    };
    const key = classKeyMap[spellClassFilter];
    if (!key) return [];

    const byLevel = new Map();

    results.forEach(spell => {
      const levelStr = spell.Level || '';
      const parts = levelStr.split(',').map(p => p.trim());
      const entry = parts.find(p => p.startsWith(key + ' '));
      if (!entry) return;
      const lvlNum = parseInt(entry.slice(key.length).trim(), 10);
      if (!Number.isFinite(lvlNum)) return;
      if (!byLevel.has(lvlNum)) byLevel.set(lvlNum, []);
      byLevel.get(lvlNum).push(spell);
    });

    return Array.from(byLevel.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([level, spellsAtLevel]) => ({ level, spells: spellsAtLevel }));
  }, [results, searchType, spellClassFilter]);

  const toggleSpellLevel = level => {
    setSpellLevelCollapsed(prev => ({ ...prev, [level]: !prev[level] }));
  };

  // For Domains filter, group spells by domain into cards
  const domainSpellGroups = useMemo(() => {
    if (searchType !== 'Spells' || spellClassFilter !== 'Domains') return [];
    const tables = loadFile('tables') || {};
    const domainDescriptions = tables.Domains || tables['Domains'] || {};

    const groups = DOMAINS.map(domain => {
      const spellsForDomain = results.filter(spell => {
        const levelStr = spell.Level || '';
        const parts = levelStr.split(',').map(p => p.trim());
        return parts.some(p => p.startsWith(domain + ' '));
      });
      if (!spellsForDomain.length) return null;
      return {
        domain,
        description: domainDescriptions[domain] || '',
        spells: spellsForDomain,
      };
    }).filter(Boolean);

    return groups;
  }, [results, searchType, spellClassFilter]);

  const toggleDomain = domain => {
    setDomainCollapsed(prev => ({ ...prev, [domain]: !prev[domain] }));
  };

  return (
    <>
      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <button className="toggle-button" onClick={handleToggleSidebar}>
          <span className="material-symbols-outlined">
            {sidebarCollapsed ? 'menu_open' : 'arrow_back_ios'}
          </span>
        </button>

        {!sidebarCollapsed && (
          <div className="cards">
            <div className="card">
              <div
                className="card-side-div card-expand-div"
                onClick={() => setSearchCardCollapsed(prev => !prev)}
              >
                <h3 className="card-title">Search</h3>
                <button className="collapse-button">
                  <span className="material-symbols-outlined">
                    {searchCardCollapsed ? 'expand_more' : 'expand_less'}
                  </span>
                </button>
              </div>
              {!searchCardCollapsed && (
              <div className="card-content">
                <div className="card-side-div" style={{ gap: '0.5rem' }}>
                  <label className="modern-label" style={{ minWidth: '5.5rem' }}>Type:</label>
                  <select
                    className="modern-dropdown small-long"
                    style={{ flex: 1 }}
                    value={searchType}
                    onChange={e => {
                      const value = e.target.value;
                      setSearchType(value);
                      if (value !== 'Spells') {
                        setSpellClassFilter('All');
                      }
                      if (value && isMobile()) {
                        setSidebarCollapsed(true);
                      }
                    }}
                  >
                    {TYPE_OPTIONS.map(opt => (
                      <option key={opt || '-'} value={opt}>
                        {opt || '-'}
                      </option>
                    ))}
                  </select>
                </div>

                {searchType === 'Spells' && (
                  <div className="card-side-div margin-top" style={{ gap: '0.5rem' }}>
                    <label className="modern-label" style={{ minWidth: '5.5rem' }}>Class:</label>
                    <select
                      className="modern-dropdown small-long"
                      style={{ flex: 1 }}
                      value={spellClassFilter}
                      onChange={e => {
                        const value = e.target.value;
                        setSpellClassFilter(value);
                        if (value && isMobile()) {
                          setSidebarCollapsed(true);
                        }
                      }}
                    >
                      {SPELL_CLASS_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {searchType && (
                  <div className="card-side-div margin-top" style={{ gap: '0.5rem' }}>
                    <label className="modern-label" style={{ minWidth: '5.5rem' }}>Contains:</label>
                    <input
                      className="modern-dropdown small-long padding-left"
                      style={{ flex: 1 }}
                      type="text"
                      placeholder="Filter by name"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                    />
                  </div>
                )}
              </div>
              )}
            </div>
          </div>
        )}
      </div>

      <header className="app-header">
        <div className="search-results">
          {!searchType && (
            <p className="search-hint">
              Select a type (Spells, Items, Feats, Skills) to list entries.
            </p>
          )}
          {searchType && results.length === 0 && (
            <p style={{ color: '#f9f9f9' }}>
              No {searchType.toLowerCase()} found matching this filter.
            </p>
          )}

          {searchType && query.trim() && (
            <div className="filter-box" style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
              <div className="card-side-div card-expand-div" style={{ width: '100%' }}>
                <button
                  className="close-button no-margin-left"
                  onClick={() => setQuery('')}
                >
                  <span className="material-symbols-outlined" style={{ color: 'var(--white)' }}>
                    close_small
                  </span>
                </button>
                <p style={{ color: 'var(--white)' }}>
                  Filter by name: <b>{query}</b>
                </p>
              </div>
            </div>
          )}

          {/* Generic single-table view for non-spells, and for spells when filter is All */}
          {searchType && results.length > 0 && (searchType !== 'Spells' || spellClassFilter === 'All') && (
            <div className="search-results-table-wrapper">
              <table className={`search-results-table ${searchType === 'Feats' ? 'feats-table' : ''} ${searchType === 'Skills' ? 'skills-table' : ''}`}>
                <thead>
                  <tr>
                    <th>Name</th>
                    {searchType === 'Spells' && spellClassFilter === 'All' && <th>Class</th>}
                    {searchType === 'Spells' && <th>Description</th>}
                    {searchType === 'Feats' && <th>Prerequisites</th>}
                    {searchType === 'Skills' && <th>Characteristic</th>}
                    {searchType === 'Items' && <th>Weight</th>}
                    {searchType === 'Items' && <th>Price</th>}
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, idx) => (
                    <tr key={`${r.Name}-${idx}`}>
                      <td>
                        <button
                          type="button"
                          className="button-link"
                          onClick={() => handleOpenCard(r)}
                        >
                          {r.Name}
                        </button>
                      </td>
                      {searchType === 'Spells' && spellClassFilter === 'All' && (
                        <>
                          <td>{r.Level}</td>
                          <td>{r['Short Description'] || ''}</td>
                        </>
                      )}
                      {searchType === 'Spells' && spellClassFilter !== 'All' && (
                        <td>{r['Short Description'] || ''}</td>
                      )}
                      {searchType === 'Feats' && (
                        <td>
                          {r.Prerequisites
                            ? parse(
                                r.Prerequisites
                                  // move punctuation inside preceding link so they can't split across lines
                                  .replace(/(<a[^>]*>[^<]*)(<\/a>)\s*([,.;:!?])/gi, '$1$3$2')
                                  // replace explicit line breaks with spaces
                                  .replace(/<br\s*\/?>/gi, ' ')
                                  // remove spaces directly before punctuation so they stay attached
                                  .replace(/\s+([,.;:!?])/g, '$1')
                                  // collapse multiple spaces
                                  .replace(/\s{2,}/g, ' '),
                                linkParseOptions
                              )
                            : ''}
                        </td>
                      )}
                      {searchType === 'Skills' && (
                        <td>{CHARACTERISTIC_FULL[r.Characteristic] || r.Characteristic || ''}</td>
                      )}
                      {searchType === 'Items' && (
                        <>
                          <td>{r.Weight ?? ''}</td>
                          <td>{r.Cost ?? ''}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Spells with specific class selected: grouped by level into collapsible cards */}
          {searchType === 'Spells' &&
            spellClassFilter !== 'All' &&
            spellClassFilter !== 'Domains' &&
            classSpellGroups.length > 0 && (
              <div>
                {classSpellGroups.map(({ level, spells }) => {
                  const collapsed = !!spellLevelCollapsed[level];
                  return (
                    <div
                      key={level}
                      className={`card card-width-spellbook ${collapsed ? 'collapsed' : ''}`}
                    >
                      <div
                        className="card-side-div card-expand-div"
                        onClick={() => toggleSpellLevel(level)}
                      >
                        <h3 className="card-title">{spellClassFilter} — Level {level}</h3>
                        <button className="collapse-button">
                          <span className="material-symbols-outlined">
                            {collapsed ? 'expand_more' : 'expand_less'}
                          </span>
                        </button>
                      </div>
                      {!collapsed && (
                        <div className="card-content">
                          <div className="search-results-table-wrapper">
                            <table className="search-results-table">
                              <thead>
                                <tr>
                                  <th>Name</th>
                                  <th>Description</th>
                                </tr>
                              </thead>
                              <tbody>
                                {spells.map(spell => (
                                  <tr key={spell.Link}>
                                    <td>
                                      <button
                                        type="button"
                                        className="button-link"
                                        onClick={() => handleOpenCard(spell)}
                                      >
                                        {spell.Name}
                                      </button>
                                    </td>
                                    <td>{spell['Short Description'] || ''}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

          {/* Spells: Domains filter, grouped by domain into collapsible cards */}
          {searchType === 'Spells' &&
            spellClassFilter === 'Domains' &&
            domainSpellGroups.length > 0 && (
              <div>
                {domainSpellGroups.map(({ domain, description, spells }) => {
                  const collapsed = !!domainCollapsed[domain];
                  return (
                    <div
                      key={domain}
                      className={`card card-width-spellbook ${collapsed ? 'collapsed' : ''}`}
                    >
                      <div
                        className="card-side-div card-expand-div"
                        onClick={() => toggleDomain(domain)}
                      >
                        <h3 className="card-title">{domain}</h3>
                        <button className="collapse-button">
                          <span className="material-symbols-outlined">
                            {collapsed ? 'expand_more' : 'expand_less'}
                          </span>
                        </button>
                      </div>
                      {!collapsed && (
                        <div className="card-content">
                          {description && (
                            <div
                              className="description-content"
                              dangerouslySetInnerHTML={{ __html: description }}
                            />
                          )}
                          <div className="search-results-table-wrapper">
                            <table className="search-results-table">
                              <thead>
                                <tr>
                                  <th>Name</th>
                                  <th>Description</th>
                                </tr>
                              </thead>
                              <tbody>
                                {spells.map(spell => (
                                  <tr key={spell.Link}>
                                    <td>
                                      <button
                                        type="button"
                                        className="button-link"
                                        onClick={() => handleOpenCard(spell)}
                                      >
                                        {spell.Name}
                                      </button>
                                    </td>
                                    <td>{spell['Short Description'] || ''}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      </header>
    </>
  );
}

