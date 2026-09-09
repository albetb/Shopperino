# Classi

> Sistema delle classi: DV, progressioni di bonus di attacco base e tiri salvezza, punti abilità, privilegi di classe, regole di combinazione del multiclasse. I dati numerici per classe si trovano in [src/data/classes.json](../../src/data/classes.json).

## Meccanica di base

Una classe definisce l'addestramento e le capacità di un personaggio. Ogni classe contribuisce, a ogni livello che il personaggio possiede in essa, con:

- Un valore di Dado Vita (tirato o fisso) sommato ai pf.
- Un incremento del **bonus di attacco base** (BAB) secondo il proprio tipo di progressione.
- Un incremento del **tiro salvezza base** secondo il proprio tipo di progressione, per ciascuno di Tempra, Riflessi e Volontà (ogni tiro salvezza è indipendentemente "buono" o "scarso" per la classe).
- Punti abilità per livello (un numero fisso per classe) + modificatore di Intelligenza.
- Privilegi di classe a livelli specifici (competenze, capacità speciali, lancio di incantesimi, ecc.).
- Un elenco di abilità di classe (abilità acquistabili a 1 PA/grado; le altre sono di classe incrociata a 2 PA/grado).

Le 11 classi base sono: Barbaro (Bbr), Bardo (Brd), Chierico (Chr), Druido (Drd), Guerriero (Grr), Monaco (Mnc), Paladino (Pal), Ranger (Rgr), Ladro (Ldr), Stregone (Str), Mago (Mag).

## Dado Vita per classe

| DV | Classi |
|---|---|
| d4  | Mago, Stregone |
| d6  | Bardo, Ladro |
| d8  | Chierico, Druido, Monaco, Ranger |
| d10 | Guerriero, Paladino |
| d12 | Barbaro |

### pf per livello

- Al 1° livello (il primissimo DV in assoluto): si prende il **valore massimo** del DV. Si somma il modificatore di Costituzione.
- A ogni livello successivo (qualsiasi classe): si **tira il DV della classe**, sommando il modificatore di Costituzione. I risultati negativi vengono ignorati — si guadagna almeno **1 pf** per livello a prescindere da una Costituzione bassa.
- Un personaggio multiclasse tira/applica il DV della classe che sta salendo di livello.

## Progressione del BAB

Tre schemi. Ogni classe segue uno di essi.

| Tipo | Formula | L1 | L5 | L10 | L15 | L20 |
|---|---|---|---|---|---|---|
| Buono (pieno)  | `BAB = livello`            | +1 | +5  | +10 | +15 | +20 |
| Medio (3/4) | `BAB = arrotonda per difetto(3L/4)`      | +0 | +3  | +7  | +11 | +15 |
| Scarso (1/2)   | `BAB = arrotonda per difetto(L/2)`       | +0 | +2  | +5  | +7  | +10 |

- Buono: Guerriero, Barbaro, Paladino, Ranger.
- Medio: Chierico, Druido, Monaco, Bardo, Ladro.
- Scarso: Mago, Stregone.

### Attacchi iterativi

