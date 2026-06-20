// ============================================================
// examples/pescaria/model/fish.ts
// I cinque tipi di pesce: fatto stabile, concordano sia la V1 sia la V3.
// Non è lo stesso concetto di "Species" in model/card.ts (quello è un
// placeholder per testare il draft, non i tipi di pesce reali del gioco).
// ============================================================
export type FishSpecies = "polpo" | "gambero" | "mollusco" | "branzino" | "sardina";
export const FISH_SPECIES: readonly FishSpecies[] = ["polpo", "gambero", "mollusco", "branzino", "sardina"];

export type Bag = Record<FishSpecies, number>;

// Struttura della partita -> V1: il sacchetto contiene 100 gettoni, 20 per tipo.
export function standardBag(): Bag {
  const bag = {} as Bag;
  for (const sp of FISH_SPECIES) bag[sp] = 20;
  return bag;
}

export function emptyTally(): Record<FishSpecies, number> {
  const t = {} as Record<FishSpecies, number>;
  for (const sp of FISH_SPECIES) t[sp] = 0;
  return t;
}
