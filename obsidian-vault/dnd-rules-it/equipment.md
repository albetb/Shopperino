# Equipaggiamento

> Ricchezza, monete, equipaggiamento iniziale, categorie e meccaniche delle armi. Le statistiche per singola arma (danni, critico, gittata, peso) vivono in [src/data/items.json](../../src/data/items.json); questo file documenta solo i *sistemi* che governano il comportamento in gioco di quei numeri.

## Ricchezza iniziale

- Ogni classe ha una formula fissa di monete d'oro iniziali (Tabella 7-1; es. `5d4 × 10 mo` chierico, `6d4 × 10` guerriero, ecc.). La formula di tiro per classe e l'alternativa del pacchetto iniziale sono in [src/data/classes.json](../../src/data/classes.json).
- La ricchezza iniziale non è vera moneta "in tasca" — è un'astrazione che rappresenta equipaggiamento ereditato, attrezzatura di addestramento e risparmi pre-avventura.
- Ogni personaggio può selezionare **un vestiario quotidiano gratuito** (artigiano, contadino, esploratore, intrattenitore, monaco, studioso, viaggiatore) alla creazione del personaggio.

## Monete

| Moneta | Abbrev. | Peso | Valore |
|---|---|---|---|
| Pezzo di rame | mr | 1/3 oz | 1 mr |
| Pezzo d'argento | ma | 1/3 oz | 10 mr |
| Pezzo d'oro | mo | 1/3 oz | 10 ma = 100 mr |
| Pezzo di platino | mp | 1/3 oz | 10 mo = 100 ma |

- L'unità di riferimento standard è il **mo**. 50 monete di qualsiasi tipo = 0,5 kg / ~1 libbra.
- Un comune bracciante giornaliero guadagna ~1 ma/giorno; un artigiano esperto ~1 mo/giorno.
- I beni commerciali (grano, bestiame, minerale, metalli preziosi, gemme) si barattano senza perdita di moneta; vedi Tabella 7-3 nella fonte.
- La nobiltà e le grandi transazioni usano **lettere di credito**, quote su miniere/porti, o lingotti d'oro misurati anziché moneta.

## Vendere e comprare

- **Comprare**: prezzo di listino (valore in mo nella Tabella 7-5 / `items.json`). In un piccolo villaggio, gli oggetti sopra una certa spesa possono non essere disponibili; il DM stabilisce la disponibilità locale.
- **Vendere beni saccheggiati/usati**: mercato = **½ del prezzo di listino**.
- **Beni commerciali** (grano, sale, minerale, bestiame, metalli preziosi, gemme): scambiati al prezzo di listino **pieno** in entrambe le direzioni.
- Gli oggetti su ordinazione speciale (es. una `spadone +2`) richiedono una grande città e una logistica stabilita dal DM; a volte l'acquirente deve mediare l'accordo.

## Armi

### Categoria di competenza

- **Semplici**, **Da guerra**, **Esotiche** — ogni arma appartiene a una di queste. La maggior parte delle classi è competente con tutte le armi semplici; molte classi aggiungono le armi da guerra; le armi esotiche richiedono *Competenza nelle Armi Esotiche* per ogni arma.
- **Penalità di non competenza**: `−4` ai tiri per colpire con un'arma con cui chi la impugna non è competente.
- Le liste di competenza per classe sono in [src/data/classes.json](../../src/data/classes.json).

### Categoria di ingombro (per arma)

- **Leggera**: più piccola della taglia di chi la impugna; utilizzabile nella mano secondaria senza penalità di taglia per la mano secondaria; a una mano.
- **A una mano**: tipica spada/ascia; può essere impugnata con una o due mani.
- **A due mani**: richiede entrambe le mani per un uso normale.

### Bonus di Forza ai danni

- **Leggera o a una mano nella mano primaria**: aggiungere il **modificatore di Forza** ai danni.
- **A una mano nella mano secondaria**: aggiungere **metà del modificatore di Forza** (arrotondato per difetto) ai danni.
- **A due mani**: aggiungere **1,5 × il modificatore di Forza** (arrotondato per difetto) ai danni.
- Un **modificatore di Forza negativo** si applica sempre per intero ai danni, indipendentemente dall'impugnatura.

