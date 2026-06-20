# A-004 — validate non sa enumerare le mosse legali

**Tipo:** attrito (previsto prima dell'implementazione, poi confermato)
**Osservato in:** implementazione di legalIntents (commit ~0025)
**Status:** aperto — gestito con un metodo opzionale, da rivalutare

## L'attrito
`validate(state, intent)` risponde sì/no su UNA mossa data. Ma un simulatore (e
un agente) ha bisogno del DUALE: "quali mosse sono legali ora?". validate non sa
generarle — sa solo controllarne una. Sono due forme di conoscenza diverse:
controllare ≠ enumerare.

Per dare al simulatore le mosse legali serve un metodo NUOVO sui System
(`legalIntents`). Quindi validate da solo non bastava all'autosufficienza del
dominio rispetto alla generazione di mosse.

## Previsione vs osservazione
Questo attrito è stato PREVISTO prima di scrivere il codice (il duale di validate
è una conoscenza diversa) e poi confermato: il tipo System ha richiesto un
metodo `legalIntents?` distinto. La previsione corretta è essa stessa un dato:
suggerisce che "controllare" ed "enumerare" sono responsabilità separate.

## Ipotesi candidate (non ancora scelte)
- H-009 (non scritta): validate dovrebbe essere DERIVATO da legalIntents
  (se sai enumerare, sai controllare: validate(i) = legalIntents().contains(i)).
  Eliminerebbe la duplicazione ma forse è costoso (enumerare per controllare uno).
- Oppure: sono due metodi legittimamente distinti, nessuna riorganizzazione.

## Stato
Gestito con `legalIntents?` opzionale sul System. validate resta separato. Da
rivalutare quando le aste avranno molte mosse legali (un bid può essere
qualunque importo: legalIntents può esplodere — vedi attrito atteso sul mercato).

## Relazione con A-001
Entrambi nascono dallo stesso sospetto: forse validate/reduce/apply non sono il
taglio giusto delle responsabilità. A-001 (reduce duplica apply) e A-002
(validate non enumera) potrebbero avere una spiegazione comune. Da tenere d'occhio.
