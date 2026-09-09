# Oggetti magici

> Categorie di oggetti, i quattro metodi di attivazione, gli slot del corpo per gli oggetti indossati, le tre categorie di oggetti impugnati (verghe, bastoni, bacchette), le formule di costo per la creazione di oggetti e la durabilità degli oggetti.

## Categorie di oggetti

Armature e scudi · armi · pozioni · anelli · verghe · pergamene · bastoni · bacchette · oggetti meravigliosi. Più gli oggetti **maledetti** e **intelligenti**, e gli **artefatti** (minori: estremamente rari ma non unici; maggiori: unici nel loro genere).

Ogni categoria ha il proprio metodo di attivazione, la propria collocazione (indossato, impugnato o trasportato) e le proprie regole di prezzo. I dati per singolo oggetto sono in [src/data/items.json](../../src/data/items.json).

## Metodi di attivazione

Quattro metodi. La descrizione dell'oggetto ne indica uno; quando non lo fa, si presume la **parola di comando**.

| Metodo | Usato da | Chi può attivarlo | Azione | Provoca attacchi di opportunità |
|---|---|---|---|---|
| Completamento di incantesimo | Pergamene | Livello sufficiente in una classe in grado di lanciare l'incantesimo | Standard | **Sì** |
| Attivazione di incantesimo | Bacchette, bastoni | Chiunque abbia l'incantesimo **nella lista incantesimi della propria classe** | Standard | No |
| Parola di comando | Predefinito quando non specificato | Chiunque conosca la parola | Standard | No |
| Attivato ad uso | Oggetti indossati/impugnati | Chiunque lo usi come previsto | Standard o nessuna | No |

- **Completamento di incantesimo** — l'incantesimo è già preparato e quasi lanciato; restano solo i gesti e le parole finali. Un personaggio non di livello sufficiente nella classe giusta può comunque provarci, a rischio di un **malfunzionamento**.
- **Attivazione di incantesimo** — nessun gesto, solo una parola. **Il vincolo è l'appartenenza alla lista, e il livello è irrilevante**: le regole estendono esplicitamente questo anche a un personaggio che non è ancora in grado di lanciare incantesimi (un paladino di 3° livello è idoneo per gli incantesimi della lista del paladino). Chi lo usa deve comunque **determinare quale incantesimo contiene l'oggetto** prima di attivarlo.
- **Parola di comando** — una chiave, non un'abilità. Non serve sapere altro. Una parola di comando che è una parola comune rischia un'attivazione accidentale durante una conversazione.
- **Attivato ad uso** — bevilo, impugnalo, indossalo. **Azione standard** quando l'uso richiede tempo (bere una pozione, indossare o togliere un anello o un cappello); **nessuna azione** quando l'attivazione coincide con l'uso (brandire una spada magica). Non provoca a meno che non lo faccia l'uso stesso — attraversare un quadretto minacciato con stivali magici provoca perché è il *camminare* a farlo. L'attivazione ad uso non implica che l'utente sappia cosa fa l'oggetto: deve saperlo o indovinarlo e poi usarlo, a meno che il beneficio non sia automatico.

## Oggetti indossati: i dodici slot del corpo

Un umanoide può indossare fino a **dodici** oggetti magici alla volta, uno per gruppo, ciascuno legato alla parte del corpo su cui si indossa:

testa (diadema, cappello, fascia, elmo) · occhi (lenti, occhialini) · collo (amuleto, collana, spilla, medaglione, scarabeo, talismano) · torso (camicia, canottiera, veste) · corpo (armatura o tunica protettiva, sopra la camicia) · vita (cintura, sopra l'armatura) · spalle (mantello, cappa, manto, sopra l'armatura) · braccia (bracciali, braccialetti) · mani (guanto, guanti, manopole) · **anelli — uno per mano, due al massimo** · piedi (scarpe, stivali)

- Un personaggio può **possedere** un numero qualsiasi di oggetti dello stesso tipo, ma trae beneficio solo da quanto gli slot permettono. Un terzo anello non fa nulla; un secondo mantello indossato sopra un mantello non fa nulla.
- Alcuni oggetti sono **indossati o trasportati senza occupare uno slot**; lo indica la descrizione dell'oggetto stesso.
- **Bacchette, verghe e bastoni non sono in questo elenco.** Sono **impugnati**, non indossati — vedi sotto.

## Oggetti impugnati: verghe, bastoni, bacchette

Le tre categorie che occupano una mano invece di uno slot del corpo. Differiscono quasi in tutto e non vanno trattate come un'unica famiglia.

