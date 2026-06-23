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

## Stato corrente (Fase A1)

Audit in corso. Tre inferenze testate finora:
- «il simulatore è single-player» → FALSA. Fase 1 (pesca, draft) e Fase 2
  (offerte, risoluzione) sono già plurali.
- «la pipeline reale è tutta single-hand» → vera ma circoscritta: solo Fase 3-4
  (contracts-completed, income, move-to-basket, install, balance).
- «l'acquisto è l'unico placeholder» → imprecisa: acquisto = placeholder
  strutturale; resolveContracts ha una decisione segnaposto (ordine di
  completamento). Due gradi di non-finito, da non fondere né tassonomizzare.

**Ipotesi che l'audit deve tentare di smentire (una sola):** la cesura tra
modello plurale e modello single-hand coincide col confine Fase 2 / Fase 3.
Smentita se: un verbo Fase 1-2 è single-hand; o un verbo Fase 3-4 è già plurale;
o la pluralità è per-verbo sparsa senza allineamento alle fasi; o l'acquisto è
l'unico ponte (un verbo-cerniera, non una linea). Verbi non ancora verificati:
offer, auction-resolution, draft-pick, install-improvements, balance-income.
