import { Linker, ChangeHandler, Atom } from './types.ts'

export class BaseAtom<STATE extends object, ACTION extends object> implements Atom<STATE, ACTION> {
    protected linker: Linker;
    addEventListener: (handler: ChangeHandler<STATE>) => void;
    removeEventListener: (handler: ChangeHandler<STATE>) => void;

    constructor(
        linker: Linker,
        addEventListener: (handler: ChangeHandler<STATE>) => void,
        removeEventListener: (handler: ChangeHandler<STATE>) => void,
    ) {
        this.linker = linker;
        this.addEventListener = addEventListener;
        this.removeEventListener = removeEventListener;
    }

    addChangeListener(handler: ChangeHandler<STATE>) {
        this.addEventListener(handler);
        return () => {
            this.removeEventListener(handler);
        };
    }

    removeChangeListener(handler: ChangeHandler<STATE>) {
        this.removeEventListener(handler);
    }

    state(): STATE {
        return this.linker.getNucleusOf<STATE, ACTION>(this).state;
    }
}
