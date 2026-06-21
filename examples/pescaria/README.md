# Pescaria — riferimento di dominio

Decisione di dominio (non di architettura): quale regolamento di Pescaria
il simulatore rende eseguibile.

## La decisione (corrente)

**Fonte canonica unica: `rules/regolamento.md`** (riconciliazione 2026).

È un documento unico che risolve le divergenze tra le versioni precedenti.
Il simulatore rende eseguibile quel testo, un fatto alla volta. Quando un
commit dichiara di rendere eseguibile un "fatto già deciso", il fatto si
trova lì.

Ciò che il regolamento non menziona resta fuori dal simulatore per assenza,
non per decisione separata. In particolare le Carte Serenissima e il sistema
d'asta a esse associato non compaiono nel 2026: restano fuori scope.

### Storia della decisione (superata, conservata per tracciabilità)

Prima del 2026 la decisione era "struttura della partita dalla V1, contenuto
di carte e Migliorie dalla V3", perché esistevano due documenti distinti e
non riconciliati. Il regolamento 2026 li unifica, quindi quella divisione
non è più necessaria. I commit fino a 0034 sono stati fatti sotto la vecchia
decisione e restano validi: il 2026 conferma la struttura che stavano già
implementando (4 giornate, fasi Pesca → Aste → Mercato → Fine Giornata).

## Struttura della partita (dal regolamento canonico)

```
Setup → Pesca del Mattino → Aste → Mercato → Fine Giornata → (×4 giornate)
```

La Pesca del Mattino comprende Rifornimento (pesca) e Draft. La partita dura
4 Giornate.

Conseguenza: tutto il lavoro già fatto (Draft, Hands, Contracts S0, agenti,
benchmark, replay) resta valido. Non va ripensato per questa decisione.

## Conseguenza pratica per i prossimi commit

La domanda guida non è "quale meccanica implementiamo", ma:

> Qual è la prossima trasformazione di stato prescritta da
> `rules/regolamento.md` che il simulatore non sa ancora eseguire?

Ogni commit continua a rendere eseguibile un fatto già deciso, non ad
anticipare una direzione di design ancora aperta (vedi
`architecture/research/README.md` per la disciplina attrito → ipotesi →
esperimento che governa questo).

## Criterio di lavoro: cosa entra in una trasformazione

Regola di lavoro concreta per questo progetto (non un principio generale
del laboratorio). A ogni commit, per ogni informazione che il regolamento
fornisce sulla fase in corso, farsi questa domanda:

> Questa informazione modifica il risultato della trasformazione di stato
> che sto implementando ORA? Se invertissi/omettessi questa informazione,
> lo stato finale cambierebbe?

- **Sì** → entra nel commit.
- **No** → appartiene al dominio, ma non a questa trasformazione. Non viene
  negata né dimenticata: aspetta il commit in cui diventerà causalmente
  rilevante (di solito quando un'altra trasformazione dipenderà da essa —
  es. l'ordine di turno diventerà rilevante quando un effetto dovrà
  applicarsi "al giocatore successivo", o quando un pareggio dovrà essere
  risolto da chi è più vicino al primo giocatore).

Esempio applicato (0034, `__hands__ → __offers__`): "la carta lascia la
mano" cambia il risultato → entra. "La carta è giocata coperta" e "l'ordine
è orario" non cambiano lo stato finale di QUESTA trasformazione → non
entrano oggi, anche se sono fatti del regolamento già noti e non in
discussione.

## Stato

Decisione presa. Non è un'ipotesi né un attrito: è una scelta di dominio,
con l'autorità di chi progetta Pescaria, non del simulatore.

## Osservazione progettuale (non attrito, non ipotesi)

Oggi il simulatore modella lo stato completo della partita, non la
conoscenza dei giocatori. Termini del regolamento come "coperta" (la carta
puntata all'asta) descrivono un vincolo sul processo decisionale — nessun
giocatore deve poter rivedere la propria scelta dopo aver visto le altre —
non una proprietà che lo stato interno deve portare. Finché nessun agente
osserva uno stato parziale (`agent.observe`, `policy.visibleState`), il
mondo simulato e ciò che un agente può conoscere di esso coincidono, e la
distinzione tra i due non è ancora un requisito. Diventerà un'estensione
architetturale rilevante il giorno in cui il comportamento di un
componente dipenderà davvero dalla visibilità parziale dello stato — non
prima.
