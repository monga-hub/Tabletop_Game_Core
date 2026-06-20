// ============================================================
// @framework/core — AuditProjection
// Una projection che NON serve al gioco. Serve al framework.
// Non sa cosa sia una moneta, un'asta o un contratto: osserva il flusso
// di eventi e ne misura l'integrità. Funziona con qualsiasi gioco.
// (Principio #7: soddisfatta da sola, è agnostica al dominio.)
//
// È anche il primo mattone di telemetria e debugging.
// ============================================================
import { Projection, GameEvent } from "./types";

export interface AuditReport {
  totalEvents: number;
  byType: Record<string, number>;
  intentsAccepted: number;     // eventi che sono intent radice non rifiutati
  intentsRejected: number;     // core.intent.rejected
  rootEvents: number;          // causedBy === null
  danglingCausedBy: number;    // causedBy che NON punta a un evento visto
  idMonotonicityBreaks: number;// id non strettamente crescenti
}

export class AuditProjection implements Projection<AuditReport> {
  readonly name = "audit";
  private total = 0;
  private byType: Record<string, number> = {};
  private rejected = 0;
  private roots = 0;
  private dangling = 0;
  private monoBreaks = 0;
  private lastId: number | null = null;
  private seenIds = new Set<number>();

  observe(event: GameEvent): void {
    this.total++;
    this.byType[event.type] = (this.byType[event.type] ?? 0) + 1;

    // monotonìa degli id
    if (this.lastId !== null && event.id <= this.lastId) this.monoBreaks++;
    this.lastId = event.id;
    this.seenIds.add(event.id);

    // integrità causale: causedBy deve puntare a un evento già visto
    if (event.causedBy === null) this.roots++;
    else if (!this.seenIds.has(event.causedBy)) this.dangling++;

    if (event.type === "core.intent.rejected") this.rejected++;
  }

  view(): AuditReport {
    // intent accettati = eventi radice che non sono rifiuti
    // (un intent valido entra come evento radice col proprio tipo;
    //  un rifiuto entra come core.intent.rejected, anch'esso radice)
    const intentsAccepted = this.roots - this.rejected;
    return {
      totalEvents: this.total,
      byType: { ...this.byType },
      intentsAccepted,
      intentsRejected: this.rejected,
      rootEvents: this.roots,
      danglingCausedBy: this.dangling,
      idMonotonicityBreaks: this.monoBreaks,
    };
  }
}
