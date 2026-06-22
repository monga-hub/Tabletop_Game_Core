// tests/auction-resolution — 0035: __offers__ + __draft__.order -> classifica.
// Vince il Valore d'Asta piu' alto; i pari vanno a chi e' piu' avanti
// nell'ordine partendo da order[0]. Classifica completa, non solo il vincitore.
import { Session } from "../packages/session/session";
import { PescariaDraftSystem } from "../examples/pescaria/draft-system";
import { PescariaDraftPickSystem } from "../examples/pescaria/draft-pick-system";
import { PescariaOfferSystem } from "../examples/pescaria/offer-system";
import { PescariaAuctionResolutionSystem } from "../examples/pescaria/auction-resolution-system";
import { Card } from "../examples/pescaria/model/card";

let f = 0; const ok = (c: boolean, m: string) => { if (c) console.log(`  ✓ ${m}`); else { console.error(`  ✗ ${m}`); f++; } };
console.log("TEST — Auction resolution (0035: offers -> classifica)\n");

const systems = [PescariaDraftSystem, PescariaDraftPickSystem, PescariaOfferSystem, PescariaAuctionResolutionSystem];

// mazzo con auctionValue controllati. species/stars irrilevanti qui.
const deck: Card[] = [
  { id: "hi",  species: "tonno",    stars: 1, auctionValue: 9 },
  { id: "mid", species: "branzino", stars: 1, auctionValue: 5 },
  { id: "lo",  species: "sardina",  stars: 1, auctionValue: 2 },
  { id: "tieA",species: "orata",    stars: 1, auctionValue: 7 },
  { id: "tieB",species: "tonno",    stars: 1, auctionValue: 7 },
  { id: "x",   species: "branzino", stars: 1, auctionValue: 1 },
];

// --- 1) ordinamento per valore d'asta (3 giocatori, una carta a testa) ---
const s = new Session({ systems, seed: 3 });
s.submit({ type: "pescaria.draft.start", agentId: "h", payload: { players: ["a","b","c"], cards: deck, cardsPerPlayer: 2 } });
const order = (s.getState().entities["__draft__"] as { order: string[] }).order;
const [p0, p1, p2] = order;

// faccio in modo che ognuno abbia in mano carte note: assegno i pick manualmente
// p0 prende hi(9) e x(1); p1 prende mid(5) e tieB(7); p2 prende lo(2) e tieA(7)
s.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: p0, cardId: "hi" } });
s.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: p1, cardId: "mid" } });
s.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: p2, cardId: "lo" } });
s.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: p0, cardId: "x" } });
s.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: p1, cardId: "tieB" } });
s.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: p2, cardId: "tieA" } });

// offerte: p0 gioca hi(9), p1 gioca mid(5), p2 gioca lo(2)
s.submit({ type: "pescaria.offer.play", agentId: "u", payload: { playerId: p0, cardId: "hi" } });
s.submit({ type: "pescaria.offer.play", agentId: "u", payload: { playerId: p1, cardId: "mid" } });
s.submit({ type: "pescaria.offer.play", agentId: "u", payload: { playerId: p2, cardId: "lo" } });
s.submit({ type: "pescaria.auction.resolve", agentId: "h", payload: {} });

const r = s.getState().entities["__auctionRanking__"] as { ranking: string[]; detail: {player:string;value:number}[] };
ok(JSON.stringify(r.ranking) === JSON.stringify([p0, p1, p2]), "classifica per valore d'asta decrescente: 9 > 5 > 2");
ok(r.detail.length === 3, "classifica COMPLETA: tutti e 3 i partecipanti, non solo il vincitore");
ok(r.detail[0].value === 9 && r.detail[2].value === 2, "i valori in classifica corrispondono alle carte giocate");

// --- 2) tie-break: due offerte a 7, vince chi e' piu' avanti nell'ordine ---
const s2 = new Session({ systems, seed: 3 });
s2.submit({ type: "pescaria.draft.start", agentId: "h", payload: { players: ["a","b","c"], cards: deck, cardsPerPlayer: 2 } });
const order2 = (s2.getState().entities["__draft__"] as { order: string[] }).order;
const [q0, q1, q2] = order2;
s2.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: q0, cardId: "hi" } });
s2.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: q1, cardId: "tieB" } }); // 7
s2.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: q2, cardId: "tieA" } }); // 7
s2.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: q0, cardId: "x" } });
s2.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: q1, cardId: "mid" } });
s2.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: q2, cardId: "lo" } });
// q1 e q2 offrono entrambi 7; q0 offre 1 (x). q1 e' piu' avanti di q2 nell'ordine.
s2.submit({ type: "pescaria.offer.play", agentId: "u", payload: { playerId: q1, cardId: "tieB" } });
s2.submit({ type: "pescaria.offer.play", agentId: "u", payload: { playerId: q2, cardId: "tieA" } });
s2.submit({ type: "pescaria.offer.play", agentId: "u", payload: { playerId: q0, cardId: "x" } });
s2.submit({ type: "pescaria.auction.resolve", agentId: "h", payload: {} });
const r2 = s2.getState().entities["__auctionRanking__"] as { ranking: string[] };
ok(r2.ranking[0] === q1, "pari a 7: vince q1 (piu' avanti nell'ordine di q2)");
ok(r2.ranking.indexOf(q1) < r2.ranking.indexOf(q2), "q1 precede q2 in classifica a parita' di valore");
ok(r2.ranking[2] === q0, "q0 (valore 1) ultimo, sotto i due a 7");

// --- 3) chi non offre non e' in classifica ---
const s3 = new Session({ systems, seed: 3 });
s3.submit({ type: "pescaria.draft.start", agentId: "h", payload: { players: ["a","b","c"], cards: deck, cardsPerPlayer: 2 } });
const order3 = (s3.getState().entities["__draft__"] as { order: string[] }).order;
const [w0, w1, w2] = order3;
s3.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: w0, cardId: "hi" } });
s3.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: w1, cardId: "mid" } });
s3.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: w2, cardId: "lo" } });
s3.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: w0, cardId: "x" } });
s3.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: w1, cardId: "tieB" } });
s3.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: w2, cardId: "tieA" } });
// solo w0 e w2 offrono; w1 no
s3.submit({ type: "pescaria.offer.play", agentId: "u", payload: { playerId: w0, cardId: "hi" } });
s3.submit({ type: "pescaria.offer.play", agentId: "u", payload: { playerId: w2, cardId: "lo" } });
s3.submit({ type: "pescaria.auction.resolve", agentId: "h", payload: {} });
const r3 = s3.getState().entities["__auctionRanking__"] as { ranking: string[] };
ok(r3.ranking.length === 2 && !r3.ranking.includes(w1), "chi non ha offerto non e' in classifica");
ok(r3.ranking[0] === w0, "tra chi ha offerto, vince il valore piu' alto (9 > 2)");

// --- 4) replay == stato ---
const a = JSON.stringify(s.getState());
const b = JSON.stringify(Session.replay(s.getLog(), systems, 3));
ok(a === b, "replay == stato (la risoluzione e' ricostruibile dal log)");

console.log("");
if (f === 0) { console.log("VERDE. Risoluzione asta: classifica completa, tie-break ciclico, solo Valore d'Asta."); process.exit(0); } else process.exit(1);