| | Verga | Bastone | Bacchetta |
|---|---|---|---|
| Incantesimi | Nessuno — poteri unici | Diversi | Esattamente uno |
| Livello dell'incantesimo | — | Qualsiasi | **4° o inferiore** |
| Cariche | **Normalmente nessuna** | 50, **una o più per incantesimo** | 50, **una per uso** |
| Attivazione | Varia per oggetto | Attivazione di incantesimo | Attivazione di incantesimo |
| Chi può usarla | **Chiunque** | Incantesimo nella lista della propria classe | Incantesimo nella lista della propria classe |
| Livello dell'incantatore | Per oggetto | Minimo **8°** | Minimo per lanciare l'incantesimo |
| CA / pf / durezza / CD per spezzarlo tipici | 9 / 10 / 10 / 27 | 7 / 10 / 5 / 24 | 7 / 5 / 5 / 16 |

### Verga

- Simile a uno scettro, con **poteri magici unici anziché incantesimi**, e normalmente **senza cariche**.
- **Chiunque può usare una verga** — non c'è alcun vincolo di lista incantesimi, a differenza delle altre due categorie.
- L'attivazione varia per oggetto ed è indicata nella descrizione dell'oggetto stesso.
- **Molte fungono anche da mazza leggera o randello** grazie alla loro robusta costruzione, quindi "impugnato" e "è un'arma" non sono esclusivi.
- Una verga **con** cariche non può mai essere intelligente.
- Le **verghe metamagiche** sono l'unica famiglia di verghe con una regola condivisa da tutto l'insieme: tre usi al giorno, applicano il loro talento **senza aumentare il livello dello slot dell'incantesimo**, e i tre livelli si differenziano *solo* per il livello massimo dell'incantesimo che raggiungono — minore 3°, normale 6°, superiore 9°. Vedi [metamagic.md](metamagic.md).

### Bastone

- Contiene **diversi incantesimi, di qualsiasi livello**; livello dell'incantatore minimo **8°**.
- **Deve essere impugnato con almeno una mano** per essere attivato (o ciò che funge da mano).
- Lanciare tramite esso è un'azione standard che non provoca, a meno che il tempo di lancio dell'incantesimo stesso non sia più lungo, nel qual caso prevale quello.
- **Le CD dei tiri salvezza usano il punteggio di caratteristica e i talenti pertinenti dell'utilizzatore.** Ogni *altro* oggetto magico usa il punteggio di caratteristica minimo richiesto per lanciare l'incantesimo, ed è ciò che rende un bastone nettamente migliore nelle mani di un incantatore potente.
- L'utilizzatore può sostituire **il proprio livello dell'incantatore a quello del bastone, se il proprio è più alto** — aumentando raggio, durata e altri effetti dipendenti dal livello.
- Di conseguenza gli incantesimi lanciati da un bastone sono **più difficili da dissolvere** e **migliori nel superare la resistenza agli incantesimi**, specialmente per un utilizzatore con Penetrazione degli Incantesimi.

### Bacchetta

- Contiene **un singolo incantesimo di 4° livello o inferiore**. Ognuna delle sue 50 cariche lancia quell'incantesimo una volta.
- **Deve essere impugnata con una mano e puntata** nella direzione generale del bersaglio o dell'area.
- Utilizzabile **mentre si lotta o si è stati inghiottiti**.
- Azione standard, non provoca, a meno che il tempo di lancio dell'incantesimo non sia più lungo.
- Una bacchetta senza cariche è **un semplice bastoncino senza valore**.
- Il suo livello dell'incantatore è il **minimo** necessario per lanciare l'incantesimo, a meno che non sia stata deliberatamente creata più alta (il che aumenta il prezzo).

## Panoramica sulla creazione di oggetti

Un incantatore con un talento di **creazione di oggetti** appropriato può fabbricare un oggetto magico permanente o monouso:

1. Spendendo **PE** = `1/25` del prezzo di mercato in mo dell'oggetto.
2. Spendendo **materiali grezzi** = `1/2` del prezzo di mercato in mo dell'oggetto.
3. Spendendo **tempo** = `1 giorno` di lavoro ogni `1.000 mo` di prezzo base (minimo 1 giorno).
4. Avendo accesso a uno spazio di lavoro adeguato (laboratorio magico, banco alchemico, ecc.).
5. Soddisfacendo gli incantesimi prerequisiti dell'oggetto (lanciati durante la creazione) e il livello dell'incantatore.

Il personaggio non può perdere un livello spendendo PE nella creazione; può spendere fino al buffer di PE del proprio livello attuale. Dopo essere salito di livello grazie all'avventura, può spendere subito i nuovi PE nella creazione, se lo desidera.

