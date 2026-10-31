import { reduceSession, type SessionCommand, type SessionState } from "@camera-grid/domain";

export class SessionService {
  #state: SessionState;

  constructor(initialState: SessionState) {
    this.#state = initialState;
  }

  snapshot(): SessionState {
    return this.#state;
  }

  apply(command: SessionCommand) {
    const result = reduceSession(this.#state, command);
    if (result.ok) this.#state = result.state;
    return result;
  }
}
