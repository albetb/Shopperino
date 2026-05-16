// =============================================================
// SHOPPERINO — RESPONSIVE (tablet 768, desktop 1280)
// Home · Combat · Inventory · Search · Shop
// =============================================================

// ---- desktop chrome (persistent sidebar + full tab bar) ----
function DesktopChrome({ activeTab = "sheet", master = true, sidebar, children, currentSub }) {
  const tabs = [
    { id: "home", label: "Home", icon: "home" },
    { id: "shop", label: "Shop", icon: "shopping_cart", master: true },
    { id: "spellbook", label: "Spellbook", icon: "menu_book" },
    { id: "loot", label: "Loot", icon: "money_bag", master: true },
    { id: "search", label: "Search", icon: "search" },
    { id: "sheet", label: "Player Sheet", icon: "badge" },
  ];
  return (
    <div className="sh-desktop">
      {/* top bar */}
      <div className="sh-topbar" style={{ height: "3.75rem", padding: "0 1.5rem" }}>
        <div className="sh-topbar-brand" style={{ flex: "0 0 auto", marginRight: "1.5rem" }}>
          <span className="sh-mark">S</span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--font-size-2xl)", letterSpacing: "0.01em" }}>Shopperino</span>
        </div>
        <div className="sh-tabs" style={{ flex: 1 }}>
          {tabs.filter(t => master || !t.master).map(t => (
            <button key={t.id} className="sh-tab" aria-current={activeTab === t.id ? "page" : undefined}>
              <Icon name={t.icon} />{t.label}
              {t.master && <Pill tone="accent" style={{ marginLeft: 4 }}>M</Pill>}
            </button>
          ))}
        </div>
        <div className="sh-topbar-actions">
          <div className="sh-mode-toggle">
            <button aria-pressed={master ? "true" : "false"}>Master</button>
            <button aria-pressed={!master ? "true" : "false"}>Player</button>
          </div>
          <IconButton icon="palette" badge />
          <IconButton icon="settings" ghost />
        </div>
      </div>
      {/* player-sheet sub-tabs (only on sheet) */}
      {activeTab === "sheet" && (
        <div style={{ display: "flex", gap: 6, padding: "10px 24px", borderBottom: "1px solid var(--border-soft)", background: "var(--bg-elev)" }}>
          {[
            { id: "combat", icon: "swords", label: "Combat" },
            { id: "inventory", icon: "backpack", label: "Inventory" },
            { id: "skills", icon: "person_play", label: "Skills" },
            { id: "feats", icon: "auto_awesome", label: "Feats" },
            { id: "features", icon: "extension", label: "Features" },
            { id: "spells", icon: "wand_stars", label: "Spells" },
            { id: "notes", icon: "edit_note", label: "Notes" },
          ].map(s => (
            <button key={s.id} className="sh-tab" aria-current={currentSub === s.id ? "page" : undefined}>
              <Icon name={s.icon} /> {s.label}
            </button>
          ))}
        </div>
      )}
      {/* body */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {sidebar && (
          <aside style={{ width: "18rem", borderRight: "1px solid var(--border-soft)", padding: "1rem", overflow: "auto", background: "var(--bg-elev)" }}>
            {sidebar}
          </aside>
        )}
        <main style={{ flex: 1, overflow: "auto", padding: "1.5rem 1.75rem" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

// ---- tablet chrome ----
function TabletChrome({ activeTab, master = true, sidebar, children, currentSub }) {
  const tabs = [
    { id: "home", icon: "home" }, { id: "shop", icon: "shopping_cart", master: true },
    { id: "spellbook", icon: "menu_book" }, { id: "loot", icon: "money_bag", master: true },
    { id: "search", icon: "search" }, { id: "sheet", icon: "badge" },
  ];
  return (
    <div className="sh-tablet">
      <div className="sh-topbar">
        <div className="sh-topbar-brand"><span className="sh-mark">S</span><span style={{ fontFamily: "var(--font-display)", fontSize: "var(--font-size-xl)" }}>Shopperino</span></div>
        <div className="sh-tabs">
          {tabs.filter(t => master || !t.master).map(t => (
            <button key={t.id} className="sh-tab" aria-current={activeTab === t.id ? "page" : undefined} style={{ padding: "8px 10px" }}>
              <Icon name={t.icon} />
            </button>
          ))}
        </div>
        <div className="sh-topbar-actions">
          <IconButton icon="palette" badge size="sm" />
        </div>
      </div>
      {activeTab === "sheet" && (
        <div style={{ display: "flex", gap: 4, padding: "8px 16px", borderBottom: "1px solid var(--border-soft)", background: "var(--bg-elev)", overflow: "auto" }}>
          {[
            { id: "combat", icon: "swords", label: "Combat" },
            { id: "inventory", icon: "backpack", label: "Inv" },
            { id: "skills", icon: "person_play", label: "Skills" },
            { id: "feats", icon: "auto_awesome", label: "Feats" },
            { id: "features", icon: "extension", label: "Features" },
            { id: "spells", icon: "wand_stars", label: "Spells" },
            { id: "notes", icon: "edit_note", label: "Notes" },
          ].map(s => (
            <button key={s.id} className="sh-tab" aria-current={currentSub === s.id ? "page" : undefined} style={{ fontSize: 12 }}>
              <Icon name={s.icon} size={16} /> {s.label}
            </button>
          ))}
        </div>
      )}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {sidebar && (
          <aside style={{ width: "16rem", borderRight: "1px solid var(--border-soft)", padding: "0.75rem", overflow: "auto", background: "var(--bg-elev)" }}>
            {sidebar}
          </aside>
        )}
        <main style={{ flex: 1, overflow: "auto", padding: "1rem 1.25rem" }}>{children}</main>
      </div>
    </div>
  );
}

// ---- Desktop HOME ----
function DesktopHome() {
  return (
    <DesktopChrome activeTab="home">
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24, maxWidth: 1100, margin: "0 auto" }}>
        <div>
          <Filigree>Embershore campaign · session 14</Filigree>
          <h1 className="sh-display" style={{ fontSize: "var(--font-size-5xl)", margin: "8px 0 6px", lineHeight: 1.05 }}>
            The party rests at <span className="sh-accent-text">The Aging Sun</span>.
          </h1>
          <p className="sh-muted" style={{ maxWidth: 560, fontSize: 16 }}>
            Continue from your last session, or jump into any tool. All saved locally — nothing leaves this device.
          </p>
          <div className="sh-row-h" style={{ gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            <Button variant="primary" icon="badge">Open player sheet</Button>
            <Button icon="auto_stories">Spellbook</Button>
            <Button variant="ghost" icon="qr_code_scanner">Scan shop</Button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 28 }}>
            {[
              { id: "shop",     name: "Shop",      desc: "Random merchant inventory by tier.",     icon: "shopping_cart", master: true },
              { id: "loot",     name: "Loot",      desc: "Hoard generator by CR & rarity bias.",    icon: "money_bag",     master: true },
              { id: "spellbk",  name: "Spellbook", desc: "Per-character spell prep & slot tracker.", icon: "menu_book" },
              { id: "search",   name: "Search",    desc: "Spells, items, feats, skills · offline.", icon: "search" },
              { id: "sheet",    name: "Player",    desc: "Halethorn · Wizard 7 · 47/52 HP",         icon: "badge", accent: true },
              { id: "notes",    name: "Notes",     desc: "Quest, lore & NPC adventure log.",         icon: "edit_note" },
            ].map(t => (
              <div key={t.id} className={`sh-tile ${t.accent ? "sh-tile--master" : ""}`} style={{ minHeight: "8.5rem" }}>
                <Icon name={t.icon} />
                <div className="t-name">{t.name}</div>
                <div className="t-desc">{t.desc}</div>
                {t.master && <Pill tone="accent" icon="key" style={{ alignSelf: "flex-start" }}>Master</Pill>}
              </div>
            ))}
          </div>
        </div>

        <div className="sh-stack">
          <Card eyebrow="active character" title="Halethorn Vellis" action={<Button size="sm" variant="ghost" icon="swap_horiz">Switch</Button>}>
            <div className="sh-row-h" style={{ gap: 12 }}>
              <div className="sh-portrait" style={{ width: "4rem", height: "4rem" }}>HV</div>
              <div style={{ flex: 1 }}>
                <div className="sh-mono sh-faint" style={{ fontSize: 12 }}>Elf · Wizard 7 · LN</div>
                <div className="sh-spread" style={{ marginTop: 4 }}>
                  <span className="sh-label">HP</span>
                  <span className="sh-mono sh-num">47 / 52</span>
                </div>
                <Bar value={90} variant="hp" />
              </div>
            </div>
            <div className="sh-divider" />
            <div className="sh-grid-3" style={{ gap: 8 }}>
              <StatPill label="AC" value={21} accent />
              <StatPill label="Init" value="+5" />
              <StatPill label="DC" value={17} sub="evoc · 18" />
            </div>
          </Card>
          <Card eyebrow="recent" title="Today's session log" padding={false}>
            {[
              { t: "Long rest · spells refreshed", m: "yesterday 23:14", i: "bedtime" },
              { t: "Looted hoard · 2 460 gp + ring", m: "20:48", i: "money_bag" },
              { t: "Combat · vs. hobgoblin warlord", m: "20:11", i: "swords" },
              { t: "Quest accepted · cellar critters", m: "19:02", i: "edit_note" },
            ].map((e, i) => (
              <div key={i} className="sh-row" style={{ gridTemplateColumns: "auto 1fr auto" }}>
                <Icon name={e.i} color="var(--accent)" />
                <div>
                  <div className="name">{e.t}</div>
                </div>
                <span className="sh-faint sh-mono" style={{ fontSize: 11 }}>{e.m}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </DesktopChrome>
  );
}

// ---- shared sidebar contents ----
function PlayerSheetSidebar({ active = "combat" }) {
  return (
    <div className="sh-stack">
      <div className="sh-row-h" style={{ gap: 10 }}>
        <div className="sh-portrait" style={{ width: "3rem", height: "3rem", fontSize: "1.25rem" }}>HV</div>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--font-size-lg)", fontWeight: 600 }}>Halethorn V.</div>
          <div className="sh-faint" style={{ fontSize: 12 }}>Wizard 7 · Elf · LN</div>
        </div>
      </div>
      <MenuCard title="Character" icon="badge" open>
        <Field label="Name"><input className="sh-input" defaultValue="Halethorn Vellis" /></Field>
        <div className="sh-grid-2">
          <Field label="Race"><select className="sh-select"><option>Elf</option></select></Field>
          <Field label="Class"><select className="sh-select"><option>Wizard 7</option></select></Field>
        </div>
      </MenuCard>
      <MenuCard title="Quick actions" icon="bolt" open>
        <div className="sh-grid-2">
          <Button variant="ghost" size="sm" icon="bedtime">Long rest</Button>
          <Button variant="ghost" size="sm" icon="healing">Heal</Button>
          <Button variant="ghost" size="sm" icon="casino">Roll d20</Button>
          <Button variant="ghost" size="sm" icon="autorenew">Reset day</Button>
        </div>
      </MenuCard>
      <MenuCard title="Conditions" icon="emoji_emotions" open={false} badge="2" />
      <MenuCard title="Companions" icon="pets" open={false} />
    </div>
  );
}

// ---- Desktop COMBAT ----
function DesktopCombat() {
  return (
    <DesktopChrome activeTab="sheet" currentSub="combat" sidebar={<PlayerSheetSidebar active="combat" />}>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
        {/* header strip */}
        <div style={{ gridColumn: "1 / -1" }}>
          <div className="sh-card" style={{ padding: "1rem 1.25rem", display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 16, alignItems: "center" }}>
            <div className="sh-portrait" style={{ width: "4.5rem", height: "4.5rem" }}>HV</div>
            <div>
              <Filigree>Elf · Wizard · Lawful Neutral</Filigree>
              <div className="sh-display" style={{ fontSize: "var(--font-size-3xl)", lineHeight: 1.05 }}>Halethorn Vellis</div>
              <div className="sh-row-h" style={{ gap: 6, marginTop: 4 }}>
                <Pill icon="badge" tone="accent">Wizard 7</Pill>
                <Pill icon="bolt">28 100 / 36 000 XP</Pill>
                <Pill icon="favorite">HP 47 / 52</Pill>
              </div>
            </div>
            <div className="sh-grid-3" style={{ gap: 8, minWidth: "22rem" }}>
              <StatPill label="AC" value={21} sub="touch 14 · flat 18" accent />
              <StatPill label="Init" value="+5" sub="DEX +3" />
              <StatPill label="Speed" value="30" sub="ft" />
            </div>
          </div>
        </div>

        {/* left column */}
        <div className="sh-stack">
          <Card eyebrow="vitals" title="Hit points">
            <div className="sh-spread" style={{ alignItems: "flex-end", marginBottom: 8 }}>
              <span className="sh-display sh-num" style={{ fontSize: "var(--font-size-4xl)" }}>47<span className="sh-faint" style={{ fontSize: "var(--font-size-lg)" }}> / 52</span></span>
              <div className="sh-row-h" style={{ gap: 6 }}>
                <Button size="sm" icon="remove" variant="ghost">−1</Button>
                <Button size="sm" icon="add" variant="ghost">+1</Button>
                <Button size="sm" icon="healing">Heal</Button>
                <Button size="sm" icon="bolt" variant="ghost">Damage</Button>
              </div>
            </div>
            <Bar value={90} variant="hp" />
            <div className="sh-grid-3" style={{ marginTop: 12, gap: 8 }}>
              <StatPill label="Temp" value="0" />
              <StatPill label="Non-lethal" value="0" />
              <StatPill label="HD" value="7d6" />
            </div>
          </Card>

          <Card eyebrow="attacks" title="Base attack · +3" action={<Button size="sm" variant="ghost" icon="add">Weapon</Button>}>
            {[
              { name: "Quarterstaff +1", meta: "Two-handed · 1d6+2 bludgeoning · ×2 crit", atk: "+5", dmg: "1d6+2" },
              { name: "Light crossbow", meta: "80 ft · 1d8 piercing · 19–20/×2",      atk: "+6", dmg: "1d8" },
              { name: "Dagger", meta: "Thrown 10 ft · 1d4 piercing · 19–20/×2",        atk: "+4", dmg: "1d4" },
            ].map((w, i) => (
              <div key={i} className="sh-row" style={{ gridTemplateColumns: "auto 1fr auto auto", padding: "10px 0", borderBottom: i < 2 ? "1px solid var(--border-soft)" : 0 }}>
                <Icon name="swords" color="var(--accent)" />
                <div>
                  <div className="name">{w.name}</div>
                  <div className="meta">{w.meta}</div>
                </div>
                <Pill icon="my_location">{w.atk}</Pill>
                <Pill icon="bolt">{w.dmg}</Pill>
              </div>
            ))}
          </Card>
        </div>

        {/* right column */}
        <div className="sh-stack">
          <Card eyebrow="saves" title="Saving throws">
            <div className="sh-grid-3" style={{ gap: 8 }}>
              <StatPill label="Fortitude" value="+4" sub="base +2 · CON +2" />
              <StatPill label="Reflex" value="+7" sub="base +2 · DEX +3 · cloak +1 · misc +1" />
              <StatPill label="Will" value="+9" sub="base +5 · WIS +0 · cloak +1 · misc +3" accent />
            </div>
          </Card>

          <Card eyebrow="AC breakdown" title="Armor class · 21">
            <div className="sh-stack" style={{ gap: 4, fontFamily: "var(--font-mono)", fontSize: 12 }}>
              {[
                ["Base", "10"], ["Armor (mage armor)", "+4"], ["Shield", "+0"], ["DEX", "+3"], ["Size (medium)", "+0"], ["Natural", "+0"], ["Deflection (ring +2)", "+2"], ["Dodge", "+1"], ["Misc.", "+1"],
              ].map(([k, v]) => (
                <div key={k} className="sh-spread" style={{ color: "var(--ink-muted)" }}><span>{k}</span><span className="sh-num" style={{ color: "var(--ink)" }}>{v}</span></div>
              ))}
              <div className="sh-divider" />
              <div className="sh-spread"><span style={{ color: "var(--ink)", fontWeight: 600 }}>Total</span><span className="sh-num sh-accent-text" style={{ fontWeight: 700, fontSize: 16 }}>21</span></div>
              <div className="sh-spread"><span style={{ color: "var(--ink-faint)" }}>Touch · flat-footed</span><span className="sh-num">14 · 18</span></div>
            </div>
          </Card>

          <Card eyebrow="resists &amp; conditions" title="Status">
            <div className="sh-row-h" style={{ gap: 6, flexWrap: "wrap" }}>
              <Pill tone="success" icon="check_circle">Mage armored</Pill>
              <Pill icon="local_fire_department">Resist fire 5</Pill>
              <Pill tone="warn" icon="emoji_emotions">Shaken (1 r.)</Pill>
            </div>
          </Card>
        </div>
      </div>
    </DesktopChrome>
  );
}

// ---- Desktop INVENTORY ----
function DesktopInventory() {
  const items = [
    { eq: true,  name: "Quarterstaff +1",        meta: "Weapon · two-handed · 1d6", qty: 1, wt: 4,  val: "2 300 gp",  r: "uncommon" },
    { eq: true,  name: "Cloak of resistance +1", meta: "Wondrous · shoulders", qty: 1, wt: 1,  val: "1 000 gp",  r: "uncommon" },
    { eq: true,  name: "Ring of protection +2",  meta: "Ring · deflection +2", qty: 1, wt: 0,  val: "8 000 gp",  r: "rare" },
    { eq: false, name: "Wand of magic missile",  meta: "Wand · 47 charges",    qty: 1, wt: 0.1, val: "750 gp",   r: "uncommon" },
    { eq: false, name: "Scroll of fly",          meta: "Arcane · CL 5",        qty: 2, wt: 0.1, val: "150 gp",   r: "common" },
    { eq: false, name: "Healing potion (mod.)",  meta: "Potion · 2d8+3",       qty: 3, wt: 0.3, val: "300 gp",   r: "common" },
    { eq: false, name: "Scroll of stoneskin",    meta: "Arcane · CL 7",        qty: 1, wt: 0.1, val: "1 125 gp", r: "uncommon" },
    { eq: false, name: "Spellbook (traveling)",  meta: "162 spells inscribed",  qty: 1, wt: 1,   val: "—",        r: "common" },
    { eq: false, name: "Rope, silk (50 ft)",     meta: "Adventuring gear",      qty: 1, wt: 5,   val: "10 gp",    r: "common" },
    { eq: false, name: "Rations, trail",         meta: "Food · 1 day each",     qty: 6, wt: 6,   val: "3 gp",     r: "common" },
    { eq: false, name: "Tindertwig (×10)",        meta: "Adventuring gear",      qty: 10, wt: 0,  val: "10 gp",    r: "common" },
  ];
  return (
    <DesktopChrome activeTab="sheet" currentSub="inventory" sidebar={<PlayerSheetSidebar active="inventory" />}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 22rem", gap: 24 }}>
        <div>
          <div className="sh-spread" style={{ marginBottom: 12 }}>
            <div>
              <Filigree>Halethorn · 11 stacks · 17.5 lb</Filigree>
              <h2 className="sh-display" style={{ margin: 0, fontSize: "var(--font-size-3xl)" }}>Pack</h2>
            </div>
            <div className="sh-row-h" style={{ gap: 8 }}>
              <Search placeholder="Find item…" />
              <Button variant="primary" icon="add">Add item</Button>
            </div>
          </div>
          <div className="sh-row-h" style={{ gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            <Chip on>All</Chip>
            <Chip>Equipped</Chip>
            <Chip>Weapons</Chip>
            <Chip>Armor</Chip>
            <Chip>Magic</Chip>
            <Chip>Consumable</Chip>
            <Chip>Misc</Chip>
          </div>
          <Card padding={false}>
            <div className="sh-row-head" style={{ gridTemplateColumns: "2rem 1fr 5rem 4rem 5rem 5rem 3rem" }}>
              <span></span><span>Item</span><span>Rarity</span><span>Qty</span><span>Weight</span><span>Value</span><span></span>
            </div>
            {items.map((r, i) => (
              <div key={i} className="sh-row" style={{ gridTemplateColumns: "2rem 1fr 5rem 4rem 5rem 5rem 3rem" }}>
                <Tickbox checked={r.eq} />
                <div>
                  <div className="name">{r.name}</div>
                  <div className="meta">{r.meta}</div>
                </div>
                <span className="sh-row-h" style={{ gap: 6, fontSize: 12, color: "var(--ink-muted)" }}>
                  <span className={`rarity-dot rarity-${r.r}`} /> {r.r}
                </span>
                <Stepper value={r.qty} />
                <span className="num sh-mono sh-faint">{r.wt}</span>
                <span className="num sh-mono">{r.val}</span>
                <IconButton ghost size="sm" icon="more_horiz" />
              </div>
            ))}
          </Card>
        </div>

        <div className="sh-stack">
          <Card eyebrow="encumbrance" title="Carry · light load">
            <div className="sh-spread" style={{ marginBottom: 6 }}><span className="sh-label">Carried</span><span className="sh-mono sh-num">17.5 / 38 lb</span></div>
            <Bar value={46} />
            <div className="sh-stack" style={{ gap: 6, marginTop: 12, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-muted)" }}>
              <div className="sh-spread"><span>Light load</span><span>≤ 38 lb</span></div>
              <div className="sh-spread"><span>Medium load</span><span>≤ 76 lb</span></div>
              <div className="sh-spread"><span>Heavy load</span><span>≤ 115 lb</span></div>
              <div className="sh-spread"><span>Lift over head</span><span>115 lb</span></div>
            </div>
          </Card>
          <Card eyebrow="wealth" title="Coin pouch">
            <div className="sh-grid-2" style={{ gap: 8 }}>
              <StatPill label="PP" value={4} />
              <StatPill label="GP" value="1 244" accent />
              <StatPill label="SP" value={87} />
              <StatPill label="CP" value={132} />
            </div>
            <div className="sh-divider" />
            <div className="sh-spread"><span className="sh-label">Total value</span><span className="sh-mono sh-num">12 313 gp</span></div>
          </Card>
        </div>
      </div>
    </DesktopChrome>
  );
}

// ---- Desktop SEARCH ----
function DesktopSearch() {
  const results = [
    { k: "auto_stories", name: "Fireball",       meta: "Spell · Evocation · 3rd · Sor/Wiz · DC 15", tail: "20 ft burst · 7d6 fire" },
    { k: "auto_stories", name: "Wall of Fire",   meta: "Spell · Evocation · 4th · Sor/Wiz",         tail: "2d6/level damage · DC 16" },
    { k: "auto_stories", name: "Burning Hands",  meta: "Spell · Evocation · 1st · Sor/Wiz",         tail: "15 ft cone · 5d4 fire" },
    { k: "inventory_2",  name: "Flame Tongue (longsword)", meta: "Magic weapon · +1 · +1d6 fire · daylight 1/day", tail: "20 715 gp · rare" },
    { k: "auto_awesome", name: "Empower Spell",  meta: "Feat · Metamagic · +2 slot · ×1.5 dice",    tail: "metamagic" },
    { k: "auto_awesome", name: "Spell Focus (Evoc.)", meta: "Feat · General · +1 DC evocation",     tail: "general" },
    { k: "person_play",  name: "Spellcraft",     meta: "Skill · INT · trained · synergy w/ Knowledge (arcana)", tail: "trained" },
    { k: "auto_stories", name: "Fire Shield",    meta: "Spell · Evocation · 4th · Sor/Wiz · warm/chill", tail: "1 round/level" },
    { k: "inventory_2",  name: "Ring of fire resistance", meta: "Ring · resist fire 10",            tail: "12 000 gp · rare" },
    { k: "auto_stories", name: "Delayed Blast Fireball", meta: "Spell · Evocation · 7th · Sor/Wiz", tail: "7d6 fire · timer" },
  ];
  return (
    <DesktopChrome activeTab="search">
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="sh-spread" style={{ marginBottom: 12 }}>
          <div>
            <Filigree>3 540 records · offline</Filigree>
            <h2 className="sh-display" style={{ margin: 0, fontSize: "var(--font-size-3xl)" }}>Search</h2>
          </div>
          <Pill icon="cloud_off">All static · no network</Pill>
        </div>

        <Search value="fire" placeholder="spells · items · feats · skills" action={<Button size="sm" variant="ghost" icon="tune">Filters</Button>} />

        <div className="sh-row-h" style={{ gap: 6, margin: "12px 0", flexWrap: "wrap" }}>
          <Chip on icon="filter_alt">All · 47</Chip>
          <Chip icon="auto_stories">Spells · 23</Chip>
          <Chip icon="inventory_2">Items · 12</Chip>
          <Chip icon="auto_awesome">Feats · 8</Chip>
          <Chip icon="person_play">Skills · 4</Chip>
          <Pill icon="school">Evocation</Pill>
          <Pill icon="auto_fix_high">Level ≤ 5</Pill>
          <button className="sh-pill sh-pill--ghost" style={{ cursor: "pointer" }}><Icon name="add" size={12} /> Filter</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 22rem", gap: 20 }}>
          <Card padding={false}>
            {results.map((r, i) => (
              <div key={i} className="sh-result-row" style={{ gridTemplateColumns: "2.25rem 1fr 14rem", padding: "10px 16px" }}>
                <span className="kind"><Icon name={r.k} size={18} /></span>
                <div>
                  <div className="name">{r.name}</div>
                  <div className="meta">{r.meta}</div>
                </div>
                <span className="tail">{r.tail}</span>
              </div>
            ))}
          </Card>

          {/* detail pane */}
          <Card eyebrow="detail" title="Fireball" action={<IconButton ghost icon="open_in_new" size="sm" />}>
            <div className="sh-row-h" style={{ gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
              <Pill tone="accent">Evocation [fire]</Pill>
              <Pill>3rd · Sor/Wiz</Pill>
              <Pill icon="schedule">1 action</Pill>
              <Pill icon="my_location">Long 400 ft + 40/level</Pill>
              <Pill icon="bolt">7d6 · DC 15</Pill>
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.55 }}>
              A fireball spell generates a searing explosion of flame that detonates with a low roar and deals 1d6 points of fire damage per caster level (max 10d6) to every creature within the area. Unattended objects also take this damage. The explosion creates almost no pressure.
            </div>
            <div className="sh-divider" />
            <div className="sh-grid-2" style={{ gap: 8 }}>
              <Button variant="primary" icon="auto_stories">Add to spellbook</Button>
              <Button variant="ghost" icon="bookmark_add">Bookmark</Button>
            </div>
          </Card>
        </div>
      </div>
    </DesktopChrome>
  );
}

// ---- Desktop SHOP ----
function DesktopShop() {
  const items = [
    { name: "Longsword",                 meta: "Weapon · martial · 1d8 slashing", qty: 4, price: "15 gp",    r: "common" },
    { name: "Heavy steel shield",        meta: "Shield · +2 AC · -2 ACP",          qty: 3, price: "20 gp",    r: "common" },
    { name: "Studded leather +1",        meta: "Armor · light · +4 AC",            qty: 1, price: "1 175 gp", r: "uncommon" },
    { name: "Healing potion (mod.)",     meta: "Potion · 2d8+3 cure",              qty: 2, price: "300 gp",   r: "uncommon" },
    { name: "Scroll of Fireball",        meta: "Scroll · arcane · CL 5",            qty: 1, price: "375 gp",   r: "uncommon" },
    { name: "Wand of magic missile",     meta: "Wand · 50 charges · CL 1",          qty: 1, price: "750 gp",   r: "uncommon" },
    { name: "Cloak of resistance +1",    meta: "Wondrous · shoulders",              qty: 1, price: "1 000 gp", r: "rare" },
    { name: "Bag of holding type II",    meta: "Wondrous · 500 lb capacity",        qty: 1, price: "5 000 gp", r: "rare" },
    { name: "Ring of protection +2",     meta: "Ring · +2 deflection",              qty: 1, price: "8 000 gp", r: "veryrare" },
    { name: "Boots of striding &amp; springing", meta: "Wondrous · +10 speed · jump +5", qty: 1, price: "5 500 gp", r: "rare" },
  ];
  const sidebar = (
    <div className="sh-stack">
      <MenuCard title="Merchant" icon="storefront" open>
        <Field label="World"><select className="sh-select"><option>Embershore</option></select></Field>
        <Field label="City"><select className="sh-select"><option>The Aging Sun</option></select></Field>
        <Field label="Merchant"><input className="sh-input" defaultValue="Drogan the Patient" /></Field>
      </MenuCard>
      <MenuCard title="Shop type" icon="local_mall" open>
        <div className="sh-row-h" style={{ flexWrap: "wrap", gap: 6 }}>
          <Chip on>General</Chip><Chip>Weapons</Chip><Chip>Armor</Chip><Chip>Magic</Chip><Chip>Potions</Chip>
        </div>
        <Field label="Wealth tier"><select className="sh-select" defaultValue="Wealthy"><option>Wealthy</option></select></Field>
        <Field label="Item count"><Stepper value={24} max={120} /></Field>
      </MenuCard>
      <MenuCard title="Rarity bias" icon="diamond" open>
        <div className="sh-stack" style={{ gap: 6 }}>
          {["Common 60%", "Uncommon 30%", "Rare 8%", "Very rare 2%"].map(s => (
            <div key={s} className="sh-spread"><span className="sh-label">{s.split(" ")[0]}</span><span className="sh-mono sh-num">{s.split(" ")[1]}</span></div>
          ))}
        </div>
      </MenuCard>
      <Button variant="primary" icon="auto_awesome" block>Generate inventory</Button>
      <Button variant="ghost" icon="qr_code_2" block>Share via QR</Button>
    </div>
  );
  return (
    <DesktopChrome activeTab="shop" sidebar={sidebar}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <div className="sh-spread" style={{ marginBottom: 16 }}>
          <div>
            <Filigree>Embershore · The Aging Sun · Drogan the Patient</Filigree>
            <h2 className="sh-display" style={{ margin: 0, fontSize: "var(--font-size-3xl)" }}>General Goods</h2>
            <div className="sh-row-h" style={{ gap: 6, marginTop: 6 }}>
              <Pill icon="paid">Wealth · Wealthy</Pill>
              <Pill icon="diamond" tone="accent">Magic · common</Pill>
              <Pill icon="inventory_2">24 items</Pill>
            </div>
          </div>
          <div className="sh-row-h" style={{ gap: 8 }}>
            <Search placeholder="Filter shop…" />
            <Button variant="ghost" icon="refresh">Re-roll</Button>
            <Button variant="primary" icon="qr_code_2">Share</Button>
          </div>
        </div>

        <Card padding={false}>
          <div className="sh-row-head" style={{ gridTemplateColumns: "1fr 5rem 4rem 7rem 3rem" }}>
            <span>Item</span><span>Rarity</span><span>Qty</span><span>Price</span><span></span>
          </div>
          {items.map((r, i) => (
            <div key={i} className="sh-row" style={{ gridTemplateColumns: "1fr 5rem 4rem 7rem 3rem" }}>
              <div>
                <div className="name sh-row-h">
                  <span className={`rarity-dot rarity-${r.r}`} />
                  <span dangerouslySetInnerHTML={{ __html: r.name }} />
                </div>
                <div className="meta">{r.meta}</div>
              </div>
              <span className="sh-row-h" style={{ gap: 6, fontSize: 12, color: "var(--ink-muted)" }}>{r.r}</span>
              <span className="num sh-mono">{r.qty}</span>
              <span className="num sh-mono" style={{ fontWeight: 600 }}>{r.price}</span>
              <IconButton ghost size="sm" icon="add_shopping_cart" />
            </div>
          ))}
        </Card>
      </div>
    </DesktopChrome>
  );
}

// ---- TABLET COMBAT (768) ----
function TabletCombat() {
  return (
    <TabletChrome activeTab="sheet" currentSub="combat" sidebar={<PlayerSheetSidebar active="combat" />}>
      <div className="sh-stack">
        <div className="sh-card" style={{ padding: "0.75rem 1rem", display: "grid", gridTemplateColumns: "auto 1fr", gap: 12, alignItems: "center" }}>
          <div className="sh-portrait">HV</div>
          <div>
            <Filigree>Elf · Wizard · LN</Filigree>
            <div className="sh-display" style={{ fontSize: "var(--font-size-2xl)", lineHeight: 1.05 }}>Halethorn Vellis</div>
            <div className="sh-row-h" style={{ gap: 6, marginTop: 4, flexWrap: "wrap" }}>
              <Pill icon="badge" tone="accent">Wizard 7</Pill>
              <Pill icon="favorite">47 / 52</Pill>
              <Pill icon="bolt">28 100 XP</Pill>
            </div>
          </div>
        </div>
        <div className="sh-grid-3">
          <StatPill label="AC" value={21} sub="touch 14 · flat 18" accent />
          <StatPill label="Init" value="+5" sub="DEX +3" />
          <StatPill label="Speed" value="30" sub="ft" />
        </div>
        <div className="sh-grid-3">
          <StatPill label="Fort" value="+4" sub="CON +2" />
          <StatPill label="Ref"  value="+7" sub="DEX +3" />
          <StatPill label="Will" value="+9" sub="WIS +0" accent />
        </div>
        <Card eyebrow="vitals" title="Hit points">
          <div className="sh-spread" style={{ alignItems: "flex-end", marginBottom: 8 }}>
            <span className="sh-display sh-num" style={{ fontSize: "var(--font-size-3xl)" }}>47<span className="sh-faint" style={{ fontSize: "var(--font-size-md)" }}> / 52</span></span>
            <div className="sh-row-h" style={{ gap: 6 }}>
              <IconButton icon="remove" size="sm" />
              <IconButton icon="add" size="sm" />
              <Button size="sm" icon="healing">Heal</Button>
            </div>
          </div>
          <Bar value={90} variant="hp" />
        </Card>
        <Card eyebrow="attacks" title="Base attack · +3">
          {[
            { name: "Quarterstaff +1", meta: "1d6+2 bludgeoning", atk: "+5", dmg: "1d6+2" },
            { name: "Light crossbow",  meta: "1d8 piercing · 80 ft", atk: "+6", dmg: "1d8" },
          ].map((w, i) => (
            <div key={i} className="sh-row" style={{ gridTemplateColumns: "1fr auto auto", padding: "10px 0", borderBottom: i === 0 ? "1px solid var(--border-soft)" : 0 }}>
              <div><div className="name">{w.name}</div><div className="meta">{w.meta}</div></div>
              <Pill icon="my_location">{w.atk}</Pill>
              <Pill icon="bolt">{w.dmg}</Pill>
            </div>
          ))}
        </Card>
      </div>
    </TabletChrome>
  );
}

window.ResponsiveScreens = {
  DesktopHome, DesktopCombat, DesktopInventory, DesktopSearch, DesktopShop, TabletCombat,
};
