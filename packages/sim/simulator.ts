// ============================================================
// @framework/sim — Simulator (cieco)
// Fa girare una partita intera. NON conosce le regole. Chiede a ogni agente,
// a turno, di scegliere tra le mosse legali (che il dominio fornisce), e
// sottomette la scelta. Si ferma quando nessun agente ha mosse legali.
//
// È il SECONDO uso reale del dominio (oltre al giocatore umano): un cliente che
// CHIEDE le mosse possibili invece di proporne una. Mette pressione a H-001.
// È anche un generatore di attriti: migliaia di partite trovano problemi che
// nessun test unitario vede.
// ============================================================
import { Session } from "../session/session";
import { Agent } from "./agent";

export interface SimResult {
  turns: number;
  finished: boolean;       // true se si è fermata per assenza di mosse (non per limite)
  log: ReturnType<Session["getLog"]>;
}

export function runGame(session: Session, agents: Agent[], maxTurns = 1000): SimResult {
  let turns = 0;
  while (turns < maxTurns) {
    let anyMoved = false;
    for (const agent of agents) {
      const legal = session.legalIntents(agent.id);
      const choice = agent.choose(legal);
      if (choice) {
        session.submit(choice);
        anyMoved = true;
        turns++;
      }
    }
    if (!anyMoved) {
      return { turns, finished: true, log: session.getLog() }; // nessuno può muovere: fine
    }
  }
  return { turns, finished: false, log: session.getLog() }; // limite raggiunto
}
