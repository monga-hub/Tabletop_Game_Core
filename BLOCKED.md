## BLOCCO — dominio

Aperto il: 2026-06 — a partire dal commit: 7ae8698 (0036, ultimo valido)

### Fatto che stavo cercando di rendere eseguibile
Il completamento dei contratti (Fase 3 — Mercato, regolamento canonico):
per ogni carta-contratto in mano, se il Banco contiene i pesci richiesti,
completare il contratto consumando quei pesci. Il verbo è deterministico e
locale (deciso insieme: la scelta vive nel Draft e nelle aste, non qui).

### Perché non posso proseguire
Per completare un contratto serve sapere **quali pesci richiede**. Il modello
`Card` non ha questo dato: ha `species` e `stars` (assi sperimentali per il
draft) e `auctionValue` (attributo di dominio). Non ha i `requirements` —
l'insieme di gettoni-pesce (`FishSpecies`: polpo/gambero/mollusco/branzino/
sardina) che il contratto richiede.

A differenza di `auctionValue` (un singolo numero, un attributo della carta),
i `requirements` SONO il contratto: sono il cuore del contenuto della carta,
non un suo dettaglio. Inventarli con valori di laboratorio non è l'equivalente
di `auctionValue` di prova — è inventare metà del mazzo, cioè progettare il
gioco. È esattamente ciò che il laboratorio ha deciso di non fare.

Conseguenza sul benchmark previsto (`conflictObserved`: due contratti
competono per lo stesso pesce?): su carte inventate risponderebbe a "quanto
competono le carte che mi sono inventato", una domanda senza valore. Su carte
reali risponde a "nel vero Pescaria, quanto spesso i contratti competono" —
la domanda di design che vogliamo. La metrica è la stessa; su un mazzo finto
non misura Pescaria. (È anche un rischio tipo A-005: generare requirements
"perché i conflitti siano possibili" significherebbe progettare il mazzo per
ciò che il simulatore dovrebbe mostrare.)

### Domanda precisa per il progettista (decidibile)
Il modello `Card` deve essere allineato alla V3 per gli attributi che il
regolamento usa nel completamento — almeno `requirements: Record<FishSpecies,
number>`. Servono le **carte reali** (anche solo un sottoinsieme, non tutte le
99), con requirements reali, presi dal contenuto di Pescaria.

Concretamente, una delle due:
  (a) fornire un sottoinsieme di carte reali della V3 (id, requirements in
      gettoni-pesce, ricompensa, categoria, valore d'asta) da inserire nel
      modello come mazzo reale, accanto o al posto di `sampleDeck()`;
  (b) confermare che per ora va usato un sottoinsieme ridotto ma comunque
      tratto dalle carte vere, e indicare quali.

### Cosa NON ho deciso al posto tuo
- Non ho inventato i `requirements` (né casuali, né "neutri", né orientati a
  produrre conflitti).
- Non ho aggiunto il campo al modello con valori di prova.
- Non ho scritto il completamento né il benchmark.

### Stato del repository
Pulito. Ultimo commit valido: 7ae8698 (0036). Niente di non committato
tranne questo BLOCKED.md e la nota README (invariante di conservazione del
pesce, vedi sotto). Il framework è pronto: tutti i verbi fino all'acquisto
sono eseguibili. Il prossimo verbo è il primo che dipende dal CONTENUTO reale
delle carte — non più solo dalla struttura.
