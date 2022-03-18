import { Atom } from './Atom.ts';
import { Reducer, ChangeHandler } from './types.ts';

export class ReducerAtom<STATE, ACTION> extends Atom<STATE, ACTION, 'reducer'> {
    constructor(reducer: Reducer<STATE, ACTION>, handlers: ChangeHandler<STATE>[] = []) {
        super(reducer, 'reducer', handlers);
    }
}

export function reducerAtom<STATE, ACTION>(
    reducer: Reducer<STATE, ACTION>,
    handlers: ChangeHandler<STATE>[] = []
) {
    return new ReducerAtom(reducer, handlers);
}
