# Abilità — Dettaglio per Singola Abilità

> CD, tipi di azione, regole di ritentare e meccaniche specifiche per singola abilità. Salta tutto ciò che è già catturato da [src/data/skills.json](../../src/data/skills.json) (caratteristica chiave, solo con addestramento, contrassegno penalità di armatura, mappa classe/fuori classe, tabella delle sinergie). Le regole a livello di sistema vivono in [skills.md](skills.md).

Ogni sezione elenca solo ciò che il JSON non cattura: le *azioni* che un'abilità permette, le loro CD, il tempo dell'azione, la regola di ritentare quando differisce da quella predefinita, e qualsiasi meccanica insolita.

---

## Acrobazia (Tumble)

| Azione | CD |
|---|---|
| Trattare una caduta come 3 m più corta ai fini del danno | 15 |
| Fare capriole a metà velocità oltre i nemici senza provocare attacchi di opportunità | 15 (+2 per ogni nemico oltre il primo) |
| Fare capriole a metà velocità *attraverso* il quadretto di un nemico | 25 (+2 per ogni nemico oltre il primo) |

- Modificatori di superficie (cumulativi): leggermente ingombra/leggermente scivolosa +2; molto ingombra o bagnata +5; molto scivolosa +5; inclinata/angolata +2.
- Non si può fare Acrobazia in fango profondo/acqua profonda (impossibile).
- **Accelerata**: `−10` per fare capriole a velocità piena.
- **Azione**: parte del movimento; nessuna azione extra.
- **Ritentare**: di solito no (per tentativo).
- **Speciale**: 5+ gradi → il bonus alla CA di Combattere sulla Difensiva diventa +3 (da +2); il bonus di Difesa Totale diventa +6 (da +4). Il talento Acrobatico → +2 di sinergia a questa abilità.

## Addestrare Animali (Handle Animal)

| Azione | CD |
|---|---|
| Gestire un animale con un comando conosciuto | 10 |
| "Spingere" un animale (compito sconosciuto una tantum) | 25 |
| Insegnare un comando | 15 |
| Addestrare per uno scopo generale | 15 |
| Domare un animale selvatico | 15 + DV dell'animale |

- Un animale addestrato conosce fino a `Int × ?` comandi (Int 1: 3 comandi; Int 2: 6 comandi).
- Scopi generici: cavalcatura da combattimento (CD 20), combattimento (CD 20), guardia (CD 20), lavoro pesante (CD 15), esibizione (CD 15), cavalcatura (CD 15), caccia (CD 20).
- Tempo di addestramento: settimane per scopo (per JSON o tabella delle regole).
- Animale ferito: CD +2.
- **Senza addestramento**: si può usare una prova di Carisma solo per gestire/spingere.
- **Sinergia**: 5 gradi → +2 a Cavalcare e alla prova di classe di empatia selvatica.

## Artigianato (Craft)

- Abilità separata per ogni tipo di manufatto (alchimia, armature, armi, ecc.).
- **Paga/materiale**: il prezzo di mercato dell'oggetto determina il costo in tempo/materiali; i materiali grezzi costano ⅓ del prezzo di mercato.
- **Progresso settimanale**: ogni settimana, tirare Artigianato; `risultato × CD` in pezzi d'argento di progresso. Se `risultato × CD ≥ prezzo (in ma)`, l'oggetto è completo. Se supera 2× o 3× il prezzo, si completa in ½ o ⅓ del tempo.
- **Opzione di progresso giornaliero**: stessa formula, ma giornaliera (prezzo tracciato in pezzi di rame, `mr` = 1/10 di ma).
- **Prova fallita**: di 5+, metà dei materiali grezzi sprecati (devono essere ripagati per metà).
- **Accelerazione**: +10 volontario alla CD per un lavoro più veloce.
- **Oggetto perfetto**: costruire un componente perfetto separato (CD 20, prezzo 300 mo arma / 150 mo armatura o scudo); il progresso del componente è tracciato separatamente, poi unito.
- **Riparazione**: tempo di riparazione = come l'originale; costo = ⅕ del prezzo.
- **Alchimia** (Artigianato): richiede di essere un incantatore.
- **Azione**: a settimana o a giorno, non a round.
- **Ritentare**: sì, in caso di fallimento parziale; il fallimento totale ripaga di nuovo metà dei materiali.

## Artista della Fuga (Escape Artist)

| Azione | CD |
|---|---|
| Legature di corda | prova di Utilizzare Corde di chi lega `+10` |
| Rete, *animare corde*, *comandare piante*, *controllare piante*, *groviglio* | 20 |
| Incantesimo laccio | 23 |
| Manette | 30 |
| Spazio stretto | 30 |
| Manette perfette | 35 |
| Lotta dell'avversario | prova di lotta opposta |

- **Azione**: 1 minuto (la maggior parte); 1 round (corda o lotta). ≥1 minuto attraverso uno spazio stretto.
- **Ritentare**: attraverso uno spazio stretto — sì (oppure si può *prendere 20* se non in pericolo). Con corda/manette — sì se non danneggiato dal fallimento.
- **Sinergia**: 5 gradi in Utilizzare Corde → +2 qui (contro le corde). 5 gradi qui → +2 a Utilizzare Corde per legare qualcuno.

