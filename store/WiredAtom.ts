import { ChangeHandler } from './types.ts';
import { Nucleus } from './Nucleus.ts';

export class WiredAtom<STATE = any, ACTION = any> {
    protected nucleus: Nucleus<STATE, ACTION>;

    constructor(
        nucleus: Nucleus<STATE, ACTION>,
    ) {
        this.nucleus = nucleus;
    }

    addChangeListener(handler: ChangeHandler<STATE>) {
        this.nucleus.addChangeListener(handler);
        return () => {
            this.nucleus.removeChangeListener(handler);
        };
    }

    state(): STATE {
        return this.nucleus.state;
    }
}
