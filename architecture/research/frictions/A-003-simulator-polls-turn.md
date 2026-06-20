# A-003 — Il simulatore non sa di chi è il turno; lo scopre per tentativi

**Tipo:** attrito di design dell'interazione simulatore ↔ dominio
**Osservato in:** simulatore, 1000 partite (commit ~0025)
**Status:** aperto

## L'attrito
Il simulatore interroga TUTTI gli agenti a ogni giro. Ma il turno è deciso dal
dominio: solo uno ha mosse, gli altri ricevono `[]` e passano. Funziona, ma il
simulatore "sonda" chi non può muovere. L'informazione "tocca a X" esiste nel
dominio (order del draft) ma non è esposta: il simulatore la deduce dal vuoto.

## Ipotesi candidate (nessuna scelta)
- Il dominio dovrebbe esporre `currentAgent(state)` accanto a legalIntents.
- Oppure legalIntents(agent)==[] È già il segnale corretto, e sondare va bene.
- Oppure il turno è esso stesso una projection che il simulatore può leggere.

## Quando rivalutarlo
Quando ci saranno fasi con turni NON a rotazione semplice (es. l'asta: il
capitano parla per ultimo, l'ordine dipende dalle offerte). Lì "sondare tutti"
potrebbe diventare ambiguo o sbagliato, e servirà che il dominio dichiari il
turno. Si lega a H-001 (di chi è il turno = parte del decision context?).
