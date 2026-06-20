// ============================================================
// examples/pescaria/model — CardModel (minimo)
// Una carta che il simulatore possa DISTINGUERE. Non "la carta di Pescaria":
// niente testo, niente effetti, niente nome, niente illustrazione. Solo ciò
// che serve perché due carte siano diverse in modo che conti per una decisione.
//
// stars e species sono ciò che un agente può confrontare → comportamento.
// Con A/B/C/D non c'era comportamento, solo casualità.
// ============================================================
export type CardId = string;
export type Species = "tonno" | "branzino" | "sardina" | "orata";

export interface Card {
  readonly id: CardId;
  readonly species: Species;
  readonly stars: number; // 1..N — la qualità/valore grezzo
}

// un mazzo di prova minimo: abbastanza vario da far emergere preferenze.
export function sampleDeck(): Card[] {
  const deck: Card[] = [];
  const species: Species[] = ["tonno", "branzino", "sardina", "orata"];
  let n = 1;
  for (const sp of species) {
    for (const stars of [1, 2, 3, 4]) {
      deck.push({ id: `c${n++}`, species: sp, stars });
    }
  }
  return deck; // 16 carte: 4 specie × 4 livelli di stelle
}
