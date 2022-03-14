import type { Reducer, ChangeHandler, Nucleus } from './types.ts'

export class BaseNucleus<STATE, ACTION> implements Nucleus<STATE, ACTION> {
    state: STATE;
    reducer: Reducer<STATE, ACTION>;
    handlers: ChangeHandler<STATE>[];

    constructor(initialState: STATE, reducer: Reducer<STATE, ACTION>) {
        this.state = initialState;
        this.reducer = reducer;
        this.handlers = [];
    }

    dispatch(action: ACTION) {
        const nextState = this.reducer(this.state, action);
        if (nextState !== this.state) {
            this.state = nextState;
            this.handlers.forEach((handler) => {
                handler(this.state);
            });
        }
    }

    addEventListener(handler: ChangeHandler<STATE>) {
        this.handlers.push(handler);
    }

    removeEventListener(handler: ChangeHandler<STATE>) {
        const index = this.handlers.indexOf(handler);
        if (index !== -1) {
            this.handlers.splice(index, 1);
        }
    }
}
