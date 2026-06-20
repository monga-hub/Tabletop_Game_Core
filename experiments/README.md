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

## Metrica chiave: sensibilità del design
Non "chi vince", ma quanto DIVERGONO gli agenti. Se strategie diverse fanno le
stesse scelte, il design offre poche decisioni reali (le carte aggiungono numeri,
non decisioni). Se divergono, ci sono trade-off veri.

## Serie storica

| Commit | Scenario | Nota | Sensibilità |
|--------|----------|------|-------------|
| 0028 | draft base (3p, 2 carte, mazzo 16) | i 3 agenti STRATEGICI collassano (tutti 3.67★); solo random diverge | 0.498* |

*la sensibilità 0.498 è quasi tutta random-vs-gruppo. I tre agenti strategici
sono identici: nel draft attuale la strategia NON conta. È il baseline contro cui
misurare se i contratti creeranno un trade-off reale.
