# Trappole

> Come si assembla e si prezza una trappola: la lista degli elementi (innesco, ripristino, aggiramento, attacco-o-tiro-salvezza, effetto), le CD di individuazione e disattivazione, e le formule di GS / costo / Artigianato usate per costruirne una da zero. Le 105 trappole di esempio e ogni tabella numerica di questa pagina vivono in [src/data/traps.json](../../src/data/traps.json).

## I tre tipi di trappola

| Tipo | GS base | Costruita con | Individuata e disattivata da |
|---|---|---|---|
| **Meccanica** | 0 | Artigianato (costruire trappole) | Chiunque (semplice), solo scoprire trappole (complessa) |
| **Congegno magico** | 1 | Creare Oggetti Meravigliosi + gli incantesimi | Solo scoprire trappole |
| **Incantesimo** | 1 | Lanciare l'incantesimo (o assumere un PNG) | Solo scoprire trappole |

- **Meccanica** — fosse, lanciafrecce, blocchi che cadono, lame, stanze allagate. Qualsiasi cosa azionata da un meccanismo.
- **Congegno magico** — scatena un effetto d'incantesimo quando attivato, come fa una bacchetta.
- **Incantesimo** — un incantesimo che *è* una trappola (`trappola di fuoco`, `glifo di custodia`, `sigillo del serpente`). Sempre **senza ripristino**, sempre innescato secondo la descrizione del proprio incantesimo.

Un GS base meccanico di 0 è legittimo a metà calcolo; se il totale finale arriva a 0 o meno, si continuano ad aggiungere caratteristiche finché non raggiunge 1.

## Individuazione e disattivazione

| Trappola | CD Cercare | CD Disattivare Congegni | Chi può provarci |
|---|---|---|---|
| Meccanica semplice (laccio, filo teso, fossa semplice) | 20 | fissata dal costruttore (base 20) | chiunque |
| Meccanica complessa (piastra a pressione, sensore a peso/aria/vibrazione, collegata a una porta) | 21+ | fissata dal costruttore | **solo scoprire trappole** |
| Qualsiasi trappola magica | `25 + livello dell'incantesimo` | `25 + livello dell'incantesimo` | **solo scoprire trappole** |

- Il costruttore sceglie liberamente le CD di Cercare e Disattivare Congegni di una trappola meccanica; entrambe alimentano il GS e il costo.
- Le CD delle trappole magiche sono fissate dall'incantesimo di livello più alto usato e non influenzano **né** il GS **né** il costo.
- Le trappole magiche senza un tiro salvezza indicato usano **CD `10 + livello dell'incantesimo × 1,5`**. Le trappole a incantesimo usano la normale CD dell'incantesimo: **`10 + livello dell'incantesimo + modificatore di caratteristica dell'incantatore`**.

## Elementi

Ogni trappola dichiara: **innesco · ripristino · CD Cercare · CD Disattivare Congegni · bonus di attacco / CD del tiro salvezza / ritardo di innesco · danno o effetto · GS**. Aggiramento e veleno sono opzionali.

### Innesco

| Innesco | Comportamento |
|---|---|
| **Posizione** | Scatta quando una creatura si trova in un quadretto specifico. Chi vola non lo attiva mai. |
| **Prossimità** | Scatta quando una creatura entra nel raggio — inclusi i volanti. Le versioni meccaniche leggono il movimento dell'aria, quindi funzionano solo dove l'aria è altrimenti ferma (cripte). Le versioni magiche usano normalmente `allarme`, la cui area non può essere più grande dell'area protetta. Versioni speciali si agganciano a un incantesimo di individuazione (`individuazione del bene` su un altare malvagio). |
| **Sonoro** | Solo magico. Ascolta con **Ascoltare +15**; richiede `udito chiaroveggente` nella costruzione. Sconfitto da Muoversi Silenziosamente, `silenzio`, o qualsiasi cosa neutralizzi l'udito. |
| **Visivo** | Solo magico. Vede; richiede `occhio arcano`, `chiaroveggenza` o `visione del vero`. Ingannato da qualsiasi cosa inganni quell'incantesimo (invisibilità, travestimento, illusione). |
| **Contatto** | Scatta al tocco. Il più semplice da costruire. La versione magica è `allarme` rimpicciolito sul punto di innesco. |
| **A tempo** | Scatta a intervalli. |
| **Incantesimo** | Solo trappole a incantesimo; la descrizione dell'incantesimo stesso ne fissa le condizioni. |

