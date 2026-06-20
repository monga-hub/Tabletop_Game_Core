# H-004 — Le zone-insieme sono projection dell'ownership

**Status:** corroborata CON CONFINE (parzialmente falsificata nella forma forte)
**Ultima valutazione:** esperimento su branch research/card-ownership · **Prossima rivalutazione:** all'implementazione di mazzo e aste

## Ipotesi (forma originale)
Le zone del gioco (draft pool, mano, mercato, scarti) non sono strutture dati
primitive. Sono projection di un unico fatto: `owner.changed`. Una carta non si
sposta mai tra contenitori — cambia solo proprietario.

## Motivazione
"Carta rimossa dal draft" non è un fatto (H-002): è una vista. Il fatto è
"ownership cambiata". Se vero, eliminerebbe metà delle strutture dati del gioco.

## Esperimento
Branch `research/card-ownership`: OwnershipSystem con un solo fatto
(`owner.changed`); le zone come query `cardsOwnedBy(x)` sulla mappa card→owner.
Rifatto il draft + scarti senza availableCards/pickedCards.

## Esito
La forma originale è TROPPO FORTE. Verificata e raffinata cercando i controesempi:

**REGGE per le zone-INSIEME:** mano, draft pool, scarto-come-mucchio. Tre zone
diverse emergono dalla stessa query, zero contenitori. Conservazione delle carte
gratis (mai distrutte, solo ri-possedute). replay==stato.

**NON REGGE per:**
- **zone-SEQUENZA** (mazzo): `owner == @deck` dà l'insieme, non l'ordine di
  pesca. Una zona ordinata è una sequenza, non un set. CONTROESEMPIO reale.
- **risorse-non-carta** (offerte d'asta): un bid è ducati promessi, non una
  carta che cambia owner. L'ownership non lo modella.

**FALSA preoccupazione (non un controesempio):** una carta con tre ruoli
simultanei (asta/ordine/miglioria). L'ownership modella DOVE sta la carta, non
COSA fa. "Cosa fa" è una regola, non una zona. Confine corretto.

## Ipotesi raffinata
Le zone-INSIEME sono projection dell'ownership. Le zone-SEQUENZA e le
risorse-non-carta richiedono altro. → Nel modello finale: usare l'ownership per
mano/pool/scarti; tenere strutture esplicite solo per mazzo (ordinato) e aste.

## Evidenze a favore
- draft pool, mano, scarto: tutte query, tutte verdi.

## Controesempi osservati
- Mazzo ordinato: la query perde l'ordine.
- Offerte d'asta: non sono ownership di carte.

## Quando rivalutarla
All'implementazione del mazzo (serve sequenza?) e delle aste (le offerte
trovano un posto fuori dall'ownership?). Lì il confine si conferma o si sposta.
