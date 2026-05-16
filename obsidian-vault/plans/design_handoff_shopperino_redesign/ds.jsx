// =============================================================
// SHOPPERINO — Design System artboard
// One canvas: tokens (colors, type, spacing, radii, shadows) +
// atoms (buttons, pills, fields, stats) + molecules (cards, rows).
// =============================================================

function Section({ title, eyebrow, children, cols = 1, gap = 16, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, ...style }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <span className="sh-eyebrow">{eyebrow}</span>
        <h3 className="sh-display" style={{ margin: 0, fontSize: "var(--font-size-2xl)" }}>{title}</h3>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap }}>
        {children}
      </div>
    </div>
  );
}

function Swatch({ name, varName, sample }) {
  return (
    <div className="sh-swatch">
      <div className="sh-swatch-chip" style={{ background: sample ?? `var(${varName})` }} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span className="sh-swatch-name">{name}</span>
        <span className="sh-swatch-meta">{varName}</span>
      </div>
    </div>
  );
}

function TypeRow({ label, size, family, weight, sample, varSize }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 16, borderBottom: "1px solid var(--border-soft)", padding: "10px 0" }}>
      <div style={{ width: 110 }}>
        <div className="sh-swatch-name">{label}</div>
        <div className="sh-swatch-meta">{varSize} · {family} {weight}</div>
      </div>
      <div style={{ flex: 1, fontFamily: family, fontWeight: weight, fontSize: size, color: "var(--ink)", lineHeight: 1.15 }}>
        {sample || "The duskblade unsheathed her arc-runed glaive."}
      </div>
      <span className="sh-swatch-meta">{size}</span>
    </div>
  );
}

function SpaceRow({ name, varName, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0", borderBottom: "1px dashed var(--border-soft)" }}>
      <div style={{ width: 80 }} className="sh-swatch-name">{name}</div>
      <div style={{ width: 88 }} className="sh-swatch-meta">{varName}</div>
      <div style={{ height: 12, background: "var(--accent)", width: value, borderRadius: 2 }} />
      <div className="sh-swatch-meta">{value}</div>
    </div>
  );
}

function RadiusRow({ name, varName, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ width: 64, height: 64, background: "var(--surface-2)", border: "1px solid var(--border-soft)", borderRadius: value }} />
      <div className="sh-swatch-name">{name}</div>
      <div className="sh-swatch-meta">{varName}</div>
    </div>
  );
}

function ShadowRow({ name, varName }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ width: 96, height: 64, background: "var(--bg-elev)", border: "1px solid var(--border-soft)", borderRadius: "var(--radius-md)", boxShadow: `var(${varName})` }} />
      <div className="sh-swatch-name">{name}</div>
      <div className="sh-swatch-meta">{varName}</div>
    </div>
  );
}

