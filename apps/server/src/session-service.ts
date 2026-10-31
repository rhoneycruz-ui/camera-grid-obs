import {
  reduceSession,
  type ReduceResult,
  type SessionCommand,
  type SessionState,
} from "@camera-grid/domain";

export class SessionService {
  #state: SessionState;
  #tail: Promise<void> = Promise.resolve();

  constructor(
    initialState: SessionState,
    private readonly persist?: (state: SessionState) => Promise<unknown>,
  ) {
    this.#state = initialState;
  }

  snapshot(): SessionState {
    return this.#state;
  }

  apply(command: SessionCommand): Promise<ReduceResult> {
    const operation = this.#tail.then(async () => {
      const result = reduceSession(this.#state, command);
      if (result.ok) {
        await this.persist?.(result.state);
        this.#state = result.state;
      }
      return result;
    });
    this.#tail = operation.then(
      () => undefined,
      () => undefined,
    );
    return operation;
  }
}
