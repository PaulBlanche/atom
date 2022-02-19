import { Atom, Nucleus, Linker, Reducer } from './types.ts'
import { assert } from '../dep/std/asserts.ts'
import { BaseNucleus } from './BaseNucleus.ts'
import { ReducerAtom } from './ReducerAtom.ts'
import { StateAtom } from './StateAtom.ts'

export class Store implements Linker {
    container: Map<Atom<any, any>, Nucleus<any, any>>;

    constructor() {
        this.container = new Map();
    }

    getNucleusOf<STATE extends object, ACTION extends object>(atom: Atom<STATE, ACTION>): Nucleus<STATE, ACTION> {
        const nucleus = this.container.get(atom);
        assert(nucleus !== undefined, 'unkown atom');

        return nucleus;
    }

    reducerAtom<STATE extends object, ACTION extends object>(
        reducer: Reducer<STATE, ACTION>,
        initialState: STATE,
    ) {
        const nucleus = new BaseNucleus<STATE, ACTION>(initialState, reducer);

        const atom = new ReducerAtom<STATE, ACTION>(
            this,
            nucleus.addEventListener.bind(nucleus),
            nucleus.removeEventListener.bind(nucleus),
        );

        this.container.set(atom, nucleus);

        return atom;
    }

    stateAtom<STATE extends object>(initialState: STATE) {
        const nucleus = new BaseNucleus<STATE, STATE>(
            initialState,
            (_, state) => state,
        );

        const atom = new StateAtom<STATE>(
            this,
            nucleus.addEventListener.bind(nucleus),
            nucleus.removeEventListener.bind(nucleus),
        );

        this.container.set(atom, nucleus);

        return atom;
    }
}