- Un personaggio con BAB ≥ +6 ottiene un **secondo attacco** per azione di attacco completo, a BAB −5.
- BAB ≥ +11: terzo attacco a −10. BAB ≥ +16: quarto a −15.
- Gli attacchi iterativi derivano **solo dal BAB**. Bonus da Forza, taglia, razza, potenziamento dell'arma, ecc. che portano l'attacco totale a +6 **non** concedono attacchi iterativi extra. Solo il BAB stesso li innesca.
- Tutti gli iterativi applicano normalmente gli altri bonus (Forza, taglia, potenziamento dell'arma, ecc.).
- Gli iterativi si effettuano solo come parte di un'azione di **attacco completo** (round completo). Un attacco con azione standard è un solo colpo.

## Progressione dei tiri salvezza

Ciascuno dei tre tiri salvezza (Tempra / Riflessi / Volontà) è indipendentemente "buono" o "scarso" per una classe.

| Tipo | Formula | L1 | L5 | L10 | L15 | L20 |
|---|---|---|---|---|---|---|
| Buono | `base = 2 + arrotonda per difetto(L/2)` | +2 | +4 | +7 | +9  | +12 |
| Scarso | `base = arrotonda per difetto(L/3)`     | +0 | +1 | +3 | +5  | +6 |

- Il tiro salvezza totale = `base + modificatore di caratteristica pertinente + varie`. Tempra usa Costituzione, Riflessi usa Destrezza, Volontà usa Saggezza ([saving-throws.md](saving-throws.md)).
- Multiclasse: le basi dei tiri salvezza di ciascuna classe **si sommano** (si sommano le basi, poi si applica il modificatore di caratteristica una sola volta).

## Punti abilità per livello

- `PA guadagnati al livello L (nella classe X) = PA/livello di X + modificatore di Intelligenza` (minimo 1).
- 1° livello: il pool è **×4** (anche il modificatore di Intelligenza e i bonus razziali vengono moltiplicati).
- L'elenco delle abilità di classe è per classe. Le **abilità di classe** del personaggio sono l'unione degli elenchi di abilità di classe di tutte le sue classi.

### Abilità di classe contro abilità di classe incrociata

- **Abilità di classe**: 1 PA compra 1 grado. Grado massimo al livello L = `L + 3` (quindi 4 al 1° livello).
- **Abilità di classe incrociata**: 2 PA comprano 1 grado. Grado massimo al livello L = `(L + 3) / 2` (quindi 2 al 1° livello).
- I **mezzi gradi** nelle abilità di classe incrociata (indicati come `n + 1/2`) esistono quando il limite è frazionario (es. limite al L2 = 2,5). Un mezzo grado **non** si somma alle prove — è solo contabilità per il progresso parziale verso il prossimo grado intero.

## Talenti disponibili per livello

- Un talento si ottiene ai livelli di personaggio **1, 3, 6, 9, 12, 15, 18** (ogni livello divisibile per 3, più il 1°).
- `talenti disponibili = 1 + arrotonda per difetto(L / 3)`.
- Il talento bonus umano al 1° livello, i talenti di combattimento bonus del guerriero e i talenti di metamagia/creazione oggetti dalla progressione di classe sono **aggiuntivi** rispetto a questi.

## Aumenti di caratteristica per livello

Vedi [experience-and-leveling.md](experience-and-leveling.md): +1 a una caratteristica a ogni livello divisibile per 4 (4, 8, 12, 16, 20).

## PE e livello

- Vedi [experience-and-leveling.md](experience-and-leveling.md) per la formula da PE a livello.
- I PE sono tracciati al **livello di personaggio** (totale), non per classe. Un personaggio multiclasse di 3° livello necessita degli stessi PE di qualsiasi altro personaggio di 3° livello.

## Privilegi di classe

I privilegi per classe sono elencati a livelli specifici nella tabella di classe. Categorie comuni:

- **Competenza nelle armi e nelle armature** — quali armi semplici/da guerra/esotiche e quali categorie di armatura la classe padroneggia. Indossare un'armatura senza competenza impone la penalità di armatura ai tiri per colpire e a molte prove di caratteristica/abilità. Indossare **qualsiasi** armatura (con o senza competenza) impedisce a un incantatore arcano di lanciare incantesimi con componenti somatiche senza tirare per la probabilità di fallimento arcano ([equipment.md](equipment.md) quando sarà scritto).
- **Incantesimi** — vedi *Lancio di incantesimi nelle tabelle di classe* più sotto.
- **Speciale** — capacità uniche (ira, punire il male, attacco furtivo, forma selvatica, scacciare non morti, ecc.).
- **Talenti bonus** — alcune classi concedono talenti extra a livelli specifici, scelti da un elenco ristretto.

### Lancio di incantesimi nelle tabelle di classe

Le tabelle di classe mostrano una griglia di incantesimi al giorno. Lettura:

- **"—"** in uno slot = la classe **non può** lanciare incantesimi di quel livello a questo livello di classe. Nemmeno incantesimi bonus.
- **"0"** = la classe ha accesso a quel livello di incantesimo solo per gli *incantesimi bonus*. Se la caratteristica di lancio del personaggio è abbastanza alta da concedere incantesimi bonus di quel livello, quelli sono gli unici slot ottenuti.
- Un numero intero positivo = incantesimi al giorno di base di quel livello. Si sommano gli incantesimi bonus dalla caratteristica di lancio ([magic.md](magic.md)).

Note:

- Un incantatore può sempre preparare/lanciare un incantesimo di livello inferiore in uno slot di livello superiore.
- Alcune classi (paladino, ranger) non ottengono la capacità di lanciare incantesimi fino a un livello di classe successivo (es. 4°).
- Incantesimi bonus di mago/stregone: basati rispettivamente su Intelligenza/Carisma. Chierico/druido/paladino/ranger: basati su Saggezza. Bardo: basato su Carisma. Vedi [magic.md](magic.md).

### Capacità straordinarie, soprannaturali e magiche

I privilegi di classe (e i tratti razziali) esistono in tre varianti:

- **Straordinaria (Str)** — non magica, nessuna componente, nessun attacco di opportunità, nessuna resistenza agli incantesimi, non dissolvibile.
- **Soprannaturale (Sop)** — magica ma non un incantesimo. **Non provoca attacchi di opportunità** quando usata; non soggetta a resistenza agli incantesimi; non contrastabile con un controincantesimo.
- **Magica (Mag)** — funziona come l'incantesimo omonimo, **senza bisogno di componenti**. **Provoca attacchi di opportunità** quando usata (trattata come il lancio di un incantesimo); soggetta a resistenza agli incantesimi; può essere contrastata con un controincantesimo.

### Membri decaduti dalla classe

- Se un personaggio perde lo status di classe (es. un paladino infrange il codice), la descrizione della classe specifica cosa mantiene e cosa perde. Predefinito: le competenze con armi/armature già ottenute vengono mantenute; i privilegi di classe dipendenti dallo status vengono persi.

## Combinazione del multiclasse

Quando un personaggio ha livelli in più classi:

- DV, BAB, tiri salvezza base e punti abilità si sommano da ogni classe (BAB e tiri salvezza vengono sommati; i DV vengono tirati singolarmente quando si sale di livello).
- Gli elenchi di abilità di classe si uniscono.
- I privilegi di classe si sommano solo quando esplicitamente indicato (es. "i livelli di compagno animale di ranger e druido si sommano"). Altrimenti progrediscono separatamente.
- Penalità ai PE per multiclasse sbilanciato: vedi [multiclassing.md](multiclassing.md).

## Modello iniziale

Ogni classe fornisce un modello pre-costruito opzionale di 1° livello (abilità, talenti, equipaggiamento). Presuppone **4 PA** spesi in abilità in cui la classe eccelle. I giocatori possono usarlo per intero, in parte, o ignorarlo del tutto.

## Casi particolari & eccezioni

- Attacchi iterativi: solo il BAB li innesca. Un potenziamento dell'arma che porta l'attacco totale a +6 non concede un secondo attacco.
- pf minimo 1/livello anche con un modificatore di Costituzione fortemente negativo.
- I mezzi gradi nelle abilità di classe incrociata non aggiungono nulla alle prove finché non diventano gradi interi (all'acquisto successivo).
- La probabilità di fallimento arcano si applica anche quando l'incantatore è competente con l'armatura — la competenza evita solo la penalità di armatura sui tiri per colpire/le prove, non la probabilità di fallimento arcano.
- Uno "0" in una colonna di incantesimi al giorno di classe *non* è uno slot base; converte solo gli incantesimi bonus da una caratteristica di lancio elevata in slot utilizzabili.
- Passare a una classe con tiro salvezza scarso nella stessa categoria in cui era buono in un'altra classe non riduce il totale del tiro salvezza buono già esistente — le basi si sommano semplicemente.

## Riferimenti incrociati

- [character-creation.md](character-creation.md) — fase di selezione della classe; pf/equipaggiamento iniziali per classe.
- [ability-scores.md](ability-scores.md) — Costituzione → pf, Intelligenza → PA/livello, caratteristica di lancio per classe.
- [skills.md](skills.md) — meccaniche complete delle abilità; abilità di classe contro classe incrociata.
- [saving-throws.md](saving-throws.md) — tiri salvezza legati alle caratteristiche.
- [combat.md](combat.md) — BAB, CA, azione di attacco completo per gli iterativi.
- [magic.md](magic.md) — incantesimi bonus, minimi di lancio, CD del tiro salvezza degli incantesimi.
- [multiclassing.md](multiclassing.md) — classe preferita e penalità ai PE.
- [experience-and-leveling.md](experience-and-leveling.md) — tabella dei PE, calendario dei talenti disponibili, aumenti di caratteristica.
- [feats.md](feats.md) — regole di selezione dei talenti.
- [class-features.md](class-features.md) — privilegi nominati per classe (ira, attacco furtivo, punire il male, forma selvatica, ecc.) e i sottosistemi di famiglio/compagno animale/cavalcatura speciale.
- [src/data/classes.json](../../src/data/classes.json) — dati numerici per classe.

## Fonti

- Manuale del Giocatore — pp. 21–23
