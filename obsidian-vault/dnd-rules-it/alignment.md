# Allineamento

> La griglia dei nove allineamenti: cos'è ciascuno, come incide meccanicamente e come interagisce con classi e incantesimi.

## La griglia

Due assi indipendenti, tre valori ciascuno → **9 allineamenti**:

|             | Buono | Neutrale | Malvagio |
|---|---|---|---|
| **Legale**  | Legale Buono (LB) | Legale Neutrale (LN) | Legale Malvagio (LM) |
| **Neutrale** | Neutrale Buono (NB) | Neutrale Puro (N)    | Neutrale Malvagio (NM) |
| **Caotico** | Caotico Buono (CB) | Caotico Neutrale (CN) | Caotico Malvagio (CM) |

- **Asse Legge–Caos**: rispetto per l'ordine, la gerarchia, la tradizione, i giuramenti contro libertà personale, adattabilità, rifiuto delle strutture.
- **Asse Bene–Male**: altruismo, rispetto per la vita, disponibilità a sacrificarsi contro egoismo, danneggiare gli altri per profitto o piacere.
- Relazioni "**a un passo**": due allineamenti sono a un passo se differiscono su **al massimo un asse** (es. LB e NB sono a un passo di distanza; LB e CN sono a due passi; LB e CM sono a tre).

## Ruolo meccanico

L'allineamento è **principalmente una guida di interpretazione**, non un input numerico costante. Raramente modifica i tiri di dado. I punti in cui conta davvero sono:

- **Restrizioni di classe** — alcune classi richiedono un allineamento specifico; cambiare allineamento può costare privilegi di classe. Descritto in [classes.md](classes.md), [class-features.md](class-features.md) e [multiclassing.md](multiclassing.md). Riepilogo:
  - Paladino → **Legale Buono**; cadere in un allineamento non-LB → ex-paladino.
  - Monaco → qualsiasi allineamento **Legale**; cadere in un allineamento non legale → ex-monaco e multiclasse a senso unico.
  - Druido → almeno un asse **Neutrale**.
  - Barbaro, Bardo → qualsiasi allineamento **non legale**.
  - Chierico → entro **un passo** dall'allineamento della divinità su entrambi gli assi.
- **Incantesimi con descrittore di allineamento** — molti incantesimi hanno un descrittore `[Buono]`, `[Malvagio]`, `[Legale]` o `[Caotico]`. Lanciare un incantesimo con un descrittore opposto all'allineamento dell'incantatore ha conseguenze (tipicamente vietato per l'incantatore, oppure uno spostamento di allineamento se usato; per i chierici, non si possono lanciare incantesimi con descrittori opposti a una delle componenti del proprio allineamento o di quello della propria divinità).
- **Incantesimi di individuazione/effetto su allineamento** — *individuazione del male/bene/legge/caos*, *protezione dal male/bene/legge/caos*, *parola sacra*, *parola sacrilega*, *ira dell'ordine*, *parola del caos*, *colpo sacro*, *influenza sacrilega*, *dictum*, *manto del caos*, *aura sacra*, *aura sacrilega*, *bestemmia*, *dissolvi male/bene/legge/caos*, ecc. — colpiscono o influenzano le creature in base alla componente di allineamento.
- **Intensità dell'aura** — chierici e paladini, e altre determinate classi/creature, proiettano un'aura di allineamento corrispondente alla propria divinità (o al proprio allineamento) con un'intensità legata al livello di classe; rilevabile dagli incantesimi *individuazione di allineamento*.
- **Restrizioni sugli oggetti magici** — alcuni oggetti magici hanno requisiti di allineamento; chi non corrisponde subisce penalità o non può attivarli. Utilizzare Oggetti Magici può emulare un allineamento ([skills-detail.md](skills-detail.md#utilizzare-oggetti-magici-use-magic-device)).
- **Abilità di tipo "punire"** — punire il male del paladino ed effetti simili colpiscono in base alla componente di allineamento.
- **Orientamento di scacciare/intimorire i non morti** — l'allineamento determina se un chierico scaccia (buono/neutrale) o intimorisce (malvagio) i non morti, più le sostituzioni specifiche della divinità ([class-features.md](class-features.md) → Scacciare/intimorire i non morti).

## Religione (requisito del chierico)

- **La maggior parte dei personaggi** non deve seguire alcuna divinità. La religione è colore narrativo.
- **I chierici** sono l'eccezione: un chierico deve venerare una divinità specifica oppure una causa/un principio fermamente sostenuto.
  - Con una divinità: l'allineamento del chierico deve essere entro un passo da quello della divinità, e i due domini scelti dal chierico devono provenire dall'elenco dei domini consentiti dalla divinità.
  - Senza una divinità: i due domini del chierico devono essere scelti tra i domini legati all'allineamento (Bene, Male, Legge, Caos) e devono corrispondere all'allineamento del chierico.
- **I druidi** venerano la natura stessa (nessuna divinità specifica richiesta) ma seguono la restrizione di allineamento del druido.
- **I paladini** devono seguire una causa legale buona o una divinità LB, ma non è richiesta una divinità specifica.
- I dati per divinità (allineamento, domini consentiti, arma preferita, seguaci tipici) si trovano in [src/data/classes.json](../../src/data/classes.json) (tabelle chierico/divinità) — vedi anche la Tabella 3-7 citata in [class-features.md](class-features.md).

## Spostamenti di allineamento durante il gioco

- L'allineamento può cambiare attraverso azioni accumulate (a giudizio del Master). Uno spostamento violento e volontario può innescare la perdita di privilegi di classe (paladino, monaco, druido, barbaro, bardo, chierico) fino a *espiazione* o a un riallineamento naturale.
- Un singolo atto incoerente con l'allineamento non lo cambia; un comportamento prolungato o un singolo atto gravemente fuori carattere possono farlo.

## Riferimenti incrociati

- [classes.md](classes.md) — restrizioni di allineamento per classe.
- [class-features.md](class-features.md) — privilegi di classe legati all'allineamento (punire il male del paladino, aura del chierico, scissione scacciare/intimorire).
- [multiclassing.md](multiclassing.md) — spostamenti di allineamento come inneschi di ex-classe.
- [magic.md](magic.md) — descrittori degli incantesimi e restrizioni di lancio.
- [skills-detail.md](skills-detail.md) — Utilizzare Oggetti Magici per emulare un allineamento.

## Fonti

- Manuale del Giocatore — pp. 104–108 (riepilogato: sintesi fornita dall'utente più che estrazione diretta)
