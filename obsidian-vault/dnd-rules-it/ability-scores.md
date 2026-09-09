# Punteggi di Caratteristica

> Le sei caratteristiche, la generazione del punteggio, la formula del modificatore, cosa governa ciascuna caratteristica e le regole per modificare i punteggi durante il gioco.

## Meccanica di base

- Sei caratteristiche: **Forza, Destrezza, Costituzione, Intelligenza, Saggezza, Carisma**.
- Ogni caratteristica ha un **punteggio** (tipicamente 3–18 al 1° livello prima dei modificatori razziali) e un **modificatore** derivato.
- È il modificatore — non il punteggio grezzo — a essere sommato ai tiri con d20, ai danni, ai totali dei tiri salvezza, ecc.
- Ogni creatura possiede tutti i punteggi di caratteristica. Un punteggio di caratteristica pari a 0 in una caratteristica non fisica è impossibile; un punteggio pari a 0 significa che la creatura è priva di sensi/morta (gestito nelle regole delle creature).

## Formule

- `modificatore = arrotonda per difetto((punteggio - 10) / 2)`
- Esempi: 10 → 0, 12 → +1, 14 → +2, 16 → +3, 18 → +4, 8 → −1, 6 → −2.

## Generazione del punteggio predefinita

- Tira `4d6`, scarta il dado più basso, somma i tre rimanenti. Ripeti sei volte per ottenere sei valori non assegnati.
- Assegna i sei valori alle sei caratteristiche a piacere (dopo aver visto i tiri).
- Applica i modificatori razziali di caratteristica (Tabella 2-1, [races.md](races.md)) *dopo* l'assegnazione. I modificatori razziali possono abbassare un punteggio oltre l'intervallo tirato.
- **Il ritiro è permesso** se il set tirato è troppo debole: tutti e sei i dadi possono essere ritirati se *la somma dei modificatori (prima dei modificatori razziali) ≤ 0* OPPURE *il punteggio più alto ≤ 13*.

## Cosa governa ciascuna caratteristica

### Forza (For)

- Si somma ai tiri per colpire in mischia.
- Si somma ai tiri per i danni delle armi in mischia (incluse le armi da lancio; *eccezione*: gli attacchi con la mano secondaria ricevono solo ×0,5 del bonus di Forza al danno, le armi a due mani ricevono ×1,5). Gli archi in genere non aggiungono la Forza al danno (gli archi compositi sono un'eccezione, fino al bonus di Forza indicato per l'arco).
- Determina la capacità di trasporto (vedi [equipment.md](equipment.md) una volta scritto).
- Governa le prove di abilità basate sulla Forza.
- Le penalità di Forza si applicano anche ai tiri per colpire con archi che non sono compositi.

### Destrezza (Des)

- Si somma ai tiri per colpire a distanza.
- Si somma alla CA, *purché il personaggio sia in grado di reagire all'attacco*. (Un personaggio colto alla sprovvista o ignaro perde la Destrezza alla CA.)
- Si somma ai tiri salvezza su Riflessi.
- Governa le prove di abilità basate sulla Destrezza.
- Importante per qualsiasi classe che indossa armatura leggera/media o nessuna armatura e per i combattenti a distanza.

### Costituzione (Cos)

- Si somma ai punti ferita per Dado Vita (applicata ogni volta che i punti ferita vengono tirati o fissati per un livello).
- Si somma ai tiri salvezza su Tempra.
- Governa le prove di Concentrazione (rilevante per gli incantatori).
- Una variazione del modificatore di Costituzione modifica retroattivamente i punti ferita esistenti, in aumento o in diminuzione, di `Δmodificatore × numero di DV`.
- Un modificatore negativo al tiro dei punti ferita (da una Costituzione molto bassa) garantisce comunque **almeno 1 pf per livello**.

### Intelligenza (Int)

