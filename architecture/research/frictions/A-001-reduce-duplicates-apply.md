# A-001 — reduce duplica la logica di apply per emettere conseguenze derivate

**Tipo:** attrito (osservazione del codice, NON ancora una diagnosi)
**Osservato in:** commit 0022 (draft.completed)
**Status:** aperto — nessuna ipotesi ancora corroborata

## L'attrito (cosa il codice ha mostrato)
Per emettere `draft.completed` quando l'ultimo pick rende vera "ogni giocatore ha
N carte", il `reduce` del pick-system deve calcolare lo stato FUTURO:

    // reduce (predittivo)
    countAfter[player] = (pickedCards[player]?.length ?? 0) + 1;
    if (ogni player >= N) emit(draft.completed)

    // apply (reale, dopo)
    pickedCards[player].push(card)

La stessa logica di conteggio esiste in due posti: una predittiva (reduce), una
reale (apply). Il codice oppone resistenza qui: per sapere COSA emettere, reduce
deve anticipare cosa apply farà.

## Cosa NON sappiamo ancora
Questo attrito NON ha ancora una causa accertata. Possibili cause (ipotesi):
- responsabilità mal distribuita (serve un attore diverso) → H-006 (Policy)
- reduce dovrebbe essere puro e lavorare su eventi già applicati → H-007
- il taglio validate/reduce/apply è sbagliato → H-008
- oppure il codice del dominio è semplicemente ancora incompleto (nessuna
  riorganizzazione necessaria, solo un caso isolato)

## Ipotesi che cercano di spiegarlo
- **H-006** — le conseguenze automatiche sono Policy (Eventi+Stato→Eventi), non System.
- (H-007, H-008: nominate ma non ancora scritte — si scrivono se l'attrito si ripresenta)

## Stato del debito
Il codice di 0022 resta col reduce predittivo. Funziona (8 test verdi). L'attrito
è documentato ma NON risolto: si scioglie quando un secondo automatismo
(auction.completed, contract.completed) ripresenterà lo stesso attrito e darà i
due usi per scegliere fra le ipotesi.

## Se un'ipotesi viene scartata
Questo attrito RESTA. Scartare H-006 non cancella A-001: cancella una spiegazione.
Il problema rimane documentato, le altre ipotesi restano candidate.
