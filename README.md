# Framework (event-sourced game engine)

Un runtime event-sourced per giochi. **Non conosce nessun gioco.**
Pescaria sarà solo il primo cliente reale; il Coin Game è il cliente minimo
che dimostra la generalità del motore.

## Principio guida
> Se cancellassi il gioco da questo repository, questa classe avrebbe ancora senso?
> Se no, non appartiene al framework.

## Struttura
- `architecture/`  — la specifica (Glossary, Core Spec, Protocol, Modules, Projections, Design Principles). Il codice si conforma a questi, non il contrario.
- `packages/core/` — tipi fondamentali: Event, Intent, Entity, Component, System, Projection.
- `packages/session/` — la Session: orchestra il ciclo, possiede il log, ricostruisce lo stato.
- `examples/coin-game/` — il primo gioco, ridicolo apposta.
- `examples/pescaria/` — (futuro) il gioco vero, accanto al coin-game, non al posto suo.
- `tests/` — il test fondante Replay == Stato. **Deve essere verde ogni giorno.**

## Il test fondante
```
tsx tests/replay-equals-state.ts
```
Costruisce uno stato, lo ricostruisce dal log, confronta byte per byte.
Se un giorno diventa rosso, un principio fondante è stato violato.

## Stato attuale
- [x] Core: tipi (Event, Intent, Entity, System, Projection)
- [x] Session: ciclo intent→validate→emit→apply, replay deterministico
- [x] Projection banale (Counter)
- [x] Coin Game (primo modulo)
- [x] Test fondante VERDE
- [ ] Core Protocol: livelli core.* e economy.*
- [ ] examples/pescaria