**Innesco visivo tramite incantesimo:**

| Incantesimo | Raggio visivo | Bonus a Osservare |
|---|---|---|
| `occhio arcano` | Linea di vista, illimitato | +20 |
| `chiaroveggenza` | Un punto prescelto | +15 |
| `visione del vero` | Linea di vista fino a 120 piedi | +30 |

Un innesco visivo è cieco al buio a meno che non usi `visione del vero` o non abbia `scurovisione` aggiunta (che ne limita la vista nel buio a 60 piedi).

### Ripristino

| Ripristino | Significato |
|---|---|
| **Nessun ripristino** | Un solo colpo. Ricostruirla è l'unico modo per riaverla. Tutte le trappole a incantesimo. |
| **Riparazione** | Deve prima essere riparata. |
| **Manuale** | Qualcuno rimette a posto i pezzi — il valore predefinito per le trappole meccaniche. Di solito circa un minuto. |
| **Automatico** | Si ripristina da sola, subito o dopo un intervallo. |

**Riparare** una trappola meccanica: Artigianato (costruire trappole) contro la stessa CD della costruzione, materiali grezzi al costo di **un quinto del prezzo di mercato**, tempo di costruzione ricalcolato da quel costo dei materiali.

### Aggiramento (opzionale)

Un modo per il costruttore di superare la propria trappola senza attivarla. In pratica solo per le trappole meccaniche — le trappole a incantesimo normalmente esentano chi le ha lanciate.

| Aggiramento | Requisito |
|---|---|
| **Serratura** | Scassinare Serrature CD 30 |
| **Interruttore nascosto** | Cercare CD 25 |
| **Serratura nascosta** | Cercare CD 25 *e* Scassinare Serrature CD 30 |

### Attacco o tiro salvezza

Una trappola normalmente fa l'uno o l'altro; occasionalmente entrambi, occasionalmente nessuno dei due.

- **Trappole ad attacco** (a distanza o in mischia) tirano un normale attacco con un bonus fissato dal costruttore. Una trappola a distanza può simulare la valutazione di Forza di un arco composito per un bonus fisso ai danni; una trappola in mischia può portare un bonus ai danni incorporato allo stesso modo.
- **Trappole a tiro salvezza** (fosse e altri progetti basati sul tiro salvezza) fissano una CD sui Riflessi e nessun tiro per colpire.
- **Non manca mai** — nessun attacco, nessun tiro salvezza, danno garantito (la parete si chiude su di te). Sempre abbinata a un ritardo di innesco.

### Danno / effetto

- **Fossa** — `1d6` ogni 10 piedi di profondità.
- **Attacco a distanza** — qualunque cosa infligga il munizionamento, più eventuale valutazione di Forza.
- **Attacco in mischia** — qualunque cosa infligga l'arma; un blocco che cade infligge la quantità di danni contundenti desiderata, ricordando che ripristinarlo significa sollevarlo di nuovo.
- **Trappola a incantesimo / congegno magico** — l'effetto e la CD propri dell'incantesimo.
- **Speciale** — annegamento, danno alle caratteristiche da veleno, e altri casi particolari, fissati dal costruttore.

## Fosse

La trappola meccanica più comune e quella con più sotto-regole.

