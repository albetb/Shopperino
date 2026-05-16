// =============================================================
// SHOPPERINO — MOBILE SCREENS (390 × 844)
// One component per screen. Each renders a complete phone view.
// =============================================================

// shared chrome ------------------------------------------------
function MobileChrome({ children, drawerOpen, drawer, bottomNav, leadIcon, title, trailing, sheet, modal }) {
  return (
    <div className="sh-phone">
      <TopBar leadIcon={leadIcon} title={title} trailing={trailing} />
      <div className="sh-scroll">
        <div style={{ height: "100%", overflow: "auto" }}>
          {children}
        </div>
        {drawerOpen && (
          <>
            <div className="sh-drawer-scrim" />
            {drawer}
          </>
        )}
        {sheet}
        {modal}
      </div>
      {bottomNav}
    </div>
  );
}

// ---- SCREEN 1: HOME (Master mode) --------------------------
function ScreenHome({ master = true }) {
  const tiles = [
    { id: "search",  name: "Search",    desc: "Browse spells, items, feats, skills.", icon: "search" },
    { id: "sheet",   name: "Player Sheet", desc: "Halethorn · Elf Wizard 7", icon: "badge", accent: true },
    { id: "spellbk", name: "Spellbook", desc: "3 books · 47 prepared", icon: "menu_book" },
    { id: "shop",    name: "Shop",      desc: "Generate merchant inventory.", icon: "shopping_cart", master: true },
    { id: "loot",    name: "Loot",      desc: "Roll hoard by CR.", icon: "money_bag", master: true },
  ];
  const visible = tiles.filter(t => master || !t.master);
  return (
    <MobileChrome title="Shopperino" leadIcon="menu" trailing={
      <span className="sh-mode-toggle" style={{ display: "inline-flex" }}>
        <button aria-pressed={master ? "true" : "false"}>Master</button>
        <button aria-pressed={!master ? "true" : "false"}>Player</button>
      </span>
    }>
      <div style={{ padding: "1.25rem 1rem 6rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <Filigree>Welcome back, dungeon master</Filigree>
          <h1 className="sh-display" style={{ fontSize: "var(--font-size-3xl)", margin: "0.25rem 0 0.5rem" }}>
            The party rests at <span className="sh-accent-text">The Aging Sun</span>.
          </h1>
          <p className="sh-muted" style={{ margin: 0, fontSize: "var(--font-size-sm)" }}>
            Halethorn · level 7 · 47/52 HP · 28 100 XP.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {visible.map(t => (
            <div key={t.id} className={`sh-tile ${t.accent ? "sh-tile--master" : ""}`}>
              <Icon name={t.icon} />
              <div className="t-name">{t.name}</div>
              <div className="t-desc">{t.desc}</div>
              {t.master && <Pill tone="accent" icon="key" style={{ alignSelf: "flex-start", marginTop: "auto" }}>Master</Pill>}
            </div>
          ))}
        </div>

        <Card eyebrow="last session" title="Quick resume" action={<IconButton icon="chevron_right" ghost size="sm" />}>
          <div className="sh-stack" style={{ gap: "0.6rem" }}>
            <div className="sh-spread">
              <span className="sh-row-h" style={{ gap: 8 }}>
                <Icon name="history" /><span style={{ fontSize: "var(--font-size-sm)" }}>Resumed combat encounter</span>
              </span>
              <span className="sh-faint sh-mono" style={{ fontSize: 11 }}>2 h ago</span>
            </div>
            <div className="sh-spread">
              <span className="sh-row-h" style={{ gap: 8 }}>
                <Icon name="bedtime" /><span style={{ fontSize: "var(--font-size-sm)" }}>Long rest · spells refreshed</span>
              </span>
              <span className="sh-faint sh-mono" style={{ fontSize: 11 }}>yesterday</span>
            </div>
          </div>
        </Card>
      </div>
    </MobileChrome>
  );
}

// ---- SIDEBAR DRAWER (used everywhere) -----------------------
function SidebarDrawer({ heading, children }) {
  return (
    <div className="sh-drawer">
      <div className="sh-drawer-head">
        <span className="ttl">{heading}</span>
        <IconButton icon="close" ghost />
      </div>
      <div className="sh-drawer-body">
        {children}
      </div>
    </div>
  );
}

// ---- SCREEN 2: SHOP (master only) ---------------------------
function ScreenShop({ drawerOpen }) {
  const items = [
    { name: "Longsword", price: "15 gp", qty: 4, rarity: "common",   meta: "Weapon · martial · 1d8" },
    { name: "Healing potion (mod.)", price: "300 gp", qty: 2, rarity: "uncommon", meta: "Potion · 2d8+3" },
    { name: "Scroll of Fireball", price: "375 gp", qty: 1, rarity: "uncommon", meta: "Scroll · arcane · CL 5" },
    { name: "Cloak of resistance +1", price: "1 000 gp", qty: 1, rarity: "rare", meta: "Wondrous · shoulders" },
    { name: "Bag of holding type II", price: "5 000 gp", qty: 1, rarity: "rare", meta: "Wondrous · 500 lb" },
    { name: "Ring of protection +2", price: "8 000 gp", qty: 1, rarity: "veryrare", meta: "Ring · +2 deflection" },
    { name: "Wand of magic missile", price: "750 gp", qty: 1, rarity: "uncommon", meta: "Wand · 50 charges" },
  ];
  return (
    <MobileChrome
      title="Shop"
      drawerOpen={drawerOpen}
      drawer={
        <SidebarDrawer heading="Generate shop">
          <div className="sh-stack">
            <MenuCard title="Settle &amp; merchant" icon="storefront" open>
              <Field label="World"><select className="sh-select" defaultValue="Embershore"><option>Embershore</option></select></Field>
              <Field label="City"><select className="sh-select" defaultValue="Aging Sun"><option>The Aging Sun</option></select></Field>
              <Field label="Merchant"><input className="sh-input" defaultValue="Drogan the Patient" /></Field>
            </MenuCard>
            <MenuCard title="Shop type" icon="local_mall" open>
              <div className="sh-row-h" style={{ flexWrap: "wrap", gap: 6 }}>
                <Chip on>General</Chip>
                <Chip>Weapons</Chip>
                <Chip>Armor</Chip>
                <Chip>Magic</Chip>
                <Chip>Potions</Chip>
              </div>
              <Field label="Wealth tier"><select className="sh-select" defaultValue="Wealthy"><option>Wealthy</option></select></Field>
              <Field label="Item count"><Stepper value={24} max={120} /></Field>
            </MenuCard>
            <MenuCard title="Rarity bias" icon="diamond" open={false} />
            <Button variant="primary" icon="auto_awesome" block>Generate inventory</Button>
            <Button variant="ghost" icon="qr_code_2" block>Share shop</Button>
          </div>
        </SidebarDrawer>
      }
    >
      <div style={{ padding: "0.75rem 1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div>
          <Filigree>The Aging Sun · Drogan the Patient</Filigree>
          <h2 className="sh-display" style={{ fontSize: "var(--font-size-2xl)", margin: "0.25rem 0" }}>General Goods</h2>
          <div className="sh-row-h" style={{ gap: 6, flexWrap: "wrap" }}>
            <Pill icon="paid">Wealth · Wealthy</Pill>
            <Pill icon="diamond" tone="accent">Magic: common</Pill>
            <Pill icon="inventory_2">24 items</Pill>
          </div>
        </div>
        <Search placeholder="Find item in shop…" />
        <Card padding={false}>
          {items.map((r, i) => (
            <div key={i} className="sh-shop-row">
              <div>
                <div className="name sh-row-h">
                  <span className={`rarity-dot rarity-${r.rarity}`} />
                  {r.name}
                </div>
                <div className="meta">{r.meta}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <span className="price">{r.price}</span>
                <span className="sh-faint sh-mono" style={{ fontSize: 11 }}>× {r.qty}</span>
              </div>
            </div>
          ))}
        </Card>
        <Button variant="ghost" icon="refresh" block>Re-roll inventory</Button>
      </div>
    </MobileChrome>
  );
}

// ---- SCREEN 3: SPELLBOOK ----------------------------------
function ScreenSpellbook() {
  const lvls = [
    { lvl: "0", name: "Cantrips", slots: 4, used: 0, spells: [
      { sch: "T", name: "Prestidigitation", meta: "Universal · 1 hour" },
      { sch: "D", name: "Detect Magic",     meta: "Divination · 1 min/level" },
      { sch: "E", name: "Ray of Frost",     meta: "Evocation · 1d3 cold" },
    ]},
    { lvl: "1", name: "1st", slots: 4, used: 1, spells: [
      { sch: "E", name: "Magic Missile", meta: "Evocation · 1d4+1 force × n", prep: true },
      { sch: "A", name: "Mage Armor",    meta: "Abjuration · +4 armor · 7 hr", prep: true },
    ]},
    { lvl: "2", name: "2nd", slots: 3, used: 2, spells: [
      { sch: "E", name: "Scorching Ray", meta: "Evocation · 4d6 fire", prep: true },
      { sch: "I", name: "Invisibility",  meta: "Illusion · 1 min/level",  prep: true },
    ]},
    { lvl: "3", name: "3rd", slots: 2, used: 0, spells: [
      { sch: "E", name: "Fireball",      meta: "Evocation · 7d6 fire · 20 ft burst", prep: true },
    ]},
    { lvl: "4", name: "4th", slots: 1, used: 1, spells: [], warn: true },
  ];
  return (
    <MobileChrome title="Spellbook" leadIcon="menu">
      <div style={{ padding: "0.75rem 1rem 6rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div>
          <Filigree>Halethorn Vellis · Wizard 7</Filigree>
          <div className="sh-spread" style={{ marginTop: 4 }}>
            <h2 className="sh-display" style={{ fontSize: "var(--font-size-2xl)", margin: 0 }}>Field Grimoire</h2>
            <Button variant="ghost" icon="bedtime" size="sm">Rest</Button>
          </div>
          <div className="sh-row-h" style={{ gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <Pill icon="auto_stories">14 spells</Pill>
            <Pill icon="bolt" tone="accent">8 prepared</Pill>
            <Pill icon="school">School · Evocation</Pill>
          </div>
        </div>
        <Search placeholder="Filter by name or school…" action={<IconButton ghost icon="tune" size="sm" />} />
        <Card padding={false}>
          {lvls.map((l, i) => (
            <React.Fragment key={i}>
              <div className="sh-level-header" data-warn={l.warn ? "true" : "false"}>
                <span className="lvl">{l.lvl}</span>
                <div>
                  <div className="sh-mono sh-faint" style={{ fontSize: 11 }}>{l.name} level</div>
                  {l.warn && <div className="sh-warn-text sh-row-h" style={{ gap: 4, fontSize: 11 }}><Icon name="warning" size={12} /> 2 prepared · 1 slot</div>}
                </div>
                <span className="slots"><Slots total={l.slots} used={l.used} /></span>
              </div>
              {l.spells.map((s, j) => (
                <div key={j} className="sh-spell-row" data-prepared={s.prep ? "true" : "false"}>
                  <span className="school">{s.sch}</span>
                  <div>
                    <div className="name">{s.name}</div>
                    <div className="meta">{s.meta}</div>
                  </div>
                  <Tickbox checked={s.prep} />
                </div>
              ))}
            </React.Fragment>
          ))}
        </Card>
      </div>
    </MobileChrome>
  );
}

// ---- SCREEN 4: LOOT (master only) --------------------------
function ScreenLoot() {
  const hoards = [
    { name: "Coin", items: [
      { name: "Platinum pieces", val: "144 pp", icon: "paid" },
      { name: "Gold pieces", val: "2 460 gp", icon: "paid" },
      { name: "Silver pieces", val: "880 sp", icon: "paid" },
    ]},
    { name: "Gems &amp; art", items: [
      { name: "Aquamarine (matched pair)", val: "500 gp", rarity: "rare", icon: "diamond" },
      { name: "Carved jade goblet", val: "250 gp", rarity: "uncommon", icon: "wine_bar" },
    ]},
    { name: "Magic items", items: [
      { name: "Wand of magic missile (CL 3)", val: "Charges 47", rarity: "uncommon", icon: "auto_fix_high" },
      { name: "Boots of striding &amp; springing", val: "5 500 gp", rarity: "rare", icon: "directions_walk" },
      { name: "Scroll · Stoneskin", val: "Arcane · CL 7", rarity: "uncommon", icon: "description" },
    ]},
  ];
  return (
    <MobileChrome title="Loot">
      <div style={{ padding: "0.75rem 1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div>
          <Filigree>Encounter · CR 8 · Standard treasure</Filigree>
          <h2 className="sh-display" style={{ fontSize: "var(--font-size-2xl)", margin: "0.25rem 0" }}>Hobgoblin warlord's hoard</h2>
          <div className="sh-row-h" style={{ gap: 6, flexWrap: "wrap" }}>
            <Pill icon="casino">Seed · #4F2A-91</Pill>
            <Pill icon="paid" tone="accent">~ 4 600 gp</Pill>
            <Pill icon="diamond">3 magic items</Pill>
          </div>
        </div>
        {hoards.map((h, i) => (
          <Card key={i} title={<span dangerouslySetInnerHTML={{ __html: h.name }} />} eyebrow={`section ${i + 1}`} padding={false}>
            {h.items.map((it, j) => (
              <div key={j} className="sh-shop-row">
                <div>
                  <div className="name sh-row-h">
                    {it.rarity && <span className={`rarity-dot rarity-${it.rarity}`} />}
                    <Icon name={it.icon} size={16} color="var(--ink-faint)" />
                    <span dangerouslySetInnerHTML={{ __html: it.name }} />
                  </div>
                </div>
                <span className="price">{it.val}</span>
              </div>
            ))}
          </Card>
        ))}
        <div className="sh-grid-2">
          <Button variant="ghost" icon="refresh">Re-roll</Button>
          <Button variant="primary" icon="folder_special">Save hoard</Button>
        </div>
      </div>
    </MobileChrome>
  );
}

// ---- SCREEN 5: SEARCH --------------------------------------
function ScreenSearch() {
  const results = [
    { k: "auto_stories", name: "Fireball",            meta: "Spell · Evocation · 3rd · Sor/Wiz", tail: "20 ft burst" },
    { k: "auto_stories", name: "Wall of Fire",        meta: "Spell · Evocation · 4th · Sor/Wiz", tail: "2d6/level" },
    { k: "auto_stories", name: "Burning Hands",       meta: "Spell · Evocation · 1st · Sor/Wiz", tail: "15 ft cone" },
    { k: "inventory_2",  name: "Flame Tongue (longsword)", meta: "Magic weapon · +1 · +1d6 fire", tail: "20 715 gp" },
    { k: "auto_awesome", name: "Empower Spell",       meta: "Feat · Metamagic · +2 slot level", tail: "metamagic" },
    { k: "auto_awesome", name: "Spell Focus (Evoc.)", meta: "Feat · General · +1 DC", tail: "general" },
    { k: "person_play",  name: "Spellcraft",          meta: "Skill · INT · trained · no synergy", tail: "trained" },
    { k: "auto_stories", name: "Fire Shield",         meta: "Spell · Evocation · 4th · Sor/Wiz", tail: "warm/chill" },
    { k: "inventory_2",  name: "Ring of fire resistance", meta: "Ring · resist fire 10", tail: "12 000 gp" },
  ];
  return (
    <MobileChrome title="Search">
      <div style={{ padding: "0.75rem 1rem 1.25rem", display: "flex", flexDirection: "column", gap: 8 }}>
        <Search value="fire" placeholder="spells · items · feats · skills" />
        <div className="sh-filter-row" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <Chip on icon="filter_alt">All · 47</Chip>
          <Chip icon="auto_stories">Spells · 23</Chip>
          <Chip icon="inventory_2">Items · 12</Chip>
          <Chip icon="auto_awesome">Feats · 8</Chip>
          <Chip icon="person_play">Skills · 4</Chip>
        </div>
        <div className="sh-row-h" style={{ gap: 6, paddingTop: 4 }}>
          <Pill icon="school">Evocation</Pill>
          <Pill icon="cancel" tone="ghost">Level 3</Pill>
          <button className="sh-pill sh-pill--ghost" style={{ cursor: "pointer" }}><Icon name="add" size={12} /> Filter</button>
        </div>
      </div>
      <Card padding={false} style={{ margin: "0 1rem 1rem", borderRadius: "var(--radius-md)" }}>
        {results.map((r, i) => (
          <div key={i} className="sh-result-row">
            <span className="kind"><Icon name={r.k} size={18} /></span>
            <div>
              <div className="name">{r.name}</div>
              <div className="meta">{r.meta}</div>
            </div>
            <span className="tail">{r.tail}</span>
          </div>
        ))}
      </Card>
    </MobileChrome>
  );
}

// ---- SCREEN 6: PLAYER SHEET → COMBAT -----------------------
function ScreenCombat() {
  return (
    <MobileChrome title="Player Sheet" bottomNav={<BottomNav current="combat" />} trailing={<IconButton icon="more_horiz" ghost size="sm" />}>
      <div style={{ padding: "0.75rem 1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {/* header */}
        <div className="sh-row-h" style={{ gap: 12 }}>
          <div className="sh-portrait">HV</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Filigree>Elf · Wizard · Lawful Neutral</Filigree>
            <div className="sh-display" style={{ fontSize: "var(--font-size-2xl)", lineHeight: 1.1, marginTop: 2 }}>Halethorn Vellis</div>
            <div className="sh-row-h" style={{ gap: 6, marginTop: 4, flexWrap: "wrap" }}>
              <Pill icon="badge" tone="accent">Wizard 7</Pill>
              <Pill icon="bolt">28 100 XP</Pill>
            </div>
          </div>
        </div>

        {/* HP bar */}
        <Card eyebrow="vitals" title="Hit points">
          <div className="sh-spread" style={{ alignItems: "flex-end", marginBottom: 8 }}>
            <span className="sh-display sh-num" style={{ fontSize: "var(--font-size-3xl)" }}>47<span className="sh-faint" style={{ fontSize: "var(--font-size-md)" }}> / 52</span></span>
            <div className="sh-row-h" style={{ gap: 8 }}>
              <IconButton icon="remove" size="sm" />
              <IconButton icon="add" size="sm" />
              <IconButton icon="healing" size="sm" />
            </div>
          </div>
          <Bar value={90} variant="hp" />
          <div className="sh-spread" style={{ marginTop: 8 }}>
            <span className="sh-faint sh-mono" style={{ fontSize: 11 }}>temp 0 · non-lethal 0</span>
            <span className="sh-faint sh-mono" style={{ fontSize: 11 }}>HD 7d6</span>
          </div>
        </Card>

        {/* AC / Init / Speed row */}
        <div className="sh-grid-3">
          <StatPill label="AC" value={21} sub="touch 14 · flat 18" accent />
          <StatPill label="Init" value="+5" sub="DEX +3" />
          <StatPill label="Speed" value="30" sub="ft · base" />
        </div>

        {/* Saves */}
        <div className="sh-grid-3">
          <StatPill label="Fort" value="+4" sub="CON +2" />
          <StatPill label="Ref" value="+7" sub="DEX +3" />
          <StatPill label="Will" value="+9" sub="WIS +0" accent />
        </div>

        {/* BAB / attacks */}
        <Card eyebrow="attacks" title="Base attack +3 / iter. —" action={<Button size="sm" variant="ghost" icon="add">Weapon</Button>}>
          <div className="sh-stack" style={{ gap: 6 }}>
            <div className="sh-row" style={{ gridTemplateColumns: "1fr auto auto", padding: "8px 0", borderBottom: "1px solid var(--border-soft)" }}>
              <div>
                <div className="name">Quarterstaff +1</div>
                <div className="meta">Two-handed · 1d6+2 bludgeoning</div>
              </div>
              <Pill icon="my_location">+5</Pill>
              <Pill icon="bolt">1d6+2</Pill>
            </div>
            <div className="sh-row" style={{ gridTemplateColumns: "1fr auto auto", padding: "8px 0", borderBottom: 0 }}>
              <div>
                <div className="name">Light crossbow</div>
                <div className="meta">80 ft · 1d8 piercing · 19-20/×2</div>
              </div>
              <Pill icon="my_location">+6</Pill>
              <Pill icon="bolt">1d8</Pill>
            </div>
          </div>
        </Card>

        {/* AC breakdown */}
        <Card eyebrow="AC breakdown" title="Armor class">
          <div className="sh-stack" style={{ gap: 6, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-muted)" }}>
            {[
              ["Base", "10"], ["Armor (mage armor)", "+4"], ["Shield", "+0"], ["DEX", "+3"], ["Size (medium)", "+0"], ["Natural", "+0"], ["Deflection (ring +2)", "+2"], ["Dodge", "+1"], ["Misc.", "+1"],
            ].map(([k, v]) => (
              <div key={k} className="sh-spread"><span>{k}</span><span className="sh-num" style={{ color: "var(--ink)" }}>{v}</span></div>
            ))}
            <div className="sh-divider" />
            <div className="sh-spread">
              <span style={{ color: "var(--ink)", fontWeight: 600 }}>Total</span>
              <span className="sh-num sh-accent-text" style={{ fontWeight: 700, fontSize: 16 }}>21</span>
            </div>
          </div>
        </Card>
      </div>
    </MobileChrome>
  );
}

// ---- SCREEN 7: PLAYER SHEET → INVENTORY ---------------------
function ScreenInventory() {
  const items = [
    { eq: true,  name: "Quarterstaff +1",           meta: "Weapon · two-handed · 1d6", qty: 1, wt: 4,  val: "2 300 gp" },
    { eq: true,  name: "Cloak of resistance +1",    meta: "Wondrous · shoulders",        qty: 1, wt: 1,  val: "1 000 gp" },
    { eq: true,  name: "Ring of protection +2",     meta: "Ring · deflection +2",         qty: 1, wt: 0,  val: "8 000 gp" },
    { eq: false, name: "Wand of magic missile",     meta: "Wand · 47 charges",            qty: 1, wt: 0.1, val: "750 gp" },
    { eq: false, name: "Scroll of fly",             meta: "Arcane · CL 5",                qty: 2, wt: 0.1, val: "150 gp" },
    { eq: false, name: "Healing potion (mod.)",     meta: "Potion · 2d8+3",               qty: 3, wt: 0.3, val: "300 gp" },
    { eq: false, name: "Spellbook, traveling",      meta: "162 spells inscribed",         qty: 1, wt: 1,  val: "—" },
    { eq: false, name: "Rope, silk (50 ft)",        meta: "Adventuring gear",             qty: 1, wt: 5,  val: "10 gp" },
    { eq: false, name: "Rations, trail (days)",     meta: "Food · 1 day each",            qty: 6, wt: 6,  val: "3 gp" },
  ];
  return (
    <MobileChrome title="Inventory" bottomNav={<BottomNav current="inventory" />}>
      <div style={{ padding: "0.75rem 1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div className="sh-spread">
          <div>
            <Filigree>Halethorn · 9 stacks</Filigree>
            <h2 className="sh-display" style={{ fontSize: "var(--font-size-2xl)", margin: 0 }}>Pack</h2>
          </div>
          <Button variant="primary" icon="add" size="sm">Add</Button>
        </div>

        {/* encumbrance bar */}
        <div className="sh-card" style={{ padding: "0.75rem 1rem" }}>
          <div className="sh-spread" style={{ marginBottom: 6 }}>
            <span className="sh-label">Carry weight · light load</span>
            <span className="sh-mono sh-num">17.5 / 38 lb</span>
          </div>
          <Bar value={46} />
          <div className="sh-row-h" style={{ gap: 8, marginTop: 8, flexWrap: "wrap", fontSize: 11 }}>
            <Pill>Light ≤ 38</Pill>
            <Pill>Medium ≤ 76</Pill>
            <Pill>Heavy ≤ 115</Pill>
            <Pill icon="paid" tone="accent">12 313 gp</Pill>
          </div>
        </div>

        <div className="sh-row-h" style={{ gap: 6, overflow: "auto" }}>
          <Chip on>All</Chip>
          <Chip>Equipped</Chip>
          <Chip>Weapons</Chip>
          <Chip>Magic</Chip>
          <Chip>Consumable</Chip>
        </div>

        <Card padding={false}>
          <div className="sh-row-head" style={{ gridTemplateColumns: "1.5rem 1fr 2.2rem 3rem 3.5rem", padding: "8px 12px" }}>
            <span></span><span>Item</span><span>Qty</span><span>Wt</span><span>Value</span>
          </div>
          {items.map((r, i) => (
            <div key={i} className="sh-row" style={{ gridTemplateColumns: "1.5rem 1fr 2.2rem 3rem 3.5rem", padding: "10px 12px" }}>
              <Tickbox checked={r.eq} />
              <div>
                <div className="name">{r.name}</div>
                <div className="meta">{r.meta}</div>
              </div>
              <span className="num sh-mono">{r.qty}</span>
              <span className="num sh-mono sh-faint">{r.wt}</span>
              <span className="num sh-mono">{r.val}</span>
            </div>
          ))}
        </Card>
      </div>
    </MobileChrome>
  );
}

// ---- SCREEN 8: PLAYER SHEET → SKILLS ------------------------
function ScreenSkills() {
  const skills = [
    { cls: true,  name: "Concentration",     abil: "CON",  ranks: 10, mod: 2, total: 12 },
    { cls: true,  name: "Knowledge (arcana)", abil: "INT", ranks: 10, mod: 5, total: 15 },
    { cls: true,  name: "Knowledge (planes)", abil: "INT", ranks: 7,  mod: 5, total: 12 },
    { cls: true,  name: "Spellcraft",         abil: "INT", ranks: 10, mod: 5, total: 17, syn: true },
    { cls: false, name: "Bluff",              abil: "CHA", ranks: 13, mod: -1, total: 12, over: true },
    { cls: true,  name: "Decipher Script",    abil: "INT", ranks: 3,  mod: 5, total: 8 },
    { cls: false, name: "Climb",              abil: "STR", ranks: 0,  mod: 1, total: 1 },
    { cls: false, name: "Listen",             abil: "WIS", ranks: 0,  mod: 2, total: 2 },
  ];
  return (
    <MobileChrome title="Skills" bottomNav={<BottomNav current="skills" />}>
      <div style={{ padding: "0.75rem 1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div className="sh-spread">
          <div>
            <Filigree>Halethorn · Wizard 7</Filigree>
            <h2 className="sh-display" style={{ fontSize: "var(--font-size-2xl)", margin: 0 }}>Skills</h2>
          </div>
          <Pill icon="bolt" tone="accent">63 / 70 ranks</Pill>
        </div>

        <div className="sh-warn-strip">
          <Icon name="warning" size={16} />
          1 skill exceeds its rank cap. Inputs are kept; totals are flagged.
        </div>

        <Search placeholder="Filter skills…" />
        <div className="sh-row-h" style={{ gap: 6, flexWrap: "wrap" }}>
          <Chip on>All</Chip>
          <Chip>Class</Chip>
          <Chip>Trained</Chip>
          <Chip>By INT</Chip>
        </div>

        <Card padding={false}>
          <div className="sh-row-head" style={{ gridTemplateColumns: "0.5rem 1fr 4.5rem 2.5rem 2.5rem", padding: "8px 12px" }}>
            <span></span><span>Skill</span><span>Ranks</span><span>Mod</span><span>Total</span>
          </div>
          {skills.map((r, i) => (
            <div key={i} className={`sh-row ${r.over ? "is-overlimit" : ""}`} style={{ gridTemplateColumns: "0.5rem 1fr 4.5rem 2.5rem 2.5rem", padding: "10px 12px" }}>
              <span className="rarity-dot" style={{ background: r.cls ? "var(--accent)" : "transparent", border: r.cls ? 0 : "1px solid var(--border)" }} />
              <div>
                <div className="name">
                  {r.name}
                  {r.syn && <Pill tone="accent" icon="link" style={{ marginLeft: 6 }}>synergy +2</Pill>}
                  {r.over && <Pill tone="warn" icon="warning" style={{ marginLeft: 6 }}>cap +8</Pill>}
                </div>
                <div className="meta">{r.abil} · {r.cls ? "class" : "cross-class"}</div>
              </div>
              <Stepper value={r.ranks} />
              <span className="num sh-mono">{r.mod >= 0 ? "+" + r.mod : r.mod}</span>
              <span className="num sh-mono" style={{ fontWeight: 700, color: r.over ? "var(--warn)" : "var(--ink)" }}>{r.total}</span>
            </div>
          ))}
        </Card>
      </div>
    </MobileChrome>
  );
}

// ---- SCREEN 9: PLAYER SHEET → FEATS ------------------------
function ScreenFeats() {
  const feats = [
    { name: "Scribe Scroll",        meta: "Item creation · class bonus · 1st", tag: "auto" },
    { name: "Spell Focus (Evoc.)",  meta: "General · +1 DC evocation spells", tag: "" },
    { name: "Greater Spell Focus (Evoc.)", meta: "General · +1 DC · req. Spell Focus", tag: "" },
    { name: "Empower Spell",        meta: "Metamagic · +2 slot · ×1.5 dice", tag: "" },
    { name: "Combat Casting",       meta: "+4 Concentration on defensive cast", tag: "" },
    { name: "Improved Initiative",  meta: "+4 to initiative checks", tag: "" },
  ];
  return (
    <MobileChrome title="Feats" bottomNav={<BottomNav current="feats" />}>
      <div style={{ padding: "0.75rem 1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div className="sh-spread">
          <div>
            <Filigree>6 of 6 selected</Filigree>
            <h2 className="sh-display" style={{ fontSize: "var(--font-size-2xl)", margin: 0 }}>Feats</h2>
          </div>
          <Button variant="primary" icon="add" size="sm">Choose feat</Button>
        </div>
        <div className="sh-stack" style={{ gap: 8 }}>
          {feats.map((f, i) => (
            <div key={i} className="sh-card" style={{ padding: "0.75rem 1rem" }}>
              <div className="sh-spread">
                <div>
                  <div className="sh-row-h" style={{ gap: 6 }}>
                    <Icon name="auto_awesome" color="var(--accent)" />
                    <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--font-size-lg)", fontWeight: 600 }}>{f.name}</span>
                    {f.tag === "auto" && <Pill tone="accent" icon="bolt">class bonus</Pill>}
                  </div>
                  <div className="sh-faint" style={{ fontSize: 12, marginTop: 2 }}>{f.meta}</div>
                </div>
                <IconButton icon="info" ghost size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </MobileChrome>
  );
}

// ---- SCREEN 10: PLAYER SHEET → FEATURES --------------------
function ScreenFeatures() {
  const classFeatures = [
    { name: "Arcane school: Evocation", meta: "Specialist · two prohibited schools (Necromancy, Enchantment)" },
    { name: "Familiar — owl",            meta: "Granted at 1st · +3 Spot · share spells" },
    { name: "Bonus feat (5th)",          meta: "Greater Spell Focus (Evocation)" },
    { name: "Bonus feat (10th)",         meta: "Locked until 10th", locked: true },
  ];
  const raceFeatures = [
    { name: "Elven immunities",     meta: "Immune to magic sleep · +2 vs enchantments" },
    { name: "Low-light vision",      meta: "See twice as far as humans in dim light" },
    { name: "Keen senses",           meta: "+2 racial bonus on Listen, Search, Spot" },
    { name: "Weapon proficiency",    meta: "Longsword, rapier, longbow, shortbow" },
  ];
  return (
    <MobileChrome title="Features" bottomNav={<BottomNav current="features" />}>
      <div style={{ padding: "0.75rem 1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <Filigree>Class &amp; race features</Filigree>
        <Card title="Wizard 7 · Evocation" eyebrow="class" padding={false}>
          {classFeatures.map((c, i) => (
            <div key={i} className="sh-row" style={{ gridTemplateColumns: "auto 1fr auto", padding: "12px 16px" }}>
              <Icon name={c.locked ? "lock" : "extension"} color={c.locked ? "var(--ink-faint)" : "var(--accent)"} />
              <div>
                <div className="name">{c.name}</div>
                <div className="meta">{c.meta}</div>
              </div>
              {c.locked && <Pill icon="lock">10th</Pill>}
            </div>
          ))}
        </Card>
        <Card title="Elf" eyebrow="race" padding={false}>
          {raceFeatures.map((c, i) => (
            <div key={i} className="sh-row" style={{ gridTemplateColumns: "auto 1fr", padding: "12px 16px" }}>
              <Icon name="auto_fix_high" color="var(--accent)" />
              <div>
                <div className="name">{c.name}</div>
                <div className="meta">{c.meta}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </MobileChrome>
  );
}

// ---- SCREEN 11: PLAYER SHEET → SPELLS ----------------------
function ScreenSpells() {
  const lvls = [
    { lvl: "0", slots: 4, used: 0, spells: [
      { sch: "T", name: "Prestidigitation", meta: "Universal · DC 10", prep: true },
      { sch: "E", name: "Ray of Frost", meta: "Evocation · 1d3 cold · DC 12", prep: true },
    ]},
    { lvl: "1", slots: 4, used: 1, spells: [
      { sch: "E", name: "Magic Missile", meta: "1d4+1 force × 3 missiles", prep: true },
      { sch: "A", name: "Mage Armor", meta: "+4 armor · 7 hr", prep: true },
      { sch: "E", name: "Burning Hands", meta: "Cone · 5d4 fire · DC 13", prep: true },
      { sch: "T", name: "Expeditious Retreat", meta: "Speed +30 · 7 min", prep: false },
    ]},
    { lvl: "2", slots: 3, used: 2, spells: [
      { sch: "E", name: "Scorching Ray", meta: "4d6 fire · ranged touch", prep: true },
      { sch: "I", name: "Invisibility", meta: "Self · 7 min", prep: true },
    ]},
    { lvl: "3", slots: 2, used: 0, spells: [
      { sch: "E", name: "Fireball", meta: "7d6 fire · 20 ft burst · DC 15", prep: true },
      { sch: "T", name: "Haste", meta: "+1 attack, +30 ft · 7 rounds", prep: true },
    ]},
    { lvl: "4", slots: 1, used: 0, spells: [
      { sch: "E", name: "Fire Shield", meta: "Warm/chill · 7 rounds · DC 16", prep: false },
    ]},
  ];
  return (
    <MobileChrome title="Spells" bottomNav={<BottomNav current="spells" />}>
      <div style={{ padding: "0.75rem 1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div className="sh-spread">
          <div>
            <Filigree>Halethorn · prepared caster</Filigree>
            <h2 className="sh-display" style={{ fontSize: "var(--font-size-2xl)", margin: 0 }}>Daily spells</h2>
          </div>
          <Button size="sm" icon="bedtime" variant="ghost">Long rest</Button>
        </div>

        <div className="sh-card" style={{ padding: "0.75rem 1rem" }}>
          <div className="sh-row-h" style={{ justifyContent: "space-around", gap: 0 }}>
            {lvls.map((l, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <span className="sh-eyebrow">{l.lvl}</span>
                <Slots total={l.slots} used={l.used} />
              </div>
            ))}
          </div>
        </div>

        <Card padding={false}>
          {lvls.map((l, i) => (
            <React.Fragment key={i}>
              <div className="sh-level-header">
                <span className="lvl">{l.lvl}</span>
                <div>
                  <div className="sh-mono sh-faint" style={{ fontSize: 11 }}>{l.slots - l.used} of {l.slots} slots</div>
                </div>
                <span className="slots"><Slots total={l.slots} used={l.used} /></span>
              </div>
              {l.spells.map((s, j) => (
                <div key={j} className="sh-spell-row" data-prepared={s.prep ? "true" : "false"}>
                  <span className="school">{s.sch}</span>
                  <div>
                    <div className="name">{s.name}</div>
                    <div className="meta">{s.meta}</div>
                  </div>
                  <Tickbox checked={s.prep} />
                </div>
              ))}
            </React.Fragment>
          ))}
        </Card>
      </div>
    </MobileChrome>
  );
}

// ---- SCREEN 12: PLAYER SHEET → NOTES -----------------------
function ScreenNotes() {
  return (
    <MobileChrome title="Notes" bottomNav={<BottomNav current="notes" />} trailing={<IconButton icon="add" ghost size="sm" />}>
      <div style={{ padding: "0.75rem 1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div className="sh-spread">
          <div>
            <Filigree>3 notes · last edited 2 h ago</Filigree>
            <h2 className="sh-display" style={{ fontSize: "var(--font-size-2xl)", margin: 0 }}>Adventurer's log</h2>
          </div>
          <Pill icon="cloud_off">Local only</Pill>
        </div>

        <div className="sh-row-h" style={{ gap: 6, overflow: "auto" }}>
          <Chip on>Recent</Chip>
          <Chip>Quest</Chip>
          <Chip>Lore</Chip>
          <Chip>NPC</Chip>
        </div>

        <Card eyebrow="quest · today" title="The Aging Sun · innkeeper" action={<IconButton ghost icon="more_vert" size="sm" />}>
          <textarea
            className="sh-textarea"
            defaultValue={`Drogan asked the party to investigate the cellar – something with too many legs has been "rearranging the casks." Reward: 250 gp + first pick of whatever moves down there. Watch for that scarred half-orc at the back table; he hasn't touched his ale in an hour.`}
            style={{ minHeight: "11rem" }}
          />
          <div className="sh-spread" style={{ marginTop: 8 }}>
            <span className="sh-faint sh-mono" style={{ fontSize: 11 }}>edited 14:22</span>
            <div className="sh-row-h" style={{ gap: 6 }}>
              <Button variant="ghost" size="sm" icon="format_bold">B</Button>
              <Button variant="ghost" size="sm" icon="format_list_bulleted">List</Button>
              <Button variant="primary" size="sm" icon="save">Save</Button>
            </div>
          </div>
        </Card>

        <Card eyebrow="lore" title="Embershore — port city">
          <div className="sh-faint" style={{ fontSize: 13, lineHeight: 1.5 }}>
            Population ~ 4 000. Brass-lantern district near the docks; the temple of the Aging Sun crowns the cliff.
            Aristos run the wine trade; the dockmaster's word is law below the seawall.
          </div>
        </Card>
      </div>
    </MobileChrome>
  );
}

// ---- DRAWER STATES + MODAL EXAMPLES -------------------------
function ScreenSheetDrawer() {
  return (
    <MobileChrome
      title="Player Sheet"
      drawerOpen
      drawer={
        <SidebarDrawer heading="Character">
          <div className="sh-stack">
            <div className="sh-row-h" style={{ gap: 10 }}>
              <div className="sh-portrait" style={{ width: "3.5rem", height: "3.5rem", fontSize: "1.5rem" }}>HV</div>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--font-size-xl)", fontWeight: 600 }}>Halethorn V.</div>
                <div className="sh-faint" style={{ fontSize: 12 }}>Wizard 7 · Elf · LN</div>
              </div>
            </div>
            <MenuCard title="Switch character" icon="people" open>
              <div className="sh-stack" style={{ gap: 6 }}>
                {[
                  { n: "Halethorn", c: "Wizard 7", on: true },
                  { n: "Brann Stoneheart", c: "Fighter 6 / Cleric 1" },
                  { n: "Vetiver Ash", c: "Rogue 5" },
                ].map(p => (
                  <button key={p.n} className="sh-row sh-row-h" style={{ background: p.on ? "var(--accent-soft)" : "transparent", border: p.on ? "1px solid var(--accent-muted)" : "1px solid var(--border-soft)", borderRadius: "var(--radius-md)", padding: "10px 12px", cursor: "pointer", textAlign: "left" }}>
                    <Icon name="badge" color={p.on ? "var(--accent)" : "var(--ink-faint)"} />
                    <div style={{ flex: 1 }}>
                      <div className="name">{p.n}</div>
                      <div className="meta">{p.c}</div>
                    </div>
                    {p.on && <Pill tone="accent" icon="check">active</Pill>}
                  </button>
                ))}
              </div>
              <Button block icon="add" variant="ghost">New character</Button>
            </MenuCard>
            <MenuCard title="Quick actions" icon="bolt" open>
              <div className="sh-grid-2">
                <Button variant="ghost" icon="bedtime" size="sm">Long rest</Button>
                <Button variant="ghost" icon="healing" size="sm">Heal</Button>
                <Button variant="ghost" icon="casino" size="sm">Roll d20</Button>
                <Button variant="ghost" icon="autorenew" size="sm">Reset day</Button>
              </div>
            </MenuCard>
            <MenuCard title="Conditions" icon="emoji_emotions" open={false} badge="2" />
            <MenuCard title="Notes &amp; logs" icon="edit_note" open={false} />
          </div>
        </SidebarDrawer>
      }
      bottomNav={<BottomNav current="combat" />}
    >
      <div style={{ padding: "0.75rem 1rem 1.25rem" }}>
        <div style={{ height: "100%", opacity: 0.4 }}>
          <Filigree>Underneath: combat page</Filigree>
        </div>
      </div>
    </MobileChrome>
  );
}

function ScreenAccentSheet() {
  return (
    <MobileChrome
      title="Spellbook"
      sheet={
        <div className="sh-sheet">
          <div className="handle" />
          <div className="sh-sheet-head">
            <div>
              <Filigree>Theme</Filigree>
              <div className="ttl">Accent color</div>
            </div>
            <IconButton ghost icon="close" />
          </div>
          <div className="sh-faint" style={{ fontSize: 12, marginBottom: 12 }}>The whole UI reskins live — buttons, slots, focus rings, selected rows.</div>
          <div className="sh-accent-hues">
            {[
              { n: "Crimson",  c: "oklch(0.66 0.17 22)", on: true },
              { n: "Brass",    c: "oklch(0.74 0.13 78)" },
              { n: "Olive",    c: "oklch(0.65 0.12 110)" },
              { n: "Emerald",  c: "oklch(0.66 0.13 155)" },
              { n: "Teal",     c: "oklch(0.66 0.10 200)" },
              { n: "Royal",    c: "oklch(0.62 0.15 260)" },
              { n: "Indigo",   c: "oklch(0.60 0.13 285)" },
              { n: "Violet",   c: "oklch(0.64 0.16 305)" },
              { n: "Plum",     c: "oklch(0.60 0.14 335)" },
              { n: "Rose",     c: "oklch(0.70 0.13 0)" },
              { n: "Bronze",   c: "oklch(0.58 0.10 50)" },
              { n: "Slate",    c: "oklch(0.62 0.02 250)" },
            ].map(h => (
              <div key={h.n} className={`sh-hue ${h.on ? "is-active" : ""}`} style={{ "--swatch": h.c }} />
            ))}
          </div>
          <div className="sh-divider" />
          <div className="sh-spread">
            <span className="sh-label">Theme</span>
            <div className="sh-mode-toggle">
              <button aria-pressed="true">Dark</button>
              <button aria-pressed="false">Parchment</button>
            </div>
          </div>
        </div>
      }
    >
      <div style={{ padding: "0.75rem 1rem", opacity: 0.4 }}>
        <Filigree>Underneath: spellbook</Filigree>
      </div>
    </MobileChrome>
  );
}

function ScreenFeatModal() {
  return (
    <MobileChrome
      title="Feats"
      bottomNav={<BottomNav current="feats" />}
      modal={
        <div className="sh-modal-scrim">
          <div className="sh-modal" style={{ maxWidth: "20rem" }}>
            <div className="sh-modal-head">
              <Filigree>level 9 · choose 1</Filigree>
              <div>Pick a new feat</div>
            </div>
            <div className="sh-modal-body">
              <Search placeholder="Search feats…" />
              <div className="sh-stack" style={{ gap: 6 }}>
                {[
                  { n: "Maximize Spell", m: "Metamagic · +3 slot · max dice", on: true },
                  { n: "Quicken Spell",  m: "Metamagic · +4 slot · swift action", warn: "prereq STR not met" },
                  { n: "Heighten Spell", m: "Metamagic · +N slot · raise level" },
                ].map(f => (
                  <div key={f.n} className="sh-card" style={{ padding: "0.65rem 0.85rem", borderColor: f.on ? "var(--accent-muted)" : undefined, background: f.on ? "var(--accent-soft)" : undefined }}>
                    <div className="sh-spread">
                      <div>
                        <div className="name" style={{ fontWeight: 600 }}>{f.n}</div>
                        <div className="meta sh-faint" style={{ fontSize: 12 }}>{f.m}</div>
                      </div>
                      <Tickbox checked={!!f.on} />
                    </div>
                    {f.warn && (
                      <div className="sh-warn-strip" style={{ marginTop: 8, fontSize: 11 }}>
                        <Icon name="warning" size={14} /> {f.warn}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="sh-modal-foot">
              <Button variant="ghost">Cancel</Button>
              <Button variant="primary" icon="check">Confirm</Button>
            </div>
          </div>
        </div>
      }
    >
      <div style={{ padding: "0.75rem 1rem", opacity: 0.4 }}>
        <Filigree>Underneath: feats list</Filigree>
      </div>
    </MobileChrome>
  );
}

window.MobileScreens = {
  ScreenHome, ScreenShop, ScreenSpellbook, ScreenLoot, ScreenSearch,
  ScreenCombat, ScreenInventory, ScreenSkills, ScreenFeats, ScreenFeatures, ScreenSpells, ScreenNotes,
  ScreenSheetDrawer, ScreenAccentSheet, ScreenFeatModal,
};
