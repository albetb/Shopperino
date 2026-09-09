# Indice della Conoscenza D&D 3.5

Questo file è il punto di ingresso a tutta la conoscenza D&D 3.5 utilizzata dal progetto Shopperino. In questo repository vivono due tipi di fonti:

1. **Note sulle regole** — descrizioni condensate di meccaniche/formule in questa cartella (`obsidian-vault/dnd-rules-it/*.md`), traduzione della cartella inglese equivalente ([`obsidian-vault/dnd-rules/*.md`](../dnd-rules/INDEX.md)). Costruite dalla skill `dnd-rules-extract` a partire dai manuali ufficiali.
2. **Dati canonici** — elenchi enumerati di incantesimi, talenti, oggetti, classi, razze, abilità in [`src/data/*.json`](../../src/data/). Letti direttamente dall'app a runtime.

Quando si implementa una funzionalità che tocca le regole, **leggi prima il file per argomento pertinente in questa cartella** per capire la meccanica, poi vai a `src/data/*.json` per i valori effettivi.

---

## Argomenti delle regole

L'elenco seguente rispecchia l'indice inglese equivalente ([INDEX.md](../dnd-rules/INDEX.md)), che viene rigenerato automaticamente da `.claude/hooks/update-dnd-index.mjs` ad ogni scrittura o modifica di un file `.md` in quella cartella. Questa cartella (`dnd-rules-it/`) non è osservata dall'hook: quando i file inglesi cambiano, questo elenco va aggiornato a mano per restare allineato.