- Le fosse **scoperte** perlopiù scoraggiano e complicano una mischia. Le fosse **coperte** sono il tipo pericoloso. I **crepacci** sono la versione su larga scala. Tutte e tre si possono superare con Scalare, Saltare o la magia.
- Una fossa coperta si trova con una **Cercare CD 20**, ma solo da parte di chi esamina deliberatamente il pavimento prima di attraversarlo. Senza farlo, una **Riflessi CD 20** evita comunque la caduta — *a meno che* la vittima non stesse correndo o muovendosi in modo avventato, nel qual caso non c'è alcun tiro salvezza.
- Le coperture vanno da detriti ammucchiati a una vera e propria botola nascosta. Una botola di solito cede a **50–80 libbre**. Le botole a scatto possono intrappolare la vittima al suo interno; tenerne aperta una richiede una prova di **Forza CD 13**.
- **Punte sul fondo** — trattate come pugnali con **+10 all'attacco**, bonus ai danni **+1 ogni 10 piedi di profondità fino a un massimo di +5**, e **1d4 punte colpiscono ogni vittima che cade**. Il danno delle punte si somma al danno da caduta e **non conta ai fini del danno medio della trappola** per il calcolo del GS.
- Qualsiasi altra cosa sul fondo (acido, lava, un mostro, una seconda trappola) è trattata come una **trappola separata** con un innesco di posizione che scatta all'impatto.

## Caratteristiche varie

| Caratteristica | Effetto |
|---|---|
| **Oggetto alchemico** | Sacchi impaccianti, fuoco d'alchimista, pietre tonanti. Se imita un incantesimo, il GS sale del livello di quell'incantesimo. |
| **Gas** | Veleno inalato. Quasi sempre "non manca mai" con un ritardo di innesco. |
| **Liquido** | Annegamento. Quasi sempre "non manca mai" con un ritardo di innesco. |
| **Bersaglio multiplo** | Colpisce più di un personaggio. |
| **Non manca mai** | Nessun tiro per colpire, nessun tiro salvezza; ritardo di innesco obbligatorio. |
| **Ritardo di innesco** | Round tra l'attivazione e l'effetto. Ritardo più breve = GS più alto. |
| **Veleno** | **Solo per iniezione, contatto e inalazione — i veleni ingeriti non si possono usare.** Ogni veleno ha il proprio modificatore di GS. |
| **Punte sul fondo** | Vedi sopra. |
| **Attacco di contatto** | Qualsiasi trappola che richiede solo un attacco di contatto per colpire. |

## Grado di Sfida

Sommare ogni modificatore applicabile al GS base per il tipo di trappola.

### Modificatori di GS meccanici

| Caratteristica | Fascia | GS |
|---|---|---|
| **CD Cercare** | ≤15 / 16–24 / 25–29 / 30+ | −1 / — / +1 / +2 |
| **CD Disattivare Congegni** | ≤15 / 16–24 / 25–29 / 30+ | −1 / — / +1 / +2 |
| **CD tiro salvezza sui Riflessi** (trappole a tiro salvezza) | ≤15 / 16–24 / 25–29 / 30+ | −1 / — / +1 / +2 |
| **Bonus di attacco** | ≤+0 / +1–+5 / +6–+14 / +15–+19 / +20–+24 | −2 / −1 / — / +1 / +2 |
| **Danno medio** | ogni 7 punti | +1 |
| Congegno alchemico | — | livello dell'incantesimo imitato |
| Liquido | — | +5 |
| Bersaglio multiplo | — | +1 (0 se non manca mai) |
| Ritardo di innesco | 1 / 2 / 3 / 4+ round | +3 / +2 / +1 / −1 |
| Punte sul fondo | — | +1 |
| Attacco di contatto | — | +1 |

**Modificatori di GS dei veleni:** radice di sangue, whinnis blu, olio verdesangue, veleno di vipera cornuta, veleno di piccolo centopiedi **+1** · veleno di ragno gigante **+2** · veleno di vespa gigante, veleno di grande scorpione, pasta di radice malyss, residuo di foglia sassone, essenza d'ombra, polvere ungol **+3** · nebbia della follia, nitharit, veleno di verme purpureo **+4** · lama della morte, radice di terinav, veleno di viverna **+5** · vapori di othur bruciato, bile di drago **+6** · estratto di loto nero **+8**.

