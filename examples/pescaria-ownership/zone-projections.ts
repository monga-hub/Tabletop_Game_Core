// ============================================================
// RICERCA H-004 — le zone sono projection, non strutture dati
// "La mano di Alice" = SELECT * WHERE owner == Alice.
// "Il draft pool"   = SELECT * WHERE owner == @draft-pool.
// Nessun contenitore esiste davvero: tutto è una query sull'ownership.
// ============================================================
import { Projection, GameEvent } from "../../packages/core/types";

// una sola projection generica: tiene la mappa card->owner osservando il log.
// Da questa si derivano TUTTE le zone con una query, senza altre projection.
export class OwnershipProjection implements Projection<Record<string, string>> {
  readonly name = "ownership";
  private owners: Record<string, string> = {};

  observe(event: GameEvent): void {
    if (event.type === "owner.changed") {
      this.owners[event.payload.card as string] = event.payload.to as string;
    }
  }
  view(): Record<string, string> { return { ...this.owners }; }

  // le "zone" sono query, non strutture: ecco la prova dell'ipotesi
  cardsOwnedBy(owner: string): string[] {
    return Object.entries(this.owners).filter(([, o]) => o === owner).map(([c]) => c);
  }
}
