// =============================================================
// SHOPPERINO — shared atoms + utility components
// Exposed via window for cross-file use in <script type="text/babel">
// =============================================================

// -- Icon (Material Symbols Outlined via Google Fonts) ---------
function Icon({ name, size, color, style, className = "" }) {
  return (
    <span
      className={`mi ${className}`}
      style={{
        fontSize: size != null ? (typeof size === "number" ? size + "px" : size) : undefined,
        color,
        ...style,
      }}
    >
      {name}
    </span>
  );
}

// -- Pill / Chip -----------------------------------------------
function Pill({ children, tone = "default", icon, style }) {
  const cls = `sh-pill ${
    tone === "accent" ? "sh-pill--accent"
    : tone === "warn" ? "sh-pill--warn"
    : tone === "danger" ? "sh-pill--danger"
    : tone === "success" ? "sh-pill--success"
    : tone === "ghost" ? "sh-pill--ghost"
    : ""
  }`;
  return (
    <span className={cls} style={style}>
      {icon && <Icon name={icon} size={14} />}
      {children}
    </span>
  );
}

function Chip({ children, on, icon, onClick }) {
  return (
    <button className={`sh-chip ${on ? "is-on" : ""}`} aria-pressed={on ? "true" : "false"} onClick={onClick}>
      {icon && <Icon name={icon} size={14} />}
      {children}
    </button>
  );
}

// -- Button ----------------------------------------------------
function Button({ children, variant = "default", size, block, icon, iconRight, onClick, style }) {
  const cls = [
    "sh-btn",
    variant === "primary" && "sh-btn--primary",
    variant === "ghost" && "sh-btn--ghost",
    variant === "danger" && "sh-btn--danger",
    size === "sm" && "sh-btn--sm",
    block && "sh-btn--block",
  ].filter(Boolean).join(" ");
  return (
    <button className={cls} onClick={onClick} style={style}>
      {icon && <Icon name={icon} size={size === "sm" ? 16 : 18} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === "sm" ? 16 : 18} />}
    </button>
  );
}

function IconButton({ icon, badge, ghost, size, style, onClick, title }) {
  return (
    <button
      className={`sh-icon-btn ${ghost ? "sh-icon-btn--ghost" : ""} ${size === "sm" ? "sh-icon-btn--sm" : ""}`}
      title={title}
      style={style}
      onClick={onClick}
    >
      <Icon name={icon} />
      {badge && <span className="dot" />}
    </button>
  );
}

// -- Card / Menu card ------------------------------------------
function Card({ title, eyebrow, action, children, accent, padding = true, style }) {
  return (
    <div className={`sh-card ${accent ? "sh-card--accent" : ""}`} style={style}>
      {(title || eyebrow || action) && (
        <div className="sh-card-head">
          {eyebrow && <span className="sh-eyebrow">{eyebrow}</span>}
          {title && <span>{title}</span>}
          {action}
        </div>
      )}
      <div className={padding ? "sh-card-body" : "sh-card-body sh-card-body--flush"}>{children}</div>
    </div>
  );
}

function MenuCard({ title, icon, open = true, badge, children }) {
  return (
    <div className="sh-menu-card" data-open={String(open)}>
      <button className="sh-menu-card-head" aria-expanded={open}>
        {icon && <Icon name={icon} />}
        <span>{title}</span>
        {badge && <Pill tone="accent">{badge}</Pill>}
        <Icon name="expand_more" className="sh-card-chev" />
      </button>
      <div className="sh-menu-card-body">{children}</div>
    </div>
  );
}

// -- Form fields ----------------------------------------------
function Field({ label, hint, children }) {
  return (
    <label className="sh-field">
      {label && <span className="sh-label">{label}</span>}
      {children}
      {hint && <span className="sh-label sh-faint">{hint}</span>}
    </label>
  );
}

function Search({ value = "", placeholder = "Search", action }) {
  return (
    <div className="sh-search">
      <Icon name="search" size={18} />
      <input defaultValue={value} placeholder={placeholder} />
      {action}
    </div>
  );
}

function Switch({ checked, onChange }) {
  return <button className="sh-switch" aria-checked={checked ? "true" : "false"} onClick={onChange} />;
}

function Tickbox({ checked, onChange, icon = "check" }) {
  return (
    <button className="sh-tickbox" aria-checked={checked ? "true" : "false"} onClick={onChange}>
      {checked && <Icon name={icon} />}
    </button>
  );
}

