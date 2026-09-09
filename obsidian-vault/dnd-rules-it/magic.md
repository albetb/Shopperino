# Magia

> Regole generali di lancio incantesimi: caratteristica per lanciare, preparati contro spontanei, scuole, libro degli incantesimi, anatomia della descrizione di un incantesimo, combinare effetti magici, procedure arcane contro divine.

## Arcano contro divino

- Incantesimi **arcani**: lanciati da **stregone, mago, bardo**. Manipolano direttamente l'energia magica grezza. Tendono verso effetti vistosi (forza, fuoco, freddo, fulmine, trasformazione).
- Incantesimi **divini**: lanciati da **chierico, druido, paladino, ranger** (e simili). Attinti da una fonte divina (divinità, natura, principio). Tendono verso cura, protezione ed effetti meno distruttivi.
- Le meccaniche sono le stesse — differiscono solo la fonte, la procedura di preparazione e (a volte) la lista di incantesimi.

## Caratteristica per lanciare incantesimi

| Classe | Caratteristica |
|---|---|
| Mago | Intelligenza |
| Chierico, Druido, Paladino, Ranger | Saggezza |
| Stregone, Bardo | Carisma |

### Caratteristica minima per lanciare

- Per lanciare un incantesimo di livello **L**, il punteggio della caratteristica per lanciare deve essere ≥ `10 + L`.
- Esempi: Intelligenza 11 per lanciare incantesimi da mago di 1° livello, Intelligenza 14 per il 4° livello, Intelligenza 19 per il 9° livello.
- Caratteristica per lanciare **≤ 9**: non si può lanciare alcun incantesimo di quella classe.
- Se la caratteristica per lanciare scende sotto `10 + L` (es. per *indebolimento*), gli incantesimi di livello L e superiore diventano non lanciabili finché il punteggio non recupera; gli incantesimi di livello inferiore restano lanciabili.

### CD del tiro salvezza dell'incantesimo

- `CD = 10 + livello dell'incantesimo + modificatore della caratteristica per lanciare`
- Per incantesimi di una classe diversa da quella primaria dell'incantatore: usare la caratteristica per lanciare dell'incantatore per **quella** classe.

### Incantesimi bonus al giorno

- `incantesimi bonus al livello L = arrotonda per difetto((modificatore − L) / 4) + 1` se `modificatore ≥ L`, altrimenti **0**.
- Gli incantesimi di livello 0 (trucchetti/orazioni) **non** ricevono mai incantesimi bonus.
- Gli incantesimi bonus si cumulano con la griglia base di incantesimi/giorno della classe.
- Gli incantatori multiclasse calcolano gli incantesimi bonus separatamente per ogni classe con lancio incantesimi.

## Leggere le tabelle di incantesimi/giorno per classe

- **"—"** = la classe non può lanciare incantesimi di quel livello a questo livello di classe (nemmeno incantesimi bonus).
- **"0"** = la classe ha accesso a quel livello di incantesimo ma solo tramite incantesimi bonus (serve caratteristica sufficiente).
- Un incantatore può sempre preparare/lanciare un **incantesimo di livello inferiore in uno slot di livello superiore**.
- Incantatori ibridi (paladino, ranger): livello dell'incantatore = `arrotonda per difetto(livello di classe / 2)`, il lancio incantesimi inizia al livello di classe 4.

## Lancio preparato contro spontaneo

| Classe | Stile | Lista sorgente | Preparazione giornaliera |
|---|---|---|---|
| Mago | Preparato | Libro degli incantesimi | 1 h di studio |
| Chierico | Preparato | Lista completa del chierico (+ 1 incantesimo di dominio/livello) | 1 h di preghiera a ora fissa del giorno |
| Druido | Preparato | Lista completa del druido | 1 h di comunione a ora fissa del giorno |
| Paladino | Preparato | Lista del paladino | 1 h, inizia al L4 |
| Ranger | Preparato | Lista del ranger | 1 h, inizia al L4 |
| Stregone | Spontaneo | Incantesimi conosciuti | 15 min di concentrazione |
| Bardo | Spontaneo | Incantesimi conosciuti | 15 min di esibizione/concentrazione |

- **Preparato** — fissa incantesimi specifici in slot specifici una volta al giorno; gli incantesimi lanciati lasciano gli slot vuoti fino alla preparazione successiva.
- **Spontaneo** — qualsiasi slot del livello giusto può contenere qualsiasi incantesimo conosciuto di quel livello (o inferiore).

### Scambio spontaneo (chierico / druido)

- Un chierico può sacrificare qualsiasi incantesimo preparato (non di dominio) di livello L per lanciare spontaneamente un incantesimo di **cura** (chierico buono) o di **infliggere** (malvagio) di livello ≤ L.
- Un chierico neutrale sceglie cura o infliggere alla creazione del personaggio (permanente).
- Druido: lancia spontaneamente **evoca alleato naturale** di livello ≤ L sacrificando qualsiasi incantesimo preparato di livello L.
- Lo scambio spontaneo di un incantesimo preparato modificato dalla metamagia usa lo slot più alto e l'incantesimo spontaneo eredita la metamagia; il tempo di lancio segue la regola dell'incantatore spontaneo (un passo più lungo). Vedi [metamagic.md](metamagic.md).