- Determina le lingue bonus conosciute alla creazione del personaggio (vedi [languages.md](languages.md) una volta scritto).
- Si somma ai **punti abilità per livello**. (Minimo 1 PA/livello indipendentemente da un'Intelligenza bassa.)
- Governa le prove di abilità basate sull'Intelligenza.
- Maghi: caratteristica di lancio — vedi *Caratteristica di lancio* più sotto.
- Gli animali hanno Intelligenza 1–2; le creature con intelletto umanoide hanno Intelligenza ≥ 3.

### Saggezza (Sag)

- Si somma ai tiri salvezza su Volontà.
- Governa le prove di abilità basate sulla Saggezza.
- Chierici, druidi, paladini, ranger: caratteristica di lancio — vedi *Caratteristica di lancio* più sotto.

### Carisma (Car)

- Governa le prove di abilità basate sul Carisma.
- Stregoni e bardi: caratteristica di lancio — vedi *Caratteristica di lancio* più sotto.
- Determina i tentativi e le prove di **scacciare non morti** di chierici e paladini.

(L'elenco delle abilità per caratteristica si trova in [src/data/skills.json](../../src/data/skills.json); ogni abilità è legata a una singola caratteristica.)

## Caratteristica di lancio

Ogni classe incantatrice ha una caratteristica che governa la sua magia:

- **Mago** → Intelligenza
- **Chierico, Druido, Paladino, Ranger** → Saggezza
- **Stregone, Bardo** → Carisma

Regole legate alla caratteristica di lancio:

- **Minimo per lanciare un incantesimo di livello L**: punteggio della caratteristica di lancio ≥ `10 + L`. (Serve Intelligenza 11 per lanciare incantesimi di 1° livello da mago, Intelligenza 19 per il 9° livello, ecc.)
- **Punteggio della caratteristica di lancio ≤ 9**: non può lanciare alcun incantesimo di quella classe (indipendentemente dal livello di classe).
- **CD del tiro salvezza dell'incantesimo** = `10 + livello dell'incantesimo + modificatore della caratteristica di lancio`. (Vedi [magic.md](magic.md) una volta scritto per le regole magiche complete.)
- **Incantesimi bonus al giorno** in base al punteggio di caratteristica, per livello di incantesimo — vedi [magic.md](magic.md).
- Un calo di caratteristica che porta il punteggio sotto il minimo per un livello di incantesimo: il personaggio non può lanciare incantesimi di quel livello finché il punteggio non si riprende. Gli incantesimi di livello inferiore restano lanciabili.

## Modificare i punteggi di caratteristica durante il gioco

I punteggi di caratteristica possono cambiare dopo la creazione. Tutti i valori derivati (modificatori, punti ferita, attacco, CA, tiri salvezza, punti abilità, accesso agli incantesimi, incantesimi bonus, CD, ecc.) si aggiornano di conseguenza.

- **Aumento al passaggio di livello**: +1 a una qualsiasi caratteristica a scelta ai livelli di personaggio **4, 8, 12, 16, 20**.
- **Incantesimi/effetti magici**: variazioni temporanee o permanenti delle caratteristiche. Esempi: *raggio di indebolimento* riduce la Forza; *forza del toro* la aumenta. Un effetto "intralciante" (intralciare) fa comportare la Destrezza come se fosse inferiore di 4 senza modificare davvero il punteggio.
- **Oggetti magici (indossati)**: bonus di potenziamento finché l'oggetto è indossato (es. *guanti della Destrezza*). Limite: un oggetto indossato che potenzia una caratteristica non può superare **+6**.
- **Bonus intrinseci** (da effetti rari come *desiderio*): aumenti permanenti del punteggio di caratteristica, limite cumulativo **+5**.
- **Danni alle caratteristiche** (veleno, malattia, alcuni attacchi): perdita temporanea. Si recupera **1 punto/giorno per caratteristica danneggiata** con il riposo.
- **Risucchio di caratteristiche**: perdita permanente. Ripristinato solo da incantesimi come *restaurazione*.
- **Invecchiamento**: i punteggi di caratteristica cambiano a determinate soglie di età (Tabella 6-5). Le caratteristiche fisiche (Forza/Destrezza/Costituzione) tendono a calare; le caratteristiche mentali (Intelligenza/Saggezza/Carisma) aumentano.
- **Ricalcolo retroattivo**: quando una variazione del punteggio di caratteristica altera un valore derivato per livello (es. Intelligenza → PA/livello), la variazione si applica anche ai livelli passati. *Esempio*: l'Intelligenza di Mialee sale da 15 a 16 al 4° livello grazie all'aumento di +1 al passaggio di livello; i suoi punti abilità per livello salgono da 4 a 5. Ottiene immediatamente +1 PA retroattivo per ciascun livello precedente (3 PA, per i livelli 1–3), oltre ai 5 PA per il 4° livello.

## Nota sul cumulo degli incantesimi bonus

- Gli incantesimi bonus della Tabella 1-1 si aggiungono alla griglia base di incantesimi al giorno della classe incantatrice. Un personaggio con due classi incantatrici calcola gli incantesimi bonus separatamente per ciascuna (ognuna basata sulla propria caratteristica e sul proprio livello di incantesimo).

## Casi particolari & eccezioni

- Un aggiustamento razziale di caratteristica può portare un punteggio generato sotto 8; i punteggi non vengono arrotondati per eccesso durante la creazione del personaggio.
- Gli oggetti magici indossati non si cumulano tra loro per la stessa caratteristica — si applica solo il bonus di potenziamento più alto (regola generale degli oggetti magici).
- Lo stesso punteggio di caratteristica può essere aumentato sia da equipaggiamento magico (potenziamento, limite +6) sia da bonus intrinseci (limite +5) contemporaneamente, poiché sono tipi di bonus diversi.
- Un calo di Costituzione riduce temporaneamente i punti ferita attuali; se si riprende, i punti ferita tornano. Un risucchio di Costituzione *permanente* riduce i punti ferita in modo permanente.
- Un punteggio della caratteristica di lancio aumentato durante la carriera fino a un nuovo minimo di livello di incantesimo abilita immediatamente quel livello di incantesimo (subordinatamente al livello di classe che lo consente).

## Riferimenti incrociati

- [character-creation.md](character-creation.md) — fase in cui i punteggi vengono tirati e assegnati.
- [races.md](races.md) — aggiustamenti razziali di caratteristica.
- [skills.md](skills.md) — ogni abilità è legata a una caratteristica; l'Intelligenza governa i PA/livello.
- [saving-throws.md](saving-throws.md) — Tempra=Costituzione, Riflessi=Destrezza, Volontà=Saggezza.
- [magic.md](magic.md) — incantesimi bonus, minimi di lancio, CD del tiro salvezza.
- [experience-and-leveling.md](experience-and-leveling.md) — +1 caratteristica ogni 4 livelli.
- [combat.md](combat.md) — Forza→mischia, Destrezza→distanza e CA, Costituzione→pf.

## Fonti

- Manuale del Giocatore — pp. 6, 8–10
