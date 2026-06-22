# Esperimento 0040 — Conflitti tra contratti (mazzo 2026)

## Domanda

Il dataset 2026 **ammette** stati conflittuali? Cioè: esistono stati
**costruibili** sul dataset in cui l'insieme dei contratti completati dipende
dall'ordine di risoluzione?

Il verbo è "ammette", non "contiene" né "genera": lo stato è costruibile sul
dataset, non prodotto dal gioco. La domanda incorpora il metodo
(stati costruiti per campionamento) di proposito, così resta distinta dal
futuro esperimento "il GIOCO quanto spesso genera stati conflittuali?", che
avrà la stessa apparenza ma metodo e significato diversi.

Due classi di esperimento, da non confondere:
- **esistenza** (questo): la risposta è sì/no.
- **distribuzione** (futuro): la risposta è una misura ("quanto spesso durante
  una partita"). Non ancora possibile: richiede mani e banchi prodotti dal
  gioco reale (draft + asta).

## Metodologia

- Dataset fissato: mazzo 2026 (97 carte).
- "Stato conflittuale" = definizione di **dominio**: esistono ≥2 insiemi di
  contratti completati al variare dell'ordine della mano (calcolato su tutte
  le permutazioni). NON la definizione procedurale legata alla policy.
- 100.000 campioni (mano di 4 carte distinte + banco) generati in modo
  **dichiaratamente arbitrario**. Il campionamento arbitrario è valido per una
  domanda di esistenza (basta trovarne uno) e NON per una di densità (il
  numero dipenderebbe dal campionamento).

## Osservazione

Il risultato è: **sì** — il dataset 2026 ammette stati conflittuali.

Il numero (38.441 su 100.000 campioni arbitrari) **non è il risultato**: è un
artefatto del protocollo. Serve solo a poter rispondere "sì" con confidenza —
perché il fenomeno è costruibile in molti modi, non per un singolo esempio
fortunato. Se i campioni conflittuali fossero stati 1, la risposta sarebbe
comunque "sì"; se 0, "no". È la soglia 1, non la frazione, a decidere.

Un esempio: mano {97, 19, 11, 35} con banco {polpo:3, gambero:4, mollusco:4,
branzino:3, sardina:2}.

La frazione 38.44% è **sul campione arbitrario**, e NON è il tasso del gioco:
le mani e i banchi qui non sono prodotti dal draft e dall'asta reali, ma
estratti a caso. Darle peso significherebbe leggerla come una distribuzione,
che è la domanda che questo esperimento NON pone.

## Interpretazione

Confinata alla sola domanda che decide qualcosa di già aperto: serve una
Policy di completamento (un risolutore che cerchi il "miglior insieme" invece
di completare in ordine di mano)?

Il fenomeno che renderebbe una Policy *non inutile* esiste: il mazzo 2026 può
produrre stati dove l'ordine di completamento cambia quali contratti si
chiudono. Quindi la Policy non è esclusa a priori — non siamo nel caso "0
conflitti, la Policy non servirà mai".

Questo è quanto. Se la Policy serva *davvero* dipende da quanto spesso il
**gioco** (non il campionamento arbitrario) genera questi stati, e quel numero
non è ancora misurabile. L'esistenza non implica la necessità: implica solo che
la domanda sulla densità è sensata da porsi quando il gioco la renderà
misurabile.

## Conseguenze

- La domanda di densità ("quanto spesso il gioco genera stati conflittuali")
  diventa sensata, ma resta **non misurabile** finché la pipeline non produce
  mani e banchi reali (draft reale + asta → integrazione causale). È un
  prerequisito, non un prossimo passo deciso.
- La Policy di completamento NON va costruita ora: l'esistenza del fenomeno non
  è osservazione che la batteria attuale ne soffra. Stessa disciplina del
  ContractAgent: la Policy nasce quando un'osservazione sul gioco mostra che la
  policy "ordine di mano" produce esiti che contano — non prima.

## Nota di metodo (perché questo è il primo "esperimento")

Primo commit del repository con la forma: algoritmo → esperimento → dato
osservato → interpretazione. La disciplina seguita: domanda scritta PRIMA del
codice; osservazione separata dall'interpretazione; interpretazione confinata
a una decisione già aperta, senza estendersi a "cosa significa per il design"
né a previsioni sul prossimo passo. Il valore del commit non è il numero
(38.44% non è nemmeno un numero sul gioco): è la forma con cui il simulatore
inizia a produrre conoscenza sul dominio.
