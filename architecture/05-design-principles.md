**PESCARIA**

**Design Principles**

*Sette regole che nessuno deve violare*

Questo documento non serve al compilatore. Serve agli esseri umani. Ogni
volta che verrà la tentazione di aggiungere una piccola eccezione nel
Core, queste sei regole vanno rilette per chiedersi se la si sta
violando.

**1. Il Core non conosce il gioco.**

> *Draft, aste, contratti, mercato non esistono nel Core. Sono moduli.
> Il Core conosce solo Agent, Intent, Event, Entity, Component, System,
> Projection, Session.*

**2. Il log è la verità.**

> *Lo stato non è un dato primario: è una proiezione, ricostruibile
> rigiocando il log. Se un\'informazione non è derivabile dal log, non
> esiste.*

**3. Le regole producono eventi, non modificano lo stato.**

> *Nessun System scrive direttamente nello stato. Emette eventi; sono
> gli eventi, via apply(), a cambiare lo stato. Ogni delta è quindi
> spiegabile e tracciabile.*

**4. Le projection non modificano mai lo stato.**

> *UI, Solver, Analytics, Replay, AI osservano e basta. La linea tra chi
> scrive (System) e chi legge (Projection) è il confine che tiene il
> motore onesto.*

**5. I moduli comunicano solo tramite eventi.**

> *Nessun modulo chiama direttamente un altro. Il DraftModule non
> conosce l\'AuctionModule. Parlano solo attraverso il log. Così un
> modulo si aggiunge o si toglie senza rompere gli altri.*

**6. Se può essere una projection, non deve stare in un System.**

> *Prima di aggiungere logica a un System, chiedersi se è solo lettura.
> Se lo è, è una projection. I System contengono solo ciò che deve
> produrre eventi.*

**7. Ogni astrazione nasce da almeno due usi concreti.**

> *Una classe entra nel framework solo se serve ad almeno due giochi
> (es. Coin Game e Pescaria). Se serve a uno solo, vive nel suo esempio.
> Generalizzare da un caso solo è ciò che ha prodotto gli archetipi e le
> metriche premature durante la ricerca.*

*Corollario operativo: una proposta può toccare il Core solo se dimostra
di non poter essere un modulo né una projection. È una soglia
deliberatamente alta. Protegge il Core dal diventare il contenitore dove
finisce ogni nuova idea.*

---

## Invariante della Session (aggiunta in 0015)

**Una Session deve poter essere ricostruita esclusivamente dal proprio Event Log.**
Se esiste qualunque stato che non può essere ricostruito dal log, quello stato
non appartiene alla Session.

Conseguenza pratica imposta dal codice: il costruttore della Session non accetta
stato iniziale. Una Session nasce vuota e cresce per `submit()`, oppure si
ricostruisce con `Session.fromLog()`. Non esiste modo di iniettare stato
arbitrario — l'invariante è vera per costruzione, non per disciplina.

Corollario: *collaborano i fatti, non i System.* Un System non conosce gli altri
System; conosce solo i fatti (eventi e stato) e il loro linguaggio. Sostituire il
produttore di un fatto non rompe i suoi consumatori.
