# Componenti degli incantesimi

> Cos'è ciascuna componente, cosa ne impedisce l'uso, e le convenzioni dei suffissi negli elenchi di incantesimi.

## I sei tipi di componente

### Verbale (V)

- L'incantatore deve **parlare ad alta voce**, con un tono misurato udibile entro ~9 m.
- Non può essere fornita se:
  - È presente l'incantesimo *silenzio* o un silenzio magico nell'area di lancio.
  - C'è un bavaglio, una paralisi che impedisce di parlare, un mutismo magico.
  - L'incantatore è assordato: **20% di probabilità** che il lancio fallisca per ogni incantesimo con componente V (tirato per ogni lancio).
- Sussurrare conta come inudibile — non aiuta.
- Lanciare un incantesimo con componente V è una **singola vocalizzazione sostenuta**; parlare durante il lancio (rivolgersi agli alleati, dare ordini al famiglio) non può sostituirla né accompagnarla.

### Somatica (S)

- Un gesto delle mani misurato, che richiede almeno **una mano libera** con piena mobilità.
- Non può essere fornita se:
  - Entrambe le mani sono occupate (combattimento con due armi, tenere due oggetti pesanti, arrampicarsi con entrambe le mani).
  - Il personaggio è in lotta o immobilizzato.
  - La mano è immobilizzata (manette, *tenere persone*, paralisi).
- Uno scudo/un'arma impugnati contano come occupare quella mano, a meno che non vengano lasciati cadere o altrimenti liberati.
- Indossare un'armatura / usare uno scudo mentre si lancia un incantesimo arcano con componente S causa il **Fallimento degli Incantesimi Arcani** (vedi [equipment.md](equipment.md)). I bardi con armatura leggera sono esenti per gli incantesimi da bardo.

### Materiale (M)

- Una sostanza fisica consumata (incenso, sabbia, una piuma, la squama di un serpente, ecc.).
- La componente viene **consumata** al momento del lancio (usata, anche se l'incantesimo fallisce).
- Si presume che una **borsa per componenti di incantesimi** contenga gratuitamente tutte le componenti materiali non banali standard; l'incantatore non deve tenerne traccia singolarmente.
- Le **componenti materiali costose** (quelle con un prezzo in mo indicato, es. il diamante da 5.000 mo di *resurrezione*) NON sono nella borsa e **devono essere acquistate e tracciate specificamente**.
- Senza la componente materiale richiesta → impossibile lanciare l'incantesimo.

### Focus (F)

- Uno **strumento fisico** richiesto per il lancio ma **non consumato** (es. piccolo specchio d'argento per *scrutare*, spada in miniatura di platino per *arma spirituale*).
- Riutilizzabile tra un lancio e l'altro.
- La borsa standard contiene tutti i focus senza un costo indicato.
- I focus costosi devono essere acquistati e tracciati.
- Senza il focus → impossibile lanciare l'incantesimo.

### Focus divina (FD)

- Un **simbolo sacro** (chierico buono), un **simbolo sacrilego** (chierico malvagio), o uno specifico oggetto naturale per druidi/ranger (vischio o agrifoglio).
- Deve essere esibita/tenuta in mano durante il lancio.
- La FD dei druidi è un rametto di vischio o agrifoglio (non deve essere tenuta continuamente in mano — deve essere addosso al druido).
- Senza la FD → impossibile lanciare l'incantesimo.

### Componenti combinate "M/FD" o "F/FD"

- Un testo delle componenti come `Componenti: V, S, M/FD` significa che **gli incantatori arcani usano M, quelli divini usano FD**.
- `F/FD` segue la stessa convenzione (focus per gli arcani, focus divina per i divini).

### Costo in PE (PE)

- Alcuni incantesimi potenti (*desiderio*, *miracolo*, *desiderio limitato*, creazione di oggetti) richiedono che l'incantatore **spenda PE** al momento del lancio.
- I PE spesi **non possono essere recuperati** in alcun modo — nemmeno con *restaurazione* o *miracolo*.
- L'incantatore non può spendere così tanti PE da scendere sotto il minimo per il proprio livello attuale.
  - In modo equivalente: un incantatore al minimo di PE per il proprio livello attuale **non può** lanciare un incantesimo con un costo in PE finché non ha guadagnato abbastanza da assorbire la perdita.
- Un personaggio può continuare a guadagnare PE e lanciare l'incantesimo non appena ha PE da spendere.
- I PE vengono spesi al momento di un lancio **riuscito** (persi comunque se l'incantesimo fallisce dopo che i PE sono già stati impegnati).

## Codici suffisso negli elenchi di incantesimi

Negli elenchi di incantesimi (per classe) e negli indici, un suffisso di una lettera sul nome di un incantesimo segnala componenti che richiedono attenzione extra:

| Suffisso | Significato |
|---|---|
| `m` | Componente materiale costosa (NON nella borsa standard — deve essere tracciata). |
| `f` | Focus costoso (NON nella borsa standard — deve essere tracciato). |
| `x` | Componente in PE (l'incantatore paga PE al momento del lancio). |

- Un incantesimo può avere **più suffissi** se ha più componenti costose (es. `desideriox` per *desiderio*).
- Il costo/la descrizione completa dell'oggetto compare nel testo del singolo incantesimo sotto "Componenti."

## Implicazioni pratiche

- Un mago immobilizzato con le manette non può lanciare incantesimi con componente S.
- Un incantatore in lotta non può lanciare incantesimi con componente S; per gli incantesimi solo V, deve superare una prova di Concentrazione CD `10 + livello dell'incantesimo`.
- Un incantatore messo a tacere (in un effetto di *silenzio*, o imbavagliato) non può lanciare incantesimi con componente V.
- Un incantatore assordato ha una **probabilità di fallimento del 20% per lancio** sugli incantesimi con componente V (conta come lancio dal punto di vista del chierico: lo slot viene perso in caso di fallimento).
- Un incantatore senza la propria borsa per componenti né il focus può comunque lanciare incantesimi solo V, incantesimi V+S, e qualsiasi incantesimo di cui possieda le componenti. Gli incantatori le cui capacità si basano su Saggezza/Intelligenza/Carisma portano borse per default, a meno che le circostanze non lo impediscano (spogliato, derubato, ...).

## Riferimenti incrociati

- [magic.md](magic.md) — anatomia completa della descrizione di un incantesimo e procedura di lancio.
- [combat.md](combat.md) — prove di Concentrazione per lanciare sotto stress; incantesimi di contatto.
- [equipment.md](equipment.md) — Fallimento degli Incantesimi Arcani per i lanci arcani con componente S in armatura.
- [conditions.md](conditions.md) — messo a tacere, in lotta, paralizzato, assordato.
- [magic-items.md](magic-items.md) — costose componenti PE/M per la trascrizione di pergamene e la creazione di oggetti.

## Fonti

- Manuale del Giocatore — pp. 175 (componenti V/S/M/F/FD/PE)
- Manuale del Giocatore — p. 183 (codici suffisso m/f/x)
