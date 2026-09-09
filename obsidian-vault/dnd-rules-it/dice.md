# Dadi

> Notazione e lettura dei tiri di dado richiamati in tutte le regole.

## Meccanica di base

- Notazione: `XdY+Z` = tira `X` dadi da `Y` facce, somma i risultati, aggiungi `Z`. `Z` può essere negativo o omesso.
- Set di dadi standard per giocatore: d4, d6, d8, d10, d12, d20, più un secondo d10 usato per le percentuali.
- Il d20 è il dado di risoluzione per tutte le prove (vedi [core-mechanic.md](core-mechanic.md)). Gli altri dadi si usano per i danni, i punti ferita, gli effetti degli incantesimi, le durate e le tabelle casuali.

## Formule

- `risultato = somma(X tiri di dY) + Z`
- Esempi:
  - `1d8` → da 1 a 8 (danno della spada lunga).
  - `1d8+2` → da 3 a 10 (danno della spada lunga con Forza +2).
  - `2d4+2` → da 4 a 10 (es. *dardo incantato* a livello dell'incantatore 3°).
  - `3d4+3` → da 6 a 15.

## Percentuali (d%)

- Tira due d10 di colore diverso. Uno rappresenta le decine, l'altro le unità.
- `00` sulle decine + `0` sulle unità = 100. Altrimenti si legge come un valore da 1 a 99.
- Alcune tabelle leggono solo il dado delle decine (00, 10, 20, …) oppure solo quello delle unità.

## Casi particolari & eccezioni

- I dadi del danno vengono tirati *dopo* che l'attacco ha colpito; non fanno parte del tiro per colpire con d20.
- Un tiro si effettua solo quando l'esito è incerto — i successi/fallimenti automatici non richiedono dadi.
- I tiri dovrebbero essere effettuati apertamente; il Master può tirarne alcuni in segreto per atmosfera.

## Riferimenti incrociati

- [core-mechanic.md](core-mechanic.md) — la risoluzione con d20 in sé.
- [combat.md](combat.md) — i dadi del danno sono legati alle armi e agli incantesimi.

## Fonti

- Manuale del Giocatore — pp. 5
