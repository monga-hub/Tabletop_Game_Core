# Experiments — serie storica del game design

Ogni commit significativo del REGOLAMENTO produce un benchmark: la batteria
congelata di agenti gioca migliaia di partite, e le metriche vengono salvate qui.
Confrontando i report nel tempo si vede come cambia il COMPORTAMENTO DEL GIOCO —
non dello strumento.

## Le due regole

1. **La batteria di agenti è congelata** (random, greedy-stars, greedy-species,
   balanced). Sono lo strumento di misura, come un microscopio. Non si modificano
   quando si studia una meccanica nuova, altrimenti i risultati non sono più
   confrontabili nel tempo. Aggiungere un agente = ricominciare la serie storica.

2. **Un benchmark per commit.** Un commit di regolamento non è "finito" finché
   non ha prodotto il suo report. Ogni commit produce codice E evidenza.

## Metrica PRIMARIA: esiste un ordine totale delle carte?

La domanda di design fondamentale (attorno a cui ruota tutta la ricerca sul draft):
**esiste una carta sempre migliore, o il valore emerge dal contesto?**

Per ogni coppia di carte (A,B), si misura quante volte A è scelta vs B quando
ENTRAMBE erano disponibili. Se è sempre 100/0 → ORDINE TOTALE: classifica fissa,
il gioco aggiunge numeri. Se compaiono coppie miste (55/45) → il CONTESTO conta:
il gioco crea trade-off (dissociazione di Knizia). `isTotalOrder` è la metrica
primaria; ogni meccanica nuova va giudicata su "ha prodotto la prima coppia
contesa tra agenti strategici?".

## Metrica secondaria: sensibilità del design
Non "chi vince", ma quanto DIVERGONO gli agenti. Se strategie diverse fanno le
stesse scelte, il design offre poche decisioni reali (le carte aggiungono numeri,
non decisioni). Se divergono, ci sono trade-off veri.

## Serie storica

| Commit | Scenario | Nota | Sensibilità |
|--------|----------|------|-------------|
| 0028 | draft base (3p, 2 carte, mazzo 16) | i 3 agenti STRATEGICI collassano (tutti 3.67★); solo random diverge | 0.498* |
| 0029 | ordering del draft base | **ORDINE TOTALE** per tutti e 3 gli agenti strategici (0 coppie contese su 75). random: 120/120 contese (controllo: lo strumento sa rilevarle) | totale |

*la sensibilità 0.498 è quasi tutta random-vs-gruppo. I tre agenti strategici
sono identici: nel draft attuale la strategia NON conta. È il baseline contro cui
misurare se i contratti creeranno un trade-off reale.