## Procedura di preparazione giornaliera

### Preparazione del mago

- Richiede **8 ore di riposo** precedenti (sonno / trance non faticosa per gli elfi con 4 h di trance + 4 h di attività leggera).
- Dopo il riposo: **1 ora** di studio ininterrotto con il libro degli incantesimi in un ambiente calmo (non serve lusso, ma nessuna distrazione importante, nessun danno da combattimento durante la preparazione).
- Il mago sceglie quali incantesimi riempire in quali slot; può lasciare slot vuoti.
- Gli **slot vuoti possono essere riempiti più tardi** con **15 minuti** di preparazione per livello di incantesimo; stesso requisito di studio/libro.
- **Limite del recentemente lanciato**: gli incantesimi lanciati nelle **ultime 8 ore** contano ai fini del limite di slot del giorno (cioè non si possono lanciare tutti i propri incantesimi, dormire 4 h, e ripreparali — qualsiasi cosa lanciata nelle ultime 8 h occupa ancora quello slot ai fini del riempimento).
- **Lettura magica** è l'unico incantesimo che un mago può preparare senza il proprio libro degli incantesimi presente.
- **Riposo interrotto**: ogni interruzione impone un'ora aggiuntiva di riposo prima che il mago riacquisti la mente lucida necessaria per preparare.
- La morte cancella gli incantesimi preparati (la resurrezione tramite *riportare in vita*/*resurrezione*/*vera resurrezione* recupera gli slot persi).

### Preparazione di stregone / bardo

- 8 h di riposo + **15 min** di concentrazione (il bardo spesso una canzone o un recital).
- Nessun libro; l'incantatore riempie la propria dotazione giornaliera di slot dalla propria lista fissa di Incantesimi Conosciuti.
- Il limite delle 8 h sul recentemente lanciato si applica allo stesso modo.

### Preparazione divina (chierico, druido, paladino, ranger)

- 8 h di riposo + 1 h di preghiera/comunione a un'**ora fissa del giorno** stabilita dalla divinità/fede/ordine:
  - Pelor (sole): alba.
  - Boccob: mezzanotte.
  - Druidi: qualsiasi ora ma coerente.
  - Divinità malvagie: tipicamente notte.
  - Finestra mancata → attendere la finestra del giorno successivo.
- Il chierico ottiene anche **incantesimi di dominio bonus** (1 slot preparato extra per livello di incantesimo, limitato a un incantesimo di uno dei due domini; vedi [class-features.md](class-features.md)).

## Concentrazione in combattimento

Lanciare richiede concentrazione; molte cose possono disturbarla. In caso di disturbo, **prova di Concentrazione** contro CD; fallimento = incantesimo perso.

| Disturbo | CD |
|---|---|
| Danneggiato durante il lancio (attacchi, attacchi di opportunità) | 10 + danno + livello dell'incantesimo |
| Danno continuo (es. *freccia acida* persistente) | 10 + ½ danno continuo + livello dell'incantesimo |
| Incantesimo distraente (colpito da un incantesimo ostile che non infligge danno) | CD del tiro salvezza dell'incantesimo distraente |
| In lotta o immobilizzato | 10 + livello dell'incantesimo (inoltre, si possono lanciare solo incantesimi senza componenti S) |
| Movimento vigoroso (cavalcare una montatura veloce, su un carro in movimento, su una piccola barca in acque agitate) | 10 + livello dell'incantesimo |
| Movimento violento (montatura al galoppo, nave sballottata da una tempesta, terremoto) | 15 + livello dell'incantesimo |
| Maltempo (pioggia battente, nevischio) | 5 + livello dell'incantesimo |
| Maltempo severo (grandine, tempesta) | 10 + livello dell'incantesimo |
| Intralciato (in una rete, *groviglio*, *mano serrata di Bigby*, ecc.) | 15 + livello dell'incantesimo |
| Lanciare sulla difensiva (evitando un attacco di opportunità da chi minaccia) | 15 + livello dell'incantesimo |
| Mantenere un incantesimo a durata di concentrazione mentre se ne lancia un altro | 15 + il livello dell'incantesimo attivo |

- Disturbato a metà di un lancio di 1 round o più lungo: è richiesta una prova di Concentrazione a ogni disturbo; fallimento = incantesimo sprecato.
- Vedi anche [combat.md](combat.md) per i tipi di azione riguardo al lancio.

## Fallimento dell'incantesimo (oltre alla percentuale di fallimento delle formule arcane)

- Requisiti di lancio non soddisfatti (nessuna V perché ridotti al silenzio, nessuna mano libera per S, nessuna M/F richiesta): l'incantesimo fallisce, lo slot è consumato.
- Tipo di bersaglio sbagliato (es. *charme su persona* su un cane — i cani non sono umanoidi): l'incantesimo fallisce, lo slot è consumato.
- Concentrazione interrotta: incantesimo sprecato (vedi sopra).
- **Percentuale di fallimento delle formule arcane** — vedi [equipment.md](equipment.md). Solo incantesimi arcani con componente somatica, quando l'incantatore indossa armatura o porta uno scudo senza l'eccezione di competenza.

