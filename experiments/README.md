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
| 0031 | Scenario B — collection (3p, 4 carte, mazzo 16) | A-005: con 2 carte a testa (Scenario A) nessuna meccanica che richieda 3+ carte della stessa specie è raggiungibile per costruzione. Scenario B affianca il baseline, non lo sostituisce. Nessuna meccanica nuova in questo commit: solo cardsPerPlayer 2→4 | 0.219 |
| 0031 | ordering su Scenario B | **ORDINE TOTALE** regge anche con mani più grandi (0 coppie contese su 114 per i 3 agenti strategici). random: 120/120 contese (controllo). Punto di riferimento PRIMA di introdurre i contratti (0032): se l'ordine si romperà, sapremo che non è un effetto della sola dimensione della mano | totale |
| 0032 | Contracts S0 su Scenario B | star-hist e ordering benchmark: **invariati rispetto a 0031** — risultato garantito per costruzione (il contratto valuta dopo che i pick sono decisi, nessun agente lo conosce), non un'osservazione. L'osservazione reale è sugli ESITI: random completa il contratto nel 7.7% delle partite (77/1000, controllo); i 3 agenti strategici **0/1000** ciascuno. Spiegazione verificata nel codice, non ipotizzata: greedy-species evita le specie già possedute per costruzione; balanced ha un bonus novità che domina le stelle; greedy-stars è cieco alla specie ma il mazzo non è rimescolato, quindi a parità di stelle vince sempre il primo candidato nell'ordine del mazzo (tonno prima di sardina) | n/a — nessuna nuova metrica di sensibilità, solo tasso di completamento |

*la sensibilità 0.498 è quasi tutta random-vs-gruppo. I tre agenti strategici
sono identici: nel draft attuale la strategia NON conta. È il baseline contro cui
misurare se i contratti creeranno un trade-off reale.

## Scenario A vs Scenario B

Due scenari distinti, entrambi vivi, nessuno sostituisce l'altro:

- **Scenario A — baseline** (`cardsPerPlayer = 2`, run-benchmark.ts / run-ordering.ts):
  studia il draft minimale. Resta congelato.
- **Scenario B — collection** (`cardsPerPlayer = 4`, run-benchmark-collection.ts /
  run-ordering-collection.ts): nasce per rendere osservabili meccaniche di
  collezione (A-005). Con 3 carte la mano coinciderebbe quasi col contratto
  stesso (solo completato/non completato); con 4 compare un minimo di spazio
  decisionale (tengo una carta forte o la terza sardina?).

I contratti (0032) verranno valutati su Scenario B, non sul baseline.

## Nota metodologica su 0032

L'osservazione "i 3 agenti strategici non completano mai il contratto S0,
random sì" è supportata da **un solo caso** (un contratto, uno scenario).
Non è promossa a pattern, principio o regola di design. Se in futuro un
secondo contratto diverso mostrerà la stessa regolarità su agenti deterministici
con bias di selezione (preferenza fissa per specie/ordine), allora — e solo
allora — varrà la pena chiedersi se promuoverla. Per ora resta un'osservazione
singola, spiegata dal codice degli agenti, non una legge del game design.
