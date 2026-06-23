# Pescaria — Roadmap operativa

Documento operativo, non concettuale. Dice cosa fare, in quale ordine, e quando
una fase è chiusa. Le ragioni dietro queste scelte vivono nelle conversazioni,
non qui.

## Fasi

**A — Consolidamento del simulatore attuale.**
Finire tutto ciò che è esprimibile col linguaggio attuale del modello. Regola:
nessuna nuova struttura del modello — solo completamenti, estensioni, verifiche.
- A1. Audit dei verbi: per ciascuno decidere uno stato fra ✅ stabile /
  🔧 estendibile / 🟡 placeholder. L'audit termina (non è un'attività
  permanente).
- A2. Correzioni residue trovate durante l'audit (commenti vecchi,
  disallineamenti, test mancanti): si sistemano subito, nessun accumulo.
- A3. Chiusura: «esiste ancora un comportamento del regolamento implementabile
  senza aumentare il linguaggio?» Sì → implementarlo. No → Fase B.

**B — Primo aumento di espressività.**
UN SOLO aumento (non tempo + multiplayer insieme). Prima si decide quale, poi lo
si costruisce. Candidate: temporalità / continuità delle giornate / estensione
della pipeline multi-giocatore. Una sola.

**C — Sostituzione dei placeholder.**
Solo dopo B (il linguaggio necessario esiste già). Es.: l'acquisto reale.

**D — Partita completa.**
Solo qui: ciclo delle giornate, partita completa, punteggio, condizioni di fine.

## Regole di lavoro

1. Ogni sessione produce almeno uno fra: un commit, un placeholder eliminato,
   un'inferenza falsificata. Altrimenti si è allungata troppo.
2. Mai due sessioni consecutive solo metodologiche. La seconda torna sul codice.
3. Nuova idea → «serve al repository o solo alla decisione di oggi?». Se solo
   alla decisione: non documentarla.
4. Le discussioni terminano con una scelta operativa, non con una teoria.
5. **Criterio di arresto**: quando la conversazione non cambia più quale codice
   si scriverà dopo, è finita. Tornare al simulatore.

## Stato corrente (Fase A1 — audit completato)

Audit dei verbi terminato. Inferenze testate e risultati:
- «il simulatore è single-player» → FALSA. Fase 1-2 già plurali.
- «la pipeline reale è tutta single-hand» → vera ma circoscritta: Fase 3-4
  (contracts-completed, income, move-to-basket, install, balance).
- «l'acquisto è l'unico placeholder» → imprecisa: acquisto = placeholder
  strutturale; resolveContracts ha una decisione segnaposto (ordine di
  completamento). Due gradi di non-finito, da non fondere né tassonomizzare.
- «la cesura plurale/single-hand coincide col confine Fase 2/Fase 3» → SMENTITA,
  e in modo importante. Non c'è una cesura: c'è una FRATTURA. Il "banco" esiste
  in DUE rappresentazioni scollegate:
    · __banks__ = Record<string,Tally> (plurale, per giocatore) — scritto da
      purchase (Fase 2);
    · __realHand__.bank = singolo Tally — letto da contracts-completed, income,
      move-to-basket (Fase 3-4).
  Sono DUE banchi diversi: purchase riempie __banks__[winner], i contratti
  consumano da __realHand__.bank, che nessun verbo dell'asta riempie. Il pesce
  vinto all'asta NON arriva ai contratti.

**Fatto strutturale (osservato, non inferito):** il simulatore è fatto di DUE
pipeline parallele MAI collegate — il troncone multi-giocatore
(pesca → asta → __banks__) e il troncone single-hand dei contratti
(__realHand__ → completamento → incasso → installazione → bilancia). La pipeline
reale è sempre stata alimentata iniettando un banco a mano nei test, mai
ricevendo il pesce da purchase. L'acquisto non è "il ponte su una cesura": è la
fine del primo troncone, il cui output (__banks__) non è mai stato connesso
all'input del secondo (__realHand__.bank).

Conseguenza per la roadmap: prima di Fase B (aumento di espressività) e Fase C
(sostituzione placeholder) c'è un lavoro di Fase A non previsto — collegare i due
tronconi, o decidere consapevolmente di tenerli separati. È esprimibile col
linguaggio attuale (entrambe le rappresentazioni esistono): è Fase A, non B.
