// tests/purchase — 0036: __auctionRanking__ + __stoccaggio__ -> __banks__.
// Il vincitore prende tutto il lotto. Stoccaggio svuotato. Nessun Ducato.
import { Session } from "../packages/session/session";
import { PescariaFishingSystem } from "../examples/pescaria/fishing-system";
import { PescariaDraftSystem } from "../examples/pescaria/draft-system";
import { PescariaDraftPickSystem } from "../examples/pescaria/draft-pick-system";
import { PescariaOfferSystem } from "../examples/pescaria/offer-system";
import { PescariaAuctionResolutionSystem } from "../examples/pescaria/auction-resolution-system";
import { PescariaPurchaseSystem } from "../examples/pescaria/purchase-system";
import { FISH_SPECIES } from "../examples/pescaria/model/fish";
import { Card } from "../examples/pescaria/model/card";

let f = 0; const ok = (c: boolean, m: string) => { if (c) console.log(`  ✓ ${m}`); else { console.error(`  ✗ ${m}`); f++; } };
console.log("TEST — Purchase (0036: il vincitore prende tutto il lotto)\n");

const systems = [
  PescariaFishingSystem, PescariaDraftSystem, PescariaDraftPickSystem,
  PescariaOfferSystem, PescariaAuctionResolutionSystem, PescariaPurchaseSystem,
];

const deck: Card[] = [
  { id: "hi",  species: "tonno",    stars: 1, auctionValue: 9 },
  { id: "lo",  species: "sardina",  stars: 1, auctionValue: 2 },
  { id: "x",   species: "branzino", stars: 1, auctionValue: 1 },
  { id: "y",   species: "orata",    stars: 1, auctionValue: 3 },
];

const s = new Session({ systems, seed: 8 });
// pesca: riempie __stoccaggio__
s.submit({ type: "pescaria.fishing.draw", agentId: "h", payload: { players: ["a", "b"] } });
const stoccaggioBefore = { ...(s.getState().entities["__stoccaggio__"] as Record<string, number>) };
const totalFishBefore = FISH_SPECIES.reduce((sum, sp) => sum + stoccaggioBefore[sp], 0);
ok(totalFishBefore === 12, "pesca: 2 giocatori x 6 = 12 pesci nello stoccaggio");

// draft
s.submit({ type: "pescaria.draft.start", agentId: "h", payload: { players: ["a", "b"], cards: deck, cardsPerPlayer: 2 } });
const order = (s.getState().entities["__draft__"] as { order: string[] }).order;
const [p0, p1] = order;
s.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: p0, cardId: "hi" } });
s.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: p1, cardId: "lo" } });
s.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: p0, cardId: "x" } });
s.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: p1, cardId: "y" } });

// offerte: p0 gioca hi(9), p1 gioca lo(2) -> p0 vince
s.submit({ type: "pescaria.offer.play", agentId: "u", payload: { playerId: p0, cardId: "hi" } });
s.submit({ type: "pescaria.offer.play", agentId: "u", payload: { playerId: p1, cardId: "lo" } });
s.submit({ type: "pescaria.auction.resolve", agentId: "h", payload: {} });
const rank = (s.getState().entities["__auctionRanking__"] as { ranking: string[] }).ranking;
ok(rank[0] === p0, "p0 (valore 9) vince l'asta");

// acquisto: il vincitore prende tutto
s.submit({ type: "pescaria.purchase.take", agentId: "h", payload: {} });

const banks = s.getState().entities["__banks__"] as Record<string, Record<string, number>>;
const stoccaggioAfter = s.getState().entities["__stoccaggio__"] as Record<string, number>;
const winnerBankTotal = FISH_SPECIES.reduce((sum, sp) => sum + (banks[p0]?.[sp] ?? 0), 0);
const stoccaggioAfterTotal = FISH_SPECIES.reduce((sum, sp) => sum + stoccaggioAfter[sp], 0);

ok(winnerBankTotal === 12, "il Banco del vincitore contiene tutti e 12 i pesci del lotto");
ok(stoccaggioAfterTotal === 0, "lo stoccaggio e' svuotato: il lotto e' stato preso");
ok(FISH_SPECIES.every((sp) => banks[p0][sp] === stoccaggioBefore[sp]), "ogni specie del lotto e' finita sul Banco, intatta");
ok(banks[p1] === undefined, "il perdente non ha un Banco (nessun altro acquisto in 0036)");

// conservazione: pesce su banchi + stoccaggio + sacchetto = 100 (totale invariato)
const bag = s.getState().entities["__bag__"] as Record<string, number>;
const bagTotal = FISH_SPECIES.reduce((sum, sp) => sum + bag[sp], 0);
ok(winnerBankTotal + stoccaggioAfterTotal + bagTotal === 100, "conservazione: banchi + stoccaggio + sacchetto = 100");

// nessun Ducato introdotto
ok(s.getState().entities["__ducati__"] === undefined, "nessuna risorsa Ducati introdotta in questo commit");

// replay == stato
const a = JSON.stringify(s.getState());
const b = JSON.stringify(Session.replay(s.getLog(), systems, 8));
ok(a === b, "replay == stato (l'intera catena pesca->...->acquisto e' ricostruibile dal log)");

console.log("");
if (f === 0) { console.log("VERDE. Acquisto: il vincitore prende tutto il lotto, stoccaggio svuotato, nessun Ducato."); process.exit(0); } else process.exit(1);