## Ascoltare (Listen)

| Suono | CD |
|---|---|
| Battaglia | −10 |
| Persone che parlano | 0 |
| Persona in armatura che cammina lentamente | 5 |
| Ostile in armatura pesante | 10 |
| Creatura di 1° livello che usa Muoversi Silenziosamente | 15 |
| Sussurrare | 15 |
| Gatto in agguato | 19 |
| Gufo che plana | 30 |

- Penalità di distanza: `−1` ogni 3 m.
- Porta: +5 (legno); +15 (muro di pietra).
- Contro un bersaglio che usa Muoversi Silenziosamente: usare il risultato opposto di Muoversi Silenziosamente invece della CD fissa.
- **Azione**: reattiva (gratuita) o azione di movimento per concentrarsi. Si può riascoltare come azione di movimento.
- **Ritentare**: sì (a meno che la circostanza lo impedisca).
- **Speciale**: mezzelfi +1 razziale; elfi/gnomi/halfling +2 razziale; il talento *Attenzione* → +2; vittima affascinata: −4; ascoltatore addormentato: −10 (il successo lo sveglia); ranger contro nemico prescelto: bonus.

## Camuffare (Disguise)

- Lo sforzo produce un travestimento; opposto dall'**Osservare dell'osservatore**.
- Modificatori alla prova di Camuffare: solo dettagli minori `+5`; genere diverso `−2`; razza diversa `−2`; categoria di età diversa `−2` per ogni livello.
- Bonus a Osservare in base alla familiarità: riconoscimento `+4`; amico `+6`; amico intimo `+8`; intimo `+10`.
- Ogni osservatore effettua una prova di Osservare separata; travestimento di gruppo: media di Osservare.
- **Azione**: 1d3 × 10 minuti per applicarlo.
- **Ritentare**: sì, ma gli osservatori successivi sanno che è stato tentato.
- **Speciale**: gli incantesimi *alterare se stesso*, *travestimento personale*, *metamorfosi* concedono `+10`; impersonare una persona specifica tramite *travestimento personale* dà `+10`; il talento Persuasivo: bonus.
- **Sinergia**: 5 gradi Raggirare → +2 qui quando si recita/impersona.

## Cavalcare (Ride)

| Azione | CD |
|---|---|
| Guidare con le ginocchia | 5 |
| Restare in sella (se scossi) | 5 |
| Combattere da un cavallo da guerra | 10 |
| Riparo dietro la cavalcatura | 15 |
| Caduta morbida | 15 |
| Saltare con la cavalcatura | 15 |
| Spronare la cavalcatura (velocità extra) | 15 |
| Controllare una cavalcatura non addestrata al combattimento in battaglia | 20 |
| Montare/smontare velocemente | 20 (si applica la penalità di armatura) |

- Si applica la penalità di armatura.
- Sella militare: +2 di circostanza a Cavalcare per restare in sella.
- Azione: reazioni istantanee (nessuna azione) per la maggior parte degli usi difensivi; standard per montare/smontare velocemente.
- Prerequisito per diversi talenti di combattimento a cavallo.

## Cercare (Search)

- CD per compito:
  - Trovare un oggetto in uno spazio ingombro: **10**.
  - Notare una tipica porta segreta: **20**.
  - Trovare una trappola non magica difficile (solo ladri sopra CD 20): **21+**.
  - Trovare una trappola magica (solo ladri): **25 + livello dell'incantesimo**.
  - Notare una porta segreta ben nascosta: **30**.
  - Trovare un'impronta: varia.
- **Raggio**: bisogna trovarsi entro 1,5 m dall'oggetto/superficie.
- **Azione**: 1 round completo per area di 1,5 m × 1,5 m o 1,5 m³ di oggetti.
- **Vincolo di scoprire trappole**: solo i ladri (e altri con il privilegio di classe *scoprire trappole*) possono usare Cercare per trovare trappole con CD > 20. Le trappole in pietra con CD > 20 possono essere trovate anche dai nani (scoprire trappole razziale ridotto).
- **Speciale**: gli elfi ottengono passivamente una prova di Cercare quando entro 1,5 m da una porta segreta/nascosta senza cercare attivamente; lo stesso per i mezzelfi con `+1`.
- Il talento *Investigatore* → +2 qui; 5 gradi Conoscenze (architettura) → +2 qui per la ricerca di porte/vani segreti; 5 gradi qui → +2 a Sopravvivenza (tracciare).

## Concentrazione (Concentration)

- La CD dipende dalla distrazione:
  - Danneggiato durante l'azione: **10 + danno subito**.
  - Danno da fonte continua: **10 + ½ del danno nel round**.
  - Distratto da un incantesimo: **CD del tiro salvezza dell'incantesimo** (o il suo livello dell'incantatore se non c'è tiro salvezza).
  - Movimento vigoroso (galoppo, barca a scossoni): **10**.
  - Movimento violento (carro in corsa, piccola barca in rapide): **15**.
  - Estremamente violento (terremoto): **20**.
  - Intralciato: **15**.
  - In lotta / immobilizzato: **20** (solo incantesimi senza componenti somatiche/materiali).
  - Maltempo — vento forte + pioggia battente: **5**.
  - Maltempo — vento con grandine/detriti: **10**.
