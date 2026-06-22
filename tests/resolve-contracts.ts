// tests/resolve-contracts — il verbo "completare i contratti" su carte REALI.
// Mani fisse e deterministiche (nessun campionamento: questo e' un test di
// correttezza, non un esperimento). Le carte sono scelte per id dal mazzo reale.
import { resolveContracts, Bank } from "../examples/pescaria/resolve-contracts";
import { realDeck, RealCard } from "../examples/pescaria/cards/real-deck";

let f = 0; const ok = (c: boolean, m: string) => { if (c) console.log(`  ✓ ${m}`); else { console.error(`  ✗ ${m}`); f++; } };
console.log("TEST — resolveContracts (verbo completare, carte reali, mani fisse)\n");

const deck = realDeck();
const card = (sourceId: number): RealCard => {
  const c = deck.find((x) => x.sourceId === sourceId);
  if (!c) throw new Error(`carta ${sourceId} non trovata`);
  return c;
};

// carte usate (requirements noti):
//  r18 = 1 sardina,  r25 = 1 sardina,  r1 = 2 sardine,  r57 = 2 sardine,
//  r9  = 3 sardine,  r74 = 2 polpi

// --- 1) completamento semplice senza conflitto ---
// mano: r18(1 sardina) + r74(2 polpi); banco: 1 sardina, 2 polpi -> entrambe completabili
{
  const hand = [card(18), card(74)];
  const bank: Bank = { sardina: 1, polpo: 2 };
  const r = resolveContracts(hand, bank);
  ok(r.completed.length === 2, "due contratti indipendenti completati entrambi");
  ok(r.remainingHand.length === 0, "nessuna carta resta in mano");
  ok((r.bankAfter.sardina ?? 0) === 0 && (r.bankAfter.polpo ?? 0) === 0, "i pesci richiesti sono stati consumati dal banco");
  ok(r.conflictObserved === false, "nessun conflitto: i due contratti non competono per gli stessi pesci");
}

// --- 2) contratto non completabile: pesce insufficiente ---
{
  const hand = [card(9)]; // 3 sardine
  const bank: Bank = { sardina: 2 };
  const r = resolveContracts(hand, bank);
  ok(r.completed.length === 0, "contratto da 3 sardine NON completato con solo 2 sardine");
  ok(r.remainingHand.length === 1, "la carta non completata resta in mano");
  ok((r.bankAfter.sardina ?? 0) === 2, "il banco resta invariato se nulla viene completato");
  ok(r.conflictObserved === false, "nessun conflitto se nulla viene completato");
}

// --- 3) CONFLITTO costruito apposta ---
// banco: 2 sardine. mano: r1(2 sardine) PRIMA, r18(1 sardina) DOPO.
// entrambe completabili all'inizio. Completando r1 si consumano 2 sardine ->
// r18 non e' piu' completabile. Conflitto.
{
  const hand = [card(1), card(18)]; // 2 sardine, poi 1 sardina
  const bank: Bank = { sardina: 2 };
  const r = resolveContracts(hand, bank);
  ok(r.completed.length === 1 && r.completed[0].sourceId === 1, "completato r1 (primo in mano), che consuma tutte le sardine");
  ok(r.remainingHand.length === 1 && r.remainingHand[0].sourceId === 18, "r18 resta in mano: non piu' completabile dopo r1");
  ok(r.conflictObserved === true, "CONFLITTO osservato: completare r1 ha reso r18 incompletabile");
}

// --- 4) lo stesso conflitto NON si verifica se l'ordine della mano cambia in modo da evitarlo ---
// banco: 2 sardine. mano: r18(1) PRIMA, r1(2) DOPO.
// r18 completata (resta 1 sardina), poi r1 (2 sardine) non completabile.
// Anche qui c'e' conflitto: completare r18 NON rende r1 incompletabile
// (r1 gia' richiedeva 2 e ce n'erano 2; dopo r18 ne resta 1)... verifichiamo.
{
  const hand = [card(18), card(1)]; // 1 sardina, poi 2 sardine
  const bank: Bank = { sardina: 2 };
  const r = resolveContracts(hand, bank);
  ok(r.completed.length === 1 && r.completed[0].sourceId === 18, "ordine diverso: completato r18 (1 sardina)");
  ok(r.conflictObserved === true, "conflitto osservato anche qui: completare r18 rende r1 (2 sardine) incompletabile");
  // NB: con 2 sardine in banco, r1 e r18 competono SEMPRE. L'ordine cambia QUALE
  // si completa, non SE c'e' conflitto. E' esattamente il fenomeno da osservare.
}

// --- 5) nessuna mutazione degli argomenti (purezza) ---
{
  const hand = [card(1)];
  const bank: Bank = { sardina: 5 };
  const bankCopy = { ...bank };
  resolveContracts(hand, bank);
  ok(JSON.stringify(bank) === JSON.stringify(bankCopy), "resolveContracts non muta il banco passato (funzione pura)");
}

// --- 6) banco con pesce in eccesso: completa e lascia il resto ---
{
  const hand = [card(18)]; // 1 sardina
  const bank: Bank = { sardina: 3, polpo: 2 };
  const r = resolveContracts(hand, bank);
  ok(r.completed.length === 1, "contratto completato");
  ok((r.bankAfter.sardina ?? 0) === 2 && (r.bankAfter.polpo ?? 0) === 2, "il pesce non richiesto resta sul banco");
}

console.log("");
if (f === 0) { console.log("VERDE. resolveContracts: completamento locale deterministico, conflitti osservati non risolti."); process.exit(0); } else process.exit(1);
