# Resistenza agli incantesimi

> La difesa magica innata di una creatura; la prova di livello dell'incantatore necessaria per superarla.

## Meccanica di base

- Alcune creature (esterni, golem, draghi, drow, ecc.) hanno un valore di **Resistenza agli Incantesimi (RI)**: un numero fisso che rappresenta la difesa magica.
- Quando una tale creatura è il **bersaglio di un incantesimo** (o si trova all'interno di un effetto ad area di uno), e la descrizione dell'incantesimo riporta `Resistenza agli incantesimi: Sì`, l'incantatore deve tirare:

  `prova di livello dell'incantatore = d20 + livello dell'incantatore contro CD = RI della creatura`

- **Prova di livello dell'incantatore ≥ RI** → l'incantesimo penetra e si risolve normalmente su quella creatura.
- **Prova di livello dell'incantatore < RI** → l'incantesimo **non ha effetto** su quella creatura (gli altri bersagli nell'area non sono influenzati da questo).
- La prova viene effettuata **una volta per creatura** interessata dall'incantesimo (ogni creatura con RI tira separatamente).

## Quando si applica la RI

- Solo quando l'incantesimo colpisce direttamente la creatura dotata di RI.
- Gli effetti che non colpiscono direttamente le creature dotate di RI (es. un *dardo acido* colpisce il pavimento e schizza, oppure un *evocare mostri* crea una creatura separata che poi attacca) **non** attivano la RI per l'area / le conseguenze.
- Un incantesimo con effetto persistente (es. *muro di fuoco*) verifica la RI ogni volta che la creatura interagisce con esso — tipicamente ogni round in cui vi rimane, o ogni volta che tenta di attraversarlo.
- Un incantesimo già in effetto quando la creatura entra nell'area: prova di RI in quel momento.

## Varianti di "Sì" nelle voci degli incantesimi

| Voce | Significato |
|---|---|
| Sì | La RI si applica normalmente. |
| No | La RI non si applica; l'incantesimo penetra comunque. |
| Sì (innocuo) | Incantesimo benefico; la creatura dotata di RI può **abbassare volontariamente** la propria RI (azione standard) per riceverlo. |
| Sì (oggetto) | La RI si applica se l'incantesimo ha come bersaglio un oggetto che la creatura dotata di RI impugna/indossa/porta. |

## Abbassamento volontario della RI

- Una creatura con RI può **sopprimere volontariamente** la propria RI per un round come **azione standard**, per permettere a un incantesimo benefico di un alleato di avere effetto.
- Mentre è soppressa, la RI della creatura è 0 (qualsiasi incantesimo, amico o nemico, penetra).
- Torna alla normalità all'inizio del turno successivo della creatura.

## Modificatori alla prova di livello dell'incantatore

- Talento **Incantesimi Inarrestabili**: +2 alle prove di livello dell'incantatore contro la RI.
- **Incantesimi Inarrestabili Superiore**: +4 (sostituisce, non si cumula con, Incantesimi Inarrestabili da solo — totale +4).
- Un **potere di dominio** o un'altra capacità che concede "come se lanciato a un livello dell'incantatore X superiore" si applica anche alla prova di livello dell'incantatore (il livello dell'incantatore più alto viene usato per il tiro d20 + livello).
- Un mago che lancia deliberatamente a un **livello dell'incantatore inferiore** (es. per imitare un incantesimo di livello inferiore) usa il livello dell'incantatore inferiore anche per la prova di RI.

## Differenze tra RI e livello dell'incantatore

- Un incantesimo di un incantatore di 5° livello contro una creatura con RI 18:
  - `1d20 + 5` → serve **13** o più per penetrare (1d20+5 ≥ 18).
  - 35% di probabilità per lancio che l'incantesimo abbia effetto.
- Un incantesimo di un incantatore di 15° livello contro RI 18:
  - `1d20 + 15` → serve **3+**: 90% di probabilità di penetrare.

## Incantesimi che aggirano la RI

- Gli incantesimi/effetti con `Resistenza agli incantesimi: No` penetrano sempre indipendentemente dalla RI.
- Effetti che non sono effetti diretti di un incantesimo: aree d'effetto che rilasciano oggetti fisici (non incantesimi), attacchi fisici di creature evocate, e meccanismi indiretti simili.

## Cumulo della RI

- Una creatura ha un solo valore di RI alla volta. Se più effetti concedono o aumentano la RI, **si usa il più alto** (non si sommano).
- Alcuni effetti concedono **RI temporanea** (es. l'incantesimo *resistenza agli incantesimi*, alcuni oggetti magici); la RI dell'incantesimo sostituisce la RI naturale della creatura se più alta.

## Antimagia e RI

- All'interno di un *campo di antimagia*: gli incantesimi non funzionano affatto, quindi la RI è irrilevante.
- Una creatura la cui RI è **innata** (capacità della creatura) perde la RI all'interno di un campo di antimagia insieme a tutta l'altra magia.
- Una creatura la cui RI è **concessa da un incantesimo** (es. *resistenza agli incantesimi*) la perde all'interno dell'antimagia.

## Riferimenti incrociati

- [magic.md](magic.md) — regole sul livello dell'incantatore; voce "resistenza agli incantesimi: sì/no" nella descrizione dell'incantesimo.
- [special-abilities.md](special-abilities.md) — le capacità soprannaturali non sono soggette a RI; le capacità magiche lo sono.
- [feats.md](feats.md) — Incantesimi Inarrestabili, Incantesimi Inarrestabili Superiore.
- [class-features.md](class-features.md) — domini/capacità che concedono bonus al livello dell'incantatore effettivo.

## Fonti

- Manuale del Giocatore — p. 178 (resistenza agli incantesimi)
