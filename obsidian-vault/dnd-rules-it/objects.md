# Oggetti

> Resistenza degli oggetti, attaccare oggetti, sfondare porte / catene / muri e tiri salvezza degli oggetti.

## Statistiche degli oggetti

Ogni oggetto inanimato possiede:

- **Durezza** — riduzione del danno fissa sottratta a ogni colpo prima che conti sui punti ferita. Se `danno − durezza ≤ 0`, l'oggetto non subisce danno.
- **Punti ferita** — quando scendono a 0, l'oggetto viene **distrutto**. Gli oggetti danneggiati ma non distrutti funzionano normalmente fino a quel punto.
- **CA** — `10 + mod. di taglia + mod. di Destrezza`. Gli oggetti inanimati hanno Destrezza 0 (modificatore −5), quindi un oggetto statico di taglia Media ha **CA 5**; un oggetto trasportato di taglia Minuscola ha CA 7; ecc. Aggiungi un ulteriore −2 CA se chi attacca usa un'azione di round completo per mirare (colpo automatico con un attacco in mischia; +5 al bonus di attacco con un attacco a distanza).
- **Spezzare oggetti indossati** (indossati, impugnati): usa il modificatore di Destrezza e la taglia di chi li porta; provoca attacco di opportunità; l'armatura di chi li porta non si applica (come una CA di contatto). Vedi [combat-maneuvers.md](combat-maneuvers.md).

### Scalatura della durezza in base alla taglia

I valori di durezza elencati per armi/armature presuppongono un oggetto di taglia **Media**.

- Ogni categoria di taglia **inferiore** a Media: punti ferita **÷2**.
- Ogni categoria di taglia **superiore** a Media: punti ferita **×2** (o secondo la riga della sostanza).
- La durezza non cambia con la taglia (dipende dalla sostanza).

### Durezza delle sostanze (tipica, ogni 2,5 cm di spessore)

| Sostanza | Durezza | pf ogni 2,5 cm |
|---|---|---|
| Carta / stoffa | 0 | 2 |
| Corda | 0 | 2 |
| Vetro | 1 | 1 |
| Ghiaccio | 0 | 3 |
| Legno | 5 | 10 |
| Pietra | 8 | 15 |
| Ferro / acciaio | 10 | 30 |
| Mithral | 15 | 30 |
| Adamantio | 20 | 40 |

### Armi / armature / scudi magici

- Ogni bonus di potenziamento `+1` aggiunge **+2 di durezza** e **+10 pf** al valore base dell'oggetto.
- Es. una `spada lunga +1` = durezza 12, 15 pf; uno `scudo grande d'acciaio +3` = durezza 16, 50 pf.

## Modificatori al danno (contro gli oggetti)

