import { ChangeHandler } from './types.ts';
import { Atom } from './Atom.ts';

export class StateAtom<STATE> extends Atom<STATE, STATE, 'state'> {
    constructor(handlers: ChangeHandler<STATE>[] = []) {
        super((_, state) => state, 'state', handlers);
    }
}

export function stateAtom<STATE>(handlers: ChangeHandler<STATE>[] = []) {
    return new StateAtom<STATE>(handlers);
}
