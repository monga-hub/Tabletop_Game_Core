// ============================================================
// tests/design-sensitivity — la nuova domanda del simulatore
// NON "chi vince?" ma "quanto cambiano le scelte al cambiare dell'agente?".
// Tre agenti = tre ipotesi di comportamento. Se producono distribuzioni di
// scelte DIVERSE, il design crea trade-off. Se identiche, offre poche decisioni.
// È la "sensibilità del design", lo stesso spirito del mazzo_controllo del lab.
// ============================================================
import { Session } from "../packages/session/session";
import { PescariaDraftSystem } from "../examples/pescaria/draft-system";
import { PescariaDraftPickSystem } from "../examples/pescaria/draft-pick-system";
import { GreedyStarsAgent } from "../examples/pescaria/agents/greedy-stars";
import { GreedySpeciesAgent } from "../examples/pescaria/agents/greedy-species";
import { RandomChoiceAgent } from "../examples/pescaria/agents/random";
import { sampleDeck, Card } from "../examples/pescaria/model/card";
import { runGame } from "../packages/sim/simulator";
import { Agent } from "../packages/sim/agent";

let failures = 0;
function assert(cond: boolean, msg: string) {
  if (cond) console.log(`  ✓ ${msg}`); else { console.error(`  ✗ FALLITO: ${msg}`); failures++; }
}
function makeRng(seed: number) { let s = seed; return () => { s = (s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; }; }

const systems = [PescariaDraftSystem, PescariaDraftPickSystem];

// per ogni tipo di agente, gioca 300 partite e misura: distribuzione delle
// stelle scelte, e quante volte ogni specie viene presa.
function profile(makeAgents: (s: Session, i: number) => Agent[], games = 300) {
  const starHist: Record<number, number> = {1:0,2:0,3:0,4:0};
  const speciesHist: Record<string, number> = {tonno:0,branzino:0,sardina:0,orata:0};
  for (let i = 0; i < games; i++) {
    const s = new Session({ systems, seed: i });
    s.submit({ type: "pescaria.draft.start", agentId: "h", payload: { players: ["p1","p2","p3"], cards: sampleDeck(), cardsPerPlayer: 2 } });
    runGame(s, makeAgents(s, i));
    const d = s.getState().entities["__draft__"] as { pickedCards: Record<string,string[]>; registry: Card[] };
    for (const id of Object.values(d.pickedCards).flat()) {
      const card = d.registry.find((c) => c.id === id)!;
      starHist[card.stars]++; speciesHist[card.species]++;
    }
  }
  return { starHist, speciesHist };
}

console.log("TEST — Sensibilità del design (3 ipotesi di comportamento)\n");

const stars = profile((s) => ["p1","p2","p3"].map((p) => new GreedyStarsAgent(p, () => s.getState())));
const species = profile((s) => ["p1","p2","p3"].map((p) => new GreedySpeciesAgent(p, () => s.getState())));
const random = profile((s,i) => ["p1","p2","p3"].map((p,k) => new RandomChoiceAgent(p, makeRng(i*3+k))));

console.log("  Distribuzione STELLE delle carte scelte (300 partite ciascuno):");
console.log("    greedy-stars:  ", JSON.stringify(stars.starHist));
console.log("    greedy-species:", JSON.stringify(species.starHist));
console.log("    random:        ", JSON.stringify(random.starHist));
console.log("  Distribuzione SPECIE:");
console.log("    greedy-stars:  ", JSON.stringify(stars.speciesHist));
console.log("    greedy-species:", JSON.stringify(species.speciesHist));

// MISURA DI SENSIBILITÀ: greedy-stars prende quasi solo 4★; random è uniforme.
// Se il design è sensibile, le distribuzioni divergono.
const starsHigh = stars.starHist[4] / (stars.starHist[1]+stars.starHist[2]+stars.starHist[3]+stars.starHist[4]);
const randomHigh = random.starHist[4] / (random.starHist[1]+random.starHist[2]+random.starHist[3]+random.starHist[4]);
assert(starsHigh > randomHigh + 0.2, `greedy-stars prende 4★ molto più del random (${(starsHigh*100).toFixed(0)}% vs ${(randomHigh*100).toFixed(0)}%): le scelte DIVERGONO`);

// RISULTATO REALE (inatteso): greedy-species e greedy-stars CONVERGONO.
// Con 2 carte a testa e pool ricco, l'agente-diversità diversifica restando
// sulle stelle alte: non è MAI costretto a scendere a 1★. Il trade-off
// diversità-vs-valore NON esiste in questa configurazione.
const speciesSame = JSON.stringify(species.starHist) === JSON.stringify(stars.starHist);
assert(speciesSame, "greedy-species e greedy-stars convergono: in questa config il design NON crea il trade-off atteso");
// La sensibilità reale è: greedy diverge dal random (c'è scelta), ma le due
// greedy NON divergono tra loro (la scelta è poco sensibile alla strategia).
console.log("");
console.log("  → DATO DI DESIGN (onesto): le due strategie greedy convergono.");
console.log("    Con 2 carte/pool ricco, diversità e valore non sono in conflitto.");
console.log("    Sensibilità BASSA: il draft offre meno decisioni reali di quanto sembrasse.");
console.log("    Domanda aperta: cambierebbe con più carte a testa? con un pool povero?");
console.log("    con contratti che premiano specie precise? Il simulatore lo dira'.");

console.log("");


console.log("");
if (failures === 0) { console.log("VERDE. Misuriamo la sensibilità del design, non il comportamento di un agente."); process.exit(0); }
else { console.error(`ROSSO. ${failures} asserzioni fallite.`); process.exit(1); }
