import { WiredAtom } from './WiredAtom.ts';
import { Nucleus } from './Nucleus.ts';

export class ReducerWiredAtom<STATE, ACTION> extends WiredAtom<STATE, ACTION> {
    constructor(
        nucleus: Nucleus<STATE, ACTION>,
    ) {
        super(nucleus);
    }

    dispatch(action: ACTION) {
        this.nucleus.dispatch(action);
    }
}
