**PESCARIA**

**Core Specification**

v1.0

*Il motore di tutte le versioni --- non di una.*

Specifica tecnica, non regolamento.

**Cos\'è il Core**

**Il Core non è Pescaria.**

Non contiene il draft. Non contiene le aste.

Non contiene i contratti. Non contiene il mercato.

*Contiene soltanto le leggi con cui qualunque gioco basato su eventi può
esistere.*

Una versione del gioco non modifica il Core. Attiva moduli.

Una nuova meccanica non cambia il Core. Produce nuovi eventi.

Una nuova IA non cambia il Core. Legge il log.

**Il Core è deliberatamente ignorante.**

La sua forza deriva proprio dal non sapere nulla del gioco.

**Il flusso, in una figura**

Agent

│

Intent

│

┌─────────────┐

│ Middleware │

└─────────────┘

│

System

│

Events

│

Event Log

│

apply()

│

State

│

┌────────┼────────┐

│ │ │

Replay Solver Analytics · UI · AI

**0. Scopo e non-scopo**

Questo documento specifica il Pescaria Core: il motore su cui ogni
versione del gioco, ogni strumento di analisi e ogni agente (umano o
artificiale) operano. Non è un regolamento: non spiega come si gioca a
una persona. È una specifica tecnica che definisce cosa esiste, cosa può
accadere, e come si registra ciò che accade.

> *Principio guida: non stai progettando il motore di una versione del
> gioco, ma il motore di tutte le versioni. Il Core non sa cosa sia un
> draft o un\'asta. Sa solo che esistono agenti che propongono
> intenzioni, sistemi che le trasformano in eventi, ed eventi che
> modificano lo stato. Draft, aste, contratti sono moduli sopra il
> Core.*

La specifica completa è in quattro documenti, di cui questo è il primo:
(1) Core --- i concetti fondamentali; (2) Event Catalog --- l\'elenco di
tutti gli eventi; (3) Modules --- Draft, Asta, Contratti, Migliorie,
Capitano; (4) Projections --- UI, Replay, Solver, Analytics, AI,
Telemetry. Gli ultimi tre derivano da questo: vanno scritti solo dopo
che il Core è stabile.

**1. I due principi fondanti**

**Principio 1 --- Il log è la verità, lo stato è una proiezione**

La sequenza degli eventi è l\'unica fonte di verità. Lo stato del gioco
non è un dato primario: è una cache, ricostruibile in qualsiasi momento
rigiocando il log dall\'inizio.

> stato = fold(apply, eventi)\
> \
> // lo stato non si "salva": si ricalcola dal log.

Conseguenza: replay, analytics e telemetria sono gratuiti, perché tutta
la storia è già nel log. Una partita non è una fotografia finale, è la
sequenza completa di ciò che è accaduto.

**Principio 2 --- Le regole non modificano lo stato. Producono eventi.**

Nessun sistema scrive mai direttamente nello stato. Un sistema, in
risposta a un evento, ne emette altri; sono questi a modificare lo stato
tramite apply(). Ogni delta dello stato è quindi un evento esplicito,
con la sua causa registrata.

> evento → validate() → emit() → 0..N nuovi eventi → apply() → nuovo
> stato\
> \
> // BUY_FISH non aggiunge il pesce e toglie i ducati di nascosto.\
> // Emette: MONEY_SPENT + FISH_GAINED + INVENTORY_UPDATED\
> // e sono quegli eventi a modificare lo stato.
>
> *Perché è decisivo: ogni cambiamento è spiegabile, non esistono
> effetti nascosti. Domande come "quanti ducati sono stati guadagnati
> dai contratti?" diventano query sul log (MONEY_GAINED con source =
> CONTRACT), non analisi del codice delle regole.*

**2. I concetti del Core**