### Mischia contro distanza contro portata

- **Arma da mischia**: colpisce quadretti adiacenti (o con portata).
- **Arma a distanza**: arco, balestra, fionda, arma da lancio. Vedi *Incremento di gittata* sotto.
- **Arma con portata**: un'arma da mischia (falcione, lancia lunga, ranseur, falce, catena chiodata, frusta) — per chi la impugna di taglia Media, minaccia a **3 m di distanza (2 quadretti)** invece che adiacente. Chi la impugna **non può attaccare i quadretti adiacenti** con un'arma con portata (eccezione: catena chiodata, frusta). Chi la impugna di taglia Grande con un'arma con portata minaccia a 4,5 o 6 m.
- **Catena chiodata** e **frusta** sono armi con portata esotiche che possono anche attaccare i quadretti adiacenti.

### Armi doppie

- Un'arma doppia (urgrosh nanico, spada a due lame, coreggiato a tre code, ecc.) permette a chi la impugna di usarla come se **combattesse con due armi** con la stessa arma, applicando le penalità della mano secondaria a un'estremità.
- In alternativa, usare entrambe le mani su un'estremità come una normale arma a due mani.
- Ogni estremità ha il proprio profilo di danni e critico (es. `1d6/1d6` × 2 voci sulla riga dell'arma).
- Una creatura più grande può impugnare un'arma doppia a una mano (una creatura Grande con un'arma doppia Media = a una mano, utilizzabile solo l'estremità primaria).

### Armi da lancio

- Lancio leggero (pugnale, dardo, sassi da fionda, shuriken): lanciata come **attacco standard**; l'attacco completo permette più attacchi iterativi.
- Lancio a due mani (es. varianti di giavellotto pesante): lanciata come **azione di round completo** per ogni lancio.
- Il **bonus di Forza ai danni** si applica alle armi da lancio (tranne le armi a spargimento come le fiale d'acido).
- Un'arma non progettata per il lancio può comunque essere lanciata: `−4` all'attacco, incremento di gittata 3 m, nessun margine di minaccia critica tranne il 20 naturale (moltiplicatore ×2 sul critico).

### Incremento di gittata

- Ogni arma a distanza elenca un **incremento di gittata** (es. arco corto 18 m, arco lungo 30 m, pugnale 3 m).
- Entro 1 incremento: nessuna penalità.
- Ogni incremento intero aggiuntivo: `−2` cumulativo al tiro per colpire.
- **Gittata massima**: lancio = 5 incrementi; proiettile (arco/balestra/fionda) = 10 incrementi.
- Archi compositi: valutati per una Forza specifica. Forza di chi lo impugna **superiore** alla valutazione: bonus comunque limitato a quello della valutazione. Forza **inferiore** alla valutazione: `−2` ai tiri per colpire. Arco composito senza valutazione di Forza: nessun bonus di Forza ai danni, ma la Forza negativa penalizza comunque i danni.

### Colpi critici

- Il moltiplicatore di critico (`×2`, `×3`, `×4`) si applica ai **danni tirati e al danno del modificatore di caratteristica**; **non** moltiplica:
  - I dadi dell'attacco furtivo.
  - Il danno bonus da incantamenti infuocati/ecc. (danno da energia dalle proprietà speciali dell'arma).
  - Altre "fonti di danno extra" specificamente segnate come non moltiplicate.
- Margine di minaccia (es. 18–20, 19–20): un tiro naturale entro questo margine minaccia un critico; il critico deve comunque essere **confermato** con un secondo tiro per colpire (vedi [combat.md](combat.md)).
- Un'arma `×3` moltiplica per 3 il danno base; una `×4` per 4. Le armi doppie possono avere moltiplicatori diversi per estremità.

### Tipi di danno

- **Contundenti (C)**, **Perforanti (P)**, **Taglienti (T)**.
- Alcune armi infliggono **due tipi** (es. stella del mattino = C+P); chi la impugna sceglie quale tipo infliggere a ogni colpo, oppure entrambi si applicano (usato contro creature resistenti a un tipo).
- Alcune creature sono resistenti o immuni a un tipo di danno; es. gli scheletri subiscono solo metà danno da armi taglienti e perforanti.

### Taglia dell'arma contro taglia di chi la impugna

- Ogni riga della tabella delle armi è di taglia "**Media**". Conversioni:
  - Versione **Piccola**: metà del peso indicato, i danni scendono di una categoria di dado (usa la Tabella 7-4).
  - Versione **Grande**: doppio del peso indicato, i danni salgono di una categoria di dado.
- L'ingombro di un'arma (leggera/a una mano/a due mani) è per una creatura **della sua stessa taglia**.
- Usare un'arma **non costruita per la propria taglia** impone `−2` all'attacco per ogni **grado di differenza** tra la taglia prevista dell'arma e quella di chi la impugna.
- Un'arma **con 2 o più categorie di taglia di differenza** da chi la impugna non può essere usata affatto.
- Un passo intermedio sposta anche l'ingombro: un'arma Piccola usata da una creatura Media è **leggera** (invece che a una mano); un'arma Grande usata da una creatura Media è **a due mani** (invece che a una mano); ecc.
- Esempio: una spada lunga Piccola è "leggera" per una creatura Media (a una mano → leggera se di una categoria più piccola); una spada lunga Media è "a una mano" per una creatura Grande; una spada lunga Grande è "a due mani" per una creatura Media.

### Armi improvvisate

- Un'"arma improvvisata" (bottiglia rotta, gamba di sedia, lanterna, ecc.): `−4` all'attacco, margine di minaccia solo 20 (moltiplicatore ×2 sul critico), incremento di gittata 3 m se lanciata. Il DM sceglie un'arma "vera" analoga per modellarne taglia, danni e categoria.

## Armi perfette

- Un'arma perfetta garantisce un **bonus di potenziamento** `+1` ai tiri per colpire (**non** ai danni).
- **Deve essere forgiata come perfetta fin dall'inizio** — un'arma normale non può essere in seguito trasformata in perfetta. Vedi [skills-detail.md](skills-detail.md#artigianato-craft).
- **Sovrapprezzo** rispetto al prezzo base dell'arma:
  - Arma: **+300 mo**.
  - Munizioni (per singolo pezzo, es. una freccia): **+6 mo**.
  - **Arma doppia**: **+600 mo** (il sovrapprezzo è raddoppiato, poiché entrambe le estremità sono rese perfette).
- Esempi: una spada bastarda perfetta = 35 mo base + 300 = 335 mo; 10 frecce perfette = 1 ma × 10 + 6 × 10 = ~70 mo.
- Le **munizioni perfette** vengono danneggiate/distrutte all'uso (un singolo colpo consuma la qualità perfetta).
- **Cumulo**:
  - Il `+1` di una munizione perfetta **non** si cumula con il bonus di potenziamento dell'arma che la scaglia. Si usa il più alto.
  - Il potenziamento di un'arma magica **non** si cumula con il `+1` da arma perfetta. Tutte le armi magiche sono automaticamente perfette senza costo aggiuntivo; il `+1` da arma perfetta è assorbito dal potenziamento magico.
- Richiesta come base per qualsiasi **arma magica** (un'arma `+1`, ecc. viene incantata *su* un oggetto perfetto).
- **Armature e scudi usati come armi** (es. scudo chiodato, armatura chiodata) non possono essere resi perfetti ai fini del bonus all'attacco. Le armature/scudi perfetti riducono invece la **penalità di armatura** di 1 (vedi *Armatura perfetta* / sezione armatura).

## Armature e scudi

Le statistiche per armatura (costo, bonus alla CA, Des massima, penalità di armatura, percentuale di fallimento delle formule arcane, velocità, peso) sono colonne della Tabella 7-6 / [src/data/items.json](../../src/data/items.json). Le *meccaniche* di quelle colonne:

### Categorie di armatura

- Armatura **leggera**, **media**, **pesante**; gli **scudi** sono a parte.
- La lista di competenza di classe determina quali categorie il personaggio può indossare senza penalità.
- **Nessuna competenza**: la penalità di armatura si applica ai **tiri per colpire** e a **tutte le prove di abilità e caratteristica basate su Forza/Destrezza**, in aggiunta alla normale penalità di armatura alle abilità. (La penalità per non competenza con lo scudo si cumula con quella dell'armatura.)

### Bonus di armatura e bonus di scudo

- **Bonus di armatura** alla CA: concesso dall'armatura.
- **Bonus di scudo** alla CA: concesso dallo scudo.
- Il **bonus di armatura** **non** si cumula con altri effetti di bonus di armatura (es. *armatura magica*, *bracciali dell'armatura* — si applica solo il più alto).
- Il **bonus di scudo** **non** si cumula con altri effetti di bonus di scudo (es. l'incantesimo *scudo*). Si applica solo il più alto.
- Il bonus di armatura e il bonus di scudo **si cumulano tra loro** e con deflessione / armatura naturale / schivare / bonus di taglia (sono tutti tipi di bonus diversi).

### Destrezza massima

- Ogni armatura limita il bonus di Destrezza alla CA di chi la indossa al valore indicato.
- Il limite riguarda anche il **contributo della Destrezza** a qualsiasi altra caratteristica che usi il modificatore di Destrezza legato alla CA (es. i tiri salvezza sui Riflessi **non** sono limitati — solo la CA).
- L'*elusione dei pericoli* di un ladro: anche se la Destrezza massima è 0, il ladro tratta comunque normalmente i bersagli a cui è negato il bonus di Destrezza ai fini dell'attacco furtivo.
- L'ingombro (carico) impone il proprio limite alla Destrezza massima — applicare entrambi (usare il *più basso*).

### Penalità di armatura

- Una penalità fissa applicata a: **Equilibrio, Scalare, Artista della Fuga, Nascondersi, Saltare, Muoversi Silenziosamente, Rapidità di Mano, Acrobazia** — e **Nuotare (raddoppiata)**.
- Indossare uno scudo aggiunge anche la penalità di armatura dello scudo (cumulativa con quella dell'armatura).
- Si applica indipendentemente dalla competenza nell'armatura; la non competenza *inoltre* la applica ai tiri per colpire e alle prove basate su Forza/Destrezza.

### Percentuale di fallimento delle formule arcane

- Ogni armatura/scudo ha una percentuale di fallimento delle formule. Il totale = % dell'armatura + % dello scudo (cumulativo).
- Tirare percentuale prima di lanciare un incantesimo arcano con componente somatica; con un risultato ≤ alla percentuale di fallimento, l'incantesimo fallisce (lo slot viene comunque consumato).
- **La competenza non elimina la percentuale di fallimento** — rimuove solo la penalità di armatura sui tiri per colpire.
- Gli incantesimi senza componente somatica (solo V, V+M senza S) ignorano la percentuale di fallimento.
- I **bardi** in armatura leggera: nessuna percentuale di fallimento per gli incantesimi da bardo (media/pesante/qualsiasi scudo → percentuale normale).
- Gli **incantesimi divini** non sono influenzati (a meno che un mago/chierico multiclasse non stia lanciando incantesimi da mago).

### Velocità

- L'armatura **media e pesante** (e il carico medio/pesante) riducono la velocità base:
  - Base 9 m → **6 m** se ingombrato.
  - Base 6 m → **4,5 m** se ingombrato.
- **Correre** in armatura pesante è **×3** (non ×4) della velocità base.
- Gli **scudi** non influenzano la velocità.
- I **nani** (e razze simili) mantengono la propria velocità base non influenzata dal peso dell'armatura o dal carico.

### Dormire in armatura

- Dormire in armatura **media o pesante**: automaticamente **affaticato** al risveglio (`−2` Forza, `−2` Destrezza, non si può correre né caricare).
- Dormire in armatura **leggera**: nessuna penalità.

### Indossare e togliere

| Tipo di armatura | Indossare | Indossare in fretta | Togliere |
|---|---|---|---|
| Scudo (qualsiasi) | 1 azione di movimento | n/d | 1 azione di movimento |
| Imbottita, di cuoio, di cuoio borchiato, camicia di maglia | 1 minuto | 5 round | 1 minuto (azione di movimento per lo scudo) |
| Di pelle, corazza a scaglie, cotta di maglia, corazza, armatura a bande | 4 minuti | 1 minuto | 1 minuto |
| Semi-piastre, armatura completa | 4 minuti | 4 minuti | 1d4+1 minuti |

- **Indossare in fretta**: penalità di armatura `−1` peggiore del normale e bonus alla CA `−1` peggiore del normale finché non viene indossata correttamente.
- **Aiuto** dimezza il tempo di indossare/togliere (un aiutante assiste un solo indossatore; due aiutanti non possono adattare simultaneamente la stessa armatura).
- Le semi-piastre e l'armatura completa **non possono essere indossate senza aiuto** salvo tramite la regola "indossare in fretta".

### Prezzi per armature di taglia insolita

Per armature fatte su misura per una creatura non Media (Tabella 7-? sulla stessa pagina):

| Taglia della creatura | Costo umanoide × | Peso umanoide × | Costo non umanoide × | Peso non umanoide × |
|---|---|---|---|---|
| Fino a Minuto | ×½ | ×1/10 | ×1 | ×1/10 |
| Piccolo | ×1 | ×½ | ×2 | ×½ |
| Medio | ×1 | ×1 | ×2 | ×1 |
| Grande | ×2 | ×2 | ×4 | ×2 |
| Enorme | ×4 | ×5 | ×8 | ×5 |
| Mastodontico | ×8 | ×8 | ×16 | ×8 |
| Colossale | ×16 | ×12 | ×32 | ×12 |

- L'armatura umanoide Piccola dimezza il bonus alla CA.
- "Non umanoide" indica creature dalla forma animale o con arti extra che richiedono bardature su misura.

### Scudo torre

- Fornisce **copertura totale** come azione standard invece del suo normale bonus di scudo alla CA (chi lo impugna rinuncia al bonus di scudo quel round).
- Impone una penalità `−2` ai tiri per colpire in aggiunta alla penalità di armatura.
- Una mano **non è libera** per lanciare incantesimi.

### Armature e scudi perfetti

- Un'armatura o uno scudo perfetto riduce la propria **penalità di armatura di 1** (es. una cotta di maglia perfetta ha penalità di armatura `−4` invece di `−5`).
- **Sovrapprezzo**: `+150 mo` rispetto al prezzo normale (es. cotta di maglia perfetta = 100 + 150 = 250 mo).
- Deve essere forgiata come perfetta fin dall'inizio; non può essere trasformata in perfetta dopo la creazione.
- **Non** garantisce alcun bonus di attacco o danno, anche se l'armatura o lo scudo viene usato anche come arma (es. armatura chiodata, scudo chiodato) — il `+1` da arma perfetta all'attacco è un acquisto separato.
- Tutte le armature e gli scudi magici sono automaticamente perfetti senza costo aggiuntivo; la riduzione della penalità di armatura è inclusa.
- Richiesta come base per qualsiasi incantamento di **armatura / scudo magico**.

## Ingombro e carico

Si applicano due fonti di "ingombro": l'**ingombro dell'armatura** (armatura media/pesante) e l'**ingombro del carico** (peso trasportato). Quando entrambi si applicano, prendere il **valore peggiore di ogni colonna** (Destrezza massima, penalità, velocità) — **non** sommare le penalità.

### Capacità di trasporto (per Forza)

- I valori di capacità per Forza (leggero / medio / massimo pesante) sono in una tabella indicizzata per Forza. Valori per Forza: vedi l'helper della capacità di trasporto in [src/lib/player/](../../src/lib/player/).
- **Regola del raddoppio**: ogni **+10 di Forza** moltiplica tutte e tre le soglie di capacità per **×4** (Forza 30 = 4× Forza 20, Forza 40 = 16× Forza 20, …). Per valori di Forza non presenti in tabella, trovare la riga con la stessa cifra delle unità e applicare il moltiplicatore.

### Effetti del carico

| Carico | Destrezza massima alla CA | Penalità alla prova | Velocità (9 m → / 6 m →) | Corsa |
|------|---|---|---|---|
| Leggero | — | 0 | 9 m / 6 m | ×4 |
| Medio | +3 | −3 | 6 m / 4,5 m | ×4 |
| Pesante | +1 | −6 | 6 m / 4,5 m | ×3 |

- La **penalità alla prova** si cumula con la penalità di armatura (stesse abilità interessate — vedi l'elenco della penalità di armatura sopra).
- **Nani, gnomi, halfling**: la velocità **non** è ridotta dal carico medio/pesante (né dall'armatura).
- **Oltre il carico pesante** (trasportare oltre il massimo pesante): si può sollevare ma solo barcollando (1,5 m al round come azione di round completo), perdendo il bonus di Destrezza alla CA.

### Sollevare e trascinare

- **Sollevare sopra la testa** = fino al massimo carico pesante.
- **Sollevare da terra** = fino a **2× il massimo carico pesante**; mentre lo si fa, non ci si può muovere più veloce di 1,5 m/round (round completo) e si perde il bonus di Destrezza alla CA.
- **Spingere o trascinare** = fino a **5× il massimo carico pesante** su una superficie tipica. Superficie liscia → ×2; ruvida/in salita → ×½.

### Moltiplicatori di taglia e forma

Moltiplicare il valore della tabella di Forza per:

- **Bipedi**: Piccolo ×¾, Minuscolo ×½, Minuto ×¼, Piccolissimo ×⅛; Grande ×2, Enorme ×4, Mastodontico ×8, Colossale ×16.
- **Quadrupedi** (cavalli, cani): Medio ×1,5, Piccolo ×1, Minuscolo ×¾, Minuto ×½, Piccolissimo ×¼; Grande ×3, Enorme ×6, Mastodontico ×12, Colossale ×24.

### Forza oltre la tabella

- Per Forza 30+: prendere la riga con la stessa cifra delle unità da Forza 20–29 e moltiplicare ×4 ogni +10 (es. Forza 35 = Forza 25 × 4; Forza 45 = Forza 25 × 16).

## Riferimenti incrociati

- [combat.md](combat.md) — tiri per colpire, conferma del critico, attacchi di opportunità, attacchi iterativi da attacco completo, attacchi a distanza.
- [classes.md](classes.md) — competenze di classe (semplici, da guerra, esotiche, categorie di armatura).
- [races.md](races.md) — eccezione di velocità dei nani, bonus di lancio degli halfling, familiarità con le armi (le esotiche contano come da guerra).
- [skills.md](skills.md), [skills-detail.md](skills-detail.md) — penalità di armatura, raddoppio per Nuotare, Artigianato per gli oggetti perfetti.
- [magic.md](magic.md) — percentuale di fallimento delle formule arcane, eccezione del bardo in armatura leggera, regola dell'armatura metallica del druido.
- [magic-items.md](magic-items.md) — base perfetta per armi/armature incantate.
- [feats.md](feats.md) — Competenza nelle Armi Esotiche, Arma Focalizzata, Attacco Poderoso, ecc.
- [src/data/items.json](../../src/data/items.json) — dati numerici per singola arma e singola armatura.

## Fonti

- Manuale del Giocatore — pp. 111–114, 122–123
- Manuale del Giocatore — pp. 161–162 (ingombro, capacità di trasporto, sollevare/trascinare, moltiplicatori di taglia e quadrupedi)
