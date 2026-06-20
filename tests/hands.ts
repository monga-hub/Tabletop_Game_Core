// tests/hands — al completamento del draft, hands = pickedCards (copia).
// pickedCards resta storia; hands è il presente che le meccaniche cambieranno.
import { Session } from "../packages/session/session";
import { PescariaDraftSystem } from "../examples/pescaria/draft-system";
import { PescariaDraftPickSystem } from "../examples/pescaria/draft-pick-system";
import { asCards } from "../examples/pescaria/model/test-cards";

let f = 0; const ok = (c: boolean, m: string) => { if (c) console.log(`  ✓ ${m}`); else { console.error(`  ✗ ${m}`); f++; } };
console.log("TEST — Hands (presente separato dalla storia del draft)\n");

const systems = [PescariaDraftSystem, PescariaDraftPickSystem];
const s = new Session({ systems, seed: 3 });
s.submit({ type: "pescaria.draft.start", agentId: "h", payload: { players: ["a","b"], cards: asCards(["A","B","C","D"]), cardsPerPlayer: 2 } });
const d0 = s.getState().entities["__draft__"] as { order: string[] };
const [p0,p1] = d0.order;
s.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: p0, cardId: "A" } });
s.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: p1, cardId: "B" } });
s.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: p0, cardId: "C" } });
s.submit({ type: "pescaria.draft.pick", agentId: "u", payload: { playerId: p1, cardId: "D" } });

const hands = s.getState().entities["__hands__"] as Record<string,string[]>;
const picked = (s.getState().entities["__draft__"] as { pickedCards: Record<string,string[]> }).pickedCards;
ok(hands !== undefined, "hands esiste dopo draft.completed");
ok(JSON.stringify(hands[p0].sort()) === JSON.stringify(picked[p0].sort()), "hands eguaglia pickedCards al completamento");
ok(hands[p0].length === 2 && hands[p1].length === 2, "ogni mano ha 2 carte");

const a = JSON.stringify(s.getState());
const b = JSON.stringify(Session.replay(s.getLog(), systems, 3));
ok(a === b, "replay == stato (hands nel log)");

console.log("");
if (f === 0) { console.log("VERDE. Hands separata dalla storia del draft."); process.exit(0); } else process.exit(1);
