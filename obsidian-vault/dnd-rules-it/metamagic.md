# Metamagia

> Come i talenti di metamagia modificano gli incantesimi: variazione del livello dello slot, tempistica di applicazione per stile di lancio, cumulo, interazione con gli oggetti e comportamento nel controincantesimo.

## Meccanica di base

- Un **talento di metamagia** modifica l'effetto di un incantesimo (Incantesimi Potenziati, Massimizzati, Rapidi, Silenziosi, Immobili, Estesi, Intensificati, ecc.). Applicare un talento di metamagia occupa uno **slot di livello superiore** rispetto al livello normale dell'incantesimo, ma l'incantesimo funziona comunque al suo **livello originale** per la CD del tiro salvezza, il bonus di attacco e le interazioni di livello effettivo.
- Più talenti di metamagia possono essere applicati a un singolo incantesimo; le variazioni di slot si sommano.
- Un dato talento di metamagia non può essere applicato **due volte** allo stesso incantesimo (es. non si può usare Incantesimi Potenziati due volte su un incantesimo per il 200% dei danni).
- I dettagli per singolo talento (variazione di slot, effetto, restrizioni) sono in [src/data/feats.json](../../src/data/feats.json).

## Effetti sull'incantesimo

- L'incantesimo continua a funzionare al suo **livello originale** per:
  - CD del tiro salvezza (`10 + livello originale dell'incantesimo + modificatore della caratteristica di lancio`).
  - Tiro per colpire.
  - Livello effettivo per le interazioni di livello dell'incantatore, le prove per dissolvere, l'antimagia, ecc.
  - Controincantesimo: un incantesimo modificato dalla metamagia controincanta ancora (o viene ancora controincantato da) il suo incantesimo base normalmente. Il talento di metamagia non cambia quale incantesimo lo controincanta. (Vedi [magic.md](magic.md) → controincantesimi quando estratto.)
- L'incantesimo **occupa** uno slot del livello modificato superiore (base + somma delle variazioni dei talenti di metamagia).
- **Incantesimi Intensificati è l'unica eccezione a tutto quanto sopra.** *Aumenta effettivamente il livello* dell'incantesimo, fino a un massimo di 9°. Ogni effetto che dipende dal livello dell'incantesimo — **CD del tiro salvezza**, penetrare un *globo di invulnerabilità inferiore*, prove per dissolvere — viene calcolato dal livello **intensificato**, non da quello base. La sua variazione è quindi un **livello bersaglio** piuttosto che un numero fisso: intensificare un incantesimo di 2° livello fino al 5° costa uno slot di 5° livello e dà CD 10 + 5 + modificatore di caratteristica.
- Le modifiche si applicano solo agli incantesimi che l'incantatore **lancia direttamente** — applicare la metamagia a un incantesimo su una pergamena/bacchetta/pozione richiede che la metamagia sia stata applicata **al momento della creazione dell'oggetto**, non al momento dell'attivazione. (Chi attiva l'oggetto non ha bisogno del talento di metamagia.)

## Tempistica di applicazione

Dipende dallo stile di lancio:

### Incantatori preparati (mago, chierico, druido, paladino, ranger)

- Il talento di metamagia viene **scelto al momento della preparazione** dell'incantesimo.
- L'incantesimo preparato occupa lo slot di livello superiore modificato dal momento della preparazione.
- Il tempo di lancio è **invariato** rispetto al tempo di lancio dell'incantesimo base (es. preparare *charme su persone* con Incantesimi Immobili a 2° livello richiede comunque un'azione standard per essere lanciato).

### Incantatori spontanei (stregone, bardo)

- Il talento di metamagia viene **scelto al momento del lancio**.
- Il tempo di lancio **aumenta di un livello** — un incantesimo che richiede 1 azione standard diventa un'azione di round completo se sottoposto a metamagia. Un incantesimo il cui tempo di lancio normale è già 1 round diventa 1 azione di round completo + 1 round (cioè 1 round + 1 round).
- L'incantesimo usa qualsiasi slot disponibile del livello modificato.

