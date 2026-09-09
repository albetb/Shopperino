# Privilegi di classe

> Catalogo per classe dei privilegi nominati e di come si risolvono meccanicamente. I numeri per classe (usi al giorno per livello, dadi danno, CD dei tiri salvezza che dipendono dal livello, ecc.) vivono in [src/data/classes.json](../../src/data/classes.json); questo file documenta le *meccaniche* attivate da ciascun privilegio.

I sottosistemi condivisi (famiglio, compagno animale, cavalcatura speciale, scacciare non morti, forma selvatica, specializzazione di scuola) sono in fondo.

---

## Barbaro

- **Movimento veloce (Str)** — +3 m alla velocità terrestre base. Attivo **solo** con armatura leggera o nessuna e carico leggero o nessuno.
- **Ira (Str)** — azione gratuita per entrarvi; mentre è in ira:
  - +4 Forza, +4 Costituzione, +2 morale ai tiri salvezza sulla Volontà, **−2 CA**.
  - Punti ferita bonus dall'aumento di Costituzione = `(livello) × 2`, trattati come punti ferita temporanei per la durata.
  - **Non può** usare abilità basate su Carisma, Destrezza o Intelligenza *tranne* Equilibrio, Artista della Fuga, Cavalcare, Intimidire; non può usare Concentrazione; non può lanciare incantesimi né attivare oggetti magici a completamento di incantesimo / attivazione di incantesimo / parola di comando.
  - Durata: `3 + modificatore di Costituzione in ira` round. Terminazione volontaria permessa.
  - Dopo: **affaticato** (−2 Forza, −2 Destrezza; non si può correre né caricare) per il resto dello scontro.
  - Si può entrare in ira una sola volta per scontro. Non si può entrare in ira come reazione all'azione di un altro (nessuna ira preparata/interrompente).
- **Ira superiore (Str)** (al livello indicato in JSON) — i bonus diventano +6/+6/+3.
- **Ira possente** — +8/+8/+4.
- **Ira instancabile** — nessun affaticamento post-ira.
- **Schivare prodigioso (Str)** — mantiene il bonus di Destrezza alla CA contro attaccanti invisibili e contro l'essere colto alla sprovvista. Ancora perso se immobilizzato.
- **Schivare prodigioso migliorato** — non può essere attaccato ai fianchi, tranne che da un ladro il cui livello di classe superi di ≥4 quello del barbaro che concede lo schivare prodigioso.
- **Percepire trappole (Str)** — `+X` ai tiri salvezza sui Riflessi contro le trappole e `+X` di schivare alla CA contro gli attacchi delle trappole. Si cumula tra le classi che concedono percepire trappole (barbaro + ladro).
- **RD X/—** (riduzione del danno) — riduce ogni istanza di danno da arma in arrivo di X (minimo 0; non può portare il danno sotto 0).
- **Volontà indomita** — bonus extra al tiro salvezza sulla Volontà *solo durante l'ira*, contro l'ammaliamento.
- **Analfabeta** — i barbari iniziano analfabeti in tutti i linguaggi. Possono spendere **2 PA** una volta per ottenere l'alfabetizzazione in ogni linguaggio conosciuto. Multiclassare in barbaro *non* rimuove l'alfabetizzazione già ottenuta.

## Bardo

- **Conoscenze bardiche (Str)** — `d20 + livello da bardo + modificatore di Intelligenza` per un elemento di leggenda/sapienza (nessun tiro per sapienza comune). Scala di CD circa 10/20/25/30 in base all'oscurità (10 = comune locale, 30 = sapienza perduta).
- **Musica bardica (Str/Mag/Sop)** — utilizzabile `livello da bardo / giorno` in totale. Ogni uso attiva una capacità specifica (sotto); alcune richiedono un'esibizione sostenuta (azione standard ogni round per mantenerla; non si può lanciare incantesimi o attivare oggetti mentre si sostiene; un bardo assordato ha il 20% di probabilità di fallire ogni round). Richiede i gradi minimi indicati in **Intrattenere**.
  - **Controcanto (Sop)** (3 gradi Intrattenere) — 1/round, la prova di Intrattenere sostituisce il tiro salvezza contro effetti magici sonori/dipendenti dal linguaggio per qualsiasi creatura entro 9 m, mentre viene sostenuto.
  - **Affascinare (Mag)** — 1 bersaglio ogni 3 livelli da bardo entro 27 m, tiro salvezza sulla Volontà contro la prova di Intrattenere o affascinato per 1 round/livello da bardo; interrotto da minacce o azioni ostili.
  - **Ispirare coraggio (Sop)** (3 gradi) — gli alleati che ascoltano ottengono `+X` morale ai tiri per colpire, ai danni con armi e ai tiri salvezza contro charme/paura. Dura finché si ascolta + 5 round.
  - **Ispirare competenza (Sop)** (6 gradi; L3+) — 1 alleato entro 9 m ottiene +2 di competenza a un'abilità specifica, mentre ascolta, fino a 2 minuti.
  - **Suggestione (Mag)** (9 gradi; L6+) — come l'incantesimo, su una creatura già affascinata. Non interrompe l'affascinare. Compulsione che influenza la mente. CD del tiro salvezza = `10 + ½ livello da bardo + modificatore di Carisma`.
  - **Ispirare grandezza (Sop)** (12 gradi; L9+) — 1 alleato + 1 ogni 3 livelli oltre il 9° ottiene: +2 DV bonus (d10) + modificatore di Costituzione ciascuno (punti ferita temporanei), +2 di competenza all'attacco, +1 morale ai tiri salvezza sulla Tempra.
  - **Canto di libertà (Mag)** (15 gradi; L12+) — 1 minuto di concentrazione → effetto di *spezzare incantamento* su un bersaglio entro 9 m.
  - **Ispirare eroismo (Sop)** (18 gradi; L15+) — 1 alleato + 1 ogni 3 livelli oltre il 15° ottiene +4 morale ai tiri salvezza, +4 di schivare alla CA.
  - **Suggestione di massa (Mag)** (21 gradi; L18+) — *suggestione* applicata a un numero qualsiasi di bersagli affascinati simultaneamente.
