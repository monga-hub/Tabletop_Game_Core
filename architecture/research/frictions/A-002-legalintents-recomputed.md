# A-002 — legalIntents è ricalcolato integralmente a ogni passo

**Tipo:** attrito di PERFORMANCE (non di correttezza)
**Osservato in:** simulatore, 1000 partite (commit ~0025)
**Status:** aperto — irrilevante oggi, potenziale collo di bottiglia futuro

## L'attrito
Il simulatore chiama `legalIntents(agent)` per ogni agente a ogni passo. Ogni
chiamata enumera le mosse da zero, senza cache né incrementalità. Col draft
(poche carte) è nulla. Con un mercato che genera centinaia di mosse e migliaia
di partite simulate, diventa il costo dominante.

## Cosa NON sappiamo
Se la causa sia "manca una cache di legalIntents", o "il modello dovrebbe
calcolare le mosse incrementalmente sugli eventi", o "il simulatore dovrebbe
chiedere solo all'agente di turno" (vedi A-003), o se semplicemente non sarà mai
un problema reale. Da non risolvere finché un profilo non lo dimostra.

## Quando rivalutarlo
Quando il Solver simulerà molte partite per valutare le mosse (lì legalIntents
viene chiamato in un loop annidato): se il profilo lo segnala, si sceglie una
spiegazione.
