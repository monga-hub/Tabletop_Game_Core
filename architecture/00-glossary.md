**PESCARIA FRAMEWORK**

**Glossary**

*Il vocabolario ufficiale --- undici termini, una definizione ciascuno*

Questi termini ricorrono in tutta l\'architettura. Questa pagina ne
fissa il significato una volta sola. Non è per i lettori di oggi: è per
chi leggerà il codice fra due anni e troverà la parola "Projection"
senza sapere che è un concetto preciso e non un sinonimo casuale.

  --------------------------------------------------------------------------
  **Termine**        **Definizione**                            **Può
                                                                scrivere**
  ------------------ ------------------------------------------ ------------
  **Agent**          Chi propone un\'azione. Umano, IA, bot,    Intent
                     replay o script: il motore non distingue.  
                     Un Agent produce solo Intent.              

  **Intent**         Una richiesta di azione da parte di un     ---
                     Agent. Esprime una volontà, non un fatto.  
                     Può essere rifiutata.                      

  **Event**          Un fatto accaduto, immutabile, con id      ---
                     univoco e ordinato. È l\'unità del log.    
                     Tutto ciò che succede è un Event.          

  **Domain Event**   Un Event con cui il gioco riconosce che    ---
                     qualcosa è accaduto (es. un\'asta è stata  
                     vinta). Emesso da un System.               

  **Consequence**    Un Event che è l\'effetto automatico di un ---
                     Domain Event (es. ducati spesi). È ciò che 
                     modifica davvero lo stato.                 

  **Notification**   Un Event che non modifica lo stato. Serve  ---
                     solo alle Projection a sapere che qualcosa 
                     è cambiato.                                

  **Entity**         Un oggetto del dominio identificato solo   ---
                     da un id (un giocatore, un\'asta, una      
                     carta). Non contiene dati propri.          

  **Component**      Stato attaccato a un\'Entity (mano, banco, ---
                     offerte). Il Core sa che esiste, non cosa  
                     significa: lo interpreta un modulo.        

  **System**         Trasforma Intent in Event e applica gli    Event
                     Event. È l\'unico luogo dove vivono le     
                     regole. Può scrivere (emettere Event).     

  **Projection**     Osserva il flusso degli Event e ne deriva  nulla
                     una vista (UI, Solver, Analytics, Replay,  
                     AI). Non scrive mai nulla.                 

  **Session**        Il contenitore di una partita: il suo      ---
                     EventLog, il suo RNG seedato, i moduli     
                     attivi, le projection, la cache di stato.  
  --------------------------------------------------------------------------

*Una dodicesima parola, Middleware, non è un concetto del modello ma uno
strato del runtime: intercetta gli Intent prima della validazione
(timeout, auth, log, cheat detection) senza appartenere né ai System né
alle Projection.*

*Regola di lettura: la colonna "Può scrivere" è il cuore
dell\'architettura. Solo i System scrivono (emettono Event). Le
Projection osservano e basta. Gli Agent propongono solo Intent. Chi
descrive non decide, chi osserva non muta.*
