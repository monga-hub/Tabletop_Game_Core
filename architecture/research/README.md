# Research — attriti e ipotesi

Separazione rigorosa tra ciò che il codice MOSTRA e ciò che pensiamo lo SPIEGHI.
È la stessa distinzione dati/interpretazione del laboratorio Python, applicata
all'architettura.

    Attrito → Ipotesi → Esperimento → Corroborazione → Principio

Un **attrito** è un punto dove il codice oppone resistenza. È un'osservazione,
non una diagnosi. Un attrito può generare più ipotesi; un'ipotesi può spiegare
più attriti. Quando un'ipotesi viene scartata, l'attrito resta: non si perde il
problema, solo una spiegazione.

## frictions/ — cosa il codice ha mostrato

| ID | Attrito | Status |
|----|---------|--------|
| A-001 | reduce duplica la logica di apply per le conseguenze derivate | aperto |
| A-002 | legalIntents ricalcolato integralmente a ogni passo (performance) | aperto |
| A-003 | il simulatore sonda chi non può muovere (turno non esposto) | aperto |
| A-004 | validate non sa enumerare le mosse legali | aperto |
| A-002 | legalIntents ricalcolato integralmente a ogni passo (performance) | aperto |
| A-003 | il simulatore sonda il turno invece di conoscerlo | aperto |
| A-005 | lo scenario baseline (cardsPerPlayer=2) rende irraggiungibile per costruzione qualunque meccanica che richieda ≥3 carte della stessa specie in mano (es. contratti di collezione) | osservato — risolto creando uno scenario affiancato, non modificando il baseline |

## hypotheses/ — cosa pensiamo lo spieghi

| ID | Ipotesi | Status | Spiega |
|----|---------|--------|--------|
| H-001 | Lo stato è un ruolo di projection (decision context) | corroborata, non promossa | — |
| H-002 | Gli eventi registrano fatti, non ricostruzioni | corroborata | — |
| H-003 | Nessuna astrazione prima di due usi (#7) | corroborata | — |
| H-004 | Ownership = collocazione, non relazione | raffinata (→H-005) | — |
| H-005 | Grammatica a 3 fatti: esistenza/collocazione/relazione | ipotesi | — |
| H-006 | Le conseguenze automatiche sono Policy, non System | ipotesi | A-001 |

Promozione a principio = decisione esplicita, mai automatica. Un'ipotesi diventa
principio solo dopo corroborazione su casi diversi (incluse aste, multiplayer,
persistenza, AI su molte partite).
