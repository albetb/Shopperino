# Razze

> *Sistema* dei tratti razziali: le categorie di tratti che una razza conferisce e come ciascuna categoria si risolve. Le specifiche per ogni razza (quali caratteristiche, quali bonus, quali armi, quali linguaggi) si trovano in [src/data/races.json](../../src/data/races.json).

## Meccanica di base

Una razza contribuisce a un personaggio, alla creazione, con un pacchetto fisso di tratti meccanici. Ogni razza può includere una qualsiasi di queste categorie:

- Aggiustamenti ai punteggi di caratteristica
- Categoria di taglia
- Velocità di base sul terreno (e condizioni in cui cambia)
- Sensi speciali (scurovisione, visione crepuscolare, percezione cieca, ecc.)
- Bonus razziali alle abilità (spesso condizionati)
- Talenti bonus razziali (concessi gratuitamente, prerequisiti annullati)
- Bonus ai tiri salvezza (contro categorie di effetto specifiche)
- Immunità a tipi di effetto (es. immune al sonno magico)
- Familiarità con le armi (tratta le armi esotiche elencate come armi da guerra)
- Abilità magiche (SLA)
- Linguaggi automatici e bonus
- Classe preferita

Il tipo di bonus di un tratto è di solito "razziale", che si cumula con bonus non razziali ma non con un altro bonus razziale allo stesso valore.

## Aggiustamenti di caratteristica

- Si applicano *dopo* che il giocatore ha assegnato i punteggi tirati alle caratteristiche.
- Un aggiustamento razziale all'Intelligenza non può ridurre l'Intelligenza sotto 3 (Intelligenza 1–2 è intelletto animale); le altre caratteristiche non hanno un limite minimo alla creazione.
- Gli aggiustamenti sono permanenti e si cumulano con aumenti successivi (passaggio di livello, oggetti magici, intrinseci).

## Categoria di taglia

Il Manuale del Giocatore copre le razze giocanti Piccole e Medie. Effetto meccanico della taglia su una base Media:

| Taglia | Mod. CA | Mod. attacco | Mod. Nascondersi | Trasporto e sollevamento × | Taglia arma |
|---|---|---|---|---|---|
| Media | 0 | 0 | 0 | ×1,00 | media |
| Piccola  | +1 | +1 | +4 | ×0,75 | piccola |

- I modificatori di taglia ad attacco e CA sono reciproci: Piccolo contro Medio colpisce con +1 ed è +1 più difficile da colpire, quindi Piccolo-contro-Piccolo si gioca come Medio-contro-Medio.
- Un personaggio Piccolo non può impugnare un'arma Media con piena efficacia; usa armi di taglia appropriata (vedi [equipment.md](equipment.md) una volta scritto).
- I limiti di trasporto/sollevamento scalano di ×0,75 per Piccolo (le altre taglie scalano con altri fattori — vedi "Creature più grandi e più piccole").
- La velocità per le razze Piccole è tipicamente 6 m contro 9 m per la maggior parte delle razze Medie (per razza, nel JSON).

(Le categorie di taglia più grandi sono descritte nel Manuale dei Mostri.)

## Velocità di base sul terreno

- Elencata per razza; non modificata da Destrezza o Forza.
- Regola standard: armatura media/pesante o carico medio/pesante riduce la velocità a 3/4 (gestito in [equipment.md](equipment.md)).
- **Eccezione a livello di razza**: alcune razze (in particolare i nani) ignorano questa riduzione e mantengono la velocità di base indipendentemente da armatura/carico. Questo è un flag di tratto razziale, non una regola generale.

## Sensi

- **Scurovisione** — vede nell'oscurità totale fino a una portata indicata, **solo in bianco e nero**, per il resto come la vista normale. Azione e combattimento pienamente funzionali entro la portata.
- **Visione crepuscolare** — vede il doppio della distanza di un umano in luce fioca (chiaro di luna, luce delle stelle, torcia). Colore e dettaglio conservati.
- I due si cumulano: una creatura con entrambi può vedere in luce fioca a distanza estesa e nell'oscurità totale fino alla propria portata di scurovisione.

## Bonus ai tiri salvezza

