# Core Protocol v1.0 — (da scrivere)

Il protocollo di comunicazione del motore. Non un catalogo, un contratto con garanzie.

Struttura prevista:
- Parte I — Vocabulary
- Parte II — Event Types
- Parte III — Payload Contracts
- Parte IV — Delivery Rules
- Parte V — Lifecycle

Namespace (quattro livelli):
- `core.*`     — universali (intent.submitted, intent.rejected, entity.created, ...)
- `economy.*` — risorse (resource.gained, resource.spent, ownership.changed, ...)
- `pescaria.*`— dominio (draft.pick, auction.won, contract.completed, ...)
- `<variant>.*` — captain.*, fishmarket.*, ...

I primi due livelli (core, economy) sono grammatica indipendente dal gioco e
possono essere scritti senza decisioni di design. Gli ultimi due richiedono le
scelte di dominio.