function Stepper({ value, min = 0, max = 99, onChange }) {
  return (
    <div className="sh-stepper">
      <button onClick={() => onChange?.(Math.max(min, value - 1))}><Icon name="remove" size={18} /></button>
      <span className="v">{value}</span>
      <button onClick={() => onChange?.(Math.min(max, value + 1))}><Icon name="add" size={18} /></button>
    </div>
  );
}

// -- Stat block / pills / bars --------------------------------
function Stat({ label, score, mod, tone }) {
  const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
  return (
    <div className={`sh-stat ${tone === "accent" ? "sh-stat--accent" : ""} ${tone === "warn" ? "sh-stat--warn" : ""}`}>
      <span className="sh-stat-label">{label}</span>
      <span className="sh-stat-mod sh-num">{modStr}</span>
      <span className="sh-stat-score sh-num">{score}</span>
    </div>
  );
}

function StatPill({ label, value, sub, accent }) {
  return (
    <div className={`sh-stat-pill ${accent ? "sh-stat-pill--accent" : ""}`}>
      <div className="lbl">{label}</div>
      <div className="val sh-num">{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

function Bar({ value = 60, variant }) {
  const cls = `sh-bar ${variant === "hp" ? "sh-bar--hp" : variant === "xp" ? "sh-bar--xp" : variant === "warn" ? "sh-bar--warn" : ""}`;
  return <div className={cls}><span style={{ width: value + "%" }} /></div>;
}

// -- Slot diamonds (spell slots) ------------------------------
function Slots({ total, used = 0 }) {
  const arr = Array.from({ length: total });
  return (
    <span className="sh-row-h" style={{ gap: "0.3rem" }}>
      {arr.map((_, i) => (
        <span key={i} className={`sh-slot ${i < total - used ? "sh-slot--filled" : ""}`} />
      ))}
    </span>
  );
}

// -- Filigree heading -----------------------------------------
function Filigree({ children }) {
  return <span className="sh-filigree">{children}</span>;
}

// -- Top bar (mobile chrome) ----------------------------------
function TopBar({ title, tabs, current, onMenu, onAccent, accent, masterMode, onModeToggle, leadIcon = "menu", trailing }) {
  return (
    <div className="sh-topbar">
      <button className="sh-icon-btn sh-icon-btn--ghost" onClick={onMenu} aria-label="Open menu">
        <Icon name={leadIcon} />
      </button>
      <div className="sh-topbar-brand">
        <span className="sh-mark">S</span>
        <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--font-size-lg)" }}>{title || "Shopperino"}</span>
      </div>
      <div className="sh-topbar-actions">
        {trailing}
        <button
          className="sh-icon-btn sh-icon-btn--ghost"
          onClick={onAccent}
          aria-label="Change accent"
          title="Accent color"
          style={{ position: "relative" }}
        >
          <span style={{
            width: "1rem", height: "1rem", borderRadius: "50%",
            background: "var(--accent)",
            boxShadow: "0 0 0 2px var(--bg-elev), 0 0 0 3px var(--border-strong)"
          }} />
        </button>
      </div>
    </div>
  );
}

// -- Bottom nav (Player Sheet) --------------------------------
function BottomNav({ current = "combat", master = true }) {
  const items = [
    { id: "combat",    label: "Combat",    icon: "swords" },
    { id: "inventory", label: "Inventory", icon: "backpack" },
    { id: "skills",    label: "Skills",    icon: "person_play" },
    { id: "feats",     label: "Feats",     icon: "auto_awesome" },
    { id: "features",  label: "Features",  icon: "extension" },
    { id: "spells",    label: "Spells",    icon: "wand_stars" },
    { id: "notes",     label: "Notes",     icon: "edit_note" },
  ];
  return (
    <nav className="sh-bnav">
      {items.map(it => (
        <button key={it.id} className="sh-bnav-item" aria-current={current === it.id ? "page" : undefined}>
          <Icon name={it.icon} />
          <span>{it.label}</span>
        </button>
      ))}
    </nav>
  );
}

// -- expose globals -------------------------------------------
Object.assign(window, {
  Icon, Pill, Chip, Button, IconButton,
  Card, MenuCard, Field, Search, Switch, Tickbox, Stepper,
  Stat, StatPill, Bar, Slots, Filigree, TopBar, BottomNav,
});
