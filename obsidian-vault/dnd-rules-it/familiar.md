# Famiglio

> Sottosistema del famiglio di stregone/mago: come si ottiene un famiglio, come le sue statistiche derivano dal padrone, come avanza con il livello del padrone (armatura naturale, Intelligenza, capacità speciali) e l'elenco delle creature-famiglio con il bonus per specie che ciascuna conferisce al padrone. Le schede statistiche base per creatura si trovano in [src/data/animals.json](../../src/data/animals.json).

Un **famiglio** è un animale normale che ottiene nuovi poteri e **diventa una bestia magica** quando viene chiamato al servizio da uno stregone o da un mago. Mantiene **l'aspetto, i Dadi Vita, il bonus di attacco base, i bonus ai tiri salvezza base, le abilità e i talenti** dell'animale normale che era, ma viene **trattato come una bestia magica** (non come un animale) ai fini di qualsiasi effetto che dipende dal suo tipo.

Solo un **animale normale, non modificato** può diventare un famiglio. Un compagno animale **non può** fungere anche da famiglio.

> **Differenza di tipo rispetto al compagno animale.** Il famiglio *diventa una bestia magica*; il compagno animale di druido/ranger **mantiene il proprio tipo** (animale). Poiché il famiglio è una bestia magica, *condividere incantesimi* funziona comunque su di esso grazie all'eccezione esplicita di tipo indicata sotto. (Vedi [animal-companion.md](animal-companion.md) per il sottosistema del compagno.)

---

## Ottenere un famiglio

- **Costo:** **24 ore** di lavoro + materiali magici del valore di **100 mo**.
- Lo stregone/mago **sceglie il tipo** di famiglio dall'elenco sottostante.
- Un personaggio con **più di una classe che concede un famiglio** può avere **un solo famiglio alla volta**.
- Le capacità speciali concesse **si applicano solo mentre padrone e famiglio sono entro 1 miglio** l'uno dall'altro.

---

## Livello effettivo

Tutte le capacità del famiglio dipendenti dal livello si basano sul **livello combinato del padrone nelle classi che concedono un famiglio** — i livelli di classi diverse che concedono un famiglio **si sommano** a questo scopo (es. Stregone 3 / Mago 2 → livello del padrone 5 ai fini delle capacità del famiglio).

---

## Nozioni di base sul famiglio

Si usano le **statistiche base per una creatura del tipo del famiglio** (da [src/data/animals.json](../../src/data/animals.json)), applicando poi le seguenti modifiche:

- **Dadi Vita** — per gli effetti legati al numero di Dadi Vita, si usa il **livello di personaggio del padrone** o il **totale normale dei DV del famiglio**, a seconda di quale sia **più alto**.
- **Punti ferita** — il famiglio ha **metà del totale dei punti ferita del padrone** (esclusi i punti ferita temporanei), **arrotondati per difetto**, indipendentemente dai suoi Dadi Vita effettivi.
- **Attacchi** — si usa il **bonus di attacco base del padrone** (da tutte le sue classi). Si usa il **modificatore di Destrezza o di Forza del famiglio, quello più alto**, per il suo bonus di attacco in mischia con le armi naturali. Il **danno** è pari a quello di una creatura normale del tipo del famiglio.
- **Tiri salvezza** — per ciascun tiro salvezza, si usa o il bonus base del **famiglio** (Tempra +2, Riflessi +2, Volontà +0) o quello del **padrone** (da tutte le sue classi), a seconda di quale sia **migliore**. Il famiglio usa i **propri modificatori di caratteristica** sui tiri salvezza, e **non** condivide nessun altro bonus del padrone sui tiri salvezza.
- **Abilità** — per ogni abilità in cui il padrone o il famiglio abbiano gradi, si usano o i gradi normali per un animale di quel tipo o i **gradi di abilità del padrone, quelli migliori**. In entrambi i casi, il famiglio usa i **propri modificatori di caratteristica**. Alcune abilità possono restare al di là della capacità del famiglio di utilizzarle.