- Concessi come `+X bonus razziale ai tiri salvezza contro <categoria>` (es. contro veleno, contro incantesimi, contro illusioni, contro paura).
- Si cumula con bonus ai tiri salvezza non razziali.
- Più bonus razziali allo stesso tiro salvezza contro la stessa categoria **non** si cumulano; si prende il più alto.

## Bonus alle abilità

- `+X bonus razziale a <abilità>` — si somma alla relativa prova di abilità.
- Può essere condizionato (es. un bonus a Cercare per individuare opere in muratura). Se condizionato, si applica solo quando la condizione è soddisfatta.

## Talenti bonus

- Un talento bonus razziale si ottiene gratuitamente al 1° livello, *senza* consumare lo slot di talento standard, e *ignorando* i suoi normali prerequisiti.
- Si cumula con i talenti bonus concessi dalla classe e con il talento standard di 1° livello.

## Immunità a tipi di effetto

- Es. "immune agli effetti di sonno *magico*" — nota che questo **non** rende la creatura immune al sonno naturale, solo agli incantesimi/effetti con il tipo di effetto pertinente. A volte, sopra l'immunità, si aggiungono bonus ai tiri salvezza contro effetti correlati.

## Familiarità con le armi

- Permette alla razza di trattare un'arma esotica specifica come un'arma da guerra ai fini della competenza. L'arma resta esotica per chiunque altro.

## Abilità magiche (razziali)

- Funzionano come l'incantesimo indicato, ma **senza componenti** (verbale/somatica/materiale/ecc. tutte annullate).
- Utilizzabili un numero fisso di volte al giorno secondo la razza.
- Livello dell'incantatore per le abilità magiche razziali = Dadi Vita totali del personaggio (o come specificato dalla razza).
- CD del tiro salvezza = `10 + livello dell'incantesimo + modificatore di caratteristica pertinente` (tipicamente Carisma per le abilità magiche innate).

## Linguaggi

- Ogni razza ha linguaggi automatici (gratuiti) e linguaggi bonus (scelti da un elenco).
- Un'Intelligenza alta concede linguaggi bonus extra alla creazione. Meccaniche complete in [languages.md](languages.md).

## Classe preferita

- Ogni razza ha una classe preferita. Umani e mezzelfi: "qualsiasi" (qualunque classe in cui il personaggio abbia più livelli).
- La classe preferita è esente dalla penalità ai PE per multiclasse. Vedi [multiclassing.md](multiclassing.md).

## Casi particolari & eccezioni

- Una penalità razziale all'Intelligenza non può abbassare l'Intelligenza sotto 3; si limita a 3.
- Le mezze-razze contano come entrambe le razze genitrici per qualsiasi effetto che colpisca l'una o l'altra razza genitrice (es. la magia anti-elfo colpisce i mezzelfi; gli oggetti solo-per-orchi funzionano per i mezzorchi). Le mezze-razze *non possono* moltiplicare i benefici — scelgono il migliore dei due genitori per effetto, non entrambi.
- I talenti bonus razziali annullano i prerequisiti solo per il talento concesso stesso, non per i talenti che dipendono da esso.
- Un bonus razziale a un'abilità in cui il personaggio ha 0 gradi si applica comunque (l'abilità è utilizzabile senza addestramento, oppure il bonus è concesso comunque se così specificato).

## Riferimenti incrociati

- [character-creation.md](character-creation.md) — fase 3-4: scelta della razza, applicazione dei modificatori razziali.
- [ability-scores.md](ability-scores.md) — limite minimo di 3 all'Intelligenza razziale, ricalcolo del modificatore di caratteristica.
- [languages.md](languages.md) — linguaggi automatici e bonus, alfabetizzazione.
- [multiclassing.md](multiclassing.md) — classe preferita e penalità ai PE.
- [combat.md](combat.md) — modificatori di taglia a CA e attacco.
- [equipment.md](equipment.md) — scalatura della taglia delle armi, regola della velocità con carico.
- [movement.md](movement.md) — velocità di base per taglia.
- [src/data/races.json](../../src/data/races.json) — dati numerici per razza.

## Fonti

- Manuale del Giocatore — pp. 11–20
