// ============================================================
// examples/pescaria/cards/real-deck.ts
//
// Il mazzo REALE di Pescaria come DATASET DI DOMINIO: le carte vere del gioco,
// con i loro attributi reali (requirements, reward, Valore d'Asta, miglioria).
// Distinto da sampleDeck()/Card in model/card.ts (dataset SINTETICO con
// species+stars, per i benchmark del framework e la batteria congelata).
//
// VERSIONAMENTO DEL DATO. Il simulatore studia anche l'EVOLUZIONE del gioco,
// quindi le versioni del mazzo non si cancellano: si archiviano.
//   - corrente: cards/2026/deck.json  (mazzo ufficiale 2026, 97 carte)
//   - archivio: cards/archive/deck-v3.2.json  (100 carte, versione precedente)
// realDeck() carica il corrente. realDeckArchived("3.2") carica una versione
// passata, per confronti (es. "una modifica ha alzato/abbassato i conflitti?").
//
// NB sul ruolo del file: questo modulo espone solo il DATO GREZZO (id, asta,
// reward, pesci richiesti, testo miglioria). Non contiene interpretazioni di
// design (es. "l'identità di una miglioria"): quelle sono ipotesi da TESTARE
// contro il simulatore, non verità da iscrivere nel dato. Tenerle fuori e' cio'
// che permette al dato di smentirle.
// ============================================================
import { FishSpecies } from "../model/fish";
import deck2026 from "./2026/deck.json";
import deckV32 from "./archive/deck-v3.2.json";

export interface RealCard {
  readonly id: string;                              // "r1".."r100"
  readonly sourceId: number;                        // ID nel documento
  readonly name: string;                            // nome del cliente/locale
  readonly auctionValue: number;                    // Valore d'Asta
  readonly reward: number;                          // Ricompensa in Ducati
  readonly requirements: Partial<Record<FishSpecies, number>>; // pesci richiesti dal contratto
  readonly improvement: string;                     // testo miglioria (categoria + effetto)
}

interface DeckFile {
  version: string;
  source: string;
  cards: RealCard[];
}

const CURRENT = deck2026 as DeckFile;
const ARCHIVE: Record<string, DeckFile> = {
  "3.2": deckV32 as DeckFile,
};

function clone(cards: RealCard[]): RealCard[] {
  return cards.map((c) => ({ ...c, requirements: { ...c.requirements } }));
}

/** Il mazzo corrente (2026). Copia difensiva: gli esperimenti non lo alterano. */
export function realDeck(): RealCard[] {
  return clone(CURRENT.cards);
}

export function realDeckVersion(): string {
  return CURRENT.version;
}

/** Una versione archiviata, per confronti sull'evoluzione del gioco. */
export function realDeckArchived(version: string): RealCard[] {
  const d = ARCHIVE[version];
  if (!d) throw new Error(`versione archiviata non trovata: ${version} (disponibili: ${Object.keys(ARCHIVE).join(", ")})`);
  return clone(d.cards);
}

export function archivedVersions(): string[] {
  return Object.keys(ARCHIVE);
}