### Scambio spontaneo di chierico/druido

- Un chierico che usa il lancio spontaneo di *cura*/*infliggi* (o un druido che usa *evoca alleato naturale*) può convertire un incantesimo **preparato e sottoposto a metamagia** nella sua versione spontanea — usando lo slot superiore che ha preparato, l'incantesimo spontaneo diventa metamagico senza costo aggiuntivo. Il tempo di lancio per questa conversione segue la **regola dell'incantatore spontaneo** (un livello più lungo), anche se l'incantatore sottostante è normalmente preparato.

## Incantesimi a cui la metamagia non si adatta

- Non tutti i talenti di metamagia funzionano su tutti gli incantesimi. Le restrizioni per singolo talento sono nel JSON (es. Incantesimi Potenziati funziona solo su incantesimi con effetti numerici variabili).
- Un incantesimo **senza componente verbale** non è idoneo per Incantesimi Silenziosi; uno senza componente somatica non è idoneo per Incantesimi Immobili.
- Incantesimi Rapidi **non** si cumula con sé stesso; può essere lanciato un solo incantesimo accelerato per round, anche se ne fossero disponibili più di uno.

## Interazione con gli attacchi di opportunità

- Incantesimi Silenziosi / Incantesimi Immobili **non eliminano** l'attacco di opportunità dovuto alla portata minacciata quando si lancia un incantesimo (provocare-al-lancio è legato all'atto di lanciare in un quadretto minacciato, non alla visibilità delle componenti).
- **Incantesimi Rapidi** è un'eccezione: un incantesimo accelerato **non provoca** un attacco di opportunità (perché viene lanciato come azione gratuita, non come azione standard).

## Verghe di metamagia

- Una verga di metamagia applica il proprio talento a un incantesimo **senza aumentare il livello dello slot** — l'incantesimo viene lanciato dallo slot in cui si trova già. Questo è l'intero scopo di una verga del genere, e si applica **anche agli incantatori preparati**: la scelta viene fatta al momento del lancio, non della preparazione.
- Tre livelli, distinti **dal livello di incantesimo più alto su cui la verga funziona** e da nient'altro: **inferiore 3°**, **normale 6°**, **superiore 9°**.
- **Tre usi al giorno** ciascuna.
- Usare una verga non richiede di possedere il talento che applica.

## Interazione con la creazione di oggetti

- Quando si **crea una pergamena, una pozione o una bacchetta** con un incantesimo sottoposto a metamagia, l'oggetto viene prezzato/livellato in base al **livello modificato dell'incantesimo**, non al livello base. (Vedi [magic-items.md](magic-items.md) per le formule di costo.)
- Chi attiva un tale oggetto **non** deve possedere il talento di metamagia — la metamagia è incorporata nell'oggetto al momento della creazione.

## Controincantesimo

- Un incantesimo modificato da un talento di metamagia **conta come l'incantesimo base** ai fini del controincantesimo: controincanta ed è controincantato dalla sua forma base.
- La metamagia non altera l'identificazione dell'incantesimo né la sua interazione con *dissolvi magie* / la prontezza al controincantesimo.

## Riferimenti incrociati

- [feats.md](feats.md) — sistema dei talenti, prerequisiti, acquisizione.
- [magic.md](magic.md) — lancio di incantesimi di base, formula della CD del tiro salvezza, preparati contro spontanei.
- [magic-items.md](magic-items.md) — formule di costo per la creazione di oggetti, inclusi i livelli modificati dalla metamagia.
- [combat.md](combat.md) — azioni di round completo e trigger degli attacchi di opportunità.
- [src/data/feats.json](../../src/data/feats.json) — variazione di slot ed effetto per singolo talento di metamagia.

## Fonti

- Manuale del Giocatore — pp. 88–89
