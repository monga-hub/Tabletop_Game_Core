// tests/real-deck — 0037: il mazzo REALE di Pescaria come dataset di dominio.
// Verifica integrità e indipendenza dal dataset sintetico (sampleDeck).
import { realDeck, realDeckVersion, RealCard } from "../examples/pescaria/cards/real-deck";
import { FISH_SPECIES } from "../examples/pescaria/model/fish";
import { sampleDeck } from "../examples/pescaria/model/card";

let f = 0; const ok = (c: boolean, m: string) => { if (c) console.log(`  ✓ ${m}`); else { console.error(`  ✗ ${m}`); f++; } };
console.log("TEST — Real deck (0037: il mazzo reale come dataset di dominio)\n");

const deck = realDeck();

ok(deck.length === 97, "il mazzo reale (2026) ha 97 carte");
ok(realDeckVersion() === "2026", "versione del dataset: 2026");

// ogni carta ha attributi validi
const validFish = new Set(FISH_SPECIES);
let allAuctionOk = true, allRewardOk = true, allFishOk = true, allReqNonEmpty = true;
for (const c of deck) {
  if (!(c.auctionValue >= 1 && c.auctionValue <= 16)) allAuctionOk = false;
  if (!(c.reward >= 1)) allRewardOk = false;
  const reqEntries = Object.entries(c.requirements);
  if (reqEntries.length === 0) allReqNonEmpty = false;
  for (const [sp, n] of reqEntries) {
    if (!validFish.has(sp as never) || !(n! >= 1)) allFishOk = false;
  }
}
ok(allAuctionOk, "ogni carta ha un Valore d'Asta valido (1..16)");
ok(allRewardOk, "ogni carta ha una Ricompensa >= 1");
ok(allReqNonEmpty, "ogni carta richiede almeno un pesce (ha un contratto)");
ok(allFishOk, "ogni pesce richiesto è un FishSpecies valido del dominio");

// id univoci
const ids = new Set(deck.map((c) => c.id));
ok(ids.size === 97, "tutti gli id sono univoci");

// immutabilità: due chiamate danno copie indipendenti
const d1 = realDeck();
const d2 = realDeck();
(d1[0].requirements as Record<string, number>)["sardina"] = 999;
ok((d2[0].requirements as Record<string, number>)["sardina"] !== 999, "realDeck() restituisce copie indipendenti: mutare una non tocca l'altra");

// indipendenza dal dataset sintetico: RealCard NON ha species/stars
const real = deck[0] as unknown as Record<string, unknown>;
ok(!("species" in real) && !("stars" in real), "le carte reali NON hanno species/stars (assi sintetici): sono un dataset distinto");
const synth = sampleDeck()[0] as unknown as Record<string, unknown>;
ok("species" in synth && "stars" in synth, "il mazzo sintetico conserva species/stars per la batteria congelata");

// il mazzo reale ha pesci richiesti distribuiti su tutte le specie (sanity)
const fishCount: Record<string, number> = {};
for (const c of deck) for (const [sp, n] of Object.entries(c.requirements)) fishCount[sp] = (fishCount[sp] ?? 0) + n!;
ok(FISH_SPECIES.every((sp) => (fishCount[sp] ?? 0) > 0), "tutte e 5 le specie compaiono tra i pesci richiesti");

// archivio: la versione precedente resta caricabile (il simulatore studia
// anche l'evoluzione del gioco, le versioni non si cancellano)
import { realDeckArchived, archivedVersions } from "../examples/pescaria/cards/real-deck";
ok(archivedVersions().includes("3.2"), "la versione 3.2 e' disponibile in archivio");
const v32 = realDeckArchived("3.2");
ok(v32.length === 100, "il mazzo archiviato v3.2 ha le sue 100 carte originali");
ok(v32.length !== deck.length, "corrente (97) e archivio (100) sono dataset distinti: 3 carte rimosse nel 2026");

console.log("");
if (f === 0) { console.log("VERDE. Mazzo reale 2026: 97 carte (corrente) + archivio v3.2, distinto dal sintetico."); process.exit(0); } else process.exit(1);
