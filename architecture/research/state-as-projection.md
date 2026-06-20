# Ricerca: lo stato come projection (scoperta sui ruoli)

Status: **verificato, non implementato.** Codice su branch `research/state-as-projection`.

## La domanda
Lo "stato" della Session è un concetto primitivo, o è una projection del log
come Audit e Wallet?

## L'esperimento
Riscritta la Session senza campo `state`: lo stato derivato da una
`StateProjection` che osserva il log. Tutta la suite resta verde.

## L'esito — e la scoperta vera
Lo stato **non è** primitivo: si può derivare dal log come ogni projection.
Ma la scoperta importante è più precisa di così.

La `StateProjection` **non è una projection come le altre.** I System leggono da
lei per validare e ridurre; nessuno valida guardando Audit o Wallet. Quindi una
projection da cui dipende la validazione è speciale.

> Il framework non distingue tra **Stato** e **Projection**.
> Distingue tra **ruoli** di projection.

Lo stato è la projection con il ruolo **decision context**: l'unica autorizzata
a informare `validate`. Audit, Wallet, Solver, Replay non hanno quel ruolo —
osservano soltanto.

```
Projection
   ├── ruolo: decision context   →  StateProjection   (informa validate)
   └── ruolo: observer            →  Audit, Wallet, Solver, Replay
```

## Il costo emerso
L'esperimento introduce una **dipendenza dall'ordine di osservazione**: la
StateProjection deve osservare un evento prima che i System riducano il
successivo. È il primo costo temporale del framework. Non un difetto — un costo,
da pagare solo quando serve.

## La decisione
Non si fonde su `main`. È un'ipotesi architetturale **verificata ma non ancora
necessaria** — una cosa rara e preziosa. Si riprende quando un caso reale
(probabilmente le aste o i contratti) renderà il ruolo "decision context"
chiaramente utile.

Principio #7 a livello concettuale: *nessun refactoring concettuale con un solo
beneficio teorico.* La scoperta è conservata; l'implementazione attende di
guadagnarsi il diritto di stare su main.