Il Core ha otto concetti: sette logici più la Session che li contiene.
Mantenerli puri è ciò che rende il motore stabile nel tempo.

  ---------------------------------------------------------------------------
  **Concetto**   **Definizione**                                **Può
                                                                scrivere?**
  -------------- ---------------------------------------------- -------------
  Agent          Chi propone un\'azione. Umano, IA, bot,        solo Intent
                 replay, script di test, simulatore. Il Core    
                 non distingue.                                 

  Intent         Una richiesta di azione da parte di un Agent.  ---
                 Può essere rifiutata.                          

  Event          Un fatto accaduto. Immutabile. Va nel log.     ---

  Entity         Un oggetto del dominio (un giocatore,          ---
                 un\'asta, una carta). Solo un id.              

  Component      Stato attaccato a un\'entità (mano, banco,     ---
                 offerte). Il Core non ne conosce il            
                 significato.                                   

  System         Trasforma Intent in Event e applica gli Event. Event
                 Qui vivono le regole.                          

  Projection     Osserva il flusso degli Event. Non scrive mai. nulla
                 (Solver, UI, AI, Replay.)                      

  Session        Il contenitore di una partita: EventLog, RNG   ---
                 seedato, moduli attivi, projection, cache di   
                 stato.                                         
  ---------------------------------------------------------------------------

> *La linea architettonica fondamentale: i System producono eventi, le
> Projection solo leggono. Chi descrive non decide, chi osserva non
> muta. È lo stesso principio del Solver, applicato all\'intero motore.*

**La Session come contenitore**

Tutto vive dentro una partita. La Session è l\'oggetto che la incarna:
possiede il proprio EventLog (la verità), il proprio RNG seedato (la
sorgente deterministica di casualità), l\'insieme dei moduli attivi (che
definiscono la versione), le projection collegate e la cache dello
stato. Due partite sono due Session indipendenti; mille simulazioni sono
mille Session, ognuna col suo seed e il suo log, perfettamente
confrontabili. La Session è ciò che rende "una partita" un oggetto
concreto invece di un\'idea.

**3. Agent e Intent**

Non esistono i concetti separati di "giocatore" e "IA". Esiste un solo
concetto: Agent. Un Agent produce Intent; il motore non sa cosa sia
l\'Agent dietro.

> Agent → Intent → \[Engine\] → cascata di Event\
> \
> Un Agent puo essere: umano · IA · bot casuale · replay · script ·
> simulatore

Questa unificazione, che oggi sembra un dettaglio, abilita capacità
importanti senza codice speciale:

-   far continuare a un bot una partita umana se un giocatore esce;

-   usare un replay come "giocatore" (rigioca i suoi Intent);

-   confrontare umano e IA sullo stesso terreno, perché entrambi sono
    solo produttori di Intent;

-   eseguire simulazioni massive con lo stesso identico motore del gioco
    reale.

**4. Le quattro categorie di evento**

Tutti gli eventi sono uguali per il Core e stanno sullo stesso livello
nel log. Ma si classificano in quattro categorie per origine e ruolo. La
distinzione è ciò che impedisce a un Agent di toccare lo stato
direttamente.

  -------------------------------------------------------------------------
  **Categoria**   **Cos\'è**                      **Esempi**
  --------------- ------------------------------- -------------------------
  Intent          Un Agent vuole fare qualcosa.   PLACE_BID, BUY_CARD,
                  Può essere rifiutato.           PLAY_CARD

  Domain Event    Il gioco riconosce che qualcosa AUCTION_WON,
                  è accaduto.                     CONTRACT_COMPLETED,
                                                  FISH_BOUGHT

  Consequence     Effetto automatico di un Domain MONEY_GAINED,
                  Event.                          MONEY_SPENT, CARD_DRAWN

  Notification    Non modifica lo stato. Serve    TURN_STARTED, DAY_ENDED,
                  solo alle Projection.           MATCH_FINISHED
  -------------------------------------------------------------------------

> *Regola che ne deriva, e che impone meccanicamente l\'esclusione
> psicologica: un Agent può emettere SOLO Intent. Non può emettere
> MONEY_GAINED --- quello lo produce il motore. L\'IA decide cosa vuole
> tentare, non cosa accade. La separazione tra chi propone e chi risolve
> è imposta dai tipi, non dalla disciplina.*

