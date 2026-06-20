# Research — ipotesi architetturali

Le idee non nascono principi. Nascono ipotesi, vengono corroborate o scartate,
e solo dopo molti usi diventano principi. Questa cartella distingue i livelli:

    osservazione  →  ipotesi  →  corroborata  →  principio
                                              ↘  scartata

È lo stesso metodo del laboratorio Python (esperimenti sul draft), applicato
all'architettura. Nessuna idea salta direttamente a "è vero".

## Registro

| ID | Ipotesi | Status |
|----|---------|--------|
| H-001 | Lo stato è un ruolo di projection (decision context) | corroborata, non promossa |
| H-002 | Gli eventi registrano fatti, non ricostruzioni | corroborata |
| H-003 | Nessuna astrazione prima di due usi (principio #7) | corroborata |
| H-004 | Ownership = collocazione, non relazione | raffinata (vedi H-005) |
| H-005 | Grammatica a 3 fatti: esistenza / collocazione / relazione | ipotesi, da inseguire |
| H-006 | Le conseguenze automatiche sono Policy, non System | ipotesi (da attrito reale) |

Quando una ipotesi è corroborata su abbastanza casi diversi (incluse aste,
multiplayer, persistenza, AI su molte partite), si valuta la promozione a
principio in `05-design-principles.md`. Una promozione è una decisione, non
automatica.
