# Ipotesi: identità sistemica delle famiglie di Migliorie

> **Queste NON sono proprietà del gioco. Sono ipotesi sul ruolo sistemico
> delle famiglie di Migliorie.** Il simulatore può confermarle o smentirle.
> Non vanno iscritte nel dataset (`cards/`) né lette dal simulatore: vivono
> qui, fuori da entrambi, proprio perché il dato possa raggiungerle e
> demolirle. È la stessa lezione di `conflictObserved`: l'errore non è avere
> una teoria, è metterla dentro l'algoritmo (o dentro il dato).

## Tre livelli da non confondere

1. **Dato** (`cards/2026/deck.json`): fatti grezzi. La carta 54 ha asta=6,
   reward=17, requirements={...}, improvement="Fiuto per il Pescato". Nessuna
   interpretazione.
2. **Regolamento** (`rules/regolamento.md`, legenda del mazzo): cosa *fa* una
   miglioria. "Esperienza genera 1 Ducato Influenza a inizio giornata,
   spendibile in asta per +1 Valore d'Asta." Questo è un fatto del dominio,
   non un'ipotesi.
3. **Ipotesi di design** (questo documento): a cosa *serve sistemicamente*
   una famiglia. "Esperienza aumenta la forza in asta." Questa è una
   compressione interpretativa dell'effetto del regolamento, e può essere una
   cattiva sintesi. È falsificabile.

La differenza tra 2 e 3 è il punto: il livello 2 dice cosa fa il meccanismo,
il livello 3 ipotizza quale RUOLO gioca nella partita. Il simulatore può
mostrare che il ruolo osservato è diverso da quello ipotizzato.

## Le ipotesi (mazzo 2026)

| Famiglia | Effetto (regolamento, liv. 2) | Ipotesi sul ruolo (liv. 3, falsificabile) |
| --- | --- | --- |
| ⚓ Banco Ampliato | +1 spazio Banco per copia (Fase 1) | aumenta la capacità produttiva |
| ⚓ Fiuto per il Pescato | pesce automatico a inizio giornata (Fase 1) | riduce la dipendenza dalla pesca/asta |
| 🔨 Esperienza | 1 Ducato Influenza → +1 Valore d'Asta (Fase 2) | aumenta la forza in asta |
| 🔨 Nuovi Clienti | perdi un'asta → peschi e scegli carte (Fase 2) | riduce il costo delle aste perse |
| 💰 Contrattazione Sottobanco | +1 sostituzione 2-pesci→1 per copia (Fase 3) | aumenta l'efficienza di conversione del pesce |
| 💰 Favorito della Gilda | bonus Ducati sui contratti di un tipo scelto (Fase 3) | premia la specializzazione |
| ⚖ Maestri / Banco Equilibrato | +Ducati a Fine Giornata su condizioni di set (Fase 4) | monetizzano il motore costruito |

## Come il simulatore le mette alla prova

Ogni ipotesi del livello 3 è una previsione su come la famiglia verrà
*usata*, non su cosa fa. Esempi di osservazioni che le confermerebbero o
demolirebbero, quando il simulatore eseguirà partite sul mazzo reale:

- Se "Esperienza" viene installata spesso ma il suo effetto sulle vittorie in
  asta è trascurabile → l'ipotesi "aumenta la forza in asta" non regge: forse
  il suo ruolo reale è un altro (es. costruire un motore economico). Non
  sarebbe una sconfitta dell'ipotesi: sarebbe un risultato di design.
- Se "Favorito della Gilda" viene scelto a prescindere dalla composizione
  della mano → "premia la specializzazione" è da rivedere.

Il valore di questo documento sta nel poter dire, davanti a un risultato:
"la mia ipotesi era X; i dati la supportano / la smentiscono" — invece di
poter dire solo "curioso". L'esperimento ha bisogno di una domanda; queste
sono le domande.

## Stato

Ipotesi non ancora testate. Nessuna è stata confermata né smentita dal
simulatore: le partite sul mazzo reale non sono ancora state eseguite. Da
trattare come previsioni aperte, non come descrizioni del gioco.
