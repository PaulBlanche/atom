import { Atom, Nucleus, Linker, Reducer } from './types.ts'
import { assert } from '../dep/std/asserts.ts'
import { BaseNucleus } from './BaseNucleus.ts'
import { ReducerAtom } from './ReducerAtom.ts'
import { StateAtom } from './StateAtom.ts'

export class Store implements Linker {
    // we use `any` here because it is the simplest way to allow any "kind" of
    // atoms and nucleus to be stored while not having to explicitly cast when 
    // setting/getting.  
    // deno-lint-ignore no-explicit-any
    private container: Map<Atom<any, any>, Nucleus<any, any>>;

    constructor() {
        this.container = new Map();
    }

    getNucleusOf<STATE, ACTION>(atom: Atom<STATE, ACTION>): Nucleus<STATE, ACTION> {
        const nucleus = this.container.get(atom);
        assert(nucleus !== undefined, 'unkown atom');

        return nucleus;
    }

    reducerAtom<STATE, ACTION>(
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

    stateAtom<STATE>(initialState: STATE) {
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
