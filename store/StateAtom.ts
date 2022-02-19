import { BaseAtom } from './BaseAtom.ts'
import { Linker, ChangeHandler } from './types.ts'

export type Set<STATE extends object> = STATE | ((state: STATE) => STATE);

export class StateAtom<STATE extends object> extends BaseAtom<STATE, STATE> {
    constructor(
        linker: Linker,
        addEventListener: (handler: ChangeHandler<STATE>) => void,
        removeEventListener: (handler: ChangeHandler<STATE>) => void,
    ) {
        super(linker, addEventListener, removeEventListener);
    }

    set(state: Set<STATE>) {
        this.linker.getNucleusOf<STATE, STATE>(this).dispatch(
            typeof state === 'function' ? state(this.state()) : state,
        );
    }
}

