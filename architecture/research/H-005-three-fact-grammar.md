# H-005 — Una grammatica a tre tipi di fatto

**Status:** ipotesi (da inseguire, NON verificata) — codice: nessuno ancora
**Ultima valutazione:** formulata in review · **Prossima rivalutazione:** all'arrivo di contratti e aste

## Ipotesi
Il modello del framework ha solo TRE tipi fondamentali di fatto. Quasi ogni
evento di qualunque gioco event-sourced si riconduce a uno di questi:

1. **Esistenza** — creazione / distruzione di entita (`entity.created`, `entity.destroyed`)
2. **Collocazione** — dove sta un'entita (`owner.changed`, `position.changed`) ← H-004
3. **Relazione** — come due entita si relazionano (un contratto richiede una carta;
   un'offerta lega player+amount+asta)

## Motivazione
H-004 ha mostrato che l'ownership copre le collocazioni ma non i contratti e le
aste — perche quelli sono relazioni, non collocazioni. Se i fatti fondamentali
sono davvero solo tre, il framework non descrive piu Pescaria: descrive una
grammatica generale per giochi event-sourced.

## Esperimento (da fare, non ancora fatto)
Quando contratti e aste saranno implementati, verificare se ogni loro evento
cade in una delle tre categorie senza forzature. In particolare:
- una relazione si crea e si distrugge come un'entita? (relazione = entita?)
- oppure la relazione e un quarto tipo irriducibile?

## Esito
Da determinare. NON ancora verificata.

## Evidenze a favore (preliminari)
- Esistenza: entity.created/destroyed (mai implementato esplicito, ma implicito in mint).
- Collocazione: H-004 verde su mano/draft/mercato/scarti.
- Relazione: ipotizzata, non ancora costruita.

## Controesempi da cercare
- Effetti/trigger ("quando X, allora Y"): sono relazioni o un quarto tipo?
- Obiettivi/condizioni di vittoria: riconducibili o no?
- Lo stato di una fase (es. "asta aperta/chiusa"): esistenza? collocazione? altro?

## Quando rivalutarla
All'implementazione di contratti (prima relazione vera) e aste (relazione +
risorse). Se entrambi cadono nei tre tipi senza forzare, H-005 si rafforza. Se
serve un quarto tipo, si scopre qual e.

## Perche vale la pena inseguirla
Se reggesse fino a contratti, aste e mercato, non sarebbe piu un'osservazione su
Pescaria: sarebbe una grammatica per rappresentare giochi. Ma e proprio il tipo
di idea ambiziosa che va tenuta in research/ finche non si guadagna main —
altrimenti diventa la generalizzazione-da-un-caso che il #7 vieta.
