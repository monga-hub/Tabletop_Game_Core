# H-002 — Gli eventi registrano fatti, non ricostruzioni

**Status:** corroborata
**Ultima valutazione:** durante draft.start · **Prossima rivalutazione:** alla prima feature che tenti di rigiocare invece di registrare

## Ipotesi
Un evento deve registrare il FATTO accaduto (l'ordine è [B,A,C]), non
l'informazione per ricostruirlo (il seed + l'algoritmo). Log autosufficiente.

## Motivazione
Se il log contenesse solo il seed, un futuro cambio dell'algoritmo di shuffle
romperebbe silenziosamente i replay dei log vecchi.

## Esperimento
draft.order.decided porta l'ordine già deciso nel payload; il replay lo legge,
non lo ricalcola.

## Esito
Verde. Un log del 2025 resterà rigiocabile nel 2028 anche se l'algoritmo cambia.

## Evidenze a favore
- draft.start: ordine come fatto, replay==stato regge.

## Controesempi osservati
- Nessuno.

## Non ancora provata su
- pesca dal sacchetto, mescolamento del mazzo (stesso pattern, non ancora implementato)

## Quando rivalutarla
Se mai emergesse un caso in cui registrare il fatto è troppo costoso (payload
enormi) e ricalcolare diventasse preferibile.
