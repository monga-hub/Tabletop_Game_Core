# H-006 — Le conseguenze automatiche sono Policy, non System

**Status:** ipotesi (NON implementata) — nata da un attrito reale in 0022
**Ultima valutazione:** formulata dopo draft.completed · **Prossima rivalutazione:** ad auction.completed e contract.completed

## Ipotesi
Le conseguenze automatiche del dominio non appartengono ai System che
interpretano gli Intent, ma a **Policy** che osservano il flusso degli Eventi e
lo stato risultante e producono nuovi Eventi.

    System:  Intent          → Eventi   (interpreta una volontà)
    Policy:  Eventi + Stato  → Eventi   (reagisce a un fatto avvenuto)

## L'attrito che l'ha generata (caso reale, non speculazione)
In 0022, per emettere `draft.completed`, il `reduce` del pick-system deve
SIMULARE l'effetto del pick:

    // in reduce (predittivo):   countAfter[player] = picked + 1; if (tutti >= N) emit completed
    // in apply  (reale):        pickedCards[player].push(card)

Due versioni della stessa logica — una predittiva, una reale. Fonte classica di
divergenza: cambia il conteggio in apply e devi ricordarti di cambiarlo anche
nella simulazione, o draft.completed esce al momento sbagliato (in silenzio).

## La forma che eliminerebbe la duplicazione
Una Policy osserva lo stato REALE (dopo apply), non uno simulato:

    submit(intent) → reduce → emit(card.picked) → apply(card.picked)
                   → Policy osserva lo stato reale
                   → if (ogni player ha N) emit(draft.completed)
                   → apply → Policy osserva → emit(phase.changed)

La logica esiste UNA volta sola (in apply). La Policy legge il risultato vero.

## Perché si innesta su H-001
H-001: lo stato è la projection col ruolo "decision context" (informa validate).
H-006 introduce un ruolo simmetrico: la Policy non informa le decisioni, REAGISCE
allo stato producendo eventi. Due ruoli speculari attorno allo stato.

## Cosa diventerebbe uniforme (se reggesse)
Tutti gli automatismi del gioco avrebbero la stessa forma:

    on(card.picked)        if ogni player ha N   → draft.completed
    on(draft.completed)                          → phase.changed
    on(auction.completed)                        → income.distributed
    on(contract.completed)                       → reputation.changed

## Controesempi da cercare
- Una Policy che deve emettere in base a DUE eventi correlati nel tempo (non uno
  solo): la forma on(evento) basta, o serve memoria?
- Ordine fra Policy: se due policy reagiscono allo stesso fatto, conta l'ordine?
  (richiama il costo temporale già visto in H-001.)
- Una Policy è solo un System che gestisce eventi-non-intent? O è davvero altro?

## Quando rivalutarla
Ad auction.completed e contract.completed: se le conseguenze automatiche di
aste e contratti si esprimono naturalmente come Policy, H-006 si rafforza. Se
invece "Policy" si rivela solo un altro nome per "System che gestisce un evento
derivato", H-006 si scarta — e avremo imparato che non serviva un secondo ruolo.

## Nota di disciplina
NON implementata. Il codice di 0022 resta col reduce predittivo: funziona, 8
test verdi, e con UN solo automatismo (draft.completed) non c'e' ancora la
duplicazione-su-scala che giustifica un nuovo ruolo (#7: due usi). Quando un
SECONDO automatismo (auction o contract) ripresentera lo stesso attrito, allora
H-006 avra i due usi per meritare un esperimento su branch.
