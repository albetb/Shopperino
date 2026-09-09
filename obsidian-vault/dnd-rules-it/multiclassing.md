# Multiclasse

> Prendere livelli in due o più classi. Costruito in modo incrementale; i dettagli sull'aritmetica della penalità ai PE sono a p. 60 (estrazione futura).

## Concetto di base

- Un personaggio può aggiungere un livello in qualsiasi classe al passaggio di livello, non solo continuare la propria classe esistente.
- Ogni classe contribuisce con i propri Dadi Vita, bonus di attacco base, tiri salvezza base, punti abilità e privilegi di classe ai livelli acquisiti.
- Non c'è un limite massimo al numero di classi che un personaggio può assumere.

## Combinare i numeri di classe

- **Bonus di attacco base**: somma il bonus di attacco base di ogni classe al livello acquisito. Le soglie di attacco iterativo (+6/+11/+16) scattano dal bonus di attacco base *totale*.
- **Tiri salvezza base**: somma il tiro salvezza base di ogni classe al livello acquisito, per ciascuno di Tempra/Riflessi/Volontà. Applica il modificatore di caratteristica una sola volta, in aggiunta.
- **Dadi Vita/punti ferita**: ogni nuovo livello tira i Dadi Vita della nuova classe (il 1° Dado Vita in assoluto è massimo). I punti ferita delle classi precedenti restano invariati.
- **Punti abilità**: quelli guadagnati per livello usano il valore PA/livello della classe *nuova* + modificatore di Intelligenza (minimo 1).
- **Elenco delle abilità di classe**: unione degli elenchi di abilità di classe di tutte le classi. Un'abilità che è di classe per una qualsiasi classe assunta è di classe in generale.
- **Privilegi di classe**: progrediscono indipendentemente per ciascuna classe. Si cumulano solo quando una classe lo specifica esplicitamente (es. alcuni privilegi del compagno animale di druido/ranger).

## Classe preferita

- Ogni razza ha una **classe preferita** designata.
  - Umani e mezzelfi: **"qualsiasi"** — la classe preferita è quella in cui il personaggio ha più livelli. In caso di parità sono ammesse più classi preferite.
  - Altre razze: una singola classe fissa (es. nano → guerriero, elfo → mago, gnomo → bardo, halfling → ladro, mezzorco → barbaro; elenco completo in [src/data/races.json](../../src/data/races.json)).
- La classe preferita è **esente** dalla penalità ai PE per multiclasse.

## Penalità ai PE per multiclasse (panoramica)

- Se due o più livelli di classe di un personaggio multiclasse sono sufficientemente sbilanciati, il personaggio subisce una **penalità percentuale ai PE** guadagnati (aritmetica completa a p. 60 — da estrarre).
- La **classe preferita del personaggio viene ignorata** nel calcolo dello sbilanciamento.
- Per la classe preferita "qualsiasi" (umani/mezzelfi): la classe di livello più alto è trattata come preferita e ignorata, quindi un umano non può mai subire la penalità sulla propria classe più alta. *Può* comunque subirla tra le classi rimanenti, se sufficientemente sbilanciate.

## Restrizioni di multiclasse specifiche per classe

- **Monaco** — una volta che un monaco prende un livello in un'altra classe, non può **mai più guadagnare un altro livello da monaco**. I livelli e i privilegi da monaco già ottenuti restano.
- **Paladino** — una volta che un paladino prende un livello in un'altra classe, non può **mai più guadagnare un altro livello da paladino**. I livelli e i privilegi da paladino già ottenuti restano, purché il codice non venga violato. Cadere in disgrazia (ex-paladino) è una questione separata che richiede *espiazione* prima di ulteriori avanzamenti in qualsiasi classe — in realtà è il riavanzamento in paladino nello specifico a essere bloccato dalla regola precedente; l'*espiazione* ripristina i privilegi da paladino già posseduti, non l'avanzamento.
- **Druido** — uno spostamento di allineamento lontano da neutrale, o insegnare il Druidico a un non-druido → status di ex-druido (perde i privilegi di classe) fino a *espiazione*; l'avanzamento è bloccato mentre si è ex-druido.
- **Chierico** — una grave violazione di allineamento → ex-chierico (perde incantesimi e privilegi di classe) fino a *espiazione*.
- **Barbaro** — deve essere **non legale**. Diventare legale rende il barbaro un ex-barbaro (perde Ira e Movimento veloce); gli altri privilegi (RD, Percepire trappole, Schivare prodigioso) restano.
- **Bardo** — deve essere **non legale**. Stesso modello del barbaro riguardo lo spostamento di allineamento.

## Casi particolari & eccezioni

- La classe preferita non deve necessariamente essere la classe di livello più alto perché l'esenzione si applichi — i suoi livelli semplicemente non contano ai fini dello sbilanciamento.
- Alcune classi di prestigio non contano mai ai fini della penalità da multiclasse (specificato per ogni classe di prestigio). Vedi [prestige-classes.md](prestige-classes.md) una volta scritto.
- Passare a monaco o paladino tramite multiclasse è permesso; passare **fuori** da esse blocca permanentemente l'ulteriore avanzamento in quella classe.

## Riferimenti incrociati

- [races.md](races.md) — classe preferita per razza.
- [character-creation.md](character-creation.md) — selezione di razza/classe.
- [experience-and-leveling.md](experience-and-leveling.md) — assegnazione dei PE e aritmetica della penalità (futuro).
- [classes.md](classes.md) — combinare le progressioni di bonus di attacco base/tiri salvezza/punti abilità.
- [src/data/races.json](../../src/data/races.json) — dati sulla classe preferita.

## Fonti

- Manuale del Giocatore — pp. 11, 13, 21–22, 26, 33, 47–48, 51