- **Danno delle armi a distanza** contro gli oggetti: ÷2 prima di applicare la durezza (le armi d'assedio ne sono esenti).
- **Attacchi elementali**:
  - Sonoro, acido: danno pieno; applica la durezza normalmente.
  - Elettricità, fuoco: danno **÷2** prima della durezza.
  - Freddo: danno **÷4** prima della durezza.
- **Armi inefficaci** (a discrezione del DM): alcuni attacchi semplicemente non possono danneggiare certi oggetti (es. tagliare una corda con un randello, sfondare una pergamena con un martello). Il DM può stabilire che l'oggetto non subisca alcun danno.

## Immunità

- Gli oggetti sono immuni ai **danni non letali**.
- Gli oggetti sono immuni ai **colpi critici** (trattati come costrutti a questo riguardo).
- Gli oggetti animati (creature simili ai golem) non sono immuni — sono creature, non oggetti inanimati.

## Vulnerabilità

- Il DM può stabilire che certi attacchi infliggano **danno doppio** e/o **ignorino la durezza** in casi evidenti (fuoco contro carta, ascia contro porta di legno, taglienti contro corda).

## Tiri salvezza degli oggetti

- **Oggetto incustodito** (posato a terra): **fallisce** sempre qualsiasi tiro salvezza debba effettuare. Qualsiasi effetto a tiro salvezza o morte sugli oggetti presuppone il fallimento (es. *disintegrazione*).
- **Oggetto custodito** (tenuto in mano, indossato, in tasca): se il suo portatore è il bersaglio, l'oggetto usa il **bonus al tiro salvezza del portatore** (usa il migliore tra i tiri salvezza del portatore). Il tiro salvezza del portatore, non quello dell'oggetto.
- Gli **oggetti magici** effettuano un proprio tiro salvezza: base = `2 + ½ livello dell'incantatore` per Tempra/Riflessi/Volontà. Usa il valore più alto tra il proprio tiro salvezza e quello del portatore.

## Colpire un oggetto come azione di attacco

- Attacco contro la CA dell'oggetto; se va a segno, tira il danno; sottrai la durezza; il resto riduce i punti ferita.
- Un personaggio può impiegare un'**azione di round completo** per mirare un singolo colpo deliberato contro un oggetto statico: in mischia = **colpo automatico**, a distanza = **+5 al bonus di attacco**.

## Sfondare con la forza bruta (prova di Forza)

Da usare quando si sfonda o si forza qualcosa piuttosto che attaccarlo con un'arma. Effettua una **prova di Forza** contro la CD di rottura dell'oggetto.

| Azione | CD |
|---|---|
| Sfondare una porta di legno semplice | 13 |
| Sfondare una porta di legno buona | 18 |
| Sfondare una porta di legno robusta | 23 |
| Spezzare una catena (ordinaria) | 26 |
| Piegare una sbarra di ferro | 24 |
| Spezzare delle manette | 26 |
| Sfondare una porta di ferro (spessa 5 cm) | 28 |
| Spezzare le corde che legano un prigioniero | 23 |
| Modificatore per porta chiusa a chiave | +5 |
| Modificatore per serratura arcana | +10 (se entrambi, usa solo il più alto) |

- Un oggetto a **metà dei punti ferita o meno** vede la propria CD di rottura ridotta di **2**.
- Modificatore di taglia alla prova di Forza (per categoria a partire da Media): Piccolo −4, Minuscolo −8, Minuto −12, Piccolissimo −16; Grande +4, Enorme +8, Mastodontico +12, Colossale +16.
- Un **piede di porco** garantisce un bonus di circostanza alla prova (specifico dell'oggetto, tipicamente +2). Un **ariete portatile** garantisce bonus ulteriori e permette a più PG di aiutare.

## Danneggiato contro distrutto

- Un oggetto rimane **pienamente funzionale** finché i punti ferita non raggiungono 0. Una porta a 1 pf sbarra ancora il passaggio; una spada lunga a 1 pf taglia ancora a danno pieno.
- A 0 pf l'oggetto è **distrutto** (nella maggior parte dei casi non restano rottami da cui ripararlo).
- Gli oggetti danneggiati (non distrutti) possono essere riparati con l'abilità **Artigianato** (vedi [skills.md](skills.md)).

## Riferimenti incrociati

- [combat.md](combat.md) — meccaniche del tiro per colpire; danno elementale; il danno massiccio non si applica agli oggetti.
- [combat-maneuvers.md](combat-maneuvers.md) — Spezzare usa queste statistiche degli oggetti.
- [equipment.md](equipment.md) — peso e valore base di armi/armature; durezza/pf delle armi per riga.
- [magic-items.md](magic-items.md) — gli oggetti magici hanno un proprio tiro salvezza, durezza/pf aumentati per ogni +1.
- [skills.md](skills.md) — Artigianato per le riparazioni; Scassinare Serrature come alternativa alla forza bruta.

## Fonti

- Manuale del Giocatore — pp. 165–167 (oggetti, durezza, pf, CA, modificatori al danno, tiri salvezza, forza bruta)