function DesignSystem() {
  return (
    <div className="sh-root theme-dark accent-crimson" style={{ width: 1280, padding: 40, display: "flex", flexDirection: "column", gap: 56 }}>
      {/* HERO ------------------------------------------------- */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40, paddingBottom: 24, borderBottom: "1px solid var(--border)" }}>
        <div>
          <Filigree>Shopperino · Design System</Filigree>
          <h1 className="sh-display" style={{ fontSize: "var(--font-size-5xl)", margin: "8px 0 4px" }}>Ink &amp; Candlelight</h1>
          <p style={{ margin: 0, color: "var(--ink-muted)", maxWidth: 720, fontSize: "var(--font-size-md)" }}>
            A tabletop companion system: deep ink surfaces, parchment-cream type, a single
            <span className="sh-accent-text"> --accent </span> knob that reskins everything from buttons to spell slots.
            Every value is a rem-based custom property.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Pill icon="palette" tone="accent">--accent · crimson</Pill>
          <Pill icon="dark_mode">theme-dark</Pill>
          <Pill icon="straighten">1 rem = 16 px</Pill>
        </div>
      </div>

      {/* TOKENS — COLOR ------------------------------------- */}
      <Section eyebrow="01 · Tokens" title="Color — surfaces" cols={4}>
        <Swatch name="Background" varName="--bg" />
        <Swatch name="Background elev." varName="--bg-elev" />
        <Swatch name="Surface 1" varName="--surface-1" />
        <Swatch name="Surface 2" varName="--surface-2" />
        <Swatch name="Surface 3" varName="--surface-3" />
        <Swatch name="Border soft" varName="--border-soft" />
        <Swatch name="Border" varName="--border" />
        <Swatch name="Border strong" varName="--border-strong" />
      </Section>

      <Section eyebrow="01 · Tokens" title="Color — ink" cols={4}>
        <Swatch name="Ink" varName="--ink" />
        <Swatch name="Ink muted" varName="--ink-muted" />
        <Swatch name="Ink faint" varName="--ink-faint" />
        <Swatch name="Ink disabled" varName="--ink-disabled" />
      </Section>

      <Section eyebrow="01 · Tokens" title="Color — semantic + accent" cols={4}>
        <Swatch name="Accent" varName="--accent" />
        <Swatch name="Accent strong" varName="--accent-strong" />
        <Swatch name="Accent soft" varName="--accent-soft" />
        <Swatch name="Accent ring" varName="--accent-ring" />
        <Swatch name="Warn (over-limit)" varName="--warn" />
        <Swatch name="Danger / HP" varName="--danger" />
        <Swatch name="Success / heal" varName="--success" />
        <Swatch name="Info" varName="--info" />
      </Section>

      {/* TOKENS — TYPE -------------------------------------- */}
      <Section eyebrow="02 · Tokens" title="Type scale" cols={1}>
        <div style={{ background: "var(--surface-1)", border: "1px solid var(--border-soft)", borderRadius: "var(--radius-lg)", padding: "12px 20px" }}>
          <TypeRow label="Display 5xl"   size="3.25rem" varSize="--font-size-5xl" family="var(--font-display)" weight={600} sample="Ink &amp; Candlelight" />
          <TypeRow label="Display 4xl"   size="2.5rem"  varSize="--font-size-4xl" family="var(--font-display)" weight={600} sample="Halethorn the Wanderer" />
          <TypeRow label="Display 3xl"   size="1.875rem" varSize="--font-size-3xl" family="var(--font-display)" weight={600} sample="Combat Initiative" />
          <TypeRow label="Display 2xl"   size="1.5rem"  varSize="--font-size-2xl" family="var(--font-display)" weight={600} sample="Wizard Spellbook" />
          <TypeRow label="Display xl"    size="1.25rem" varSize="--font-size-xl"  family="var(--font-display)" weight={600} sample="Hand of the Aging Sun" />
          <TypeRow label="UI Body lg"    size="1.0625rem" varSize="--font-size-lg" family="var(--font-ui)" weight={500} sample="Equip masterwork longsword to free hand." />
          <TypeRow label="UI Body md"    size="0.9375rem" varSize="--font-size-md" family="var(--font-ui)" weight={400} sample="Range 30 ft. Will save DC 17 negates." />
          <TypeRow label="UI Body sm"    size="0.8125rem" varSize="--font-size-sm" family="var(--font-ui)" weight={400} sample="The party rests in the candlelit alcove." />
          <TypeRow label="UI Caption xs" size="0.75rem"  varSize="--font-size-xs"  family="var(--font-ui)" weight={500} sample="ranks · class skill · synergy" />
          <TypeRow label="Mono num"      size="1rem"     varSize="--font-mono"     family="var(--font-mono)" weight={500} sample="STR 18 · DEX 14 · AC 21 · HP 47/52" />
        </div>
      </Section>

      {/* TOKENS — SPACE / RADIUS / SHADOW -------------------- */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 24 }}>
        <Section eyebrow="03 · Tokens" title="Spacing scale" cols={1}>
          <div style={{ background: "var(--surface-1)", border: "1px solid var(--border-soft)", borderRadius: "var(--radius-lg)", padding: "12px 20px" }}>
            <SpaceRow name="1"  varName="--space-1"  value="0.25rem" />
            <SpaceRow name="2"  varName="--space-2"  value="0.5rem" />
            <SpaceRow name="3"  varName="--space-3"  value="0.75rem" />
            <SpaceRow name="4"  varName="--space-4"  value="1rem" />
            <SpaceRow name="5"  varName="--space-5"  value="1.25rem" />
            <SpaceRow name="6"  varName="--space-6"  value="1.5rem" />
            <SpaceRow name="8"  varName="--space-8"  value="2rem" />
            <SpaceRow name="10" varName="--space-10" value="2.5rem" />
            <SpaceRow name="12" varName="--space-12" value="3rem" />
          </div>
        </Section>

        <Section eyebrow="04 · Tokens" title="Radii">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, padding: 20, background: "var(--surface-1)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-soft)" }}>
            <RadiusRow name="xs" varName="--radius-xs" value="0.25rem" />
            <RadiusRow name="sm" varName="--radius-sm" value="0.375rem" />
            <RadiusRow name="md" varName="--radius-md" value="0.625rem" />
            <RadiusRow name="lg" varName="--radius-lg" value="0.875rem" />
            <RadiusRow name="xl" varName="--radius-xl" value="1.25rem" />
            <RadiusRow name="pill" varName="--radius-pill" value="999px" />
          </div>
        </Section>

        <Section eyebrow="05 · Tokens" title="Shadows">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, padding: 20, background: "var(--surface-1)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-soft)" }}>
            <ShadowRow name="1 · base"  varName="--shadow-1" />
            <ShadowRow name="2 · raise" varName="--shadow-2" />
            <ShadowRow name="3 · float" varName="--shadow-3" />
          </div>
        </Section>
      </div>

      {/* ATOMS ------------------------------------------------ */}
      <Section eyebrow="06 · Atoms" title="Buttons, inputs, controls">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
          {/* buttons */}
          <Card title="Buttons" eyebrow="atoms">
            <div className="sh-stack">
              <div className="sh-row-h" style={{ flexWrap: "wrap", gap: 8 }}>
                <Button variant="primary" icon="save">Save character</Button>
                <Button icon="folder_open">Open</Button>
                <Button variant="ghost">Cancel</Button>
                <Button variant="danger" icon="delete">Delete</Button>
              </div>
              <div className="sh-row-h" style={{ flexWrap: "wrap", gap: 8 }}>
                <Button variant="primary" size="sm" icon="add">Add spell</Button>
                <Button size="sm">Roll</Button>
                <Button variant="ghost" size="sm" icon="refresh">Regenerate</Button>
              </div>
              <div className="sh-row-h" style={{ gap: 8 }}>
                <IconButton icon="menu" />
                <IconButton icon="settings" />
                <IconButton icon="palette" badge />
                <IconButton icon="more_vert" ghost />
              </div>
            </div>
          </Card>

          {/* fields */}
          <Card title="Fields" eyebrow="atoms">
            <div className="sh-stack">
              <Field label="Character name"><input className="sh-input" defaultValue="Halethorn Vellis" /></Field>
              <div className="sh-grid-2">
                <Field label="Race"><select className="sh-select" defaultValue="Elf"><option>Elf</option></select></Field>
                <Field label="Class"><select className="sh-select" defaultValue="Wizard"><option>Wizard</option></select></Field>
              </div>
              <Search value="fireball" placeholder="Search spells, items, feats…" />
              <div className="sh-row-h" style={{ gap: 8, flexWrap: "wrap" }}>
                <Chip on icon="filter_alt">All</Chip>
                <Chip icon="auto_stories">Spells</Chip>
                <Chip icon="inventory_2">Items</Chip>
                <Chip icon="auto_awesome">Feats</Chip>
              </div>
            </div>
          </Card>

          {/* pills / badges */}
          <Card title="Pills &amp; badges" eyebrow="atoms">
            <div className="sh-stack">
              <div className="sh-row-h" style={{ flexWrap: "wrap", gap: 8 }}>
                <Pill icon="bolt" tone="accent">Prepared</Pill>
                <Pill icon="shield">Class skill</Pill>
                <Pill tone="warn" icon="warning">Over-limit</Pill>
                <Pill tone="danger" icon="favorite">Bloodied</Pill>
                <Pill tone="success" icon="check">Trained</Pill>
              </div>
              <div className="sh-row-h" style={{ gap: 8 }}>
                <span className="sh-row-h"><span className="rarity-dot rarity-common" /><span className="sh-mono" style={{ fontSize: "var(--font-size-xs)" }}>common</span></span>
                <span className="sh-row-h"><span className="rarity-dot rarity-uncommon" /><span className="sh-mono" style={{ fontSize: "var(--font-size-xs)" }}>uncommon</span></span>
                <span className="sh-row-h"><span className="rarity-dot rarity-rare" /><span className="sh-mono" style={{ fontSize: "var(--font-size-xs)" }}>rare</span></span>
                <span className="sh-row-h"><span className="rarity-dot rarity-legendary" /><span className="sh-mono" style={{ fontSize: "var(--font-size-xs)" }}>legendary</span></span>
              </div>
              <div className="sh-row-h" style={{ gap: 12 }}>
                <Switch checked />
                <Switch />
                <Tickbox checked />
                <Tickbox />
                <Stepper value={3} />
              </div>
            </div>
          </Card>
        </div>
      </Section>

      {/* MOLECULES ------------------------------------------- */}
      <Section eyebrow="07 · Molecules" title="Stat block, bars, rows">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <Card title="Ability scores" eyebrow="molecule">
            <div className="sh-stat-grid">
              <Stat label="STR" score={12} mod={1} />
              <Stat label="DEX" score={16} mod={3} tone="accent" />
              <Stat label="CON" score={14} mod={2} />
              <Stat label="INT" score={20} mod={5} tone="accent" />
              <Stat label="WIS" score={10} mod={0} />
              <Stat label="CHA" score={8}  mod={-1} tone="warn" />
            </div>
          </Card>

          <Card title="Defenses" eyebrow="molecule">
            <div className="sh-grid-3" style={{ marginBottom: 12 }}>
              <StatPill label="AC" value={21} sub="touch 14 · flat 18" accent />
              <StatPill label="HP" value="47/52" sub="hit dice 7d6" />
              <StatPill label="Init" value="+5" sub="DEX +3" />
            </div>
            <div className="sh-grid-3">
              <StatPill label="Fort" value="+4" sub="CON +2" />
              <StatPill label="Ref"  value="+7" sub="DEX +3" />
              <StatPill label="Will" value="+9" sub="WIS +0" accent />
            </div>
          </Card>

          <Card title="Stat bars" eyebrow="molecule">
            <div className="sh-stack" style={{ gap: 14 }}>
              <div>
                <div className="sh-spread" style={{ marginBottom: 6 }}>
                  <span className="sh-label">Hit points</span>
                  <span className="sh-mono sh-num">47 / 52</span>
                </div>
                <Bar value={90} variant="hp" />
              </div>
              <div>
                <div className="sh-spread" style={{ marginBottom: 6 }}>
                  <span className="sh-label">Experience</span>
                  <span className="sh-mono sh-num">28 100 / 36 000</span>
                </div>
                <Bar value={78} variant="xp" />
              </div>
              <div>
                <div className="sh-spread" style={{ marginBottom: 6 }}>
                  <span className="sh-label">Encumbrance · over-limit</span>
                  <Pill tone="warn" icon="warning">+2 lb</Pill>
                </div>
                <Bar value={104} variant="warn" />
              </div>
            </div>
          </Card>

          <Card title="Spell slots" eyebrow="molecule">
            <div className="sh-stack" style={{ gap: 12 }}>
              {[
                { l: "Cantrips", n: 4, u: 0 },
                { l: "1st level", n: 4, u: 1 },
                { l: "2nd level", n: 3, u: 2 },
                { l: "3rd level", n: 2, u: 0 },
                { l: "4th level", n: 1, u: 1 },
              ].map(r => (
                <div key={r.l} className="sh-spread">
                  <span className="sh-label">{r.l}</span>
                  <Slots total={r.n} used={r.u} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Section>

      <Section eyebrow="08 · Molecules" title="Rows, cards, navigation">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

          <Card title="Inventory row" eyebrow="row">
            <div style={{ background: "var(--bg)", border: "1px solid var(--border-soft)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
              <div className="sh-row-head" style={{ gridTemplateColumns: "1.5rem 1fr 3rem 3.5rem 3.5rem" }}>
                <span></span><span>Item</span><span>Qty</span><span>Wt</span><span>Value</span>
              </div>
              {[
                { eq: true,  name: "Longsword, masterwork", meta: "1d8 19-20/×2 · slashing", qty: 1, wt: 4,  val: "315 gp" },
                { eq: false, name: "Studded leather +1",   meta: "AC +4 · max DEX +5", qty: 1, wt: 20, val: "1 175 gp" },
                { eq: false, name: "Wand of magic missile", meta: "CL 5 · 12 charges", qty: 1, wt: 0.1, val: "750 gp" },
                { eq: false, name: "Healing potion, mod.",  meta: "2d8 + 3 cure", qty: 3, wt: 0.3, val: "300 gp ea" },
              ].map((r, i) => (
                <div key={i} className="sh-row" style={{ gridTemplateColumns: "1.5rem 1fr 3rem 3.5rem 3.5rem", padding: "10px 16px" }}>
                  <Tickbox checked={r.eq} icon="check" />
                  <div>
                    <div className="name">{r.name}</div>
                    <div className="meta">{r.meta}</div>
                  </div>
                  <span className="num sh-mono">{r.qty}</span>
                  <span className="num sh-mono sh-faint">{r.wt}</span>
                  <span className="num sh-mono">{r.val}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Spell row + level header" eyebrow="row">
            <div style={{ background: "var(--bg)", border: "1px solid var(--border-soft)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
              <div className="sh-level-header">
                <span className="lvl">2<span className="sh-faint" style={{ fontFamily: "var(--font-ui)", fontSize: 13 }}>nd</span></span>
                <span className="sh-faint sh-mono" style={{ fontSize: 12 }}>3 prepared · 4 slots</span>
                <span className="slots"><Slots total={4} used={1} /></span>
              </div>
              {[
                { sch: "E", name: "Scorching Ray", meta: "Evocation · Range 30 ft · 4d6 fire", prep: true },
                { sch: "I", name: "Invisibility",  meta: "Illusion · Self · 1 min/level", prep: true },
                { sch: "T", name: "Knock",          meta: "Transmutation · Close range",  prep: false },
              ].map((s, i) => (
                <div key={i} className="sh-spell-row" data-prepared={s.prep ? "true" : "false"}>
                  <span className="school">{s.sch}</span>
                  <div>
                    <div className="name">{s.name}</div>
                    <div className="meta">{s.meta}</div>
                  </div>
                  <Tickbox checked={s.prep} />
                </div>
              ))}
            </div>
          </Card>

          <Card title="Skill row" eyebrow="row">
            <div style={{ background: "var(--bg)", border: "1px solid var(--border-soft)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
              <div className="sh-row-head" style={{ gridTemplateColumns: "0.7rem 1.4fr 4.5rem 2.5rem 2.5rem" }}>
                <span></span><span>Skill</span><span>Ranks</span><span>Mod</span><span>Total</span>
              </div>
              {[
                { cls: true,  name: "Spellcraft",    abil: "INT", ranks: 10, mod: 5, total: 15, over: false },
                { cls: true,  name: "Knowledge (arc.)", abil: "INT", ranks: 10, mod: 5, total: 15, over: false },
                { cls: false, name: "Climb",         abil: "STR", ranks: 4,  mod: 1, total: 5,  over: false },
                { cls: false, name: "Bluff",         abil: "CHA", ranks: 13, mod: -1, total: 12, over: true },
              ].map((r, i) => (
                <div key={i} className={`sh-row ${r.over ? "is-overlimit" : ""}`} style={{ gridTemplateColumns: "0.7rem 1.4fr 4.5rem 2.5rem 2.5rem" }}>
                  <span className={`rarity-dot ${r.cls ? "rarity-uncommon" : ""}`} style={{ background: r.cls ? "var(--accent)" : "transparent", border: r.cls ? 0 : "1px solid var(--border)" }} />
                  <div>
                    <div className="name">{r.name} {r.over && <Pill tone="warn" icon="warning">over rank cap</Pill>}</div>
                    <div className="meta">{r.abil}</div>
                  </div>
                  <Stepper value={r.ranks} />
                  <span className="num sh-mono">{r.mod >= 0 ? "+" + r.mod : r.mod}</span>
                  <span className="num sh-mono" style={{ fontWeight: 700 }}>{r.total}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Search result row" eyebrow="row">
            <div style={{ background: "var(--bg)", border: "1px solid var(--border-soft)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
              {[
                { k: "auto_stories", name: "Fireball",       meta: "Spell · Evocation · 3rd · Sor/Wiz", t: "20 ft burst" },
                { k: "inventory_2",  name: "Belt of giant strength +4", meta: "Item · Wondrous · belt", t: "16 000 gp" },
                { k: "auto_awesome", name: "Power Attack",   meta: "Feat · Combat · prereq STR 13", t: "general" },
                { k: "person_play",  name: "Knowledge (planes)", meta: "Skill · INT · trained only", t: "—" },
              ].map((r, i) => (
                <div key={i} className="sh-result-row">
                  <span className="kind"><Icon name={r.k} size={18} /></span>
                  <div>
                    <div className="name">{r.name}</div>
                    <div className="meta">{r.meta}</div>
                  </div>
                  <span className="tail">{r.t}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Menu card (sidebar building block)" eyebrow="component">
            <div className="sh-stack">
              <MenuCard title="Filters" icon="filter_alt" open badge="3 active">
                <Field label="Spell level"><select className="sh-select"><option>0 — 5</option></select></Field>
                <Field label="School"><select className="sh-select"><option>Any</option></select></Field>
                <div className="sh-row-h"><Switch checked /> <span className="sh-label" style={{ flex: 1 }}>Hide unprepared</span></div>
              </MenuCard>
              <MenuCard title="Class &amp; level" icon="badge" open={false} />
              <MenuCard title="Rest &amp; reset" icon="bedtime" open={false} />
            </div>
          </Card>

          <Card title="Empty &amp; loading states" eyebrow="state">
            <div className="sh-grid-2">
              <div className="sh-empty" style={{ background: "var(--bg)", borderRadius: "var(--radius-md)", padding: 24 }}>
                <Icon name="auto_stories" size={36} />
                <div className="title">No spells known</div>
                <div className="sh-faint sh-mono" style={{ fontSize: 12 }}>Tap + to learn your first cantrip.</div>
                <Button variant="primary" size="sm" icon="add">Learn spell</Button>
              </div>
              <div style={{ background: "var(--bg)", borderRadius: "var(--radius-md)", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="sh-skeleton" style={{ height: 14, width: "70%" }} />
                <div className="sh-skeleton" style={{ height: 10, width: "45%" }} />
                <div className="sh-skeleton" style={{ height: 32, width: "100%" }} />
                <div className="sh-skeleton" style={{ height: 32, width: "100%" }} />
                <div className="sh-skeleton" style={{ height: 32, width: "80%" }} />
              </div>
            </div>
          </Card>

        </div>
      </Section>

      {/* ACCENT PICKER  ------------------------------------ */}
      <Section eyebrow="09 · Theming" title="Accent picker (popover)">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div className="sh-accent-popover">
            <div className="sh-spread" style={{ marginBottom: 8 }}>
              <span className="sh-display" style={{ fontSize: "var(--font-size-xl)" }}>Accent color</span>
              <Pill icon="palette" tone="accent">live</Pill>
            </div>
            <div className="sh-faint" style={{ fontSize: 12 }}>Drives buttons, borders, slots, focus rings.</div>
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
                <div key={h.n} className={`sh-hue ${h.on ? "is-active" : ""}`} title={h.n} style={{ "--swatch": h.c }} />
              ))}
            </div>
            <div className="sh-divider" />
            <div className="sh-spread">
              <span className="sh-label">Theme</span>
              <div className="sh-mode-toggle">
                <button aria-pressed="true">Dark</button>
                <button aria-pressed="false">Light</button>
              </div>
            </div>
          </div>
          <Card title="Soft-warning indicator (rules over-limit)" eyebrow="state">
            <div className="sh-stack" style={{ gap: 12 }}>
              <div className="sh-warn-strip">
                <Icon name="warning" size={16} />
                You've assigned 13 ranks to a cross-class skill (max 5). Input is kept; total is flagged.
              </div>
              <div style={{ background: "var(--bg)", border: "1px solid var(--border-soft)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                <div className="sh-row is-overlimit" style={{ gridTemplateColumns: "1fr auto auto" }}>
                  <div>
                    <div className="name">Bluff <Pill tone="warn" icon="warning">over rank cap</Pill></div>
                    <div className="meta">CHA · cross-class · max 5</div>
                  </div>
                  <Stepper value={13} />
                  <span className="num sh-mono" style={{ fontWeight: 700 }}>+12</span>
                </div>
              </div>
              <div className="sh-faint" style={{ fontSize: 12 }}>
                Soft-warn rule: the input is never blocked. Tone is amber, never red — red is reserved for HP/damage.
              </div>
            </div>
          </Card>
        </div>
      </Section>

      {/* TOKEN SPEC FOOTER --------------------------------- */}
      <Section eyebrow="10 · Spec" title="Token recipe (paste into root.css)">
        <pre style={{
          background: "var(--bg)",
          border: "1px solid var(--border-soft)",
          borderRadius: "var(--radius-md)",
          padding: 20,
          margin: 0,
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          lineHeight: 1.55,
          color: "var(--ink-muted)",
          overflow: "auto",
          maxHeight: 420,
        }}>{`:root {
  /* type */
  --font-display: "Cormorant Garamond", Georgia, serif;
  --font-ui: "Manrope", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  --font-size-2xs: 0.6875rem;
  --font-size-xs:  0.75rem;
  --font-size-sm:  0.8125rem;
  --font-size-md:  0.9375rem;
  --font-size-lg:  1.0625rem;
  --font-size-xl:  1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.5rem;
  --font-size-5xl: 3.25rem;

  /* spacing */
  --space-1: 0.25rem;  --space-2: 0.5rem;  --space-3: 0.75rem;
  --space-4: 1rem;     --space-5: 1.25rem; --space-6: 1.5rem;
  --space-8: 2rem;     --space-10: 2.5rem; --space-12: 3rem;

  /* radii */
  --radius-xs: 0.25rem; --radius-sm: 0.375rem; --radius-md: 0.625rem;
  --radius-lg: 0.875rem; --radius-xl: 1.25rem; --radius-pill: 999px;

  /* tap targets */
  --tap-target: 2.75rem;  /* 44px floor */
  --tap-target-sm: 2.25rem;
}

.theme-dark {
  --bg: oklch(0.155 0.006 60);
  --bg-elev: oklch(0.185 0.007 60);
  --surface-1: oklch(0.215 0.008 60);
  --surface-2: oklch(0.255 0.009 65);
  --surface-3: oklch(0.305 0.010 65);
  --border: oklch(0.32 0.011 65);
  --border-soft: oklch(0.255 0.009 60);
  --border-strong: oklch(0.42 0.014 70);
  --ink: oklch(0.945 0.012 85);
  --ink-muted: oklch(0.74 0.012 78);
  --ink-faint: oklch(0.58 0.010 70);
  --warn: oklch(0.78 0.135 78);
  --danger: oklch(0.66 0.19 22);
  --success: oklch(0.72 0.13 150);

  /* accent: a single hue knob; UI uses --accent + 5 derivatives */
  --accent: oklch(0.66 0.17 22);
  --accent-strong: oklch(0.72 0.18 22);
  --accent-soft:   oklch(0.66 0.17 22 / 0.10);
  --accent-muted:  oklch(0.66 0.17 22 / 0.18);
  --accent-ring:   oklch(0.66 0.17 22 / 0.55);
  --accent-fg:     oklch(0.985 0.005 60);
}

.theme-light { /* parchment — same names, light values */ }
`}</pre>
      </Section>

    </div>
  );
}

window.DesignSystem = DesignSystem;
