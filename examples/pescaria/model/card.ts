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
  // --- attributi SPERIMENTALI (asse per studiare il draft, NON dominio) ---
  // species e stars non rappresentano la carta del regolamento: sono assi che
  // generano preferenze negli agenti. Hanno congelato la batteria e prodotto
  // le osservazioni di 0027-0034. Restano finché un modello di dominio non sia
  // abbastanza ricco da sostituirli (principio: non rimuovere uno strumento
  // prima che esista il suo sostituto). Vedi examples/pescaria/README.md.
  readonly species: Species;
  readonly stars: number; // 1..N — la qualità/valore grezzo (sperimentale)
  // --- attributo di DOMINIO (dal regolamento canonico, cap. 5) ---
  // Valore d'Asta: il numero usato per puntare durante le aste. Distinto e
  // indipendente da Ricompensa, Contratto, Categoria (quattro informazioni
  // separate sulla carta). Per ora valore di laboratorio, non quello reale
  // delle 99 carte: il mazzo è un mazzo di prova, non Pescaria.
  readonly auctionValue: number;
}

// un mazzo di prova minimo: abbastanza vario da far emergere preferenze.
export function sampleDeck(): Card[] {
  const deck: Card[] = [];
  const species: Species[] = ["tonno", "branzino", "sardina", "orata"];
  let n = 1;
  for (const sp of species) {
    for (const stars of [1, 2, 3, 4]) {
      // Valore d'Asta di laboratorio: distinto da stars per costruzione, così
      // un agente che massimizzasse il Valore d'Asta NON coinciderebbe con
      // greedy-stars. n cresce 1..16, dà 16 valori d'asta tutti diversi.
      deck.push({ id: `c${n}`, species: sp, stars, auctionValue: n });
      n++;
    }
  }
  return deck; // 16 carte: 4 specie × 4 livelli di stelle, auctionValue 1..16
}
