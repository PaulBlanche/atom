import { Reducer, ChangeHandler } from './types.ts';
import { Atom } from './Atom.ts'

export class Nucleus<STATE, ACTION> {
    state: STATE;
    private reducer: Reducer<STATE, ACTION>;
    private handlers: ChangeHandler<STATE>[]

    constructor(atom: Atom<STATE, ACTION>, intialState: STATE) {
        this.state = intialState;
        this.reducer = atom.reducer;
        this.handlers = [...atom.handlers];
    }

    dispatch(action: ACTION) {
        const nextState = this.reducer(this.state, action);

        if (nextState !== this.state) {
            const previousState = this.state
            this.state = nextState;
            this.handlers.forEach((handler) => {
                handler(previousState, nextState);
            });
        }
    }

    addChangeListener(handler: ChangeHandler<STATE>) {
        this.handlers.push(handler);
    }

    removeChangeListener(handler: ChangeHandler<STATE>) {
        const index = this.handlers.indexOf(handler);
        if (index !== -1) {
            this.handlers.splice(index, 1);
        }
    }
}
