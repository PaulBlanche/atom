import { BaseAtom } from './BaseAtom.ts'
import { Linker, ChangeHandler } from './types.ts'

export class ReducerAtom<STATE, ACTION> extends BaseAtom<STATE, ACTION> {
    constructor(
        link: Linker,
        addEventListener: (handler: ChangeHandler<STATE>) => void,
        removeEventListener: (handler: ChangeHandler<STATE>) => void,
    ) {
        super(link, addEventListener, removeEventListener);
    }

    dispatch(action: ACTION) {
        this.linker.getNucleusOf<STATE, ACTION>(this).dispatch(action);
    }
}