## Controincantesimo

- Possibile contro qualsiasi incantesimo, divino o arcano.
- Vedi il file dedicato: [counterspelling.md](counterspelling.md).

## Risultato di un incantesimo

- L'incantatore identifica quali creature o area sono interessate; i bersagli idonei effettuano tiri salvezza (se previsti).
- Gli incantesimi con il descrittore **che influenza la mente** funzionano solo su creature con **Intelligenza ≥ 1**.
- Gli incantesimi influenzano chi li impugna/lancia con un raggio `[Personale]` o `[Bersaglio: incantatore]`.
- Gli incantesimi senza chiara linea di vista / linea di effetto verso il bersaglio falliscono.
- Una creatura a cui è **negato un tiro salvezza** da un incantesimo applica comunque qualsiasi resistenza agli incantesimi possieda.

### Attacchi

- Un "attacco" nel testo di un incantesimo = qualsiasi azione ostile: incantesimi che infliggono danno, che disabilitano (*blocca persone*), scacciare/intimorire non morti, *charme* (se ostile), incantesimi che disarmano/spostano (*disarmare*, spingere). Incantesimi come *evocare mostri* non sono di per sé attacchi (la creatura evocata che attacca lo è, invece).

### Riportare in vita i morti

- *Riportare in vita*, *resurrezione*, *vera resurrezione* fanno tornare un personaggio ucciso.
- L'anima deve essere **consenziente**; non può essere riportata contro la sua volontà.
- **Perdita di livello**: il personaggio riportato in vita perde **1 livello di personaggio** (o 1 Costituzione se riportato in vita al 1° livello). Nuovo totale PE = punto medio tra i PE minimi per il nuovo livello (inferiore) e i PE minimi per il livello precedente.
- **Ostacolare la resurrezione**: trattenere il corpo, lanciare *intrappolare l'anima*, ecc. impedisce la resurrezione.

## Combinare effetti magici

La regola predefinita è "**tutti gli effetti funzionano come scritto**, simultaneamente." Esistono molte eccezioni specifiche:

### Cumulo dei bonus