---

## Tabella di avanzamento

Indicizzata per il **livello di classe del padrone**. **Aggiustamento armatura naturale** è un *miglioramento* (aggiunto) al bonus di armatura naturale già posseduto dal famiglio. **Int** è il **punteggio** di Intelligenza del famiglio (non un bonus). Le capacità speciali sono **cumulative**.

| Livello di classe del padrone | Aggiustamento armatura naturale | Int | Speciale |
|---|---|---|---|
| 1°–2°   | +1  | 6  | Allerta, eludere migliorato, condividere incantesimi, legame empatico |
| 3°–4°   | +2  | 7  | Trasmettere incantesimi a contatto |
| 5°–6°   | +3  | 8  | Parlare con il padrone |
| 7°–8°   | +4  | 9  | Parlare con animali della sua specie |
| 9°–10°  | +5  | 10 | — |
| 11°–12° | +6  | 11 | Resistenza agli incantesimi |
| 13°–14° | +7  | 12 | Scrutare sul famiglio |
| 15°–16° | +8  | 13 | — |
| 17°–18° | +9  | 14 | — |
| 19°–20° | +10 | 15 | — |

---

## Capacità speciali

Tutti i famigli possiedono queste capacità speciali (o le conferiscono ai loro padroni) in base al livello combinato del padrone nelle classi che concedono un famiglio, come mostrato sopra. Le capacità sono **cumulative**.