### Modificatori di GS magici

GS base 1, poi **il maggiore tra i due — mai entrambi**:

- il **livello dell'incantesimo di livello più alto** usato, oppure
- **+1 ogni 7 punti di danno medio per round**.

### Danno medio

Prendere il danno medio di un colpo riuscito e arrotondare al **multiplo di 7 più vicino** (arrotondare per eccesso in caso di parità esatta). Il danno da una valutazione di Forza e da attacchi extra conta; **veleno e punte sul fondo no**.

### Trappole multiple

Due o più trappole collegate che coprono più o meno la stessa area vengono prima valutate separatamente.

- **Dipendenti** (evitare la prima evita anche la seconda): tenerle come trappole separate.
- **Indipendenti** (nessuna delle due richiede l'altra): combinare i loro GS come si combinano i GS dei mostri in un Livello di Sfida dell'incontro; quel LS è il GS combinato.

## Costo

### Meccanica

```
finale = (costo base modificato × GS) + veleno / extra alchemici
base   = 1.000 mo
minimo = GS × 100 mo
```

Applicare ogni modificatore sotto alla base di 1.000 mo *prima* di moltiplicare per il GS. **Un ripristino automatico moltiplica per 20 il costo del veleno o dell'oggetto alchemico** — dosi sufficienti a continuare a ripristinare la trappola — e *solo* quello. **Non** moltiplica la trappola in sé; una lettura precedente di questa pagina diceva il contrario, e sballava di un fattore venti il prezzo di ogni campione a ripristino automatico.

| Caratteristica | Modificatore di costo |
|---|---|
| Innesco: posizione / contatto | — |
| Innesco: contatto (fissato) | −100 mo |
| Innesco: prossimità / a tempo | +1.000 mo |
| Ripristino: nessuno | −500 mo |
| Ripristino: riparazione | −200 mo |
| Ripristino: manuale | — |
| Ripristino: automatico | +500 mo (0 con un innesco a tempo) |
| Aggiramento: serratura / interruttore nascosto / serratura nascosta | +100 / +200 / +300 mo |
| CD Cercare sotto 20 / 20 / sopra 20 | `−100 × (20 − CD)` / — / `+200 × (CD − 20)` |
| CD Disattivare Congegni sotto 20 / 20 / sopra 20 | `−100 × (20 − CD)` / — / `+200 × (CD − 20)` |
| CD Riflessi sotto 20 / 20 / sopra 20 | `−100 × (20 − CD)` / — / `+300 × (CD − 20)` |
| Bonus di attacco sotto +10 / +10 / sopra +10 | `−100 × (10 − bonus)` / — / `+200 × (bonus − 10)` |
| Valutazione di Forza a distanza | `+100 mo × bonus` (max +4) |
| Bonus di Forza in mischia | `+100 mo × bonus` (max +8) |
| Non manca mai | +1.000 mo |
| Veleno / oggetto alchemico | il suo stesso costo |

### Congegno magico

Costa mo **e** PE, e richiede un incantatore. Pagare per **ogni** incantesimo nella costruzione — inclusi gli incantesimi di innesco. `allarme` usato come innesco è gratuito a meno che non debba lanciarlo un PNG.

| | Per incantesimo | Componenti materiali | Componenti in PE |
|---|---|---|---|
| **Monouso** | `50 mo × LI × LivInc` + `4 PE × LI × LivInc` | costo pieno | totale × 5 mo |
| **Ripristino automatico** | `500 mo × LI × LivInc` + `40 PE × LI × LivInc` | costo × 100 mo | totale × 500 mo |

Tempo di costruzione: **1 giorno ogni 500 mo** di costo.

### Trappola a incantesimo

Gratuita, a meno che non si debba assumere un incantatore PNG.

### Trappole multiple

Calcolare il prezzo di ogni trappola componente separatamente e sommare i risultati — sia per le combinazioni dipendenti sia per quelle indipendenti.

## CD di Artigianato (costruire trappole)

| GS della trappola | CD base |
|---|---|
| 1–3 | 20 |
| 4–6 | 25 |
| 7–10 | 30 |

Modificatori: **innesco di prossimità +5**, **ripristino automatico +5**. Il progresso è una prova di Artigianato a settimana; vedi [skills-detail.md](skills-detail.md) per la procedura di Artigianato.

## Cosa confermano e non confermano i campioni

Le 105 trappole di esempio e le tabelle sopra sono state stampate insieme, quindi ogni campione è un esempio svolto di queste regole — il che li rende l'unico vero collaudo di un'implementazione. Misurato (vedi [trapCR.test.js](../../src/lib/trap/trapCR.test.js)):

- **92 dei 102 campioni a trappola singola** riproducono esattamente il loro GS stampato a partire dalle tabelle. I dieci che non lo fanno sono il libro in disaccordo con sé stesso: tre raffiche di proiettili addebitate per bersagli multipli in una voce e non nella successiva, due fosse il cui GS stampato nessuna combinazione di fasce raggiunge, e la *trappola a rete grande*, la cui regola di lotta è in prosa.
- **Arrotondare per eccesso una parità esatta è confermato, non stilistico.** Arrotondare per difetto il danno medio in caso di parità ne perde sei dei 92.
- **La CD Cercare di una trappola magica dichiara il livello del suo incantesimo** (`25 + LivInc`), ed è quel numero che segue il suo GS stampato. Confrontato con spells.json, i due sono in disaccordo su esattamente due dei 33 campioni magici — *terremoto* e *parola di potere: stordire* — e in entrambi i casi vince la CD.
- **I nomi dei veleni differiscono tra le due metà del libro.** I campioni li scrivono per esteso (*veleno di grande scorpione mostruoso*); la tabella dei GS li indicizza in forma breve (*veleno di grande scorpione*).
- **Il danno di un effetto d'incantesimo è dei dadi.** L'effetto di *terremoto* recita `raggio di 65 piedi`; leggere un numero nudo iniziale come danno valuta quella trappola due GS troppo alta.
- **Le voci a trappole multiple non sono valutate affatto da queste tabelle** — le tre in questione dichiarano i propri GS componenti in prosa, e si combinano come i livelli di sfida degli incontri.

## Dati nell'app

[src/data/traps.json](../../src/data/traps.json) porta entrambe le metà di questa pagina:

- **`traps`** — 105 trappole di esempio, GS 1–10, ciascuna con `ref`, `cr`, `type`, `trigger`, `reset`, `bypass`, `searchDC`, `disableDeviceDC`, `attacks`, `save`, `pit`, `poison`, `spellEffects`, `effect`, `multipleTargets`, `multipleTraps`, `neverMiss`, `onsetDelayRounds`, `gas`/`liquid`, `cost`, `note`, e un **`footprint`** derivato (`single` · `squares` · `area` · `room` · `burst` · `multi`, con conteggio dei quadretti) pensato per guidare il diagramma della plancia.
- **`tables`** — il lato generatore: enumerazioni di innesco/ripristino/aggiramento, incantesimi da innesco visivo, costanti di fosse e punte, `crModifiers` (fasce meccaniche, lista veleni, regola magica), `costModifiers` e `craftDC`.

Questo copre entrambe le strade che il generatore di trappole potrebbe prendere — scegliere un campione per GS da `traps`, oppure comporne una da `tables` — come descritto in [feature_backlog.md](../docs/feature_backlog.md) voce 2.

## Correlati

- [skills-detail.md](skills-detail.md) — procedure di Cercare, Disattivare Congegni, Scassinare Serrature, Artigianato.
- [class-features.md](class-features.md) — scoprire trappole e percepire trappole.
- [saving-throws.md](saving-throws.md) — risoluzione dei Riflessi.
- [magic-items.md](magic-items.md) — Creare Oggetti Meravigliosi e il modello generale di costo di creazione oggetti.
- [objects.md](objects.md) — durezza e pf se il meccanismo della trappola stesso viene attaccato.
