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

### Procedura di lavoro (per Pescaria — supportata dai commit 0030–0035)

Per implementare nuove meccaniche di Pescaria:

1. apri `rules/regolamento.md`;
2. individua il primo verbo che prende in ingresso uno stato **già
   rappresentato** dal simulatore (es. `__auctionRanking__`, `__hands__`);
3. ignora tutto il resto;
4. implementa esclusivamente quella trasformazione.

Questa procedura descrive fedelmente cosa è stato fatto dal 0030 al 0035,
anche quando non era ancora esplicitata. **Resta locale a Pescaria di
proposito**: è supportata da un solo progetto (sei commit consecutivi, stesso
gioco, stesso regolamento già abbastanza lineare). Non è ancora una regola del
protocollo generale dell'agente (`CLAUDE.md`), perché non sappiamo se un
secondo progetto — con un regolamento meno lineare, o dove le trasformazioni
nascono prima del regolamento — richiederà la stessa disciplina. Si promuoverà
a regola generale solo il giorno in cui un secondo progetto, spontaneamente,
ci porterà a lavorare di nuovo per verbi del regolamento — non perché sembri
una buona idea.

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

Esempio applicato (0035, `__offers__ + __draft__.order → __auctionRanking__`):
l'ordine di turno — rimandato in 0034 — entra ORA, perché la risoluzione dei
pari ("vince chi è più avanti nell'ordine partendo dal Primo Giocatore") non è
definibile senza di esso. È il caso previsto al 0034: un fatto rimandato entra
quando un'altra trasformazione comincia a dipenderne. Non si è introdotto uno
stato `__firstPlayer__` separato: per la PRIMA asta della giornata il Primo
Giocatore è ancora quello iniziale, e `__draft__.order` — che parte da lui — lo
rappresenta già. Il segnalino entrerà nello stato solo nel commit in cui dovrà
cambiare (seconda asta). NON sono entrati: rilancio in Ducati (nessun agente
può rilanciare, vale 0 per tutti), bonus Esperienza (miglioria assente),
acquisto del pesce (trasformazione successiva).

Esempio applicato (0036, `__auctionRanking__ + __stoccaggio__ → __banks__`):
il vincitore prende il lotto → entra (movimento di risorsa puro). NON entrano:
i Ducati e il pagamento (il movimento del pesce è distinto dal pagamento, come
il rilancio era distinto dalla determinazione del vincitore), la scelta di
"quanti pesci" (introdurrebbe un Intent e toccherebbe la batteria congelata —
semplificazione dichiarata: il vincitore prende tutto), gli altri acquirenti,
la capienza del Banco, gli scarti. Il Banco nasce come stato qui, residuo
della trasformazione, non introdotto in anticipo.

## Invariante di dominio: conservazione del pesce

Il pesce non viene creato né distrutto durante la partita: cambia solo
collocazione. È una proprietà di Pescaria, vera indipendentemente da come il
simulatore la verifica e da qualunque semplificazione di un singolo commit.

Oggi la somma è `sacchetto + stoccaggio + banchi = 100`. La forma si
allargherà man mano che il pesce acquisisce nuove collocazioni (Cesta,
scarti, contratti consumati): `sacchetto + stoccaggio + banchi + ceste +
scarti + ... = 100`. L'invariante non cambia — cambia la sua rappresentazione,
perché il dominio rappresentato diventa più ricco.

Nota implementativa (deliberata): non esiste un "test dell'invariante" né un
helper `assertFishConservation`. Esiste un test dell'acquisto (0036,
`tests/purchase.ts`) che *incidentalmente* contiene un controllo di
conservazione. Responsabilità locale, una sola occorrenza: l'astrazione
(funzione/helper/categoria di test dedicata) nascerà solo quando una seconda
trasformazione del pesce (Cesta, scarti) conterrà lo stesso controllo — non
prima. Stessa disciplina "due casi prima dell'astrazione" applicata ai test.

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

## Biforcazione del modello della carta (0035)

Da quando esiste il regolamento canonico, il `CardModel` porta due
rappresentazioni della carta con scopi distinti, e per ora convivono:

- **Rappresentazione sperimentale e parziale** (`species`, `stars`): non
  descrive *per intero* la carta del regolamento, ma non per questo è falsa —
  è parziale. Sono assi introdotti per studiare il draft — hanno congelato la
  batteria di agenti e prodotto le osservazioni di 0027-0034. Nel regolamento
  la carta non "è" di una specie: è un Cliente il cui contratto *richiede*
  certi pesci (gettoni nel sacchetto). `species`/`stars` sono strumenti di
  laboratorio: finché rispondono bene alla domanda per cui esistono (far
  emergere preferenze negli agenti), non c'è motivo di rimuoverli.
- **Rappresentazione di dominio** (`auctionValue`): il Valore d'Asta del
  regolamento (cap. 5), uno dei quattro attributi distinti della carta
  (Contratto, Ricompensa, Valore d'Asta, Categoria). Per ora con valori di
  laboratorio, non quelli reali delle 99 carte.

Questa non è una contraddizione da risolvere fondendo i due, ed è la ragione
per cui NON si tocca `stars`/`species` ora: rimuoverli prima che un modello
di dominio sia abbastanza ricco da sostituirli distruggerebbe la continuità
sperimentale (stesso principio già applicato a benchmark e agenti — non si
rimuove uno strumento prima che esista il suo sostituto). La domanda "species
e stars sono ancora necessari?" è prematura finché il modello di dominio non
sarà completo.

Conseguenza su S0 (0032): il contratto diagnostico "3 carte di specie
sardina" era costruito sull'asse sperimentale, non sul regolamento (dove non
esistono "carte sardina"). Era dichiarato un contratto di laboratorio, ha
risposto alla sua domanda, e resta un esperimento storico: non va riscritto.
