# Modules — (da scrivere, richiede decisioni di design)

Ogni modulo dichiara: nuovi eventi, nuovo stato (componenti), nuove regole.
I moduli comunicano solo tramite eventi (Design Principle #5).

Moduli previsti: Draft, Auction, Contract, Improvement, Captain, FishMarket.

Configurazioni-versione:
- TERRY = Core + Draft + Auction + Improvement + Contract
- A     = Core + Captain + Auction
- B     = Core + FishMarket
