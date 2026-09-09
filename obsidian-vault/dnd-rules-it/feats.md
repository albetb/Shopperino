# Talenti

> Sistema dei talenti: come si acquisiscono, prerequisiti, categorie. L'elenco dei talenti specifici e dei loro effetti si trova in [src/data/feats.json](../../src/data/feats.json).

## Meccanica di base

- Un **talento** è una capacità speciale distinta che concede una nuova opzione o migliora una già esistente.
- Un talento si possiede o non si possiede — i talenti **non hanno gradi**.
- Un talento può essere selezionato solo se tutti i suoi **prerequisiti** sono soddisfatti al momento della selezione (punteggio di caratteristica, BAB, privilegio di classe, gradi abilità, altro talento, livello di classe, livello del personaggio, ecc.).
- Un personaggio che in seguito **perde un prerequisito** (es. la Forza scende sotto 13 a causa di *raggio di indebolimento*) **non può usare** i talenti dipendenti finché il prerequisito non viene ripristinato, ma il talento in sé non viene perso.

## Acquisizione

- Ogni personaggio ottiene **1 talento al 1° livello** e **1 in più a ogni livello divisibile per 3** (quindi L3, L6, L9, L12, L15, L18). Formula: `slot talento da avanzamento di livello = 1 + parte intera di (L / 3)`. (Anche in [experience-and-leveling.md](experience-and-leveling.md).)
- Gli **umani** ottengono un talento extra al 1° livello.
- I **guerrieri** ottengono talenti di combattimento bonus al L1 e a ogni livello pari successivo (scelti da un elenco di talenti bonus del guerriero — vedi sotto).
- I **maghi** ottengono talenti bonus al L5, 10, 15, 20 (scelti tra metamagia, creazione oggetto o *Padronanza degli Incantesimi* — vedi [class-features.md](class-features.md)).
- **Altri talenti bonus specifici di classe** (Seguire Tracce e Resistenza Fisica dei ranger; le scelte al L1/2/6 dei monaci; lo slot opzionale per capacità speciali dei ladri) sono elencati in [class-features.md](class-features.md).
- I **talenti bonus razziali** (es. la familiarità con le armi dei nani tecnicamente non è un talento; ma alcune razze concedono veri talenti bonus) seguono regole proprie.
- I talenti bonus si **aggiungono** ai talenti da avanzamento di livello, non li sostituiscono.
- I talenti sono scelti dal giocatore, non assegnati dal DM.

## Categorie

Un talento rientra esattamente in una categoria:

- **Generale** — nessuna restrizione particolare. Disponibile a chiunque soddisfi i prerequisiti.
- **Talento bonus del guerriero** — un sottoinsieme di talenti generali/di combattimento contrassegnato in [src/data/feats.json](../../src/data/feats.json) come disponibile per la selezione bonus del guerriero. **Tutti i talenti bonus del guerriero sono anche talenti generali** — qualsiasi personaggio può prenderli con il proprio slot normale se soddisfa i prerequisiti. Il contrassegno "bonus del guerriero" limita solo ciò che i *guerrieri* possono selezionare con i propri slot *bonus*.
- **Creazione oggetto** — permette a un incantatore di creare oggetti magici (pergamene, pozioni, bacchette, anelli, bastoni, oggetti meravigliosi, armi/armature, ecc.). Vedi [magic-items.md](magic-items.md).
- **Metamagia** — modifica gli incantesimi quando vengono lanciati o preparati. Vedi [metamagic.md](metamagic.md).

## Prerequisiti — tipi

- **Punteggio di caratteristica**: es. Forza 13.
- **Bonus di attacco base**: es. BAB +1.
- **Altro talento**: es. *Attacco Poderoso* (Forza 13).
- **Livello di classe**: es. guerriero di livello 4.
- **Livello del personaggio**: es. livello del personaggio 6.
- **Privilegio di classe**: es. capacità di lanciare incantesimi arcani di 1° livello.
- **Grado abilità**: es. 3 gradi in Acrobazia.
- **Razza / tratto razziale**: alcuni talenti sono vincolati alla razza.
- **Allineamento / divinità**: un piccolo numero di talenti.

Prerequisiti multipli: devono essere soddisfatti tutti. Selezionare un talento a un livello in cui più acquisizioni avvengono simultaneamente (es. prendere un talento allo stesso livello in cui si raggiunge la soglia di BAB richiesta) è permesso — i prerequisiti soddisfatti a partire da quel livello contano.

## Interazioni multiclasse

- Un personaggio multiclasse può prendere un talento al livello in cui viene concesso, applicando il livello attuale di qualsiasi classe nel verificare i prerequisiti di livello di classe.
- Lo slot di talento bonus di un guerriero può essere speso per qualsiasi talento dell'elenco bonus del guerriero, anche se il guerriero ha altre classi.

## Casi particolari ed eccezioni

- Selezionare un talento prerequisito allo stesso livello del personaggio del talento dipendente è permesso solo quando entrambi gli slot diventano disponibili a quel livello (es. multiclassare in una classe che concede un talento bonus al 3° livello del personaggio, scegliendo il prerequisito come talento della normale progressione e il dipendente come talento bonus).
- Un talento con un **limite di utilizzi giornalieri** mantiene il proprio limite indipendentemente da come è stato acquisito.
- Un talento concesso da una classe come talento bonus **ignora i prerequisiti** solo se la classe lo dichiara esplicitamente (es. i talenti di stile di combattimento del ranger ignorano esplicitamente i prerequisiti; i talenti bonus del guerriero **non** lo fanno — richiedono comunque i prerequisiti).
- Alcuni talenti possono essere selezionati **più di una volta**, ogni volta applicati a una scelta diversa (es. *Arma Focalizzata* per arma, *Abilità Focalizzata* per abilità). Indicato per ciascun talento nel JSON.

## Riferimenti incrociati

- [experience-and-leveling.md](experience-and-leveling.md) — programma degli slot talento per livello.
- [classes.md](classes.md) — classi che concedono talenti bonus.
- [class-features.md](class-features.md) — dettagli dei talenti bonus di guerriero, mago, ranger, monaco, ladro.
- [metamagic.md](metamagic.md) — meccaniche della metamagia.
- [magic-items.md](magic-items.md) — meccaniche di creazione oggetti e formule di costo.
- [src/data/feats.json](../../src/data/feats.json) — dati per talento: nome, prerequisiti, tag di tipo (generale/bonus guerriero/creazione oggetto/metamagia), effetto, flag di ripetibilità.

## Fonti

- Manuale del Giocatore — pp. 87
