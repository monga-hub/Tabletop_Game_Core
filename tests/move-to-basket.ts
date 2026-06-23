// tests/move-to-basket — verbo "Spostamento Scarti" (Fase 3). Primo verbo con
// una decisione del giocatore: la selezione (cosa conservare) arriva come
// parametro dell'Intent. Il System la valida e la esegue, non la decide.
import { Session } from "../packages/session/session";
import { PescariaMoveToBasketSystem } from "../examples/pescaria/move-to-basket-system";
import { System, GameState, Intent, EventDraft, GameEvent } from "../packages/core/types";
import { FISH_SPECIES } from "../examples/pescaria/model/fish";

let f = 0; const ok = (c: boolean, m: string) => { if (c) console.log(`  ✓ ${m}`); else { console.error(`  ✗ ${m}`); f++; } };
console.log("TEST — Move to basket (Spostamento Scarti: la scelta arriva come parametro)\n");

// seeder per impostare __realHand__.bank (il Banco invenduto)
const Seeder: System = {
  namespace: "seed",
  handles: (t) => t === "seed.bank" || t === "seed.bank.done",
  validate: () => null,
  reduce: (_s, i: Intent): EventDraft[] => [{ type: "seed.bank.done", producer: "seed", payload: i.payload }],
  apply: (st: GameState, e: GameEvent): GameState => {
    if (e.type === "seed.bank.done") {
      const ent: Record<string, unknown> = { ...st.entities, __realHand__: { hand: [], bank: e.payload.bank } };
      if (e.payload.cesta) ent["__cesta__"] = e.payload.cesta;
      return { ...st, entities: ent };
    }
    return st;
  },
};
const sys = [Seeder, PescariaMoveToBasketSystem];

// --- 1) spostamento valido: la selezione esce dal Banco ed entra in Cesta ---
{
  const s = new Session({ systems: sys, seed: 1 });
  s.submit({ type: "seed.bank", agentId: "h", payload: { bank: { sardina: 2, polpo: 1 } } });
  // il giocatore SCEGLIE di conservare 1 sardina + 1 polpo (2 pesci, entro capienza 3)
  s.submit({ type: "pescaria.basket.move", agentId: "u", payload: { selection: { sardina: 1, polpo: 1 } } });

  const rh = s.getState().entities["__realHand__"] as { bank: Record<string, number> };
  const cesta = s.getState().entities["__cesta__"] as Record<string, number>;
  ok((cesta.sardina ?? 0) === 1 && (cesta.polpo ?? 0) === 1, "la selezione (1 sardina + 1 polpo) e' nella Cesta");
  ok((rh.bank.sardina ?? 0) === 1 && (rh.bank.polpo ?? 0) === 0, "il Banco e' ridotto: resta 1 sardina, 0 polpi");
}

// --- 2) selezione che eccede il Banco: rifiutata ---
{
  const s = new Session({ systems: sys, seed: 2 });
  s.submit({ type: "seed.bank", agentId: "h", payload: { bank: { sardina: 1 } } });
  const r = s.submit({ type: "pescaria.basket.move", agentId: "u", payload: { selection: { sardina: 2 } } });
  ok(!r.accepted, "selezione (2 sardine) che eccede il Banco (1 sardina) e' rifiutata");
}

// --- 3) selezione che eccede la capienza della Cesta: rifiutata ---
{
  const s = new Session({ systems: sys, seed: 3 });
  s.submit({ type: "seed.bank", agentId: "h", payload: { bank: { sardina: 2, polpo: 2, branzino: 1 } } });
  // 4 pesci selezionati, ma la Cesta tiene 3
  const r = s.submit({ type: "pescaria.basket.move", agentId: "u", payload: { selection: { sardina: 2, polpo: 2 } } });
  ok(!r.accepted, "selezione di 4 pesci che eccede la capienza Cesta (3) e' rifiutata");
}

// --- 4) capienza tiene conto di cosa e' GIA' in Cesta ---
{
  const s = new Session({ systems: sys, seed: 4 });
  s.submit({ type: "seed.bank", agentId: "h", payload: { bank: { sardina: 3 }, cesta: { polpo: 2 } } });
  // Cesta ha gia' 2; selezionarne 2 -> totale 4 > 3: rifiutata
  const r1 = s.submit({ type: "pescaria.basket.move", agentId: "u", payload: { selection: { sardina: 2 } } });
  ok(!r1.accepted, "con 2 gia' in Cesta, selezionarne 2 (tot 4) e' rifiutato (capienza 3)");
  // selezionarne 1 -> totale 3: ok
  const r2 = s.submit({ type: "pescaria.basket.move", agentId: "u", payload: { selection: { sardina: 1 } } });
  ok(r2.accepted, "con 2 gia' in Cesta, selezionarne 1 (tot 3) e' accettato");
  const cesta = s.getState().entities["__cesta__"] as Record<string, number>;
  ok((cesta.polpo ?? 0) === 2 && (cesta.sardina ?? 0) === 1, "la Cesta accumula: 2 polpi preesistenti + 1 sardina");
}

// --- 5) selezione vuota: valida (il giocatore puo' non conservare nulla) ---
{
  const s = new Session({ systems: sys, seed: 5 });
  s.submit({ type: "seed.bank", agentId: "h", payload: { bank: { sardina: 2 } } });
  const r = s.submit({ type: "pescaria.basket.move", agentId: "u", payload: { selection: {} } });
  ok(r.accepted, "selezione vuota e' valida: 'può' conservare significa anche non conservare");
}

// --- 6) replay == stato ---
{
  const s = new Session({ systems: sys, seed: 6 });
  s.submit({ type: "seed.bank", agentId: "h", payload: { bank: { sardina: 2, polpo: 1 } } });
  s.submit({ type: "pescaria.basket.move", agentId: "u", payload: { selection: { polpo: 1 } } });
  const a = JSON.stringify(s.getState());
  const b = JSON.stringify(Session.replay(s.getLog(), sys, 6));
  ok(a === b, "replay == stato");
}

console.log("");
if (f === 0) { console.log("VERDE. Spostamento Scarti: la scelta arriva come parametro, vincoli Banco e capienza rispettati."); process.exit(0); } else process.exit(1);
