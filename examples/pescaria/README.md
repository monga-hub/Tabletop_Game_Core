# Pescaria — riferimento di dominio

Decisione di dominio (non di architettura): quale regolamento di Pescaria
il simulatore rende eseguibile, quando esistono più versioni del documento.

## La decisione

**Struttura della partita → Regolamento V1.**
**Contenuto delle carte e delle Migliorie → Regolamento V3.**

Sono due cose distinte e si prendono da fonti diverse, intenzionalmente.

## Cosa viene dalla V1 (struttura)

Il flusso della partita è quello della V1:

```
Setup → Pesca dei pesci → Draft delle carte → Aste → Mercato → Bilancia → Nuova giornata
```

Conseguenza: tutto il lavoro già fatto (Draft, Hands, Contracts S0, agenti,
benchmark, replay) resta valido. Non va ripensato per questa decisione.

## Cosa viene dalla V3 (contenuto)

- struttura delle Carte Cliente/Miglioria;
- le Migliorie e le loro categorie (Pesca, Aste, Clienti, Bilancia);
- gli effetti aggiornati delle Migliorie;
- il bilanciamento delle carte.

## Cosa NON viene dalla V3

Esplicitamente fuori dall'oggetto del simulatore, per ora:

- le Carte Serenissima;
- il nuovo sistema d'asta a puntata singola con scambio della Serenissima;
- il ciclo continuo delle aste (un'asta dopo l'altra, senza fasi separate);
- l'eliminazione del draft.

Questa è una direzione di design diversa rispetto a quella che il simulatore
sta rendendo eseguibile. Potrebbe diventarlo in futuro, ma non è una decisione
presa oggi: non va anticipata nel codice.

## Conseguenza pratica per i prossimi commit

La domanda guida non è più "quale meccanica implementiamo", ma:

> Qual è il prossimo fatto del regolamento V1 (struttura) — con il contenuto
> della V3 dove applicabile — che il simulatore non sa ancora eseguire?

Ogni commit continua a rendere eseguibile un fatto già deciso, non ad
anticipare una direzione di design ancora aperta (vedi
`architecture/research/README.md` per la disciplina attrito → ipotesi →
esperimento che governa questo).

## Stato

Decisione presa. Non è un'ipotesi né un attrito: è una scelta di dominio,
con l'autorità di chi progetta Pescaria, non del simulatore.
