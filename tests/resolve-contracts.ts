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
}

// --- 2) contratto non completabile: pesce insufficiente ---
{
  const hand = [card(9)]; // 3 sardine
  const bank: Bank = { sardina: 2 };
  const r = resolveContracts(hand, bank);
  ok(r.completed.length === 0, "contratto da 3 sardine NON completato con solo 2 sardine");
  ok(r.remainingHand.length === 1, "la carta non completata resta in mano");
  ok((r.bankAfter.sardina ?? 0) === 2, "il banco resta invariato se nulla viene completato");
}

// --- 3) stato conflittuale: la POLICY "ordine della mano" sceglie A ---
// banco: 2 sardine. mano: r1(2 sardine) PRIMA, r18(1 sardina) DOPO.
// entrambe completabili all'inizio. La policy completa r1 (primo), consuma 2
// sardine -> r18 resta. NB: che questo stato sia "conflittuale" (l'insieme
// dipende dall'ordine) NON e' misurato qui: e' una proprieta' del dominio,
// vive nell'esperimento. Qui si verifica solo cosa fa la policy.
{
  const hand = [card(1), card(18)]; // 2 sardine, poi 1 sardina
  const bank: Bank = { sardina: 2 };
  const r = resolveContracts(hand, bank);
  ok(r.completed.length === 1 && r.completed[0].sourceId === 1, "policy 'ordine mano': completa r1 (primo), consuma tutte le sardine");
  ok(r.remainingHand.length === 1 && r.remainingHand[0].sourceId === 18, "r18 resta in mano: non piu' completabile dopo r1");
}

// --- 4) ordine inverso sullo stesso stato: la policy sceglie r18 ---
// stesso banco e stesse carte, ordine [r18, r1]: l'insieme completato CAMBIA.
// E' questa dipendenza dall'ordine che l'esperimento (non questo test)
// chiamera' "conflitto" - una proprieta' dello stato, non della policy.
{
  const hand = [card(18), card(1)]; // 1 sardina, poi 2 sardine
  const bank: Bank = { sardina: 2 };
  const r = resolveContracts(hand, bank);
  ok(r.completed.length === 1 && r.completed[0].sourceId === 18, "ordine inverso: la policy completa r18, non r1");
  // l'insieme {r18} != {r1} del caso 3: stesso stato, esiti diversi al variare
  // dell'ordine. La proprieta' di dominio (conflittualita') si misura cosi',
  // confrontando esiti - nell'esperimento, non nell'algoritmo.
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

// --- 7) CESTA come fallback: il Banco e' PRIMARIO ---
// r9 = 3 sardine. Banco ha 3 sardine: basta da solo, la Cesta NON si tocca.
{
  const hand = [card(9)]; // 3 sardine
  const bank: Bank = { sardina: 3 };
  const cesta: Bank = { sardina: 2 };
  const r = resolveContracts(hand, bank, cesta);
  ok(r.completed.length === 1, "Banco basta (3 sardine): contratto completato");
  ok((r.cestaAfter.sardina ?? 0) === 2, "il Banco e' PRIMARIO: bastando da solo, la Cesta resta intatta (2 sardine)");
  ok((r.bankAfter.sardina ?? 0) === 0, "il Banco e' stato consumato");
}

// --- 8) la Cesta INTEGRA solo il mancante ---
// r9 = 3 sardine. Banco ha 2, Cesta ha 2. Banco non basta; Banco+Cesta si'.
// Si attinge 1 dalla Cesta (solo il mancante), restano 1 in Cesta.
{
  const hand = [card(9)]; // 3 sardine
  const bank: Bank = { sardina: 2 };
  const cesta: Bank = { sardina: 2 };
  const r = resolveContracts(hand, bank, cesta);
  ok(r.completed.length === 1, "Banco (2) non basta ma Banco+Cesta (4) si': contratto completato");
  ok((r.bankAfter.sardina ?? 0) === 0, "il Banco e' svuotato per primo");
  ok((r.cestaAfter.sardina ?? 0) === 1, "la Cesta integra SOLO il mancante: 2 - 1 = 1 sardina resta");
}

// --- 9) ne' Banco ne' Banco+Cesta bastano: non completato ---
{
  const hand = [card(9)]; // 3 sardine
  const bank: Bank = { sardina: 1 };
  const cesta: Bank = { sardina: 1 };
  const r = resolveContracts(hand, bank, cesta);
  ok(r.completed.length === 0, "Banco+Cesta (2) < richiesto (3): contratto NON completato");
  ok((r.bankAfter.sardina ?? 0) === 1 && (r.cestaAfter.sardina ?? 0) === 1, "Banco e Cesta intatti se nulla e' completato");
}

console.log("");
if (f === 0) { console.log("VERDE. resolveContracts: Banco primario, Cesta integra solo il mancante."); process.exit(0); } else process.exit(1);
