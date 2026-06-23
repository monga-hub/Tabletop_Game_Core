// tests/income — verbo "Incassare" (Fase 4). Un verbo, due effetti
// inseparabili: accredito Ducati + ritorno del pesce consumato al Sacchetto.
import { Session } from "../packages/session/session";
import { PescariaContractsCompletedSystem } from "../examples/pescaria/contracts-completed-system";
import { PescariaIncomeSystem } from "../examples/pescaria/income-system";
import { realDeck, RealCard } from "../examples/pescaria/cards/real-deck";
import { Bank } from "../examples/pescaria/resolve-contracts";
import { FISH_SPECIES } from "../examples/pescaria/model/fish";

let f = 0; const ok = (c: boolean, m: string) => { if (c) console.log(`  ✓ ${m}`); else { console.error(`  ✗ ${m}`); f++; } };
console.log("TEST — Income (verbo Incassare: Ducati + ritorno pesce)\n");

const systems = [PescariaContractsCompletedSystem, PescariaIncomeSystem];
const deck = realDeck();
const card = (sid: number): RealCard => {
  const c = deck.find((x) => x.sourceId === sid);
  if (!c) throw new Error(`carta ${sid} assente`);
  return c;
};

// r18 = 1 sardina (reward?), r74 = 2 polpi. Leggo i reward reali dal mazzo.
const r18 = card(18), r74 = card(74), r9 = card(9);
const expectedEarned = r18.reward + r74.reward;
const expectedSardineBack = (r18.requirements.sardina ?? 0);
const expectedPolpiBack = (r74.requirements.polpo ?? 0);

const s = new Session({ systems, seed: 1 });
const hand = [r18, r74, r9];
const bank: Bank = { sardina: 1, polpo: 2 }; // completa r18 e r74, non r9
const bagStart = { sardina: 0, polpo: 0, gambero: 0, mollusco: 0, branzino: 0 };

s.submit({ type: "pescaria.realhand.created", agentId: "h", payload: { hand, bank } });
// nota: __bag__ parte assente; il primo income.collected lo crea con i pesci restituiti
s.submit({ type: "pescaria.contracts.resolve", agentId: "h", payload: {} });

// prima dell'incasso: contratti completati presenti, nessun Ducato
const completedBefore = s.getState().entities["__completedContracts__"] as RealCard[];
ok(completedBefore.length === 2, "prima dell'incasso: 2 contratti completati in attesa");
ok(s.getState().entities["__ducati__"] === undefined, "prima dell'incasso: nessun Ducato");

// INCASSO
s.submit({ type: "pescaria.income.collect", agentId: "h", payload: {} });

const ducati = s.getState().entities["__ducati__"] as number;
const bagAfter = s.getState().entities["__bag__"] as Record<string, number>;
const completedAfter = s.getState().entities["__completedContracts__"] as RealCard[];

// effetto 1: Ducati
ok(ducati === expectedEarned, `effetto 1 - Ducati accreditati = somma reward (${expectedEarned})`);
// effetto 2: pesce tornato nel sacchetto
ok((bagAfter.sardina ?? 0) === expectedSardineBack, `effetto 2 - ${expectedSardineBack} sardina/e tornate nel sacchetto`);
ok((bagAfter.polpo ?? 0) === expectedPolpiBack, `effetto 2 - ${expectedPolpiBack} polpi tornati nel sacchetto`);
// i due effetti sono dello stesso verbo: entrambi presenti dopo un solo incasso
ok(ducati > 0 && (bagAfter.sardina ?? 0) + (bagAfter.polpo ?? 0) > 0, "i due effetti avvengono insieme (un solo verbo)");
// contratti completati NON azzerati: il verbo successivo (installazione
// migliorie) deve poterli leggere. Incasso e Migliorie consumano lo stesso stato.
ok(completedAfter.length === 2, "i contratti completati RESTANO dopo l'incasso (li consumera' l'installazione migliorie)");
ok(s.getState().entities["__incomeCollected__"] === true, "l'incasso e' marcato come avvenuto");

// conservazione del pesce: RIPRISTINATA come conseguenza del verbo completo.
// banco residuo (r9 non completato non ha consumato nulla; bank era 1 sardina+2 polpi,
// completare r18+r74 ha consumato 1 sardina + 2 polpi -> banco vuoto) + sacchetto.
// I pesci tornati nel sacchetto sono esattamente quelli consumati dai contratti.
const bagTotal = FISH_SPECIES.reduce((s, sp) => s + (bagAfter[sp] ?? 0), 0);
ok(bagTotal === expectedSardineBack + expectedPolpiBack, "conservazione: il pesce tornato nel sacchetto eguaglia quello speso per i contratti incassati");

// re-incasso: rifiutato dal flag (i contratti sono ancora lì, ma già incassati)
const r = s.submit({ type: "pescaria.income.collect", agentId: "h", payload: {} });
ok(!r.accepted, "income.collect ripetuto e' rifiutato (gia' incassato), benche' i contratti siano ancora presenti");

// replay == stato
const a = JSON.stringify(s.getState());
const b = JSON.stringify(Session.replay(s.getLog(), systems, 1));
ok(a === b, "replay == stato (incasso ricostruibile dal log)");

console.log("");
if (f === 0) { console.log("VERDE. Incassare: un verbo, due effetti inseparabili (Ducati + pesce al sacchetto)."); process.exit(0); } else process.exit(1);