| Relazione tra bonus | Si cumula? |
|---|---|
| Due bonus dello **stesso tipo nominato** (entrambi "bonus di potenziamento alla Forza") | **No** — si prende solo il più alto. |
| Due bonus di tipo **diverso** (potenziamento + morale) | **Sì** — si sommano. |
| Bonus di **schivare** tra loro | **Sì** — caso speciale, gli schivare si cumulano sempre. |
| Bonus di **circostanza** da circostanze genuinamente diverse | **Sì**. |
| Bonus **senza nome** (solo "+2 a") con un bonus nominato | **Sì**. |
| Penalità di qualsiasi tipo da fonti diverse | **Sì** — si sommano (un'eccezione alla regola dei bonus). |

### Stesso effetto a intensità diverse

- *Forza del toro* (+4 di potenziamento alla Forza) e *resistenza dell'orso* (+4 di potenziamento alla Costituzione): caratteristiche diverse, entrambe si applicano.
- *Indebolimento* (-4 Forza) e un altro *indebolimento* (-6 Forza): si applica solo la penalità peggiore.
- *Forza del toro* (+4) e *cintura del gigante* (+4 di potenziamento alla Forza): stesso tipo di bonus, stessa caratteristica → non si cumulano, si prende il più alto.

### Stesso incantesimo, effetti diversi

- Alcuni incantesimi offrono effetti multipli tramite una sequenza (*metamorfosi di oggetti*). Lanciarli ripetutamente li sovrappone: l'ultimo si applica; gli effetti sovrapposti precedenti si annullano.
- *Pelle di pietra* + un nuovo *pelle di pietra* sullo stesso bersaglio → solo uno è attivo; il più vecchio viene dissolto.

### Controlli mentali multipli

- Il soggetto obbedisce a tutti i controllori nella massima misura coerente. Se i comandi confliggono, i controllori effettuano **prove opposte di Carisma** per determinare quale comando segue il soggetto.
- Un controllo mentale può soppiantarne un altro se lo rimuove esplicitamente (es. *spezzare incantamento*).
- Una creatura già sotto *charme* può anche ricevere una *suggestione*; la *suggestione* ha la precedenza per i comandi compatibili.

### Effetti opposti

- Due incantesimi con effetti esplicitamente opposti (es. *velocità* contro *lentezza*) **si annullano a vicenda** entro il bersaglio/area di sovrapposizione.
- *Lentezza* su una creatura velocizzata → entrambi gli effetti terminano su quella creatura.

### Effetti istantanei

- Gli effetti con durata *istantanea* sono **sempre cumulativi** tra fonti multiple (es. più *cura ferite leggere* sullo stesso bersaglio ripristinano ciascuno pf indipendentemente; più istanze di danno da *palla di fuoco* si applicano ciascuna).

### Nomi di bonus diversi da incantesimi diversi

- *Benedizione* (+1 morale ai tiri per colpire; +1 di resistenza ai tiri salvezza contro la paura) e *protezione dal male* (+2 di resistenza ai tiri salvezza contro effetti di origine malvagia) → entrambi si applicano; tipi di bonus diversi.

## Anatomia della descrizione di un incantesimo

Ogni voce di incantesimo in [src/data/spells.json](../../src/data/spells.json) è strutturata allo stesso modo. Lo schema:

### Nome

- Il nome comune dell'incantesimo (1ª riga).

### Scuola (sottoscuola) [Descrittore]

- Una delle 8 scuole (o **Universale**); alcuni incantesimi specificano una sottoscuola (es. Evocazione[Chiamare], Illusione[Ammaliamento]).
- I descrittori tra parentesi indicano categorie elementali o tematiche a cui appartiene l'incantesimo; i descrittori governano come l'incantesimo interagisce con altri incantesimi, capacità speciali, immunità/resistenze e allineamento delle creature.
- Descrittori standard: **acido, aria, caotico, freddo, oscurità, morte, terra, elettricità, malvagio, paura, fuoco, forza, buono, dipendente dal linguaggio, legale, luce, che influenza la mente, sonoro, acqua**.
- Un incantesimo **dipendente dal linguaggio** funziona solo su un bersaglio che comprende il linguaggio parlato usato.
- Un incantesimo **che influenza la mente** funziona solo su creature con **Intelligenza ≥ 1**.

### Livello

- Livello per classe occupato dall'incantesimo, abbreviato:
  - **Brd** (bardo), **Chr** (chierico), **Drd** (druido), **Mag** (mago), **Pal** (paladino), **Rgr** (ranger), **Str** (stregone).
- I domini del chierico sono elencati separatamente (es. `Fuoco 3` = incantesimo di 3° livello del dominio del Fuoco).
- Gli incantesimi di dominio, quando preparati nello slot di dominio bonus, usano il livello più alto applicabile per la propria CD del tiro salvezza.

### Componenti

- **V** verbale — deve essere pronunciata a voce udibile. Ridotto al silenzio o incapace di parlare → non si può lanciare. Assordato: 20% di probabilità di fallire ogni lancio di un incantesimo con componente V.
- **S** somatica — richiede almeno una mano libera. Non si può lanciare mentre si lotta/si è immobilizzati/con entrambe le mani occupate.
- **M** materiale — sostanza fisica consumata nel lancio; tracciata solo se il costo non è trascurabile. La normale borsa dei componenti copre tutte le componenti M senza costo indicato.
- **F** focus — oggetto non consumato richiesto durante il lancio. La normale borsa copre i focus senza costo indicato.
- **FD** focus divino — un simbolo sacro (chierici buoni) o un simbolo sacrilego (chierici malvagi) o uno specifico oggetto naturale (druidi: vischio/agrifoglio).
- **PE** — i PE devono essere spesi al lancio; non possono scendere sotto i PE richiesti per il livello attuale.
- **Contrassegni suffisso** nelle voci della lista incantesimi:
  - `m` dopo il nome dell'incantesimo = componente materiale costosa (non nella borsa — deve essere tracciata).
  - `f` = focus costoso (deve essere tracciato).
  - `x` = componente in PE.

Vedi [spell-components.md](spell-components.md) per le regole complete.

### Tempo di lancio

- La maggior parte degli incantesimi: **1 azione standard**.
- Alcuni: 1 round, 1 minuto, più a lungo.
- Alcuni: **1 azione gratuita** (es. *caduta di piuma*) — può essere lanciato anche fuori dal proprio turno (eccezione secondo le regole scritte); non provoca attacco di opportunità; solo un incantesimo ad azione gratuita per round.
- Incantesimi con 1 round di lancio: azione di round completo che si completa all'inizio del **turno successivo dell'incantatore** (provoca attacco di opportunità all'inizio; l'incantatore non minaccia alcun quadretto durante il lancio).

### Raggio

- **Personale** — colpisce solo l'incantatore.
- **Contatto** — attacco di contatto per somministrarlo; si può mantenere la carica per più round (vedi [combat.md](combat.md) → incantesimi a contatto).
- **Ravvicinato** — `7,5 m + 1,5 m ogni 2 livelli dell'incantatore` (cioè 9 m al L2, 10,5 m al L4, 12 m al L6, …).
- **Medio** — `30 m + 3 m per livello dell'incantatore`.
- **Lungo** — `120 m + 12 m per livello dell'incantatore`.
- **Illimitato** — ovunque sullo stesso piano.
- **Raggio espresso in metri** — raggio fisso dalla descrizione dell'incantesimo.

### Bersaglio / Effetto / Area

Gli incantesimi specificano cosa colpiscono:

- **Bersaglio/i** — creatura/e o oggetto/i specifici. L'incantatore deve vedere o toccare ogni bersaglio.
- **Effetto** — l'incantesimo crea una cosa separata (es. *evocare mostri I* crea una creatura; *muro di fuoco* crea un muro).
- **Area** — l'incantesimo colpisce tutto nell'area:
  - **Esplosione** — si irradia da un punto in tutte le direzioni; colpisce tutti nel raggio (inclusi i non visibili se esiste linea di effetto).
  - **Emanazione** — come l'esplosione ma l'area persiste per la durata dell'incantesimo, irradiando dal punto sorgente.
  - **Diffusione** — come l'esplosione ma piega attorno agli angoli (non serve linea di effetto oltre la sorgente).
  - **Cono** — da un angolo del quadretto dell'incantatore in un quarto di cerchio; si allarga estendendosi.
  - **Cilindro** — cerchio sul terreno, che poi si estende verso l'alto.
  - **Linea** — linea retta dal quadretto dell'incantatore fino a un angolo di un quadretto alla gittata massima; colpisce tutti i quadretti attraversati dalla linea.
  - **Sfera** — si irradia da un punto designato (l'incantatore non deve necessariamente esserne il centro).
- **Creature** contro **Oggetti**: gli incantesimi mirati a creature non colpiscono gli oggetti a meno che non sia specificato, e viceversa.
- Un effetto con un contrassegno **Formabile (F)** (dopo Area o Effetto): l'incantatore modella l'area entro certi vincoli (tipicamente cubi, nessuna dimensione < 3 m).

### Linea di effetto

- Un percorso libero dall'origine dell'incantesimo al bersaglio. **Come la linea di vista ma bloccata solo da barriere solide**, non da oscurità/nebbia/occultamento.
- Richiesta perché qualsiasi incantesimo abbia effetto su un bersaglio o per designare l'origine di un'area.
- Un muro di pietra con un foro grande quanto un pugno (≥ 9 dm²) NON blocca la linea di effetto attraverso il foro.

### Mirare un incantesimo

- L'incantatore sceglie il bersaglio/area al momento del lancio. Per un incantesimo con esplosioni multiple (*missile magico*), scegliere i bersagli al momento del lancio.
- Per un incantesimo con raggio "solo su di sé", l'incantatore è automaticamente l'unico bersaglio.

### Durata

- **Cronometrata** — round/minuti/ore. Alla scadenza del tempo, la magia termina.
- **Istantanea** — effetto una tantum; le conseguenze possono persistere (es. *cura ferite leggere* cura; i pf recuperati sono permanenti).
- **Permanente** — la magia rimane finché *dissolvi magie* non la rimuove.
- **Concentrazione** — dura finché l'incantatore si concentra (azione standard per round per mantenerla; non provoca attacco di opportunità).
- **Concentrazione + N round dopo** — concentrarsi estende l'effetto fino a quel numero di round oltre la fine della concentrazione.
- **Soggetti, Effetti, Aree** — la durata copre ciò che nomina la descrizione dell'incantesimo.
- Suffisso **(D)** sulla durata = l'incantatore può **dissipare** l'incantesimo come azione standard (nessuna V, nessun attacco di opportunità).
- Suffisso **(I)** sulla durata = l'incantatore può interrompere/scaricare l'effetto a piacere (es. *arma spirituale* può essere ridiretta come azione di movimento).
- **Scarica**: incantesimi come gli attacchi di contatto restano "mantenuti" finché non vengono scaricati; una volta somministrata, la magia termina.

### Tiro salvezza

- **Annulla** — tiro salvezza riuscito = l'incantesimo non ha effetto.
- **Parziale** — tiro salvezza riuscito = si verifica comunque un effetto ridotto (es. metà danno, paralisi parziale).
- **Nessuno** — nessun tiro salvezza permesso.
- **Metà** — tiro salvezza riuscito = metà danno (tipico degli incantesimi ad area che infliggono danno).
- **Non credere** — chi tira salvezza riconosce l'illusione (tiro salvezza sulla Volontà).
- **(oggetto)** — il tiro salvezza si applica agli oggetti (usa il tiro salvezza del portatore se posseduto; fallisce automaticamente se incustodito).
- **(innocuo)** — incantesimo benefico; il soggetto può rinunciare volontariamente al tiro salvezza.
- CD = `10 + livello dell'incantesimo + modificatore della caratteristica per lanciare`.
- Fallimento volontario: una creatura con resistenza alla magia (es. RI o una qualità speciale come quella dell'elfo contro *sonno*) può sopprimerla come azione standard per ricevere un incantesimo benefico.
- Vedi [saving-throws.md](saving-throws.md).

### Resistenza agli incantesimi

- Elenca **Sì / No / Sì (innocuo) / Sì (oggetto)**.
- Vedi [spell-resistance.md](spell-resistance.md).

### Testo descrittivo

- Descrizione completa dell'incantesimo: comportamento, regole speciali, rimandi "vedi testo".

## Interazioni del livello dell'incantatore

- Molti effetti degli incantesimi (dadi danno, raggio, durata, numero di bersagli) scalano con il **livello dell'incantatore**.
- Livello dell'incantatore = il livello della classe con cui si lancia. Oggetti usati da creature senza classe: livello dell'incantatore = DV.
- Alcuni incantesimi specificano una **scala massima** (es. *palla di fuoco* si ferma a 10d6 al livello dell'incantatore 10+).
- Un incantatore può **deliberatamente lanciare a un livello dell'incantatore inferiore** (fino al minimo richiesto dall'incantesimo); l'incantesimo usa il livello inferiore per tutte le variabili dipendenti dal livello. Utile per: regole di controincantesimo, prove di dissoluzione, ecc.
- Un privilegio di classe che concede incantesimi "come se di livello dell'incantatore superiore" si applica alle **variabili dipendenti dal livello dell'incantatore** (danno, durata, raggio, prove di dissoluzione) ma **non** ad altre capacità di classe.

## Convenzioni della lista degli incantesimi

- **Dadi Vita** è sinonimo di livello di personaggio per effetti "creature fino a N DV" (es. *charme su persona* su creature fino a 4 DV). Le creature con solo DV razziali usano quei DV.
- **Livello dell'incantatore** in una lista di incantesimi significa sempre il livello di classe dell'incantatore (o i DV per creature senza classe).
- **"Creatura"** e **"personaggio"** sono sinonimi nel testo degli incantesimi.
- Le condizioni citate negli incantesimi (accecato, paralizzato, stordito, ecc.) seguono [conditions.md](conditions.md).
- **Serie di incantesimi**: alcuni incantesimi fanno riferimento a una base (es. *cura ferite leggere* è la base per tutti gli incantesimi *cura*). Le voci derivate elencano solo le differenze dalla base; le informazioni di intestazione condivise non sono ripetute.

## Scuole di magia

Ci sono **8 scuole** più una categoria senza scuola. Ogni incantesimo appartiene esattamente a una scuola (a volte una sottoscuola).

- **Abiurazione** — protezione, bando, dissipazione, barriere magiche. Incantesimi comuni: *protezione dal male*, *dissolvi magie*, *campo di antimagia*. Nota: un'abiurazione attiva crea "interferenza" magica rilevabile come disturbo di basso livello (*individuazione del magico*).
- **Evocazione** — sposta materia o energia. **Sottoscuole**:
  - *Chiamare*: porta una creatura da un altro piano (la creatura è reale; se uccisa, muore).
  - *Creazione*: crea un oggetto/creatura del tutto nuovo dalla magia.
  - *Guarigione*: ripristina pf e condizioni (varianti divine).
  - *Evocare*: crea una copia temporanea di una creatura da un altro piano (se uccisa, svanisce; si riforma dopo 24 h sul piano di origine, non distrutta).
  - *Teletrasporto*: sposta l'incantatore/soggetto attraverso il Piano Astrale.
- **Divinazione** — rivela informazioni. La sottoscuola *Scrutare* crea un sensore magico invisibile che permette all'incantatore di vedere/sentire a distanza.
- **Ammaliamento** — influenza la mente. Sottoscuole:
  - *Charme*: fa sì che il soggetto veda l'incantatore come un amico.
  - *Compulsione*: costringe direttamente ad azioni. Tutti gli incantesimi di ammaliamento influenzano la mente (Intelligenza ≥ 1, non non morti/costrutti/melme/vegetali/elementali/parassiti).
- **Invocazione** — manipola energia magica grezza per produrre danno, forza, ecc.
- **Illusione** — false informazioni sensoriali. Sottoscuole:
  - *Immagine* — falsa immagine generata solo dalla mente dell'incantatore; gli altri la percepiscono come l'incantatore intende.
  - *Ammaliamento visivo* — altera il modo in cui viene percepito un oggetto/creatura esistente.
  - *Motivo* — immagine in movimento con un effetto reale (mentale) sugli osservatori.
  - *Fantasma* — immagine mentale percepita solo dai bersagli (gli altri non vedono nulla).
  - *Ombra* — parzialmente reale, tratta dal Piano d'Ombra; può avere effetti reali.
  - Non credere: un tiro salvezza sulla Volontà riuscito permette all'osservatore di riconoscere l'illusione (immagine/ammaliamento visivo diventano traslucidi; il fantasma svanisce per lui; gli effetti d'ombra infliggono danno ridotto).
- **Necromanzia** — manipola la forza vitale, la morte e i non morti.
- **Trasmutazione** — altera le proprietà fisiche di creature o oggetti.
- **Universale** — *non è una scuola*. Un piccolo gruppo di incantesimi (es. *prestidigitazione*, *permanenza*, *desiderio limitato*, *desiderio*, *marchio arcano*) che non appartengono a nessuna scuola. Sempre apprendibili; non possono essere di specialità né proibiti.

## Specializzazione del mago (maghi specialisti)

- Al L1, un mago sceglie una **scuola di specialità** (o resta *universalista*).
- Scegliere una specialità richiede anche di **proibirsi 2 altre scuole** — solo **1** proibizione se la specialità è **Divinazione** (non si può proibire Divinazione come scuola bandita).
- **Effetti della specialità**:
  - +1 slot di incantesimo di specialità a ogni livello di incantesimo (dal 1° al 9°); **deve contenere un incantesimo della scuola di specialità**.
  - `+2` a Sapienza Magica nell'apprendere incantesimi della scuola di specialità.
- **Effetti della proibizione**:
  - Non può **apprendere o lanciare** incantesimi delle scuole proibite — nemmeno tramite pergamene o bacchette. Non può prepararli, copiarli o trascriverli.
- Le scelte di specialità/proibizione sono **permanenti**.
- Gli incantesimi universali non sono influenzati.

Nomi degli specialisti: abiuratore, evocatore, divinatore, ammaliatore, invocatore, illusionista, negromante, trasmutatore.

## Libro degli incantesimi del mago

### Contenuto iniziale
- Tutti gli incantesimi di livello 0 (tranne le scuole proibite).
- 3 incantesimi di 1° livello a scelta (di qualsiasi scuola consentita).
- 1 incantesimo di 1° livello aggiuntivo per ogni +1 di modificatore di Intelligenza (bonus di creazione).

### Aggiungere incantesimi
- **Gratuito al salire di livello**: 2 incantesimi di qualsiasi livello che il mago può lanciare, aggiunti al libro senza costo.
- **Copiare dal libro di un altro mago o da una pergamena**:
  1. Decifrare la scrittura — Sapienza Magica CD `15 + livello dell'incantesimo` (1 giorno di studio). *Lettura magica* decifra automaticamente senza prova.
  2. Una volta decifrato, trascrivere nel proprio libro — stessa CD di Sapienza Magica al momento della trascrizione. Il fallimento significa che non si può riprovare con quella fonte fino al giorno successivo; la fonte resta intatta (la pergamena si consuma se trascritta; il libro resta intatto).
  3. Costo di trascrizione: **100 mo a pagina** (inchiostri speciali). L'incantesimo occupa **pagine = livello dell'incantesimo** (trucchetto = 1 pagina); richiede **24 ore a pagina**.
  4. I maghi specialisti ottengono +2 a Sapienza Magica quando trascrivono un incantesimo della propria scuola di specialità; non possono trascrivere affatto le scuole proibite.
- **Ricerca indipendente** — inventare un nuovo incantesimo da zero. Investimento in tempo + mo secondo il DM (regole nel Manuale del Dungeon Master).
- **Libro degli incantesimi perduto** — si può preparare solo *lettura magica* finché il libro non viene recuperato o sostituito.
- **Sostituzione**: copiare da un libro degli incantesimi di riserva nello stesso modo (1 giorno di studio + prova di Sapienza Magica + 100 mo/pagina); non serve ridecifrare la propria scrittura se il mago ha già preparato da quel libro in precedenza.
- **Vendere** i libri degli incantesimi: metà del costo di scrittura del contenuto (quindi 100 pagine di incantesimi = 5.000 mo).

## Incantesimi conosciuti di stregone / bardo

- Lista fissa per livello di classe (Tabelle 3-17 / 3-18).
- Nuovo livello → si ottengono incantesimi secondo la tabella; si sceglie dalla lista di incantesimi di classe appropriata.
- Stregoni/bardi possono **scambiare un incantesimo precedentemente conosciuto** con un altro a certi livelli di classe (per descrizione della classe).
- Un Carisma alto fornisce incantesimi bonus (slot aggiuntivi), ma nessun incantesimo **conosciuto** extra.

## Trascrizione e ricerca divina

- Gli incantesimi divini vengono trascritti/decifrati esattamente come gli arcani (Sapienza Magica CD 15 + livello dell'incantesimo).
- Solo il **lanciatore di una pergamena divina** può trascriverla per l'uso; gli scritti tornano in forma divina dopo essere stati decifrati da chiunque, ma solo gli incantatori divini con quell'incantesimo nella propria lista di classe possono poi lanciarlo.
- Ricerca di nuovi incantesimi divini: stessa procedura della ricerca arcana; alcuni chierici la condividono con la propria fede, altri la custodiscono.

## Sotto-regole della metamorfosi (cambiaforma)

Il meccanismo condiviso dietro *alterare se stesso*, *metamorfosi* e la forma selvatica del druido. Tratto dalle voci *alterare se stesso* e *metamorfosi* in [src/data/spells.json](../../src/data/spells.json) — *metamorfosi* è definito come "funziona come *alterare se stesso*, tranne…", quindi i due vanno letti insieme. La forma selvatica aggiunge le proprie eccezioni sopra; vedi [class-features.md](class-features.md) → Forma selvatica.

### Cosa dà la nuova forma

Solo qualità fisiche:

- **Punteggi di Forza, Destrezza e Costituzione della nuova forma** (*metamorfosi*; il semplice *alterare se stesso* mantiene i propri).
- **Taglia naturale**, con il cambiamento di taglia che influisce su CA, tiri per colpire, lotta e capacità di trasporto.
- **Bonus di armatura naturale** della forma.
- **Armi naturali** (artiglio, morso, corno…). Arti extra **non** concedono attacchi extra.
- **Modalità di movimento comuni** — scavare, arrampicarsi, camminare, nuotare, volare con ali. Limitato a **120 piedi volando / 60 piedi non volando**.
- **Bonus razziali alle abilità** e **talenti bonus razziali** della forma.
- Qualità fisiche grossolane (ali, numero di arti).
- **Tutti gli *attacchi* speciali straordinari** della forma (solo *metamorfosi*).

### Cosa si mantiene

- **Classe e livello, punti ferita, allineamento, bonus di attacco base, bonus base ai tiri salvezza.** Cambiano solo i *modificatori di caratteristica* sovrapposti a quelli — i numeri base non cambiano.
- I punteggi di **Intelligenza, Saggezza e Carisma**.
- Tutti gli attacchi e le qualità **soprannaturali e magiche** della propria forma *normale*, tranne quelli che richiedono una parte del corpo che la nuova forma non ha (una bocca per un'arma a soffio, occhi per uno sguardo).
- Gli attacchi e le qualità straordinarie **derivati dai livelli di classe**. Si perdono quelli della forma normale che non lo sono.
- La capacità di lanciare incantesimi — ma vedi la restrizione sulle componenti sotto.

### Cosa NON si ottiene

- Le **qualità** straordinarie speciali della forma: scurovisione, visione crepuscolare, percezione cieca, vista cieca, guarigione accelerata, rigenerazione, **fiuto**, e così via. Questa è la clausola più comunemente applicata male — una forma di lupo concede il morso, non il fiuto.
- Qualsiasi capacità **soprannaturale o magica** della nuova forma.
- I Dadi Vita della forma, il BAB, i gradi abilità o i talenti (non razziali).

### Punti ferita

- I punti ferita **non cambiano**: restano calcolati dalla propria Costituzione, anche se la Costituzione della forma si applica ai tiri salvezza sulla Tempra e alle prove di Costituzione.
- *Metamorfosi* e la forma selvatica **inoltre ripristinano i punti ferita come se ci si fosse riposati per una notte** all'assunzione della forma — `1 pf per livello di personaggio`, per [combat.md](combat.md) → Cura naturale. Tornare alla forma normale non cura nient'altro.
- Se ucciso mentre trasformato, il soggetto ritorna alla forma originale ma resta morto.

### Lanciare incantesimi da trasformati

- La nuova forma deve essere **in grado di parlare in modo comprensibile** per usare le componenti verbali, e deve avere **arti capaci di manipolazione fine** per le componenti somatiche o materiali.
- Una forma animale fallisce entrambe, quindi un druido trasformato non può lanciare incantesimi — ed è esattamente ciò che il talento **Incantesimi Naturali** esiste per aggirare.

### Equipaggiamento

- Al cambiamento, ogni oggetto o **resta indossato o impugnato** (se la nuova forma può indossarlo o impugnarlo) oppure **si fonde nella forma e diventa non funzionante**. Una forma animale fonde praticamente tutto, quindi l'armatura indossata smette di contribuire alla CA e le armi impugnate smettono di essere utilizzabili.
- Al ritorno alla forma normale, gli oggetti fusi riappaiono al loro posto e tornano a funzionare. Gli oggetti indossati nella forma assunta che la forma vera non può indossare cadono a terra.

### Limiti

- I **DV della forma assunta non possono superare il livello dell'incantatore** (o i DV del soggetto, il minore dei due); *metamorfosi* si ferma a 15 DV. La forma selvatica si ferma invece al **livello di classe del druido**.
- Nessuna forma più piccola di Piccolissimo; nessuna forma incorporea o gassosa; nessuna creatura portatrice di un modello.
- Le creature incorporee e gassose non possono essere trasformate con metamorfosi. Una creatura con il sottotipo **cambiaforma** può tornare alla forma originale come azione standard.
- *Metamorfosi* cambia il **tipo e sottotipo di creatura** del soggetto per corrispondere alla forma; il semplice *alterare se stesso* no.

## Riferimenti incrociati

- [spell-components.md](spell-components.md) — dettagli V/S/M/F/FD/PE, codici suffisso.
- [spell-resistance.md](spell-resistance.md) — prova di livello dell'incantatore contro la RI.
- [counterspelling.md](counterspelling.md) — prepararsi, identificazione, contrasto tramite *dissolvi magie*.
- [metamagic.md](metamagic.md) — adeguamento dello slot, tempistica di preparazione, differenze nel tempo di lancio.
- [special-abilities.md](special-abilities.md) — categorizzazione Mag / Sop / Ex / Naturale.
- [class-features.md](class-features.md) — incantesimi di dominio, scambio spontaneo, famiglio, compagno animale, forma selvatica.
- [combat.md](combat.md) — incantesimi a contatto, attacco di opportunità dal lancio, lancio sulla difensiva.
- [conditions.md](conditions.md) — stati referenziati (accecato, paralizzato, ecc.).
- [saving-throws.md](saving-throws.md) — CD del tiro salvezza, effetti del tiro salvezza.
- [equipment.md](equipment.md) — tabella della percentuale di fallimento delle formule arcane.
- [magic-items.md](magic-items.md) — pergamene, bacchette, pozioni; metamagia nella creazione di oggetti.
- [src/data/spells.json](../../src/data/spells.json) — dati per singolo incantesimo.

## Fonti

- Manuale del Giocatore — pp. 8–10, 23, 32, 43–44, 55–56
- Manuale del Giocatore — pp. 169–183 (lancio, concentrazione, contrastare gli incantesimi, anatomia della descrizione dell'incantesimo, scuole, preparazione del mago, preparazione di stregone/bardo, preparazione divina, trascrizione, combinare effetti, perdita di livello per riportare in vita, suffissi degli incantesimi, convenzioni su DV/livello dell'incantatore)
- [src/data/spells.json](../../src/data/spells.json) — le voci *alterare se stesso* e *metamorfosi*, fonte della sezione sulle sotto-regole della metamorfosi sopra