**5. Struttura di un evento nel log**

Il log è piatto: ogni evento, di intento o di conseguenza, è una riga
allo stesso livello. La gerarchia causale non è annidata, è espressa da
un riferimento.

> { id: 1841, type: BUY_FISH, actor: Player3, causedBy: null }\
> { id: 1842, type: MONEY_SPENT, actor: AuctionModule, causedBy: 1841 }\
> { id: 1843, type: FISH_GAINED, actor: AuctionModule, causedBy: 1841 }\
> { id: 1844, type: INVENTORY_UPDATED, actor: AuctionModule, causedBy:
> 1841 }

Ogni evento porta almeno: un id univoco e ordinato; un type; un actor
(chi l\'ha prodotto --- un Agent per gli Intent, un Modulo per le
conseguenze); un causedBy (l\'id dell\'evento che l\'ha generato, o null
se è un Intent originario); un payload coi dati specifici.

> *Il log piatto dà sia la facilità di query (cerchi MONEY_SPENT
> direttamente) sia la catena causale completa (segui causedBy a ritroso
> per ricostruire perché). Non devi scegliere tra le due.*

**6. Determinismo e casualità**

Il Core applica eventi in modo puramente deterministico: lo stesso log,
rigiocato, produce sempre lo stesso stato. Questo è ciò che rende il
replay esatto e il confronto fra agenti possibile.

La casualità (pesca dal sacchetto, mescolamento del mazzo) non è un
effetto degli eventi. È un input, già risolto, contenuto nel payload
dell\'evento, prodotto da un generatore con seed che è parte dello
stato.

