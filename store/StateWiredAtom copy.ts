import { WiredAtom } from './WiredAtom.ts';
import { Nucleus } from './Nucleus.ts';

export type Set<STATE> = STATE | ((state: STATE) => STATE);

export class StateWiredAtom<STATE> extends WiredAtom<STATE, STATE> {
    constructor(
        nucleus: Nucleus<STATE, STATE>,
    ) {
        super(nucleus);
    }

    set(state: Set<STATE>) {
        this.nucleus.dispatch(
            isSetter(state) ? state(this.state()) : state,
        );
    }
}

function isSetter<STATE>(
    state: Set<STATE>,
): state is ((state: STATE) => STATE) {
    return typeof state === 'function';
}
