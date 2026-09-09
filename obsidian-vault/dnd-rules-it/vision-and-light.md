# Visione e Luce

> Livelli di luce, modalità di visione speciali, probabilità di mancare ed effetti sulle abilità dovuti alla scarsa visibilità.

## Livelli di luce

| Livello | Effetti in combattimento | Note |
|-------|---|---|
| Piena luce (luce del sole, incantesimo luce del giorno) | Visibilità normale | Alcune creature (es. i drow) sono abbagliate. |
| Normale (lanterna, stanza illuminata) | Visibilità normale per chi può vedere | Predefinito per le aree interne illuminate. |
| Penombra / luce fioca (torcia lontana, crepuscolo) | Tutte le creature ottengono **occultamento** (20% di probabilità di mancare per chi attacca); prove di Nascondersi possibili senza copertura | La visione crepuscolare vede come se fosse luce normale. |
| Oscurità (nessuna fonte di luce, notte senza luna) | Le creature senza scurovisione sono **accecate**: 50% di probabilità di mancare, perdono la Destrezza alla CA, −2 CA, velocità dimezzata, −4 a Cercare e alle prove di abilità basate su Forza/Destrezza | La scurovisione vede normalmente entro il raggio; non ci si può nascondere da essa. |

- L'occultamento dovuto alla luce fioca è una probabilità di mancare del 20% per attacco (vedi [combat.md](combat.md)).
- L'oscurità totale per una creatura dotata di vista = occultamento totale (50% di mancare), più la condizione accecato.

## Modalità di visione

### Visione normale

- Funziona solo in piena luce e luce normale. In luce fioca, subisce l'occultamento come chi attacca. Nell'oscurità, è accecata.

### Visione crepuscolare (elfi, gnomi, mezzelfi)

- Vede fino a **2× il raggio** di qualsiasi fonte di luce non magica o magica.
- Una torcia (raggio normale 6 m di piena luce, 12 m di penombra) si estende a **12 m di piena luce, 24 m di penombra** per chi ha visione crepuscolare.
- In penombra o all'ombra, percepisce come se fosse luce normale (nessuna penalità di occultamento).
- **Non** aiuta nell'oscurità **totale**.

### Scurovisione (nani, mezzorchi)

- Vede normalmente nell'**oscurità totale fino al raggio indicato** (18 m tipici).
- La visione è **in bianco e nero** entro il raggio della scurovisione; texture e forme sono preservate.
- **Non** penetra: l'oscurità magica (es. incantesimo *oscurità*), la nebbia/fumo che occulta o altre fonti di occultamento non legate all'illuminazione.
- Nascondersi da una creatura con scurovisione in aree prive di luce richiede una copertura (o un'alternativa magica); l'occultamento dovuto all'oscurità non è disponibile.

### Percezione cieca / vista cieca (alcune creature)

- **Percezione cieca**: consapevole delle creature entro il raggio senza vederle; i bersagli beneficiano comunque dell'occultamento (50%) ma chi la possiede può individuarne la posizione.
- **Vista cieca**: equivalente pieno della vista entro il raggio; ignora l'occultamento (inclusi invisibilità, oscurità, nebbia).

## Raggio e durata delle fonti di luce

I raggi di piena luce / penombra seguono la specifica di ciascun oggetto. Generatori approssimativi (i valori specifici degli oggetti sono in [src/data/items.json](../../src/data/items.json)):

- Una tipica **torcia**: piena luce 6 m (4 quadretti), penombra 12 m (8 quadretti); durata ~1 ora.
- Una tipica **lanterna**: piena luce 9 m, penombra 18 m; durata in base all'olio (~6 ore per pinta).
- **Verga solare**: piena luce 9 m, penombra 18 m; durata 6 ore; non può essere spenta prima del tempo.
- Incantesimo **luce**: equivalente di piena luce su un oggetto toccato (per descrizione dell'incantesimo).
- Incantesimo **luce del giorno**: piena luce solare in un raggio di 18 m (conta come piena luce; può abbagliare i drow).
- **Fiamma perenne** / *luce perenne*: equivalente di una torcia permanente (senza combustibile).

## Occultamento da fonti non luminose

Anche fonti di occultamento non legate alla luce impongono probabilità di mancare (non si sommano con l'oscurità):

- **Nebbia / fumo / polvere densa**: occultamento (20%) entro pochi metri; occultamento totale più lontano.
- **Fogliame / sottobosco fitto**: occultamento del 20%.
- **Oscurità magica** (es. incantesimo *oscurità*): tratta l'area come se fosse un livello peggiore; anche le creature con scurovisione perdono la scurovisione al suo interno.

Più fonti di occultamento **non** si sommano — usa la probabilità di mancare più alta.

## Bonus per restare immobili / nascondersi

- **Osservare** contro una creatura invisibile: +20 se il bersaglio si muove; +40 se resta immobile — anche quando una creatura è "localizzata", la probabilità di mancare di chi attacca si applica comunque.
- Una creatura nascosta che attacca si rivela (serve una nuova prova di Nascondersi per nascondersi di nuovo).

## Riferimenti incrociati

- [combat.md](combat.md) — probabilità di mancare da occultamento, occultamento totale contro invisibili.
- [conditions.md](conditions.md) — accecato, abbagliato, frastornato (e stordito per gli effetti ambientali sulla CA).
- [races.md](races.md) — quali razze hanno visione crepuscolare o scurovisione e il raggio indicato.
- [skills.md](skills.md) — bonus/penalità a Nascondersi, Muoversi Silenziosamente, Osservare, Cercare dovuti al livello di luce.
- [magic.md](magic.md) — *luce*, *oscurità*, *luce del giorno*, *oscurità profonda*, ecc.
- [movement.md](movement.md) — la scarsa visibilità raddoppia il costo per quadretto.

## Fonti

- Manuale del Giocatore — pp. 164–165 (luce e visione; tabella delle fonti di luce)