- **Azione**: non è un'azione a sé; viene tirata come parte dell'azione che viene interrotta.
- **Fallimento**: l'incantesimo/azione fallisce; lo slot dell'incantesimo è perso.
- **Casi d'uso**: mantenere il lancio incantesimi attraverso una distrazione; lanciare sulla difensiva per evitare un attacco di opportunità (CD 15 + livello dell'incantesimo — successo = nessun attacco di opportunità); mantenere la concentrazione su un incantesimo attivo.
- **Speciale**: il talento *Lancio in Combattimento* → +4 qui quando si lancia sulla difensiva o mentre si è in lotta.

## Conoscenze (Knowledge)

- Ogni campo di Conoscenze è un'**abilità separata**: arcane, architettura/ingegneria, viaggi sotterranei, geografia, locali, natura, nobiltà/regalità, piani, religione, storia (10 campi in totale).
- CD per domanda: semplice/comune 10; più difficile 15; davvero ostica 20–30.
- Identificare le capacità speciali di un mostro: CD = `10 + DV del mostro`; ogni +5 oltre la CD, un'informazione in più.
- **Senza addestramento**: qualsiasi sapienza *comune* è CD ≤ 10 e utilizzabile senza addestramento come prova di Intelligenza.
- **Azione**: di solito nessuna (richiamo mentale istantaneo).
- **Ritentare**: no.
- **Sinergie (in uscita)**: ogni campo di Conoscenze a 5+ gradi dà +2 a una specifica altra prova — lista completa in skills.json. Esempi: arcane → Sapienza Magica; viaggi sotterranei → Sopravvivenza sottoterra; geografia → Sopravvivenza per non perdersi; locali → Raccogliere Informazioni; natura → Sopravvivenza all'aperto; nobiltà → Diplomazia; piani → Sopravvivenza su altri piani; religione → scacciare non morti; storia → Conoscenze bardiche; architettura → Cercare porte segrete.

## Decifrare Scritture (Decipher Script)

- CD base: testo semplice **20**; testo standard **25**; testo oscuro/antico **30**.
- Su un successo: comprendere il senso generale di una pagina (o equivalente) di testo.
- Su un fallimento di ≤4: il DM tira una prova di Saggezza; con un risultato di Saggezza basso, il personaggio crede in un'interpretazione sbagliata. La prova viene effettuata *segretamente*.
- **Azione**: 1 minuto (10 azioni di round completo) a pagina.
- **Ritentare**: no.
- **Sinergia**: 5 gradi → +2 a Utilizzare Oggetti Magici sulle pergamene.

## Diplomazia (Diplomacy)

- Influenza l'atteggiamento di un PNG. Categorie: Ostile → Ostile Diffidente → Indifferente → Amichevole → Servizievole.
- La CD dipende dall'**atteggiamento attuale del bersaglio** e dall'**atteggiamento desiderato** — vedi la tabella di influenza nella fonte: 5 (passare da Diffidente a Indifferente) fino a 50 (passare da Ostile a Servizievole).
- Effetto della durata: il PNG resta al nuovo atteggiamento finché il personaggio è presente, poi per 1d6 × 10 minuti dopo; poi si assesta tornando verso il proprio atteggiamento base.
- **Azione**: 1 minuto di conversazione. Affrettata: azione standard con `−10`.
- **Ritentare**: sconsigliato — tentativi aggiuntivi sullo stesso PNG non aiutano (a meno che le circostanze non cambino).
- **Sinergie (in entrata)**: 5 gradi Raggirare / Conoscenze (nobiltà e regalità) / Percepire Intenzioni → +2 ciascuno.

## Disattivare Congegni (Disable Device)

| Difficoltà | Tempo | CD |
|---|---|---|
| Semplice | 1 round | 10 |
| Complicato | 1d4 round | 15 |
| Difficile | 2d4 round | 20 |
| Perfido | 2d4 round | 25 |
| Trappola magica | 2d4 round | **25 + livello dell'incantesimo** |
| Non lasciare tracce | — | +5 alla CD |

