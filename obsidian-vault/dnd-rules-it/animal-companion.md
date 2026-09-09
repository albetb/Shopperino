# Compagno Animale

> Sotto-sistema del compagno animale di druido/ranger: come si sceglie un compagno, come avanza con il livello di classe (DV bonus, armatura naturale, potenziamenti di caratteristica, comandi, abilità speciali), e gli elenchi di creature alternative con i relativi aggiustamenti di livello. Le schede base per creatura si trovano in [src/data/animals.json](../../src/data/animals.json).

Il **compagno animale di un druido** è superiore a un normale animale della sua specie e possiede poteri speciali. Il **ranger** ottiene lo stesso sotto-sistema su una progressione più lenta (vedi *Ranger* più sotto). Il compagno viene ottenuto come abilità **Straordinaria (Str)**.

Il compagno **mantiene il proprio tipo di creatura** (animale, dinosauro, ecc.) — **non** diventa una bestia magica. (Il *famiglio* è quello che diventa una bestia magica; non bisogna confondere i due.) Per questo motivo, *condividere incantesimi* prevede un'eccezione esplicita che permette comunque al druido di prenderlo come bersaglio (vedi sotto).

---

## Livello effettivo

Tutte le caratteristiche del compagno dipendono dal **livello effettivo da druido** del personaggio:

- **Druido**: livello effettivo = livello di classe da druido.
- **Ranger**: livello effettivo = **½ livello da ranger** (arrotondato per difetto). Un ranger ottiene per la prima volta un compagno al **livello da ranger 4** (livello effettivo 2).
- **Cumulo**: i livelli di classi *diverse* che concedono ciascuna un compagno animale si cumulano ai fini della determinazione delle capacità del compagno e di quali elenchi alternativi sono disponibili — con i livelli da ranger contati a metà. (Es. Druido 3/Ranger 4 → 3 + 2 = livello effettivo 5.)

Se l'aggiustamento di un elenco alternativo scelto (sotto) riduce il livello effettivo sotto **1**, quella creatura **non può** essere selezionata.

---

## Tabella di avanzamento

Indicizzata per **livello effettivo da druido** (la "Livello di classe" della tabella):

| Livello effettivo | DV bonus | Mod. armatura naturale | Mod. For/Des | Comandi bonus | Speciale |
|---|---|---|---|---|---|
| 1°–2°   | +0  | +0  | +0 | 1 | Legame, condividere incantesimi |
| 3°–5°   | +2  | +2  | +1 | 2 | Eludere |
| 6°–8°   | +4  | +4  | +2 | 3 | Devozione |
| 9°–11°  | +6  | +6  | +3 | 4 | Multiattacco |
| 12°–14° | +8  | +8  | +4 | 5 | — |
| 15°–17° | +10 | +10 | +5 | 6 | Eludere migliorato |
| 18°–20° | +12 | +12 | +6 | 7 | — |

Le abilità speciali sono **cumulative**: il compagno di un druido di 9° livello ha Legame, condividere incantesimi, Eludere, Devozione **e** Multiattacco.

---

## Basi del compagno

Parti dalle **statistiche base per una creatura della specie del compagno** (da [src/data/animals.json](../../src/data/animals.json)), quindi applica gli aggiustamenti della tabella:

- **DV bonus** — Dadi Vita a otto facce (**d8**) extra, ognuno dei quali guadagna il **modificatore di Costituzione** come di consueto. I DV bonus aumentano il **bonus di attacco base e i tiri salvezza base** del compagno:
  - **Bonus di attacco base** = quello di un **druido di livello pari ai DV totali del compagno** (cioè la progressione a ¾ del bonus di attacco base sui DV totali = DV base dell'animale + DV bonus).
  - **Tiri salvezza** — tratta il compagno come un personaggio il cui livello è pari ai suoi **DV totali**, con tiri salvezza **buoni su Tempra e Riflessi**. (Il tiro salvezza su Volontà non è migliorato da questa regola; resta quello dell'animale base.)
  - I DV bonus concedono inoltre **punti abilità e talenti aggiuntivi**, come di norma per l'avanzamento dei Dadi Vita di un mostro.
- **Mod. armatura naturale** — un **miglioramento** (aggiunto sopra) al bonus di armatura naturale già esistente della creatura.
- **Mod. For/Des** — aggiungi questo valore sia alla Forza sia alla Destrezza del compagno.
- **Comandi bonus** — il numero totale di comandi "bonus" che l'animale conosce **in aggiunta** a quelli che il druido gli insegna tramite Addestrare Animali. I comandi bonus non richiedono **né tempo di addestramento né prove di Addestrare Animali** e **non contano** ai fini del normale limite di comandi dell'animale. Il druido li seleziona e, **una volta selezionati, non possono essere cambiati**.

---

## Abilità speciali

- **Legame (Str)** — il druido può **gestire** il proprio compagno con un'**azione gratuita**, o **spingerlo** con un'**azione di movimento**, anche senza alcun grado in Addestrare Animali. Ottiene un **bonus di circostanza +4** a tutte le prove di **empatia selvatica** e di **Addestrare Animali** riguardanti il compagno.
- **Condividere incantesimi (Str)** — a propria discrezione, il druido può far sì che un qualsiasi **incantesimo** (non un'abilità magica) lanciato **su se stessa** influenzi anche il proprio compagno, se questi si trova **entro 5 piedi** al momento del lancio. Per una durata non istantanea, l'effetto **cessa se il compagno si allontana oltre 5 piedi** e non riprende anche se torna in tempo. Può inoltre lanciare sul compagno un incantesimo con bersaglio **"Voi"** (trattato come un incantesimo a **contatto**) invece che su se stessa. Questo funziona **anche se l'incantesimo normalmente non ha effetto su creature del tipo animale**. Il compagno può rifiutare volontariamente.
- **Eludere (Str)** — a un attacco che permette un **tiro salvezza su Riflessi per la metà dei danni**, un tiro salvezza **riuscito** significa che il compagno non subisce **alcun** danno.
- **Devozione (Str)** — **bonus morale +4** ai **tiri salvezza su Volontà contro incantesimi di ammaliamento** ed effetti simili.
- **Multiattacco** — il compagno ottiene **Multiattacco** come talento bonus se ha **tre o più** attacchi naturali e non possiede già il talento. Se ha **meno di tre** attacchi naturali, ottiene invece un **secondo attacco con la propria arma naturale primaria con una penalità di −5**.
- **Eludere migliorato (Str)** — a un attacco che permette un tiro salvezza su Riflessi per la metà dei danni: un tiro salvezza **riuscito** → **nessun** danno; un tiro salvezza **fallito** → **metà** danno.

---

## Elenco standard (livello effettivo 1)

Un druido può **iniziare a giocare** con un compagno animale da questo elenco (nessun aggiustamento di livello). Il compagno di un druido di 1° livello è del tutto tipico per la propria specie, salvo gli aggiustamenti sopra indicati. Il compagno è un animale leale che accompagna il druido secondo le modalità tipiche della propria specie.

**¹ = disponibile solo se la campagna si svolge interamente o in parte in un ambiente acquatico.**

| Creatura | Acquatico | Rif. dati |
|---|---|---|
| Tasso | | `animals/badger` |
| Cammello | | `animals/camel` |
| Topo crudele | | `animals/dire-rat` |
| Cane | | `animals/dog` |
| Cane, da cavalcatura | | `animals/dog-riding` |
| Aquila | | `animals/eagle` |
| Falco | | `animals/hawk` |
| Cavallo, pesante | | `animals/horse-heavy` |
| Cavallo, leggero | | `animals/horse-light` |
| Gufo | | `animals/owl` |
| Pony | | `animals/pony` |
| Serpente, vipera Piccola | | `animals/snake-small-viper` |
| Serpente, vipera Media | | `animals/snake-medium-viper` |
| Lupo | | `animals/wolf` |
| Focena | ¹ | `animals/porpoise` |
| Squalo, Medio | ¹ | `animals/shark-medium` |
| Calamaro | ¹ | `animals/squid` |

> **Nota sull'errata.** Le regole ufficiali elencano anche il **coccodrillo** qui (acquatico), duplicando la sua voce nell'elenco di 4° livello (−3) più sotto — un vero e proprio bug nella fonte. Poiché è troppo potente per un compagno di 1° livello, questo progetto mantiene il coccodrillo **solo** nell'elenco di 4° livello (−3).

---

## Compagni animali alternativi

Un personaggio di **livello effettivo** sufficientemente alto può invece scegliere un compagno da uno degli elenchi sotto, **applicando l'aggiustamento di livello indicato** al livello effettivo ai fini della determinazione delle caratteristiche e delle abilità speciali del compagno. L'aggiustamento è mostrato tra parentesi.

> Esempio: un leopardo è nell'elenco di **4° livello (−3)**. Un druido di 7° livello che prende un leopardo lo tratta come un compagno di livello effettivo **7 − 3 = 4** (quindi +2 DV, +2 armatura naturale, +1 For/Des, 2 comandi, Eludere).

**¹ = disponibile solo in un ambiente acquatico.**

Rif. dati = la scheda corrispondente in [src/data/animals.json](../../src/data/animals.json) (`animals/<slug>`). I dinosauri **non sono ancora presenti** in `animals.json`.

### 4° livello o superiore (Livello −3)

| Creatura | Acquatico | Rif. dati |
|---|---|---|
| Scimmia antropomorfa | | `animals/ape` |
| Orso, nero | | `animals/bear-black` |
| Bisonte | | `animals/bison` |
| Cinghiale | | `animals/boar` |
| Ghepardo | | `animals/cheetah` |
| Coccodrillo | ¹ | `animals/crocodile` |
| Tasso crudele | | `animals/dire-badger` |
| Pipistrello crudele | | `animals/dire-bat` |
| Donnola crudele | | `animals/dire-weasel` |
| Leopardo | | `animals/leopard` |
| Lucertola, varano | | `animals/lizard-monitor` |
| Squalo, Grande | ¹ | `animals/shark-large` |
| Serpente, costrittore | | `animals/constrictor-snake` |
| Serpente, vipera Grande | | `animals/snake-large-viper` |
| Ghiottone | | `animals/wolverine` |

### 7° livello o superiore (Livello −6)

| Creatura | Acquatico | Rif. dati |
|---|---|---|
| Orso, bruno | | `animals/bear-brown` |
| Coccodrillo, gigante | | `animals/crocodile-giant` |
| Deinonychus (dinosauro) | | *mancante — non in animals.json* |
| Scimmia antropomorfa crudele | | `animals/dire-ape` |
| Cinghiale crudele | | `animals/dire-boar` |
| Lupo crudele | | `animals/dire-wolf` |
| Ghiottone crudele | | `animals/dire-wolverine` |
| Elasmosauro (dinosauro) | ¹ | *mancante — non in animals.json* |
| Leone | | `animals/lion` |
| Rinoceronte | | `animals/rhinoceros` |
| Serpente, vipera Enorme | | `animals/snake-huge-viper` |
| Tigre | | `animals/tiger` |

### 10° livello o superiore (Livello −9)

| Creatura | Acquatico | Rif. dati |
|---|---|---|
| Orso, polare | | `animals/bear-polar` |
| Leone crudele | | `animals/dire-lion` |
| Megaraptor (dinosauro) | | *mancante — non in animals.json* |
| Squalo, Enorme | ¹ | `animals/shark-huge` |
| Serpente, costrittore gigante | | `animals/constrictor-snake-giant` |
| Balena, orca | ¹ | `animals/orca` |

### 13° livello o superiore (Livello −12)

| Creatura | Acquatico | Rif. dati |
|---|---|---|
| Orso crudele | | `animals/dire-bear` |
| Elefante | | `animals/elephant` |
| Polpo, gigante | ¹ | `animals/octopus-giant` |

### 16° livello o superiore (Livello −15)

| Creatura | Acquatico | Rif. dati |
|---|---|---|
| Squalo crudele | ¹ | `animals/dire-shark` |
| Tigre crudele | | `animals/dire-tiger` |
| Calamaro, gigante | ¹ | `animals/squid-giant` |
| Triceratopo (dinosauro) | | *mancante — non in animals.json* |
| Tirannosauro (dinosauro) | | *mancante — non in animals.json* |

---

## Sostituzione

Perdere un compagno (morte o rilascio) richiede un **rituale di 24 ore** per richiamarne uno nuovo. Un druido può congedare un compagno (rilasciarlo) senza penalità.

---

## Riferimenti incrociati

- [class-features.md](class-features.md) — Privilegi di classe di Druido e Ranger (questo sotto-sistema è riassunto lì e dettagliato qui).
- [classes.md](classes.md) — progressioni di DV, bonus di attacco base e tiri salvezza di classe usate per derivare bonus di attacco base/tiri salvezza del compagno dai DV totali.
- [skills-detail.md](skills-detail.md) — Addestrare Animali (comandi, addestramento) ed empatia selvatica del druido.
- [combat.md](combat.md) — attacchi con tiro salvezza su Riflessi per la metà (Eludere/Eludere migliorato), attacchi naturali (Multiattacco).
- [src/data/animals.json](../../src/data/animals.json) — schede base per ogni creatura selezionabile (`animals/<slug>`).

## Fonti

- Manuale del Giocatore — tabelle del Compagno Animale del Druido e dei Compagni Animali Alternativi.
