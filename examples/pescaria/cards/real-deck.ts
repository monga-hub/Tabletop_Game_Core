// ============================================================
// examples/pescaria/cards/real-deck.ts
//
// Il mazzo REALE di Pescaria (deck-v3.2.json, 100 carte, da
// MAZZO_PESCARIA_DIC25). Questo è il DATASET DI DOMINIO: le carte vere del
// gioco, con i loro attributi reali. È un oggetto distinto da `sampleDeck()`
// in model/card.ts:
//
//   - sampleDeck() / Card  -> dataset SINTETICO. species+stars sono assi
//     costruiti per gli agenti; serve ai benchmark del FRAMEWORK (ordering,
//     sensitivity) e alla batteria congelata. NON sparisce, NON viene
//     sostituito: misura proprietà del simulatore, non del gioco.
//   - realDeck() / RealCard -> dataset DI DOMINIO. Gli attributi sono quelli
//     veri del mazzo (requirements, reward, valore d'asta, miglioria). Serve
//     agli esperimenti su PESCARIA (conflitti tra contratti, distribuzione
//     migliorie, ecc.).
//
// I due alberi convivono. Gli agenti della batteria girano sul sintetico
// (sono tarati su stars/species); non giocano ancora sul mazzo reale, perché
// non sono agenti che giocano a Pescaria — verificano proprietà del
// framework. Quella migrazione, se avverrà, è una decisione futura.
//
// Versionato come dato: oggi v3.2. Quando il mazzo cambierà sarà
// deck-v3.3.json, e il loader caricherà quello. Il bilanciamento non è
// congelato dal numero di carte ma dalla versione del file.
// ============================================================
import { FishSpecies } from "../model/fish";
import deckData from "./deck-v3.2.json";

export interface RealCard {
  readonly id: string;                              // "r1".."r100"
  readonly sourceId: number;                        // ID nel documento (1..100)
  readonly name: string;                            // nome del cliente/locale
  readonly auctionValue: number;                    // Valore d'Asta (2..10)
  readonly reward: number;                          // Ricompensa in Ducati
  readonly requirements: Partial<Record<FishSpecies, number>>; // pesci richiesti dal contratto
  readonly improvement: string;                     // testo miglioria (categoria + effetto)
}

interface DeckFile {
  version: string;
  source: string;
  cards: RealCard[];
}

const DECK = deckData as DeckFile;

export function realDeck(): RealCard[] {
  // copia difensiva: il dataset è immutabile, gli esperimenti non lo alterano.
  return DECK.cards.map((c) => ({ ...c, requirements: { ...c.requirements } }));
}

export function realDeckVersion(): string {
  return DECK.version;
}