<!-- AUTO-INDEX:START -->
- [ability-scores.md](ability-scores.md) — **Punteggi di Caratteristica** — Le sei caratteristiche, la generazione del punteggio, la formula del modificatore, cosa governa ciascuna caratteristica e le regole per modificare i punteggi durante il gioco.
- [alignment.md](alignment.md) — **Allineamento** — La griglia dei nove allineamenti: cos'è ciascuno, come incide meccanicamente e come interagisce con classi e incantesimi.
- [animal-companion.md](animal-companion.md) — **Compagno Animale** — Sotto-sistema del compagno animale di druido/ranger: come si sceglie un compagno, come avanza con il livello di classe (DV bonus, armatura naturale, potenziamenti di caratteristica, comandi, abilità speciali), e gli elenchi di creature alternative con i relativi aggiustamenti di livello. Le schede base per creatura si trovano in [src/data/animals.json](../../src/data/animals.json).
- [attacks-of-opportunity.md](attacks-of-opportunity.md) — **Attacchi di opportunità** — Quadretti minacciati, cosa provoca, come si risolvono gli attacchi di opportunità, portata, passo di 1,5 m.
- [character-creation.md](character-creation.md) — **Creazione del Personaggio** — Procedura ordinata per costruire un personaggio giocante di 1° livello. Solo una panoramica procedurale — i dettagli si trovano nei file per argomento.
- [class-features.md](class-features.md) — **Privilegi di classe** — Catalogo per classe dei privilegi nominati e di come si risolvono meccanicamente. I numeri per classe (usi al giorno per livello, dadi danno, CD dei tiri salvezza che dipendono dal livello, ecc.) vivono in [src/data/classes.json](../../src/data/classes.json); questo file documenta le *meccaniche* attivate da ciascun privilegio.
- [classes.md](classes.md) — **Classi** — Sistema delle classi: DV, progressioni di bonus di attacco base e tiri salvezza, punti abilità, privilegi di classe, regole di combinazione del multiclasse. I dati numerici per classe si trovano in [src/data/classes.json](../../src/data/classes.json).
- [combat-maneuvers.md](combat-maneuvers.md) — **Manovre di Combattimento** — Azioni speciali in mischia: carica, combattere con due armi, combattimento a cavallo, disarmare, fintare, armi a schizzo, oltrepassare, sbilanciare, spingere, spezzare. La lotta è intenzionalmente omessa (usata raramente in questa campagna).
- [combat.md](combat.md) — **Combattimento** — Struttura del round, economia delle azioni, risoluzione degli attacchi, CA, pf, danni, critici, lanciare incantesimi in combattimento, modificatori situazionali (copertura/occultamento/attaccare ai fianchi).
- [conditions.md](conditions.md) — **Condizioni** — Effetti di stato con nome e conseguenze meccaniche. Più condizioni possono applicarsi contemporaneamente; gli effetti si sommano a meno che non si sovrappongano esplicitamente.
- [core-mechanic.md](core-mechanic.md) — **Meccanica di base** — La risoluzione universale con d20 usata per ogni azione dall'esito incerto.
- [counterspelling.md](counterspelling.md) — **Controincantesimo** — Interrompere un incantatore nemico a metà lancio preparando un contro.
- [dice.md](dice.md) — **Dadi** — Notazione e lettura dei tiri di dado richiamati in tutte le regole.
- [equipment.md](equipment.md) — **Equipaggiamento** — Ricchezza, monete, equipaggiamento iniziale, categorie e meccaniche delle armi. Le statistiche per singola arma (danni, critico, gittata, peso) vivono in [src/data/items.json](../../src/data/items.json); questo file documenta solo i *sistemi* che governano il comportamento in gioco di quei numeri.
- [experience-and-leveling.md](experience-and-leveling.md) — **Esperienza e avanzamento di livello** — Assegnazione dei PE, la tabella PE-livello, e cosa cambia per livello.
- [familiar.md](familiar.md) — **Famiglio** — Sottosistema del famiglio di stregone/mago: come si ottiene un famiglio, come le sue statistiche derivano dal padrone, come avanza con il livello del padrone (armatura naturale, Intelligenza, capacità speciali) e l'elenco delle creature-famiglio con il bonus per specie che ciascuna conferisce al padrone. Le schede statistiche base per creatura si trovano in [src/data/animals.json](../../src/data/animals.json).
- [feats.md](feats.md) — **Talenti** — Sistema dei talenti: come si acquisiscono, prerequisiti, categorie. L'elenco dei talenti specifici e dei loro effetti si trova in [src/data/feats.json](../../src/data/feats.json).
- [languages.md](languages.md) — **Linguaggi** — Quali linguaggi un personaggio conosce, come ottenerne altri, i linguaggi legati alla classe, e l'alfabetizzazione.
- [magic-items.md](magic-items.md) — **Oggetti magici** — Categorie di oggetti, i quattro metodi di attivazione, gli slot del corpo per gli oggetti indossati, le tre categorie di oggetti impugnati (verghe, bastoni, bacchette), le formule di costo per la creazione di oggetti e la durabilità degli oggetti.
- [magic.md](magic.md) — **Magia** — Regole generali di lancio incantesimi: caratteristica per lanciare, preparati contro spontanei, scuole, libro degli incantesimi, anatomia della descrizione di un incantesimo, combinare effetti magici, procedure arcane contro divine.
- [metamagic.md](metamagic.md) — **Metamagia** — Come i talenti di metamagia modificano gli incantesimi: variazione del livello dello slot, tempistica di applicazione per stile di lancio, cumulo, interazione con gli oggetti e comportamento nel controincantesimo.
- [movement.md](movement.md) — **Movimento** — Movimento tattico sul quadrettato: velocità, diagonali, terreno, restringersi, taglia e portata delle creature, regole di movimento speciali.
- [multiclassing.md](multiclassing.md) — **Multiclasse** — Prendere livelli in due o più classi. Costruito in modo incrementale; i dettagli sull'aritmetica della penalità ai PE sono a p. 60 (estrazione futura).
- [objects.md](objects.md) — **Oggetti** — Resistenza degli oggetti, attaccare oggetti, sfondare porte / catene / muri e tiri salvezza degli oggetti.
- [races.md](races.md) — **Razze** — *Sistema* dei tratti razziali: le categorie di tratti che una razza conferisce e come ciascuna categoria si risolve. Le specifiche per ogni razza (quali caratteristiche, quali bonus, quali armi, quali linguaggi) si trovano in [src/data/races.json](../../src/data/races.json).
- [saving-throws.md](saving-throws.md) — **Tiri Salvezza** — Risoluzione di Tempra / Riflessi / Volontà, corrispondenza con le caratteristiche, CD dei tiri salvezza.
- [skills-detail.md](skills-detail.md) — **Abilità — Dettaglio per Singola Abilità** — CD, tipi di azione, regole di ritentare e meccaniche specifiche per singola abilità. Salta tutto ciò che è già catturato da [src/data/skills.json](../../src/data/skills.json) (caratteristica chiave, solo con addestramento, contrassegno penalità di armatura, mappa classe/fuori classe, tabella delle sinergie). Le regole a livello di sistema vivono in [skills.md](skills.md).
- [skills.md](skills.md) — **Abilità** — Risoluzione delle prove di abilità, gradi, abilità di classe vs incrociate, scale di CD, prendere 10/20, aiutare, sinergia, e il formato usato dalle descrizioni per singola abilità.
- [special-abilities.md](special-abilities.md) — **Capacità speciali** — Categorizzazione delle capacità non incantesimo che creature, classi e oggetti possono utilizzare: Magica, Soprannaturale, Straordinaria, Naturale.
- [spell-components.md](spell-components.md) — **Componenti degli incantesimi** — Cos'è ciascuna componente, cosa ne impedisce l'uso, e le convenzioni dei suffissi negli elenchi di incantesimi.
- [spell-resistance.md](spell-resistance.md) — **Resistenza agli incantesimi** — La difesa magica innata di una creatura; la prova di livello dell'incantatore necessaria per superarla.
- [traps.md](traps.md) — **Trappole** — Come si assembla e si prezza una trappola: la lista degli elementi (innesco, ripristino, aggiramento, attacco-o-tiro-salvezza, effetto), le CD di individuazione e disattivazione, e le formule di GS / costo / Artigianato usate per costruirne una da zero. Le 105 trappole di esempio e ogni tabella numerica di questa pagina vivono in [src/data/traps.json](../../src/data/traps.json).
- [vision-and-light.md](vision-and-light.md) — **Visione e Luce** — Livelli di luce, modalità di visione speciali, probabilità di mancare ed effetti sulle abilità dovuti alla scarsa visibilità.
<!-- AUTO-INDEX:END -->

