# H-001 — Lo stato è un ruolo di projection, non un concetto primitivo

**Status:** corroborata (non promossa a principio)
**Ultima valutazione:** prima sessione di implementazione · **Prossima rivalutazione:** all'arrivo delle aste/contratti

## Ipotesi
Il framework non distingue tra "Stato" e "Projection": distingue tra *ruoli* di
projection. Lo stato è la projection col ruolo **decision context** — l'unica
autorizzata a informare `validate`.

## Motivazione
"Tutto è una projection del log" aveva un'eccezione: lo stato. Se l'eccezione
cadesse, la regola sarebbe universale.

## Esperimento
Branch `research/state-as-projection`: Session riscritta senza campo stato; lo
stato derivato da una StateProjection che osserva il log.

## Esito
La suite (7 test) resta verde. Lo stato NON è primitivo. Ma la StateProjection
non è come le altre: i System leggono da lei per validare. L'eccezione non è
eliminata — è diventata un *ruolo*.

## Evidenze a favore
- Coin Game, Tic Tac Toe, frammento di Pescaria (draft): tutti verdi senza stato primitivo.
- replay e getState diventano la stessa operazione.

## Controesempi osservati
- Nessuno che falsifichi l'ipotesi. Ma emerge un COSTO: dipendenza dall'ordine
  di osservazione (la StateProjection deve osservare prima dei System).

## Non ancora provata su
- aste (più System che reagiscono allo stesso evento)
- effetti concatenati profondi
- multiplayer, persistenza reale
- AI su migliaia di partite

## Quando rivalutarla
Quando le aste richiederanno più projection che informano decisioni: lì si vedrà
se "ruoli di projection" paga davvero o se la dipendenza d'ordine costa troppo.
