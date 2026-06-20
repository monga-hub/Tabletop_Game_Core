// helper per i test che verificano la MECCANICA del draft (non gli attributi):
// trasforma una lista di id in Card minime valide.
import { Card, Species } from "./card";
const SPECIES: Species[] = ["tonno", "branzino", "sardina", "orata"];
export function asCards(ids: string[]): Card[] {
  return ids.map((id, i) => ({ id, species: SPECIES[i % SPECIES.length], stars: (i % 4) + 1 }));
}
