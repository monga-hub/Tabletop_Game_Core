# H-003 — Nessuna astrazione prima di due usi concreti

**Status:** corroborata (è il principio #7)
**Ultima valutazione:** continua · **Prossima rivalutazione:** ad ogni tentazione di generalizzare

## Ipotesi
Una classe/concetto entra nel framework solo se serve ad almeno DUE giochi.
Con un solo uso, vive nel suo esempio.

## Motivazione
Durante la ricerca sul draft, archetipi e metriche nati da un solo caso si
rivelarono prematuri. Generalizzare da un esempio solo è il modo tipico di
costruire la cosa sbagliata.

## Esperimento
Applicata di continuo: gli switch in coin/pescaria NON sono stati astratti in un
registry (un solo gioco li chiedeva); "phase" e "turno" tenuti in pescaria.*
finché TTT non li ha resi candidati legittimi.

## Esito
Il framework è rimasto minuscolo. Tic Tac Toe è entrato con zero modifiche.

## Evidenze a favore
- Coin/Pescaria/TTT sopra un Core non modificato.
- "phase" e "turno" ora esistono in 2 giochi → candidati alla promozione.

## Controesempi osservati
- Nessuno. (Una versione concettuale del #7 ha appena bloccato il merge di H-001:
  un solo beneficio teorico non basta a giustificare un refactoring.)

## Non ancora provata su
- il momento in cui un'astrazione sarà DAVVERO giustificata da due usi: vedremo
  se la regola la riconosce al momento giusto, non solo se blocca i casi prematuri.

## Quando rivalutarla
Quando il registry di handler avrà due giochi che lo richiedono: sarà il test se
la regola sa anche dire "sì, ora", non solo "non ancora".