- **Fallimento di 4 o meno**: si può ritentare, ma si sa che è fallito.
- **Fallimento di 5+**: la trappola scatta / il danno è fatto.
- **Truccare un oggetto per farlo fallire più tardi**: possibile (es. una sella che si rompe dopo un po' di tempo).
- **Vincolo di scoprire trappole**: solo i ladri (e chi possiede scoprire trappole) possono disattivare trappole magiche e trappole con CD>20 (con il privilegio di classe *scoprire trappole*).
- **Azione**: per tabella sopra.
- **Speciale**: attrezzi da scasso (perfetti): +2 di circostanza; senza attrezzi (improvvisati): `−2`. Il talento *Dita Agili* → +2.

## Equilibrio (Balance)

| Superficie | CD |
|---|---|
| Larga (16–30 cm) | 10 |
| Media (5–15 cm) | 15 |
| Stretta (< 5 cm) | 20 |

- Modificatori di superficie: leggermente ostruita +2; molto ostruita +5; leggermente scivolosa +2; molto scivolosa +5; inclinata +2.
- Fallimento ≤4: non ci si può muovere quel round. Fallimento ≥5: cadere (tiro salvezza sui Riflessi CD=5 per aggrapparsi al bordo).
- Perde il bonus di Destrezza alla CA mentre è in equilibrio; 5+ gradi → non è considerato sbilanciato (mantiene la Destrezza).
- **Accelerata**: `−5` per muoversi a velocità piena (serve una prova di Equilibrio per azione di movimento).
- **Azione**: nessuna azione (reattiva).
- **Sinergia**: 5 gradi Acrobazia → +2 qui.

## Falsificare (Forgery)

- Opposta dalla **prova di Falsificare del lettore**, con modificatori:
  - Tipo di documento sconosciuto al lettore `−2`; parzialmente conosciuto `0`; ben conosciuto `+2`.
  - Calligrafia sconosciuta `−2`; conosciuta di sfuggita `0`; ben conosciuta `+2`; intimamente conosciuta `+4`.
  - Il documento contraddice le aspettative del lettore `−2`.
- **Azione**: ~1 minuto semplice; 1d4 minuti a pagina complesso.
- **Ritentare**: no per documento/lettore.
- **Restrizione**: bisogna essere alfabetizzati nella lingua del documento.

## Guarire (Heal)

| Compito | CD |
|---|---|
| Primo soccorso (stabilizzare un morente) | 15 |
| Cura a lungo termine | 15 |
| Curare i caltropi / danno da *crescita di rovi* | 15 |
| Curare il veleno | CD del tiro salvezza del veleno |
| Curare la malattia | CD del tiro salvezza della malattia |

- **Primo soccorso**: stabilizza una creatura morente (nessun pf curato). Azione standard.
- **Cura a lungo termine**: 8 h di attività leggera → il paziente guarisce 2 pf per livello / giorno (contro il normale 1) e 2 danni alle caratteristiche / giorno. Un curatore si prende cura di fino a 6 pazienti. Non può curare sé stesso.
- **Curare caltropi/ecc.**: rimuove l'effetto di dimezzamento della velocità dopo 10 minuti di lavoro + CD15.
- **Curare il veleno**: tira per la creatura avvelenata ad ogni tiro salvezza imposto dal veleno, usando Guarire al posto del suo tiro salvezza sulla Tempra se migliore.
- **Curare la malattia**: stesso modello per i tiri salvezza contro la malattia.
- **Azione**: 1 azione standard (primo soccorso), più lunga per le altre.
- **Speciale**: il talento *Autosufficiente* → +2. Kit del guaritore → +2 di circostanza.

## Intimidire (Intimidate)

- Forza un bersaglio a essere amichevole (brevemente) o lo demoralizza in combattimento.
- **Amichevolezza forzata**: prova opposta — Intimidire contro `(livello o DV del bersaglio) + modificatore di Saggezza + (modificatore del tiro salvezza sulla morale del bersaglio contro la paura)`. Successo: il bersaglio si comporta amichevolmente per 1 round + 1d6×10 min, poi diventa Diffidente (se era Indifferente) o Ostile (se era Diffidente).
- **Demoralizzare (in combattimento)**: azione standard; stessa prova opposta. Successo: il bersaglio è **scosso** per 1 round (−2 ai tiri per colpire, alle prove di caratteristica, ai tiri salvezza).
- Modificatori: il bersaglio è una categoria di taglia più grande → `−4`; più piccolo → `+4`. I bersagli immuni alla paura non possono essere intimiditi.
- **Azione**: 1 minuto per l'atteggiamento; 1 azione standard per demoralizzare.
- **Speciale**: il talento *Persuasivo* → +2; 5 gradi Raggirare → +2 qui.

## Intrattenere (Perform)

- Molte abilità Intrattenere separate: vocale (canto, oratoria, comicità), strumento per famiglia (corde, fiati, percussioni, tastiera, danza, recitazione). I gradi in una non si traducono in un'altra.
- Scala di CD (guadagno):
  - 10 = passare il cappello (1d10 mr/giorno);
  - 15 = piacevole (1d10 ma/giorno);
  - 20 = grande spettacolo (3d10 ma/giorno; possibile invito);
  - 25 = memorabile (1d6 mo/giorno; reputazione regionale);
  - 30 = straordinario (3d6 mo/giorno; reputazione nazionale; attenzione planare).
- Strumento perfetto: +2 di circostanza.
- Vincoli della **musica bardica**: es. 3 gradi per *ispirare coraggio*, 6 per *ispirare competenza*, 9 per *suggestione*, 12 per *ispirare grandezza*, 15 per *canto di libertà*, 18 per *ispirare eroismo*, 21 per *suggestione di massa*. (Privilegio di classe del bardo; vedi [class-features.md](class-features.md).)
- **Azione**: tipicamente il lavoro di una serata (o di un giorno).
- **Ritentare**: sì, ma gli spettacoli falliti danneggiano le CD future (+2 per fallimento).

## Muoversi Silenziosamente (Move Silently)

- Opposta da **Ascoltare** di chiunque ascolti.
- A ≤ ½ velocità: nessuna penalità. > ½ fino a piena: `−5`. Corsa/carica: `−20`.
- Modificatori di superficie: rumorosa (ghiaia, sottobosco) `−2`; molto rumorosa (sottobosco fitto, neve alta) `−5`.
- **Azione**: parte del movimento (nessuna azione extra).
- **Speciale**: il talento *Furtivo* → +2. Bonus razziale halfling +2. Famiglio gatto → +3 al proprio padrone.

## Nascondersi (Hide)

- Opposta da **Osservare**.
- A ≤ ½ velocità: nessuna penalità. > ½ fino a piena: `−5`. Corsa/carica: `−20`.
- Modificatore di **taglia**: Colossale `−16`, Mastodontico `−12`, Enorme `−8`, Grande `−4`, Medio 0, Piccolo `+4`, Minuscolo `+8`, Minuto `+12`, Piccolissimo `+16`.
- **Copertura o occultamento richiesti** — almeno un quarto di copertura/occultamento per tentare, con alcune eccezioni.
- **Cecchinaggio**: nascosto, si spara a distanza, ci si nasconde di nuovo a `−20`. Azione di movimento.
- **Creare una diversione**: prova di Raggirare; con successo, si tenta Nascondersi mentre l'attenzione degli osservatori è distolta.
- Invisibile: +40 a Nascondersi se immobile, +20 se in movimento.
- **Azione**: di solito nessuna azione extra (parte del movimento).
- **Speciale**: il talento *Furtivo* → +2. Il ranger al 13° livello può Nascondersi in terreno naturale anche senza copertura (mimetismo); al 17°, anche mentre è osservato (nascondersi in piena vista).

## Nuotare (Swim)

| Acqua | CD |
|---|---|
| Calma | 10 |
| Mossa | 15 |
| Tempestosa | 20 |

- Ogni round in acqua, tirare Nuotare.
- Successo: ci si muove a ½ velocità (azione di movimento) o ¼ velocità (azione di movimento) — la tabella varia. Fallimento: nessun progresso. Fallimento di 5+: si va sott'acqua, si inizia ad annegare.
- Sott'acqua: si può trattenere il respiro per `2 × punteggio di Costituzione` round senza sforzarsi; con azioni di combattimento, solo ½ di quello.
- Dopo che il respiro finisce: prova di Costituzione CD 10, +1 per round, o si inizia ad annegare.
- **La penalità di armatura si applica ed è raddoppiata** (armatura + carico).
- **Azione**: un'azione di movimento muove a ¼ velocità; un round completo muove a ½ velocità.
- **Speciale**: il talento *Atletico* → +2. *Resistenza* → +4 contro il danno non letale da affaticamento del nuoto.

## Osservare (Spot)

- Penalità di distanza: `−1` ogni 3 m.
- Osservatore distratto: `−5`.
- Vedere una creatura invisibile nelle vicinanze: Osservare opposta, ma CD ≥ 20 minimo.
- Usata per: notare imboscate (opposta da Nascondersi), vedere attraverso Camuffare, leggere le labbra (CD 15, richiede linea di vista alle labbra, nessun'altra azione quel minuto, ottiene il senso generale con successo — solo ½ della velocità normale di movimento permessa).
- Fallimento nel leggere le labbra di 5+: interpretazione falsa.
- **Azione**: reattiva (gratuita) per le imboscate; un minuto intero di concentrazione per leggere le labbra.
- **Speciale**: il talento *Attenzione* → +2; elfi +2 razziale; mezzelfi +1 razziale; famiglio falco → +3 al padrone in luce intensa; famiglio gufo → +3 in luce fioca. Ranger contro nemico prescelto: bonus.

## Parlare Linguaggi (Speak Language)

- Non è un'abilità a prova. Ogni grado = un nuovo linguaggio parlato/letto correntemente.
- Si inizia con 1–2 linguaggi razziali + linguaggi bonus dal modificatore di Intelligenza alla creazione.
- **Senza addestramento**: non può essere usata (o si conosce un linguaggio o no).
- Eccezione dell'analfabetismo del barbaro (vedi [languages.md](languages.md)).

## Percepire Intenzioni (Sense Motive)

- CD 20: intuizione — percepire che qualcosa non va in una persona/situazione.
- CD 25 (o 15 se dominato): rilevare l'influenza di un ammaliamento su qualcuno.
- Distinguere un messaggio segreto: opposta dalla prova di Raggirare di chi parla (usata per veicolare il segreto); l'ascoltatore (origliante) fa lo stesso a `−2` per ogni dettaglio mancante sulla parte coinvolta.
- **Azione**: 1 minuto (o più a lungo per leggere le motivazioni più in profondità).
- **Ritentare**: no per tentativo.
- **Speciale**: ranger contro nemico prescelto: bonus. Il talento *Negoziatore* → +2; 5 gradi qui → +2 a Diplomazia.

## Professione (Profession)

- Ogni professione è un'abilità Professione separata (cuoco, marinaio, minatore, ecc.). Solo con addestramento.
- Prova settimanale: guadagna ½ del risultato della prova in mo/settimana come salario per il lavoro normale.
- Compiti specifici (CD fissate dal DM).
- **Senza addestramento**: ~1 ma/giorno come manodopera non qualificata.
- **Azione**: a settimana o per compito.

## Raccogliere Informazioni (Gather Information)

- Spendere 1d4+1 ore e qualche mo in bevande/tangenti; tirare contro CD 10 per pettegolezzi generali.
- Informazioni più specifiche o sensibili: CD 15–25+.
- **Azione**: 1d4+1 ore.
- **Ritentare**: sì, ma i tentativi ripetuti attirano attenzione.
- **Speciale**: mezzelfo +2 razziale. 5 gradi Conoscenze (locali) → +2 qui; il talento *Investigatore* → +2.

## Raggirare (Bluff)

- Opposta da **Percepire Intenzioni del bersaglio**.
- Modificatori a Percepire Intenzioni (lato del bersaglio):
  - La bugia è leggermente difficile da credere `+5`;
  - La bugia è difficile da credere `+10`;
  - La bugia è difficile da mandar giù `+20`;
  - Il bersaglio vuole crederci `−5`.
- **Fintare in combattimento**: azione standard; Raggirare opposta contro Percepire Intenzioni; successo → il bersaglio perde il bonus di Destrezza alla CA contro il prossimo attacco (deve avvenire prima del proprio turno successivo). Non umanoidi: penalità `−4`; animali Int 1–2: `−8`; non intelligenti: impossibile.
- **Creare una diversione** (per Nascondersi): azione standard; con successo, si tenta Nascondersi.
- **Passare un messaggio segreto**: CD 15 semplice, CD 20 complesso; l'ascoltatore che origlia si oppone con Percepire Intenzioni a `−2` per ogni dettaglio mancato; fallimento di 5+: informazione falsa veicolata.
- **Azione**: standard per fintare in combattimento o diversione; più lunga per il messaggio segreto.
- **Ritentare**: stesso bersaglio e circostanza — no. Circostanza diversa: forse.
- **Speciale**: ranger contro nemico prescelto: bonus. Il talento *Persuasivo* → +2. 5 gradi Raggirare → +2 a Diplomazia, Intimidire, Rapidità di Mano e Camuffare (quando si recita).

## Rapidità di Mano (Sleight of Hand)

| Azione | CD |
|---|---|
| Rubare un oggetto grande quanto una moneta | 10 |
| Sollevare un piccolo oggetto da una persona | 20 |
| Nascondere un piccolo oggetto su di sé | CD 20 (contro Osservare/Cercare dell'osservatore) |

- Nascondere un piccolo pugnale: +2 a Osservare/Cercare opposta; oggetto più piccolo: +4.
- Opposta da Osservare (osservazione) o Cercare (occultamento).
- **Ritentare**: sì contro lo stesso bersaglio, ma CD +10 se l'osservatore è lo stesso.
- **Azione**: di solito un'azione standard; può essere un'azione gratuita con `−20`.
- **Senza addestramento**: si possono tentare solo azioni con CD ≤ 10; non si può usare per sottrarre da persone.
- **Speciale**: il talento *Mani Abili* → +2. 5 gradi Raggirare → +2 qui.

## Saltare (Jump)

- **Modificatore di velocità** a Saltare: se la velocità base terrestre è < 9 m, `−6` ogni 3 m sotto 9 m; se > 9 m, `+4` ogni 3 m sopra 9 m.
- Richiede una rincorsa di 6 m; senza di essa, la **CD è raddoppiata**.

| Salto in lungo (con rincorsa) | CD |
|---|---|
| 1,5 m | 5 |
| 3 m | 10 |
| 4,5 m | 15 |
| 6 m | 20 |
| 7,5 m | 25 |
| 9 m | 30 |

- Fallimento a metà salto (lungo): atterra al punto raggiunto; fallimento ≤4 = "1,5 m corto" — Riflessi CD 15 per aggrapparsi al bordo; fallimento = cade.
- Salto in alto (verticale con rincorsa): CD = `4 × cm di altezza libera / 30 cm` (quindi un salto di 30 cm è CD 4; 90 cm è CD 12).
- Senza rincorsa: raddoppiare la CD.
- Salto in alto da posizione ferma: nessuna riduzione del modificatore di CD.
- Portata verticale per categoria di taglia: Medio 2,4 m; Piccolo 1,8 m; Minuscolo 1,2 m; ... fino a Colossale 38,4 m.
- Saltare sul posto su una superficie bassa: CD 15.
- **Saltare giù**: CD 15 per subire il danno come se si fosse caduti 3 m in meno del reale.
- **Azione**: parte del movimento (nessuna azione extra).
- **Speciale**: il talento *Corsa* → +4 ai salti con rincorsa. Bonus razziale halfling +2. *Acrobatico* → +2.
- 5 gradi Acrobazia → +2 qui; 5 gradi qui → +2 Acrobazia.

## Sapienza Magica (Spellcraft)

| Azione | CD |
|---|---|
| Identificare un glifo di custodia con *lettura magica* | 13 |
| Identificare un incantesimo mentre viene lanciato (bisogna vederlo/sentirlo) | **15 + livello dell'incantesimo** |
| Apprendere un incantesimo da un libro degli incantesimi / pergamena (maghi) | 15 + livello dell'incantesimo |
| Preparare un incantesimo preso in prestito dal libro di un altro mago | 15 + livello dell'incantesimo |
| Identificare la magia su un singolo oggetto/creatura tramite *individuazione del magico* | **15 + ½ livello dell'incantatore** (min 15) |
| Identificare un *simbolo* con *lettura magica* | 19 |
| Identificare un incantesimo in effetto (area) | 20 + livello dell'incantesimo |
| Identificare materiali modellati dalla magia (es. muro di ferro) | 20 + livello dell'incantesimo |
| Decifrare l'incantesimo di una pergamena senza *lettura magica* | 20 + livello dell'incantesimo (1 round completo) |
| Dopo un tiro salvezza contro un incantesimo, identificarlo | 25 + livello dell'incantesimo |
| Identificare una pozione | 25 (1 minuto) |
| Disegnare un diagramma di ancora dimensionale in un cerchio magico | 20 (10 minuti) |
| Comprendere un effetto magico strano/unico | 30+ |

- **Azione**: di solito nessuna azione (durante un tiro salvezza); 1 round per identificare mentre viene lanciato; 1 min per una pozione; 10 min per il diagramma; per tabella per gli altri.
- **Ritentare**: no per la maggior parte delle identificazioni.
- **Speciale**: il mago specialista +2 per identificare gli incantesimi della propria scuola (e `−5` per le scuole proibite — e alcune azioni impossibili per le scuole proibite).
- Il talento *Attitudine Magica* → +2.
- 5 gradi Conoscenze (arcane) → +2 Sapienza Magica; 5 gradi Sapienza Magica → +2 Utilizzare Oggetti Magici sulle pergamene; 5 gradi Utilizzare Oggetti Magici → +2 Sapienza Magica per le pergamene.

## Scalare (Climb)

| Superficie | CD |
|---|---|
| Pendenza ≤ 60° (percorribile) | 0 |
| Corda con nodi / muro inclinato | 5 |
| Corda annodata o corda + muro su cui puntellarsi; *passo dimensionale con corda* | 10 |
| Superficie con sporgenze (es. sartiame di nave) | 10 |
| Qualsiasi superficie con appigli adeguati (roccia ruvida) | 15 |
| Superficie ruvida con appigli scarsi (muro di un dungeon) | 20 |
| Parete di roccia naturale ruvida | 25 |
| Muro di mattoni | 25 |
| Strapiombo o soffitto con appigli solo per le mani | 25 |
| Superficie verticale perfettamente liscia | — (impossibile) |

- Modificatori di CD: arrampicata a camino (spingere tra pareti opposte) `−10`; angolo (spingere tra pareti perpendicolari) `−5`; molto scivolosa `+5`.
- Fallimento ≤4: nessun progresso (nessuna caduta). Fallimento di 5+: **caduta** dall'altezza attuale.
- Velocità di arrampicata: ¼ della base a meno di accelerare (`−5` per muoversi a ½ velocità).
- Perde il bonus di Destrezza alla CA mentre si arrampica; una mano libera può usare una singola arma. Non si può usare uno scudo.
- **Danno mentre ci si arrampica**: bisogna ri-arrampicarsi alla CD della superficie per mantenere la presa; il fallimento = caduta.
- **Farsi da soli degli appigli**: 1 minuto ogni 90 cm con un piolo; CD 15 in seguito.
- **Afferrare un personaggio che cade**: attacco di contatto in mischia per afferrarlo; CD di Scalare = CD del muro `+10` per tenerlo (non può superare la capacità di trasporto).
- **Azione**: parte del movimento.
- **Speciale**: famiglio lucertola → +3 al padrone. Bonus razziale halfling +2. Il talento *Atletico* → +2.
- 5 gradi Utilizzare Corde → +2 a Scalare quando si usa una corda.

## Scassinare Serrature (Open Lock)

| Qualità della serratura | CD |
|---|---|
| Molto semplice | 20 |
| Media | 25 |
| Buona | 30 |
| Sbalorditiva | 40 |

- Richiede attrezzi da scasso. Senza: improvvisato a `−2`. Attrezzi perfetti: `+2` di circostanza.
- **Azione**: 1 round (round completo).
- **Senza addestramento**: impossibile (solo con addestramento). Si può provare a forzare la serratura con la forza (vedi "spezzare oggetti").
- **Speciale**: il talento *Dita Agili* → +2.

## Sopravvivenza (Survival)

| Azione | CD |
|---|---|
| Cavarsela nella natura selvaggia (metà velocità, cibo/acqua per sé + 1 per ogni 2 oltre la CD) | 10 |
| Cavarsela nel maltempo severo (+2 Tempra, ½ danno; condividere con 1 alleato per ogni 1 oltre la CD) | 15 |
| Evitare pericoli naturali (es. sabbie mobili) | 15 |
| Prevedere il meteo 24 h prima | 15 (ogni +5 = +1 giorno di previsione) |
| Tracciare | dal talento Traccia e dal terreno |

- **Azione**: per compito; tracciare è round completo per azione di movimento mentre si traccia.
- Il **talento Traccia** è richiesto per seguire tracce con CD > 10 (i ranger lo hanno gratis).
- **Ritentare**: al giorno per la sopravvivenza; all'ora all'aperto / 10 min al chiuso per le tracce.
- **Speciale**: ranger contro nemico prescelto: bonus. Il talento *Autosufficiente* → +2 Sopravvivenza e Guarire.
- 5 gradi → +2 Conoscenze (natura). Molti campi di Conoscenze a 5 gradi danno +2 Sopravvivenza nel loro dominio.

## Utilizzare Corde (Use Rope)

| Azione | CD |
|---|---|
| Fare un nodo saldo | 10 |
| Fissare un rampino | 10 (+2 ogni 3 m di lancio; lancio massimo 4,5 m + 3 m ogni +5) |
| Fare un nodo speciale (scorsoio, nodo scorsoio, nodo che si può sciogliere) | 15 |
| Fare un nodo a una mano | 15 |
| Unire corde | varia |
| Legare una persona | Artista della Fuga opposta (+10 a Utilizzare Corde) |

- Corda di seta: +2 di circostanza. Incantesimo *animare corde* + Utilizzare Corde: +2 a qualsiasi prova di Utilizzare Corde con quella corda (cumulativo).
- **Speciale**: il talento *Mani Abili* → +2.
- 5 gradi → +2 Scalare (con corda); +2 Artista della Fuga (quando si sfugge da corde).
- 5 gradi Artista della Fuga → +2 Utilizzare Corde (quando si lega qualcuno).

## Utilizzare Oggetti Magici (Use Magic Device)

Permette a un personaggio di emulare i requisiti per usare un oggetto magico: privilegio di classe, allineamento, punteggio di caratteristica, razza, persino l'atto di lanciare da una pergamena.

| Azione | CD |
|---|---|
| Attivare alla cieca (oggetto attivato con parola di comando/ecc., metodo sconosciuto) | 25 |
| Decifrare un incantesimo scritto (sostituto di *lettura magica*) | 25 + livello dell'incantesimo |
| Emulare un allineamento | 30 |
| Emulare un privilegio di classe | 20 |
| Emulare un punteggio di caratteristica (per soddisfare un minimo di lancio) | (vedi testo) |
| Emulare una razza | 25 |
| Usare una bacchetta | 20 |
| Usare una pergamena | 20 + livello dell'incantatore |

- **Fallimento di 9 o meno**: non succede nulla, si può ritentare dopo 24 h.
- **Fallimento di 10+ (1 naturale) su una pergamena**: **malfunzionamento** — l'energia si libera imprevedibilmente (2d6 danni tipici).
- Solo un'emulazione alla volta (una prova di Utilizzare Oggetti Magici per emulazione).
- Ogni prova di Utilizzare Oggetti Magici vale solo per la durata di quell'attivazione.
- **Azione**: come richiesto dall'attivazione dell'oggetto.
- **Restrizione**: solo con addestramento. Nessun prendere 10. Nessun aiutare un alleato.
- **Speciale**: il talento *Attitudine Magica* → +2.
- 5 gradi Sapienza Magica → +2 qui (per le pergamene); 5 gradi Decifrare Scritture → +2 qui (per le pergamene); 5 gradi qui → +2 Sapienza Magica (per decifrare le pergamene).

## Valutare (Appraise)

| Oggetto | CD |
|---|---|
| Comune, ben conosciuto | 12 |
| Raro o esotico | 15, 20, o superiore |

- Con successo: stimare il valore entro il 10% (il DM tira `2d6 + 3`, moltiplica per 10%, moltiplica per il prezzo reale — questa è la stima quando la prova fallisce; successo → corretto).
- Lente d'ingrandimento: +2 di circostanza per oggetti piccoli/finemente dettagliati (gemme).
- Bilancia da mercante: +2 per oggetti prezzati a peso (metalli preziosi).
- **Azione**: 1 minuto a oggetto.
- **Ritentare**: no sullo stesso oggetto.
- **Speciale**: nani +2 razziale contro oggetti di pietra/metallo. Il talento *Diligente* → +2.
- 5 gradi Artigianato → +2 qui (per oggetti di quel manufatto).

---

## Riferimenti incrociati

- [skills.md](skills.md) — *sistema* delle abilità (pool di punti, gradi, gradi massimi, prendere 10/20, aiutare un alleato, meccanica di sinergia, penalità di armatura, formato delle specifiche).
- [class-features.md](class-features.md) — interazioni di abilità specifiche di classe (scoprire trappole, nemico prescelto, vincoli della musica bardica, empatia selvatica, mimetismo, nascondersi in piena vista, eludere, mente sfuggente).
- [src/data/skills.json](../../src/data/skills.json) — caratteristica chiave, contrassegni classe/fuori classe, contrassegno penalità di armatura, contrassegno solo addestramento, mappature di sinergia per singola abilità.
- [feats.md](feats.md) — Focalizzazione in un'Abilità, Attitudine Magica, Investigatore, Persuasivo, Furtivo, Acrobatico, Atletico, Autosufficiente, ecc. (quando estratti).

## Fonti

- Manuale del Giocatore — pp. 67–86
