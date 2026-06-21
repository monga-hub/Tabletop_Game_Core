// tests/offers — 0034: hands -> offers. Una carta lascia la mano ed entra
// nell'area delle offerte. Nessun ordine di turno, nessuna copertura: non
// cambiano il risultato di questa trasformazione (vedi README di dominio).
import { Session } from "../packages/session/session";
import { PescariaDraftSystem } from "../examples/pescaria/draft-system";
import { PescariaDraftPickSystem } from "../examples/pescaria/draft-pick-system";
import { PescariaOfferSystem } from "../examples/pescaria/offer-system";
import { asCards } from "../examples/pescaria/model/test-cards";

let f = 0; const ok = (c: boolean, m: string) => { if (c) console.log(`  ✓ ${m}`); else { console.error(`  ✗ ${m}`); f++; } };
console.log("TEST — Offers (0034: hands -> offers)\n");

const systems = [PescariaDraftSystem, PescariaDraftPickSystem, PescariaOfferSystem];
const s = new Session({ systems, seed: 4 });
s.submit({ type: "pescaria.draft.start", agentId: "h", payload: { players: ["a", "b"], cards: asCards(["A", "B", "C", "D"]), cardsPerPlayer: 2 } });
const order = (s.getState().entities["__draft__"] as { order: string[] }).order;
const [p0, p1] = order;
s.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: p0, cardId: "A" } });
s.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: p1, cardId: "B" } });
s.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: p0, cardId: "C" } });
s.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: p1, cardId: "D" } });

const handsBefore = s.getState().entities["__hands__"] as Record<string, string[]>;
ok(handsBefore[p0].length === 2 && handsBefore[p1].length === 2, "ogni mano ha 2 carte prima di offrire");

// p1 offre prima di p0: l'ordine non è vincolato (criterio di lavoro 0034)
const cardP1 = handsBefore[p1][0];
const r1 = s.submit({ type: "pescaria.offer.play", agentId: "u", payload: { playerId: p1, cardId: cardP1 } });
ok(r1.accepted, "p1 può offrire prima di p0: nessun ordine di turno richiesto");

const cardP0 = handsBefore[p0][0];
s.submit({ type: "pescaria.offer.play", agentId: "u", payload: { playerId: p0, cardId: cardP0 } });

const handsAfter = s.getState().entities["__hands__"] as Record<string, string[]>;
const offersAfter = s.getState().entities["__offers__"] as Record<string, string>;
ok(handsAfter[p0].length === 1 && !handsAfter[p0].includes(cardP0), "la carta offerta esce dalla mano di p0");
ok(handsAfter[p1].length === 1 && !handsAfter[p1].includes(cardP1), "la carta offerta esce dalla mano di p1");
ok(offersAfter[p0] === cardP0 && offersAfter[p1] === cardP1, "entrambe le offerte sono visibili nello stato (nessuna copertura modellata oggi)");

// rifiuti
const r2 = s.submit({ type: "pescaria.offer.play", agentId: "u", payload: { playerId: p0, cardId: handsAfter[p0][0] } });
ok(!r2.accepted, "p0 non può offrire una seconda volta nello stesso round");

const r3 = s.submit({ type: "pescaria.offer.play", agentId: "u", payload: { playerId: p1, cardId: cardP0 } });
ok(!r3.accepted, "p1 non può offrire una carta che non ha in mano (è nella mano/offerta di p0)");

// legalIntents: chi ha già offerto non ha più mosse
ok(s.legalIntents(p0).length === 0 && s.legalIntents(p1).length === 0, "nessuna mossa legale residua: entrambi hanno già offerto");

// replay == stato
const a = JSON.stringify(s.getState());
const b = JSON.stringify(Session.replay(s.getLog(), systems, 4));
ok(a === b, "replay == stato (hands -> offers è ricostruibile dal log)");

console.log("");
if (f === 0) { console.log("VERDE. Offers: hands -> offers, nessun ordine, nessuna copertura modellata oggi."); process.exit(0); } else process.exit(1);