---

## File di dati canonici (`src/data/`)

Mappa curata a mano dei dati enumerabili e degli argomenti di regole a cui si riferiscono.

| File | Forma | Contenuto | Argomenti di regole correlati |
|---|---|---|---|
| [`spells.json`](../../src/data/spells.json) | Array di oggetti incantesimo | ~605 incantesimi con Name, School, Level, Components, Casting Time, Range, Effect, Duration | `magic.md`, `spell-components.md`, `metamagic.md`, `spell-resistance.md` |
| [`scrolls.json`](../../src/data/scrolls.json) | `{ Arcane, Divine }` → pergamene | Istanze di pergamena pre-generate per tradizione | `magic.md`, `magic-items.md` |
| [`feats.json`](../../src/data/feats.json) | `{ Feats: [...] }` | Tutti i talenti con prerequisiti, tipo, descrizione | `feats.md` |
| [`skills.json`](../../src/data/skills.json) | `{ Skills: [...] }` | Tutte le abilità con caratteristica chiave, flag solo con addestramento, flag penalità di armatura | `skills.md` |
| [`races.json`](../../src/data/races.json) | `{ races: [...] }` | Tutte le razze con taglia, velocità, aggiustamenti di caratteristica, tratti razziali | `races.md` |
| [`classes.json`](../../src/data/classes.json) | `{ classes: [...] }` | Tutte le classi con DV, progressioni di bonus di attacco base/tiri salvezza, punti abilità, privilegi di classe | `classes.md`, `multiclassing.md`, `prestige-classes.md` |
| [`items.json`](../../src/data/items.json) | `{ Good, Ammo, Weapon, Specific Weapon, Armor, Specific Armor, Shield, Specific Shield }` | Armi/armature/scudi/equipaggiamento comuni e specifici con statistiche | `equipment.md`, `magic-items.md` |
| [`tables.json`](../../src/data/tables.json) | Oggetto con molte tabelle indicizzate per chiave | Tabelle di consultazione: tipi di negozio, probabilità di oggetti magici, livelli delle pergamene, basi di armi/armature, enumerazioni, ecc. | `equipment.md`, `magic-items.md` (usate principalmente dai generatori di Negozio/Bottino) |
| [`traps.json`](../../src/data/traps.json) | `{ traps: [...], tables: {...} }` | 105 trappole di esempio GS 1–10 (innesco, ripristino, CD, attacco/tiro salvezza, danno, veleno, costo, `footprint` sulla plancia derivato) + le tabelle del generatore (modificatori di GS, modificatori di costo, CD di Artigianato, enumerazioni) | `traps.md` |

### Ricerca inversa: argomento di regole → file di dati

- **`magic.md`** ↔ `spells.json`, `scrolls.json`, parti di `tables.json` (livello della pergamena, probabilità di oggetto magico)
- **`equipment.md`** ↔ `items.json`, `tables.json` (tabelle base di armi/armature)
- **`feats.md`** ↔ `feats.json`
- **`skills.md`** ↔ `skills.json`
- **`races.md`** ↔ `races.json`
- **`classes.md`** ↔ `classes.json`
- **`traps.md`** ↔ `traps.json`

### Convenzioni di accesso

- Oggetti e incantesimi usano una stringa `link` come `"items/Weapon/longsword"` o `"scrolls/Arcane/fireball"`. Risolvila con `getItemByRef(link)` da [`src/lib/utils.js`](../../src/lib/utils.js).
- Tutti i valori derivati del personaggio (modificatori di caratteristica, bonus di attacco base, tiri salvezza, CA, totali delle abilità, ecc.) appartengono al modello di dominio in [`src/lib/player/player.js`](../../src/lib/player/player.js) — non ricalcolarli mai nei componenti.