- Un incantesimo prerequisito può essere fornito da un **oggetto ad attivazione di incantesimo o a completamento di incantesimo** invece che lanciandolo: una pergamena consumata, oppure **una carica di bacchetta**, per ogni giorno di creazione.
- **Più personaggi possono collaborare**, ciascuno fornendo alcuni prerequisiti; concordano chi tra loro conta come creatore ai fini del livello dell'incantatore dell'oggetto.

## Formule per il prezzo base (oggetti a singolo incantesimo)

| Oggetto | Prezzo base |
|---|---|
| Pergamena | `livello dell'incantatore × livello dell'incantesimo × 25 mo` |
| Pozione | `livello dell'incantatore × livello dell'incantesimo × 50 mo` |
| Bacchetta | `livello dell'incantatore × livello dell'incantesimo × 750 mo` (50 cariche) |

- **Incantesimi di livello 0**: contano il livello dell'incantesimo come `1/2` nella formula.
- Le **bacchette** hanno **50 cariche** alla creazione; il prezzo è per le 50 intere.
- Il **livello dell'incantatore** deve essere ≥ al **minimo** per lanciare l'incantesimo contenuto (≥ 1 per un incantesimo di 1° livello; ≥ 3 per uno di 2° livello; ecc.). Si presume che l'incantesimo sia lanciato a quel minimo a meno che il creatore non lo alzi deliberatamente — il che costa di più e normalmente si fa per incantesimi che scalano con il livello (danni, durata).

### Costo in PE e materiali a partire dal prezzo

- **Costo in PE** = `prezzo base / 25`.
- **Materiali grezzi** = `prezzo base / 2`.

### Componenti materiali extra

- Gli incantesimi con una **componente materiale costosa** (es. il diamante da 5.000 mo di *riportare in vita*) aggiungono il costo della componente come spesa extra.
- **Pozioni / pergamene**: pagare il costo della componente **una volta** alla creazione (viene consumata).
- **Bacchette**: pagare **50 ×** il costo della componente (una per carica).
- Questi costi extra si aggiungono al prezzo della formula.

### Altri tipi di oggetti