> // SBAGLIATO: l\'evento pesca (non deterministico, replay rotto)\
> DRAW_FISH → il sistema estrae un pesce a caso\
> \
> // CORRETTO: il pesce e gia deciso e viaggia nel payload\
> DRAW_FISH { fish: \"branzino\", rngState: 0x9F2C\... }
>
> *Regola dura: nessun System introduce casualità come effetto. Ogni
> elemento casuale è risolto a monte dal RNG seedato dello stato e
> registrato nell\'evento. Così rigiocare il log mille volte dà mille
> partite identiche.*

**7. Il ciclo del motore**

Il flusso completo da un Intent allo stato aggiornato. Il Core
orchestra; i moduli validano e decidono le conseguenze. Il Core non
conosce le regole specifiche (non sa che un\'offerta dev\'essere
positiva: lo sa l\'AuctionModule).

> 1\. Agent emette un Intent (es. PLACE_BID {amount: 8})\
> 2. Middleware intercetta (timeout, auth, log, cheat detection)\
> 3. Engine chiede ai System: validate(intent) (AuctionModule: 8 \> 0 e
> \<= ducati?)\
> 4. se invalido → INTENT_REJECTED (nel log: anche i rifiuti sono
> storia)\
> 5. se valido → il System emette i Domain Event e le Consequence\
> 6. Engine applica gli Event: apply(state, event) per ciascuno\
> 7. ogni apply verifica le Invariants del motore (vedi cap. 8)\
> 8. nuovo stato in cache; le Projection osservano il flusso

Nota sul passo 4: anche un Intent rifiutato è un fatto accaduto e va nel
log. "Il giocatore 3 ha tentato un\'offerta non valida" è un dato
comportamentale, non un errore da nascondere.

**Il Middleware**

Tra l\'Intent e la validazione c\'è uno strato di middleware: il posto
dove vivono le preoccupazioni trasversali che non sono né regole di
gioco (System) né osservazione (Projection). Autenticazione, timeout,
logging, statistiche, debug, cheat detection intercettano il flusso
degli Intent senza sporcare i moduli. È la stessa separazione di
responsabilità applicata al come, non al cosa.

**8. Le Invarianti del motore**

Esistono regole che devono essere sempre vere, qualunque modulo sia
attivo. Non sono regole del gioco --- sono regole del motore, garanzie
di integrità che valgono per TERRY, A, B e per qualsiasi variante
futura. Il motore le verifica a ogni apply; un\'invariante violata è un
bug del motore, segnalato subito, non un dato corrotto scoperto più
tardi.

  -----------------------------------------------------------------------
  **Invariante**           **Garantisce che**
  ------------------------ ----------------------------------------------
  Conservazione delle      ogni carta esiste esattamente una volta in
  carte                    tutto lo stato.

  Unicità del contenitore  una carta appartiene a un solo contenitore
                           (mano, banco, scarti).

  Owner unico              ogni Entity ha un solo proprietario in un dato
                           momento.

  Non-negatività delle     nessun giocatore può avere ducati (o pesci)
  risorse                  negativi.

  Monotonìa del log        ogni evento ha un id strettamente crescente.

  Integrità causale        ogni causedBy punta a un evento realmente
                           esistente nel log.
  -----------------------------------------------------------------------

> *La differenza è netta: "un giocatore non può avere ducati negativi"
> non è una regola di Pescaria (i costi li decide il modulo economico),
> è una garanzia che lo stato non possa mai diventare incoerente. Le
> invarianti proteggono il motore da sé stesso e dai moduli,
> indipendentemente dal gioco.*

**9. Conseguenza: il laboratorio è un insieme di Projection**

Il Solver progettato nella fase di ricerca non è un programma separato.
È una Projection: osserva il log, calcola V0, espone dati, non modifica
nulla. Esattamente come Replay, Analytics, UI e AI.

> *Non esistono più "la versione del laboratorio" e "la versione del
> gioco". Esiste un solo motore. La stessa partita alimenta UI, replay,
> analytics, Solver e IA. La duplicazione delle regole --- il rischio
> che tre rappresentazioni divergano --- è eliminata alla radice: c\'è
> una sola verità, il log, e tutto il resto la legge.*

Questo chiude l\'arco dell\'intero progetto. Si era partiti da un
simulatore di draft; si arriva a un game engine osservabile. La
differenza è sostanziale: un simulatore risponde alle domande che gli
poni; un motore osservabile conserva l\'intera storia di ogni partita e
permette domande che oggi non sono ancora state immaginate. Ogni partita
diventa un esperimento riproducibile e analizzabile.

**10. Stato: Core v1.0 (Frozen)**

Questo documento definisce il Core ed è da considerarsi CONGELATO. È il
fondamento da cui tutto il resto deriva. Il Core ha raggiunto il giusto
livello di astrazione: da qui il lavoro cambia natura, non si espande
più il Core, si costruisce sopra di esso.

> *Soglia di modifica: da questo momento ogni idea nuova deve trovare
> posto in un modulo o in una projection. Una proposta può toccare il
> Core solo se dimostra di non poter essere implementata come modulo o
> projection. È una soglia deliberatamente alta: protegge il Core dal
> diventare il contenitore dove finisce ogni nuova idea --- esattamente
> il rischio che tutta la ricerca ha cercato di evitare.*

I tre documenti successivi derivano da questo e vanno scritti
nell\'ordine:

  --------------------------------------------------------------------------
  **Documento**       **Contenuto**                             **Stato**
  ------------------- ----------------------------------------- ------------
  1\. Core            Otto concetti, due principi, invarianti,  FROZEN v1.0
  Specification       ciclo del motore. (questo)                

  2\. Event Catalog   Elenco completo e tipizzato di tutti gli  successivo
                      eventi del gioco.                         

  3\. Modules         Draft, Asta, Contratti, Migliorie,        successivo
                      Capitano, FishMarket.                     

  4\. Projections     UI, Replay, Solver, Analytics, AI,        successivo
                      Telemetry.                                
  --------------------------------------------------------------------------

Le versioni del gioco (TERRY, A, B) non sono nel Core: sono
configurazioni che attivano moduli diversi. TERRY = Core + Draft +
Auction + Improvement + Contract. A = Core + Captain + Auction. B =
Core + FishMarket. Una variante futura sarà un modulo nuovo, senza
toccare il motore.