- **Allerta (Str)** — finché il famiglio è a **portata di braccio**, il padrone ottiene il talento **Allerta**.
- **Eludere migliorato (Str)** — quando è soggetto a un attacco che normalmente concede un **tiro salvezza su Riflessi per dimezzare i danni**, il famiglio non subisce **alcun danno** con un tiro salvezza **riuscito** e subisce **metà danno** anche se il tiro salvezza **fallisce**.
- **Condividere incantesimi** — a discrezione del padrone, questi può far sì che qualsiasi **incantesimo** (ma non una capacità magica) che lancia **su se stesso** colpisca anche il suo famiglio, se questo si trova **entro 5 piedi** al momento del lancio. Per una durata non istantanea, l'effetto **termina se il famiglio si allontana oltre 5 piedi** e non lo colpirà di nuovo anche se ritorna prima che la durata scada. Il padrone può anche lanciare un incantesimo con bersaglio **"Voi"** sul proprio famiglio (come un incantesimo a **contatto**) invece che su se stesso. Questo funziona **anche se l'incantesimo normalmente non ha effetto su creature del tipo del famiglio (bestia magica)**.
- **Legame empatico (Sop)** — il padrone ha un legame empatico con il proprio famiglio fino a **1 miglio**. **Non può** vedere attraverso i suoi occhi, ma possono comunicare empaticamente; si può trasmettere solo un **contenuto emotivo generico**. Grazie a questo legame, il padrone ha la stessa connessione con un oggetto o un luogo che ha il suo famiglio.
- **Trasmettere incantesimi a contatto (Sop)** — se il padrone è di **3° livello o superiore**, un famiglio può trasmettere incantesimi a contatto per lui. Se padrone e famiglio sono **in contatto** quando il padrone lancia un incantesimo a contatto, può designare il famiglio come "colui che crea il contatto", e il famiglio può quindi trasmettere l'incantesimo a contatto proprio come avrebbe potuto fare il padrone. Come di consueto, se il padrone lancia un altro incantesimo prima che il contatto venga effettuato, l'incantesimo a contatto si dissolve.
- **Parlare con il padrone (Str)** — se il padrone è di **5° livello o superiore**, famiglio e padrone possono comunicare **verbalmente come se usassero un linguaggio comune**. Le altre creature non comprendono la comunicazione senza aiuto magico.
- **Parlare con animali della sua specie (Str)** — se il padrone è di **7° livello o superiore**, il famiglio può comunicare con animali all'incirca della stessa specie (incluse le varietà spettrali): pipistrelli con pipistrelli, ratti con roditori, gatti con felini, falchi/gufi/corvi con uccelli, lucertole e serpenti con rettili, rospi con anfibi, donnole con creature simili (donnole, visoni, puzzole, ermellini, moffette, ghiottoni e tassi). Limitato dall'intelligenza delle creature coinvolte nella conversazione.
- **Resistenza agli incantesimi (Str)** — se il padrone è di **11° livello o superiore**, il famiglio ottiene **RI = livello del padrone + 5**. Per colpire il famiglio con un incantesimo, un altro incantatore deve superare una prova di livello dell'incantatore (1d20 + livello dell'incantatore) ≥ alla RI del famiglio.
- **Scrutare sul famiglio (Mag)** — se il padrone è di **13° livello o superiore**, può **scrutare sul proprio famiglio** (come l'incantesimo *scrutare*) **una volta al giorno**.

---

## Elenco dei famigli

Ogni tipo di famiglio concede un **bonus per specie fisso al padrone**. Riferimento dati = la scheda statistica corrispondente in [src/data/animals.json](../../src/data/animals.json) (`animals/<slug>`).

| Famiglio | Il padrone ottiene | Riferimento dati |
|---|---|---|
| Pipistrello | +3 alle prove di Ascoltare | `animals/bat` |
| Gatto | +3 alle prove di Muoversi Silenziosamente | `animals/cat` |
| Falco | +3 alle prove di Osservare in piena luce | `animals/hawk` |
| Lucertola | +3 alle prove di Scalare | `animals/lizard` |
| Gufo | +3 alle prove di Osservare nell'ombra | `animals/owl` |
| Ratto | +2 ai tiri salvezza su Tempra | `animals/rat` |
| Corvo ¹ | +3 alle prove di Valutare | `animals/raven` |
| Serpente ² | +3 alle prove di Raggirare | `animals/snake-tiny-viper` |
| Rospo | +3 punti ferita | `animals/toad` |
| Donnola | +2 ai tiri salvezza su Riflessi | `animals/weasel` |

> ¹ Un famiglio **corvo** può **parlare una lingua** a scelta del padrone come capacità soprannaturale.
> ² **Vipera minuscola.**

---

## Perdere un famiglio

- Se il famiglio **muore o viene congedato** (congedo incluso — non esiste un rilascio volontario senza penalità), il padrone deve tentare un **tiro salvezza su Tempra CD 15**. Fallimento → perde **200 PE per livello di classe del padrone**; successo → ne perde **la metà**. Il totale dei PE del padrone **non può mai scendere sotto 0** a causa di questo, e non può perdere un livello per questo motivo.
- Un famiglio ucciso o congedato **non può essere sostituito per un anno e un giorno**; ottenere il successivo richiede quindi le solite **24 ore + 100 mo**.
- Un famiglio ucciso **può essere resuscitato** proprio come un personaggio, e in tal caso **non** perde un livello né un punto di Costituzione.

---

## Riferimenti incrociati

- [class-features.md](class-features.md) — privilegi di classe di Stregone e Mago (questo sottosistema è riassunto lì e dettagliato qui).
- [classes.md](classes.md) — progressioni di DV, BAB e tiri salvezza usate per derivare BAB/tiri salvezza del famiglio dal padrone.
- [skills-detail.md](skills-detail.md) — le abilità potenziate dai bonus per specie.
- [magic.md](magic.md) — incantesimi a contatto (Trasmettere incantesimi a contatto), *scrutare* (Scrutare sul famiglio), resistenza agli incantesimi.
- [src/data/animals.json](../../src/data/animals.json) — schede statistiche base per ogni creatura-famiglio (`animals/<slug>`).

## Fonti

- Manuale del Giocatore — Stregone (Famiglio) e le tabelle del sottosistema dei famigli.