- **Lanciare incantesimi** — arcani, **basati su Carisma**, **spontanei** (conosce una lista fissa; vedi [magic.md](magic.md) per il sistema preparati-contro-spontanei). Livello massimo di incantesimo 6.
- **Armatura e lancio arcano** — un bardo in armatura leggera non subisce alcuna percentuale di fallimento delle formule arcane per gli incantesimi da bardo. Armatura media/pesante o qualsiasi scudo → percentuale di fallimento normale.

## Chierico

- **Aura (Str)** — aura di allineamento corrispondente alla componente più forte della divinità, intensità in base al livello da chierico (vedi incantesimi *individuazione dell'allineamento*).
- **Domini** — sceglie **2** dalla lista consentita dalla divinità al 1° livello (permanente). I domini concedono:
  - Un **potere concesso** (capacità passiva o bonus).
  - Un **incantesimo di dominio per livello di incantesimo (1–9)**. Ogni giorno, il chierico ottiene uno slot extra per livello di incantesimo designato come **slot di dominio**; quello slot può contenere solo un incantesimo di uno dei due domini scelti.
- **Lancio spontaneo** — sacrificando un incantesimo preparato (non di dominio) di livello L, un chierico può lanciare spontaneamente *qualsiasi* incantesimo di cura (buono/neutrale) o *qualsiasi* incantesimo di infliggere (malvagio) di livello ≤ L. Il chierico neutrale sceglie l'orientamento buono o malvagio al 1° livello, permanente.
- **Scacciare / intimorire non morti (Sop)** — vedi il sottosistema *Scacciare non morti* sotto.
- **Preparazione degli incantesimi** — prepara dalla lista completa del chierico ogni giorno dopo 1 ora di contemplazione/preghiera. L'ora del giorno dipende dalla divinità (buona = alba; malvagia = notte).
- **Restrizione di allineamento** — entro un passo dall'allineamento della divinità su entrambi gli assi; non può essere neutrale puro a meno che non lo sia la divinità. Alcune divinità impongono restrizioni ulteriori (es. i chierici di San Cuthbert non possono essere neutrali).
- **Caratteristica per lanciare incantesimi** — Saggezza. CD del tiro salvezza degli incantesimi = `10 + livello dell'incantesimo + modificatore di Saggezza`.
- **Ex-chierico** — una violazione grave del codice → perde gli incantesimi e i privilegi di classe (mantiene le competenze con armi/armature). Richiede *espiazione* per essere recuperati. Nessun ulteriore livello da chierico finché non ha espiato.

## Druido

- **Compagno animale (Str)** — vedi il sottosistema *Compagno animale* sotto.
- **Senso della natura (Str)** — `+2` alle prove di Conoscenze (natura) e Sopravvivenza.
- **Empatia selvatica (Str)** — `d20 + livello da druido + modificatore di Carisma` per migliorare l'atteggiamento di un animale, come una prova di Diplomazia. Raggio 9 m, 1 minuto. Utilizzabile anche su bestie magiche con Intelligenza 1–2 a `−4`.
- **Passo silvano (Str)** — si muove attraverso il terreno difficile naturale (rovi, sottobosco) a velocità normale, senza danno. Gli effetti magici (es. *groviglio*) si applicano comunque.
- **Passo senza tracce (Str)** — non lascia traccia in terreno naturale a meno che non lo desideri.
- **Resistere al fascino della natura (Str)** — `+4` ai tiri salvezza contro incantesimi e capacità magiche dei folletti.
- **Forma selvatica (Sop)** — vedi il sottosistema *Forma selvatica* sotto.
- **Immunità al veleno (Str)** — immune a tutti i veleni (naturali e magici).
- **Mille volti (Sop)** — *alterare se stesso* a volontà, ma solo nella propria forma. Cosmetico, non da combattimento.
- **Corpo senza tempo (Str)** — nessuna penalità di invecchiamento ai punteggi fisici; muore comunque di vecchiaia secondo i tempi previsti.
- **Lancio spontaneo** — sacrifica un incantesimo preparato di livello L → lancia spontaneamente qualsiasi *evoca alleato naturale* di livello ≤ L.
- **Preparazione degli incantesimi** — quotidiana, 1 ora di comunione con la natura; prepara dalla lista completa del druido.
- **Caratteristica per lanciare incantesimi** — Saggezza.
- **Restrizione di armatura** — non può indossare **armatura metallica** né impugnare scudi metallici. Consentiti: imbottita, di cuoio, di pelle; scudi di legno (non torre). Violarla fa perdere tutte le capacità di lancio incantesimi e soprannaturali per **24 ore**.
- **Druidico** — linguaggio segreto di classe. Insegnarlo a non druidi fa perdere permanentemente tutte le capacità da druido.
- **Restrizione di allineamento** — almeno un asse deve essere neutrale.
- **Ex-druido** — un cambio di allineamento o l'insegnare il Druidico a un non druido → perde incantesimi, privilegi di classe soprannaturali e compagno animale finché non ottiene *espiazione*.

## Guerriero

- **Talenti da combattimento bonus** — al 1° livello e a ogni livello **pari** successivo (2, 4, 6, …, 20). Devono essere tratti dalla lista dei talenti bonus del guerriero (perlopiù talenti di combattimento). I prerequisiti restano richiesti.
- Nessun altro privilegio di classe. I guerrieri si affidano interamente ai talenti e alle competenze accumulati.

## Monaco

- **Armi da monaco** — kama, nunchaku, sai, shuriken, siangham. Il monaco può applicare Raffica di Colpi e altri effetti di classe da monaco a queste armi.
- **Talenti bonus** — a livelli fissi (1, 2, 6), scelti da una piccola lista per livello. Prerequisiti ignorati.
  - L1: *Lottare Migliorato* o *Pugno Stordente*.
  - L2: *Riflessi in Combattimento* o *Deviare Frecce*.
  - L6: *Disarmare Migliorato* o *Sbilanciare Migliorato*.
- **Bonus alla CA (Sag)** — quando non è in armatura e non è ingombrato (solo carico leggero), aggiunge il **modificatore di Saggezza** alla CA, più `+1` a determinati livelli chiave (per JSON). Perso quando indossa armatura, usa uno scudo o porta un carico medio/pesante.
- **Raffica di colpi (Str)** — azione di attacco completo che concede un **attacco extra al BAB più alto**; *tutti* gli attacchi durante la raffica subiscono una penalità `−2` (la penalità cala ai livelli successivi per JSON). Utilizzabile solo con colpi senz'armi o armi da monaco (non mescolando entrambi nella stessa raffica, tranne un quarterstaff/bo che conta come arma da monaco se impugnato a due mani).
- **Colpo senz'armi (Str)** — trattato **sia** come arma manufatta (quindi si applicano *arma magica* / *arma magica superiore*) **sia** come arma naturale (quindi si applica *zanna magica*). Progressione del danno per livello e taglia del monaco — tabella in JSON.
- **Colpo ki (Sop)** — i colpi senz'armi contano come **magici** (a seconda del livello in JSON), poi come **legali**, poi come **adamantini** ai fini di superare la RD.
- **Eludere (Str)** — nessun danno con un tiro salvezza sui Riflessi riuscito contro un attacco che permette i Riflessi per metà danno. Solo con armatura leggera o nessuna.
- **Movimento veloce (Str)** — `+X m` alla velocità base quando non è in armatura e non è ingombrato (scala per JSON).
- **Mente lucida (Str)** — `+2` ai tiri salvezza contro l'ammaliamento.
- **Caduta lenta (Str)** — quando cade a portata di braccio da una parete, tratta la caduta come se fosse X m più corta. Alla fine qualsiasi altezza con una parete vicina.
- **Purezza del corpo (Str)** — immune a tutte le malattie non magiche (cioè comuni).
- **Integrità del corpo (Sop)** — cura sé stesso di `2 × livello da monaco` punti ferita al giorno, distribuibili.
- **Eludere migliorato (Str)** — anche con un Riflessi fallito, subisce metà danno (ancora nessun danno con successo).
- **Corpo adamantino (Str)** — immunità a tutti i veleni.
- **Passo abbondante (Mag)** — *porta dimensionale* 1/giorno, livello dell'incantatore = ½ livello da monaco.
- **Anima adamantina (Str)** — resistenza agli incantesimi = `livello da monaco + 10`.
- **Palmo tremante (Sop)** — una volta a settimana, dichiara un bersaglio prima di effettuare un attacco senz'armi. Se colpisce, il bersaglio deve tirare Tempra (CD `10 + ½ livello da monaco + modificatore di Saggezza`) o morire in un momento a scelta del monaco entro `1 giorno per livello da monaco`. Immuni: costrutti, melme, vegetali, non morti, incorporei, chiunque sia immune al tiro salvezza sulla Volontà rispetto ai DV del monaco.
- **Corpo senza tempo (Str)** — nessuna penalità di invecchiamento.
- **Lingua del sole e della luna (Str)** — parla con qualsiasi creatura vivente.
- **Corpo vuoto (Sop)** — diventa etereo `1 round per livello da monaco / giorno`, divisibile.
- **Perfezione interiore** — il tipo diventa **Esterno**; RD 10/magico.
- **Allineamento** — solo Legale.
- **Restrizione di multiclasse** — una volta che il monaco prende un livello in un'altra classe, **non può mai più avanzare come monaco** (i livelli e le capacità esistenti sono mantenuti).

## Paladino

- **Aura di bene (Str)** — come un chierico del livello del paladino, aura *buona*.
- **Individuazione del male (Mag)** — a volontà.
- **Punire il male (Sop)** — `1 + un uso ogni 5 livelli` al giorno. Dichiarato su un attacco: aggiunge il **modificatore di Carisma** all'attacco e aggiunge il **livello da paladino** ai danni se il bersaglio è malvagio. Sprecato su un mancato o su un bersaglio non malvagio.
- **Grazia divina (Sop)** — aggiunge il **modificatore di Carisma** a **tutti** i tiri salvezza.
- **Imposizione delle mani (Sop)** — riserva giornaliera di punti ferita = `livello da paladino × modificatore di Carisma`, distribuibile a qualsiasi bersaglio consenziente come azione standard tramite il tocco. Ogni uso è "spendere N punti per curare N pf." In alternativa, usato come attacco di contatto contro una creatura non morta per infliggere altrettanti pf di danno (nessun tiro salvezza).
- **Aura di coraggio (Sop)** — il paladino è immune alla paura; gli alleati entro 3 m ottengono `+4` morale contro la paura. Soppressa mentre il paladino è privo di sensi o morto.
- **Salute divina (Str)** — immune a tutte le malattie, magiche e comuni.
- **Scacciare non morti (Sop)** — come un chierico di `livello da paladino − 3` (quindi inizia al livello 4 da paladino con livello effettivo di scacciata 1). Basato su Carisma. Vedi il sottosistema *Scacciare non morti*.
- **Cavalcatura speciale (Mag)** — vedi il sottosistema *Cavalcatura speciale* sotto.
- **Curare malattie (Mag)** — scala da 1/settimana con usi extra ai livelli superiori.
- **Lanciare incantesimi** — divini, **basati su Saggezza**, **preparati**. Inizia al 4° livello di classe. Saggezza minima 11 per lanciare incantesimi di 1° livello (la regola di [magic.md](magic.md) si applica comunque). Livello dell'incantatore = `arrotonda per difetto(livello da paladino / 2)`. Il paladino non ha accesso ai domini.
- **Allineamento** — solo Legale Buono. **Codice di condotta**: agire con onore, non mentire, non imbrogliare, rispettare l'autorità legittima, punire chi minaccia gli innocenti, aiutare chi è nel bisogno. Alleati: solo seguaci legali buoni; può avventurarsi con alleati non malvagi a breve termine.
- **Ex-paladino** — qualsiasi atto volontariamente malvagio o grave violazione del codice → **perde tutti i privilegi di classe da paladino** (incantesimi, punire, imposizione delle mani, aura, cavalcatura, ecc.) finché non ottiene *espiazione*. Mantiene le competenze con armi/armature.
- **Restrizione di multiclasse** — una volta che il paladino prende un livello in un'altra classe, **non può mai più avanzare come paladino**.

## Ranger

- **Nemico prescelto (Str)** — al 1° livello, sceglie un tipo/sottotipo di creatura dalla lista dei nemici prescelti. Ottiene `+2` alle prove di Raggirare, Ascoltare, Percepire Intenzioni, Osservare, Sopravvivenza contro quella creatura, e `+2` ai danni con armi contro quella creatura. Nemici aggiuntivi scelti a ogni livello indicato in JSON; ad ogni nuova scelta, il ranger può invece **potenziare un nemico prescelto esistente di +2**. Umanoidi ed esterni richiedono di scegliere un sottotipo.
- **Seguire tracce** — talento Traccia concesso gratuitamente al L1.
- **Empatia selvatica** — stessa meccanica del druido (`d20 + livello da ranger + modificatore di Carisma`).
- **Stile di combattimento (Str)** — al L2, sceglie **combattere con due armi** *o* **tiro con l'arco**. Il ranger ottiene un talento bonus gratuito adatto allo stile, **ignorando tutti i prerequisiti**. Benefici solo con armatura leggera o nessuna. Lo stile è permanente.
  - Percorso a due armi: gratuito *Combattere con Due Armi*; poi *Combattere con Due Armi Migliorato* (miglioramento dello stile) e *Combattere con Due Armi Superiore* (padronanza).
  - Percorso con l'arco: gratuito *Tiro Rapido*; poi *Tiro Multiplo* e *Tiro Preciso Migliorato*.
- **Resistenza** — talento bonus al L3.
- **Compagno animale (Str)** — vedi sottosistema. Il ranger usa le meccaniche del druido ma a **metà livello da ranger** (quindi idoneo per la prima volta al L4 da ranger → compagno effettivo da druido L2).
- **Lanciare incantesimi** — divini, **basati su Saggezza**, preparati. Inizia al L4. Livello dell'incantatore = `½ livello da ranger`. Saggezza minima 11.
- **Passo silvano** — come quello del druido, ottenuto più tardi.
- **Inseguitore rapido (Str)** — velocità piena normale mentre segue tracce (`−10` alla prova di Sopravvivenza invece del normale `−20` a velocità piena; velocità doppia a `−20` invece del normale `−40`).
- **Eludere (Str)** — come quello del monaco; solo con armatura leggera o nessuna.
- **Padronanza dello stile di combattimento (Str)** — talento bonus aggiuntivo nello stile scelto, prerequisiti ignorati, efficace solo con armatura leggera/nessuna.
- **Mimetismo (Str)** — può usare Nascondersi in qualsiasi terreno naturale anche quando non offre copertura/occultamento.
- **Nascondersi in piena vista (Str)** — può usare Nascondersi in terreno naturale anche mentre è osservato.

## Ladro

- **Attacco furtivo (Str)** — danno extra `+1d6` al L1, `+1d6` ogni **2** livelli da ladro (max +10d6 al L19). Si attiva quando **una qualsiasi** delle condizioni:
  - Al bersaglio è **negato il bonus di Destrezza alla CA** (colto alla sprovvista, sorpreso, immobilizzato, ecc.).
  - Il ladro sta **attaccando ai fianchi** il bersaglio.
  - A distanza: il bersaglio deve trovarsi entro **9 m**.
  - Condizioni:
    - **I dadi dell'attacco furtivo NON sono moltiplicati su un critico**, ma *si applicano* comunque su un colpo critico (aggiunti una volta sopra il danno base moltiplicato).
    - Il bersaglio deve avere un'anatomia vitale distinguibile: **immuni** = melme, vegetali, non morti, costrutti, incorporei, chiunque sia immune ai colpi critici.
    - L'**occultamento** di qualsiasi grado nega l'attacco furtivo.
    - Si può scegliere il danno non letale dall'attacco furtivo **senza penalità** usando un manganello; con un'arma letale, si applica la normale `−4` per il danno non letale.
    - Non si può eseguire un attacco furtivo su un bersaglio le cui parti vitali sono fuori portata.
- **Scoprire trappole (Str)** — può usare **Cercare** per trovare trappole con CD > 20 (gli altri non possono). Può usare Disattivare Congegni per disarmare trappole magiche (CD = `25 + livello dell'incantesimo`).
- **Eludere (Str)** — vedi quello del monaco, stessa regola.
- **Percepire trappole (Str)** — `+1` ai Riflessi contro le trappole e `+1` di schivare alla CA contro gli attacchi delle trappole, in scala. Si cumula tra le classi con percepire trappole.
- **Schivare prodigioso (Str)** — come quello del barbaro.
- **Schivare prodigioso migliorato (Str)** — come quello del barbaro.
- **Eludere migliorato** — solo se scelto come capacità speciale.
- **Capacità speciali** — al L10 e ogni 3 livelli successivi (L13, 16, 19), sceglie **una**:
  - **Colpo menomante (Str)** — gli attacchi furtivi infliggono anche 2 danni alla Forza.
  - **Attutire il colpo (Str)** — 1/giorno, quando viene ridotto a ≤0 pf da un colpo in mischia, tenta un tiro salvezza sui Riflessi contro il danno; successo → metà danno. La negazione dell'azione standard non lo impedisce (non è un attacco), ma la perdita del bonus di Destrezza sì.
  - **Eludere migliorato (Str)**.
  - **Opportunismo (Str)** — 1/round, attacco di opportunità contro una creatura appena danneggiata da un alleato.
  - **Padronanza dell'abilità** — sceglie `3 + modificatore di Intelligenza` abilità; può sempre **prendere 10** su di esse anche sotto stress.
  - **Mente sfuggente (Str)** — se colpito da un ammaliamento e il tiro salvezza fallisce, può tentare un secondo tiro salvezza 1 round dopo.
  - **Un talento** invece di una capacità speciale.

## Stregone

- **Lanciare incantesimi** — arcani, **basati su Carisma**, **spontanei**. Livello massimo di incantesimo 9. La progressione degli incantesimi conosciuti è fissa secondo la tabella di classe (non dipende dal Carisma); gli *slot* bonus al giorno derivano dal Carisma.
- **Preparazione degli incantesimi** — nessuna. Lancia qualsiasi incantesimo conosciuto usando qualsiasi slot disponibile del livello appropriato.
- **Scambio al salire di livello** — al L4 e ogni livello pari successivo (L6, L8, …), può **dimenticare un incantesimo conosciuto e sostituirlo** con un altro di livello uguale o inferiore.
- **Famiglio** — al L1, vedi il sottosistema *Famiglio*.
- **Armatura e lancio arcano** — nessuna competenza con alcuna armatura; l'armatura provoca la percentuale di fallimento delle formule arcane per gli incantesimi da stregone.

## Mago

- **Lanciare incantesimi** — arcani, **basati su Intelligenza**, **preparati dal libro degli incantesimi**. Livello massimo di incantesimo 9.
- **Scrivere Pergamene** — talento bonus al L1.
- **Talenti bonus** — al L5, 10, 15, 20, sceglie un talento tra: metamagia, creazione di oggetti, o *Maestria negli Incantesimi*. Deve soddisfare i prerequisiti.
- **Famiglio** — al L1, stesso sottosistema dello stregone.
- **Specializzazione di scuola** — al L1, sceglie *universalista* (nessuna specialità) oppure una singola scuola di magia. Vedi il sottosistema *Specializzazione di scuola*.
- **Libro degli incantesimi** — vedi [magic.md](magic.md).
- **Armatura e lancio arcano** — nessuna competenza con l'armatura; la percentuale di fallimento delle formule arcane si applica normalmente.

---

## Famiglio (sottosistema di stregone / mago)

> Meccaniche complete, la tabella di avanzamento (armatura naturale / Intelligenza / capacità speciali) e la lista delle creature da famiglio con i bonus per specie vivono in **[familiar.md](familiar.md)**. Qui solo un riepilogo.

- Costa **24 ore + 100 mo**. Un famiglio è un animale normale che **diventa una bestia magica** quando evocato; mantiene i DV, il BAB, i tiri salvezza, le abilità e i talenti del suo animale di base ma è trattato come una bestia magica ai fini degli effetti mirati per tipo. (Da contrapporre al **compagno animale**, che mantiene il proprio tipo animale.) Un solo famiglio alla volta, anche tra classi che concedono famigli (i loro livelli **si cumulano** ai fini delle capacità).
- **Statistiche derivate** — DV = max(livello del padrone, DV naturali del famiglio); pf = **½ dei pf del padrone** (arrotondato per difetto, nessun pf temporaneo); BAB = BAB del padrone; l'attacco in mischia usa il più alto tra Forza/Destrezza del famiglio; tiri salvezza = il migliore tra quelli base del padrone o del famiglio (Tempra +2/Riflessi +2/Volontà +0), usando i modificatori di caratteristica propri del famiglio; abilità = il migliore tra i gradi del padrone o quelli dell'animale, usando i modificatori di caratteristica del famiglio.
- **Avanzamento per livello del padrone** — migliora **l'adeguamento all'armatura naturale** (+1 → +10) e l'**Intelligenza** (6 → 15), più capacità speciali cumulative: Vigilanza, eludere migliorato, condividere incantesimi, legame empatico (L1); consegnare incantesimi a contatto (L3); parlare con il padrone (L5); parlare con animali della propria specie (L7); resistenza agli incantesimi = padrone +5 (L11); *scrutare il famiglio* 1/giorno (L13).
- **Bonus per specie** — ogni tipo di famiglio concede un bonus fisso al padrone (es. corvo → +3 Valutare; donnola → +2 tiri salvezza sui Riflessi; rospo → +3 pf). Statistiche base in [src/data/animals.json](../../src/data/animals.json).
- **Penalità per la perdita** — se il famiglio muore o viene congedato, il padrone tenta un tiro salvezza sulla **Tempra CD 15** o perde **200 PE per livello di classe del padrone** (metà con successo); mai sotto 0 PE, mai un livello perso. Un famiglio ucciso/congedato **non può essere sostituito per un anno e un giorno**; uno ucciso può essere *riportato in vita* normalmente senza perdita di livello/Costituzione.

## Compagno animale (sottosistema di druido / ranger)

> Meccaniche complete, la tabella di avanzamento e le liste di creature alternative vivono in **[animal-companion.md](animal-companion.md)**. Qui solo un riepilogo.

- Scelto da una lista fissa di creature base (statistiche in [src/data/animals.json](../../src/data/animals.json)). Il compagno **mantiene il proprio tipo** (animale/dinosauro) — **non** diventa una bestia magica.
- Migliora per **livello effettivo** = livello da druido, oppure **½ livello da ranger** (il ranger ne ottiene uno per la prima volta al L4 da ranger → effettivo 2). I livelli delle classi che concedono un compagno si cumulano.
- **Adeguamenti per livello** (cumulativi): DV bonus (d8 ciascuno, +modificatore di Costituzione; alza il BAB e i tiri salvezza buoni su Tempra/Riflessi sul totale DV), armatura naturale bonus, +Forza/+Destrezza, **trucchi bonus** oltre il limite di Addestrare Animali, e **capacità speciali** — Legame, Condividere Incantesimi (L1), Eludere (L3), Devozione (L6), Attacchi Multipli (L9), Eludere Migliorato (L15).
- **Liste alternative** — un personaggio di livello più alto può scegliere una creatura più forte applicando un adeguamento di livello (es. un leopardo dalla lista L4 conta come livello effettivo `attuale − 3`); se questo porta il livello effettivo sotto 1, non può essere scelto.
- **Sostituzione** — rituale di 24 ore dopo aver perso un compagno (morte o rilascio).

## Cavalcatura speciale (sottosistema del paladino)

- Concessa al L5. Cavalcatura standard: cavallo da guerra pesante per un paladino Medio; pony da guerra per un paladino Piccolo. Il DM può approvare sostituzioni (es. uno squalo da cavalcatura per un paladino acquatico).
- La cavalcatura è una **bestia magica**, non un animale normale.
- **Adeguamenti per livello**: DV bonus (d10), armatura naturale bonus, +Forza, **progressione di Intelligenza** (la cavalcatura diventa intelligente e può comunicare empaticamente con il paladino).
- **Capacità speciali** per livello del paladino: condividere incantesimi (L5), condividere tiri salvezza (la cavalcatura usa i tiri salvezza del paladino se migliori), eludere migliorato, legame empatico (1,5 km); più tardi: bonus di velocità, *comandare* la propria specie come capacità magica, resistenza agli incantesimi.
- **Evocazione** — azione di round completo, la cavalcatura appare per **2 ore per livello da paladino / giorno**; può essere congedata/richiamata; appare ovunque entro la vista.
- **Morte** — se la cavalcatura muore, il paladino attende **30 giorni** OPPURE **ottiene un livello da paladino** per rievocarla, subendo `−1` all'attacco e ai danni nel frattempo. Una cavalcatura rievocata è lo stesso individuo riportato in vita.

## Forma selvatica (sottosistema del druido)

- Capacità **Sop**; azione standard per cambiare; *non* provoca attacchi di opportunità. Dura `1 ora per livello da druido` o finché non termina.
- **Vincoli di forma** (si sbloccano a livelli di druido progressivamente più alti, per JSON):
  - Iniziale: animale di taglia Piccola o Media.
  - Più tardi: aggiunte le taglie Grande, Minuscola, Enorme.
  - Più tardi: creature vegetali (immuni a effetti mentali, paralisi, metamorfosi, sonno, stordimento in molti casi).
  - Più tardi: elementali (Piccolo/Medio/Grande/Enorme con usi al giorno separati).
- DV massimi della forma assunta = livello da druido.
- Il druido deve aver visto personalmente quel tipo di animale.
- **Meccaniche del cambiamento** — usa le sotto-regole di *metamorfosi*:
  - **Forza/Destrezza/Costituzione diventano quelle della forma**; Intelligenza/Saggezza/Carisma restano quelle del druido. Classe, livello, **punti ferita**, BAB e tiri salvezza base sono tutti mantenuti — cambiano solo i modificatori di caratteristica sovrapposti ad essi.
  - Ottiene gli attacchi naturali, l'armatura naturale, la taglia e le modalità di movimento della forma — ma **non** le sue *qualità* straordinarie speciali (fiuto, scorgere nel buio) né alcuna capacità Sop/Mag. Dettagli completi in [magic.md](magic.md) → Sotto-regole di metamorfosi.
  - **Ogni uso ripristina i pf come se si fosse riposato per una notte** (`1 pf per livello di personaggio`). Tornare alla forma normale non cura nulla.
  - Non può lanciare incantesimi: il druido perde la parola in forma animale, quindi le componenti verbali falliscono. Il talento **Incantesimi Naturali** rimuove questa restrizione. Le capacità soprannaturali e magiche di classe restano utilizzabili tranne dove la forma lo impedisce.
  - L'equipaggiamento si fonde nella forma e diventa non funzionante — l'armatura indossata smette di contribuire alla CA, le armi impugnate smettono di essere utilizzabili. Riappare intatto al ritorno alla forma normale.
- Gli **usi al giorno** progrediscono per livello; tornare alla forma normale è gratuito e non consuma un uso.
- Le forme elementali (16° livello+) sono l'eccezione alla regola "niente Sop/Mag": il druido **ottiene** le capacità straordinarie, soprannaturali e magiche dell'elementale e i suoi talenti, pur mantenendo il proprio tipo di creatura.

## Scacciare / intimorire non morti (sottosistema di chierico / paladino)

- **Azione standard**, usa tentativi basati sul modificatore di Carisma al giorno = `3 + modificatore di Carisma`. Il livello effettivo di scacciata del paladino = `livello da paladino − 3` (inizia a funzionare al livello 4 da paladino). Usi bonus dal talento Scacciata Superiore.
- Capacità soprannaturale — **non** provoca un attacco di opportunità. Il chierico deve brandire il proprio simbolo sacro (gratuito); i paladini usano un simbolo sacro o semplicemente si presentano.
- Colpisce i non morti entro **18 m (12 quadretti)**, linea di vista, linea di effetto (linea di effetto verso tutti i bersagli).
- **Risoluzione**:
  1. **Prova di scacciata** — `d20 + modificatore di Carisma` → si consulta una tabella fissa per trovare il *DV più alto* di non morti colpiti.
  2. **Danno di scacciata** — `2d6 + livello da chierico + modificatore di Carisma` DV totali di non morti sono colpiti, iniziando dal più vicino e con DV più basso. Saltare non morti più potenti nelle vicinanze è permesso; il resto è sprecato se non restano abbastanza DV per colpire il successivo.
- I **non morti colpiti (scacciati)** fuggono a velocità piena per `10 round`. **Si acquattano** se messi all'angolo. Avvicinarsi entro **3 m (2 quadretti)** di un non morto scacciato, OPPURE attaccarlo in mischia, **interrompe** l'effetto per quella creatura. Gli attacchi a distanza o restare a ≥ 3 m di distanza **non** lo interrompono.
- **Distruzione** — un chierico il cui livello effettivo di scacciata è **≥ 2× i DV del non morto** lo distrugge invece di scacciarlo.
- **Chierico malvagio** — **intimorisce** (intimoriti, +2 agli attacchi contro di loro mentre sono intimoriti, dura 10 round) invece di scacciare; può **comandare** invece di distruggere (controllo mentale: azione standard per dare un comando mentale di un'azione; DV totali comandati contemporaneamente ≤ livello da chierico; può rilasciarne alcuni per comandarne altri).
- Il **chierico neutrale** sceglie scacciare o intimorire al 1° livello, permanente.
- Alcune divinità specialistiche invertono questo per i loro chierici (es. i chierici neutrali buoni di Wee Jas intimoriscono; i chierici legali buoni di San Cuthbert intimoriscono; i chierici di Obad-Hai scacciano).
- **Annullare la scacciata** (chierico malvagio contro la scacciata di uno buono, o viceversa) — effettua una prova di scacciata; se supera il risultato di scacciata originale, i non morti colpiti sono liberati dall'effetto. Il chierico che annulla può quindi intimorire/comandare con `2d6 + livello + Carisma` DV.
- **Rinforzare i non morti** (chierico malvagio, azione di round completo) — sceglie un non morto bersaglio; il risultato della prova di scacciata si aggiunge ai DV effettivi del bersaglio contro futuri tentativi di scacciata per **10 round**.

## Specializzazione di scuola (sottosistema del mago)

Vedi [magic.md](magic.md) per la lista completa delle scuole di magia e le regole dello specialista.

---

## Riferimenti incrociati

- [classes.md](classes.md) — sistema delle classi (DV, BAB, tiri salvezza, punti abilità).
- [magic.md](magic.md) — scuole, preparati contro spontanei, libro degli incantesimi, preparazione degli incantesimi, minimi per lanciare.
- [multiclassing.md](multiclassing.md) — restrizione a senso unico di monaco e paladino.
- [combat.md](combat.md) — attaccare ai fianchi, Destrezza negata, colto alla sprovvista, attacchi di opportunità.
- [feats.md](feats.md) — talenti bonus concessi dai privilegi di classe.
- [src/data/classes.json](../../src/data/classes.json) — dati numerici per classe.

## Fonti

- Manuale del Giocatore — pp. 24–57