- Alcuni oggetti magici hanno costi fissi aggiuntivi oltre alla formula (es. l'*anello dei tre desideri* aggiunge 3 × 5.000 = 15.000 mo oltre alla base, perché *desiderio* ha una componente in PE e un oggetto permanente permette 3 usi).
- Il prezzo dettagliato per oggetti non a incantesimo singolo (anelli, verghe, bastoni, oggetti meravigliosi, armi/armature) è nel Manuale del Dungeon Master. Vedi [src/data/items.json](../../src/data/items.json) per i dati di gioco.

## Tempo di creazione

- `1 giorno ogni 1.000 mo` di prezzo base (minimo 1 giorno).
- Un creatore può lavorare in turni di 8 ore; non può spendere PE se non sta lavorando attivamente.

## Requisiti di spazio di lavoro

- La maggior parte dei talenti di creazione di oggetti richiede un **laboratorio** o un **workshop** adeguato.
- Esempi di spazi di lavoro: laboratorio alchemico (+2 ad Artigianato (alchimia)); laboratorio magico.
- Senza uno spazio di lavoro adeguato, la creazione è impossibile (nessuna improvvisazione).

## Talenti di creazione di oggetti (categorie)

- **Scrivere Pergamene** — pergamene. Talento bonus gratuito per i maghi al 1° livello.
- **Mescere Pozioni** — pozioni.
- **Creare Bacchette** — bacchette.
- **Creare Bastoni** — bastoni.
- **Creare Verghe** — verghe.
- **Creare Oggetti Meravigliosi** — oggetti meravigliosi.
- **Creare Armi e Armature Magiche** — armi e armature.
- **Forgiare Anelli** — anelli.
- **Creare Costrutti** — Manuale del Dungeon Master.

Ogni talento ha i propri prerequisiti (livello dell'incantatore + a volte una classe specifica).

## Chi attiva l'oggetto non ha bisogno del talento di creazione

- Il personaggio che **usa** un oggetto creato non ha mai bisogno del talento di creazione oggetti usato per fabbricarlo.
- Chi lo attiva deve soddisfare i requisiti d'uso propri dell'oggetto (corrispondenza di allineamento, privilegio di classe, punteggio di caratteristica, ecc.) — oppure usare l'abilità **Utilizzare Oggetti Magici** per emulare qualsiasi prerequisito mancante (vedi [skills-detail.md](skills-detail.md#utilizzare-oggetti-magici-use-magic-device)).

## Interazione con la metamagia

- Un oggetto che incorpora un **incantesimo modificato dalla metamagia** ha il prezzo calcolato al **livello dell'incantesimo modificato dalla metamagia**, non al livello base (quindi una pergamena di un incantesimo di 3° livello Massimizzato usa il livello 6 nella formula).
- Chi attiva l'oggetto **non** ha bisogno del talento di metamagia. La metamagia fa parte dell'oggetto.
- Per l'interazione dei talenti di metamagia con gli oggetti a incantesimo, vedi [metamagic.md](metamagic.md).

## Tiri salvezza, danni e riparazione degli oggetti magici

- Un oggetto magico effettua un tiro salvezza **solo** quando è incustodito, quando è il bersaglio specifico dell'effetto, oppure quando chi lo tiene ottiene un **1 naturale** al proprio tiro salvezza.
- **Bonus al tiro salvezza dell'oggetto = `2 + ½ livello dell'incantatore`** (arrotondato per difetto), ed è **lo stesso numero per tutti e tre i tipi di tiro salvezza**. Eccezione: un oggetto intelligente effettua i tiri salvezza sulla Volontà con la propria Saggezza.
- Un oggetto magico subisce danni come un oggetto comune dello stesso tipo salvo indicazione contraria. Un oggetto **danneggiato** continua a funzionare; uno **distrutto** perde tutta la sua magia.
- Ripararlo con Artigianato costa quanto riparare un oggetto comune dello stesso tipo. *Ripristinare* ripara un oggetto danneggiato, mai uno distrutto.
- Vedi [objects.md](objects.md) per durezza, punti ferita e CD per spezzare in generale.

## Oggetti intelligenti e maledetti

- Solo gli oggetti **permanenti** possono essere intelligenti. Gli oggetti monouso e a cariche — pozioni, pergamene, bacchette, verghe cariche — **non possono** mai esserlo.
- Meno dell'1% degli oggetti magici è intelligente.
- Gli oggetti maledetti sono costruiti male o corrotti; possono danneggiare l'utilizzatore o semplicemente non essere ciò che sembrano.

## Taglia e oggetti magici

- La taglia normalmente non impedisce l'uso: la maggior parte degli indumenti magici o va bene a chiunque o si adatta magicamente a chi li indossa. Corporatura, forma e razza non dovrebbero impedire a un personaggio di usare un oggetto. Un creatore può deliberatamente restringerne uno a una razza o taglia, ma è un'eccezione dichiarata dal DM, non una regola predefinita.

## Casi particolari ed eccezioni

- Il pool di PE di un creatore non può scendere sotto 0 (cioè non si può perdere un livello per la creazione).
- L'incantesimo di una pergamena **non può superare** il massimo livello di incantesimo lanciabile dal creatore al momento della creazione.
- Una pergamena/pozione registra il **livello dell'incantatore** del creatore; chi la attiva usa quel livello dell'incantatore per qualsiasi scala interna all'incantesimo (dadi danno, raggio, durata), indipendentemente dal proprio livello. **Un bastone è l'eccezione** — usa il livello dell'incantatore dell'utilizzatore quando è più alto.
- Una bacchetta consuma una carica per attivazione; a 0 cariche, la bacchetta è inerte finché non viene ricaricata (il DM può permettere la ricarica allo stesso tasso di costo; di solito le bacchette sono oggetti a vita singola).
- Un oggetto ad attivazione di incantesimo è vincolato **solo alla lista incantesimi**, mai al livello dell'utilizzatore — un incantatore ben al di sotto del livello dell'incantesimo lo attiva normalmente.

## Riferimenti incrociati

- [feats.md](feats.md) — sistema dei talenti, categoria dei talenti di creazione oggetti.
- [metamagic.md](metamagic.md) — metamagia in pergamene/bacchette/pozioni.
- [magic.md](magic.md) — livello dell'incantatore, preparazione degli incantesimi.
- [spell-resistance.md](spell-resistance.md) — la prova di livello dell'incantatore che un bastone migliora.
- [objects.md](objects.md) — durezza, punti ferita, CD per spezzare.
- [skills-detail.md](skills-detail.md) — emulazione di Utilizzare Oggetti Magici per gli oggetti.
- [combat.md](combat.md) — attivare un oggetto come azione in un round.
- [src/data/items.json](../../src/data/items.json), [src/data/scrolls.json](../../src/data/scrolls.json) — dati per singolo oggetto.

## Fonti

- Manuale del Dungeon Master — pp. 212–216, 234–247
- Manuale del Giocatore — pp. 88–89
