// ============================================================
// experiments/0040-contract-conflicts/experiment.ts
//
// PRIMO ESPERIMENTO SUL DOMINIO.
//
// Non un benchmark (non confronta implementazioni/agenti). Non un test (non
// verifica correttezza). Un esperimento: una domanda, una metodologia, un
// dataset fissato, una procedura ripetibile, un risultato osservato.
//
// DOMANDA
//   Nel mazzo 2026 esistono stati in cui l'insieme dei contratti completabili
//   dipende dall'ordine di risoluzione?
//
// È una domanda di ESISTENZA (binaria), non di densità. "Quanto spesso il
// GIOCO genera questi stati" non è ancora misurabile: richiederebbe mani e
// banchi prodotti dal gioco reale (draft + asta), che la pipeline non genera
// ancora. Qui le mani e i banchi sono campionati in modo DICHIARATAMENTE
// ARBITRARIO: servono solo a cercare SE almeno una configurazione conflittuale
// esista nel mazzo reale. Il campionamento arbitrario è onesto per una domanda
// di esistenza (basta trovarne uno); sarebbe disonesto per una domanda di
// densità (il numero dipenderebbe dal campionamento, non dal gioco).
//
// METODOLOGIA
//   - dataset fissato: mazzo 2026 (realDeck()).
//   - "stato conflittuale" = definizione di DOMINIO: esistono >=2 insiemi di
//     contratti completati al variare dell'ordine della mano. NON la
//     definizione procedurale (un completamento blocca un altro), che dipende
//     dalla policy. Si calcola provando tutte le permutazioni della mano.
//   - si campionano molti (mano, banco) arbitrari e si conta in quanti lo
//     stato è conflittuale, riportando: esiste almeno uno? (la domanda) e,
//     come contorno NON interpretato, la frazione grezza sul campione
//     arbitrario (che NON è il tasso del gioco).
//
// OSSERVAZIONE, INTERPRETAZIONE, CONSEGUENZE: vedi README.md, scritti DOPO aver
// eseguito, in quest'ordine.
// ============================================================
import { resolveContracts, Bank } from "../../examples/pescaria/resolve-contracts";
import { realDeck, realDeckVersion, RealCard } from "../../examples/pescaria/cards/real-deck";
import { FishSpecies, FISH_SPECIES } from "../../examples/pescaria/model/fish";
import * as fs from "fs";

function perms<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const p of perms(rest)) out.push([arr[i], ...p]);
  }
  return out;
}

// definizione di DOMINIO: l'insieme dei completati dipende dall'ordine?
function isConflictual(hand: RealCard[], bank: Bank): boolean {
  const sets = new Set<string>();
  for (const p of perms(hand)) {
    const completed = resolveContracts(p, bank).completed;
    sets.add(completed.map((c) => c.sourceId).sort((a, b) => a - b).join(","));
  }
  return sets.size > 1;
}

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0x100000000; };
}

const deck = realDeck();
const rng = makeRng(20260101);
const SAMPLES = 100000;
const HAND_SIZE = 4;   // mani piccole: le permutazioni restano enumerabili
const MAX_FISH = 4;    // pesci per specie nel banco arbitrario

let conflictual = 0;
let firstExample: { hand: number[]; bank: Bank } | null = null;

for (let i = 0; i < SAMPLES; i++) {
  // mano arbitraria: HAND_SIZE carte distinte dal mazzo
  const hand: RealCard[] = [];
  const used = new Set<number>();
  while (hand.length < HAND_SIZE) {
    const c = deck[Math.floor(rng() * deck.length)];
    if (!used.has(c.sourceId)) { used.add(c.sourceId); hand.push(c); }
  }
  // banco arbitrario
  const bank: Bank = {};
  for (const sp of FISH_SPECIES) {
    const n = Math.floor(rng() * (MAX_FISH + 1));
    if (n > 0) bank[sp as FishSpecies] = n;
  }
  if (isConflictual(hand, bank)) {
    conflictual++;
    if (!firstExample) firstExample = { hand: hand.map((c) => c.sourceId), bank };
  }
}

const report = {
  experiment: "0040-contract-conflicts",
  question: "Nel mazzo 2026 esistono stati in cui l'insieme dei contratti completabili dipende dall'ordine?",
  deckVersion: realDeckVersion(),
  method: {
    samples: SAMPLES, handSize: HAND_SIZE, maxFishPerSpecies: MAX_FISH,
    conflictDefinition: "dominio: >=2 insiemi-completati al variare dell'ordine (tutte le permutazioni)",
    sampling: "arbitrario (mani+banchi casuali) — valido SOLO per la domanda di esistenza, non per la densità",
  },
  result: {
    exists: conflictual > 0,
    conflictualSamples: conflictual,
    fractionOnArbitrarySample: conflictual / SAMPLES,  // NON il tasso del gioco
    firstExample,
  },
};

fs.mkdirSync("experiments/0040-contract-conflicts", { recursive: true });
fs.writeFileSync("experiments/0040-contract-conflicts/result.json", JSON.stringify(report, null, 2));

console.log("ESPERIMENTO 0040 — Conflitti tra contratti (mazzo 2026)\n");
console.log("DOMANDA:", report.question, "\n");
console.log("Stati conflittuali trovati:", conflictual, "su", SAMPLES, "campioni arbitrari");
console.log("ESISTE almeno uno stato conflittuale nel mazzo 2026?", report.result.exists ? "SÌ" : "NO");
if (firstExample) {
  console.log("Primo esempio: carte", firstExample.hand, "banco", JSON.stringify(firstExample.bank));
}
console.log("\nFrazione sul campione arbitrario:", (report.result.fractionOnArbitrarySample * 100).toFixed(2) + "%");
console.log("(NON è il tasso del gioco: il campionamento è arbitrario, non prodotto dal draft+asta reali)");
