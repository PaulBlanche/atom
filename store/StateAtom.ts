import { BaseAtom } from './BaseAtom.ts'
import { Linker, ChangeHandler } from './types.ts'

export type Set<STATE> = STATE | ((state: STATE) => STATE);

export class StateAtom<STATE> extends BaseAtom<STATE, STATE> {
    constructor(
        linker: Linker,
        addEventListener: (handler: ChangeHandler<STATE>) => void,
        removeEventListener: (handler: ChangeHandler<STATE>) => void,
    ) {
        super(linker, addEventListener, removeEventListener);
    }

    set(state: Set<STATE>) {
        this.linker.getNucleusOf<STATE, STATE>(this).dispatch(
            isSetter(state) ? state(this.state()) : state,
        );
    }
}

function isSetter<STATE>(state: Set<STATE>): state is ((state: STATE) => STATE) {
    return typeof state === 'function'
}