import { Nucleus } from './Nucleus.ts';
import { Atom } from './Atom.ts';
import { StateAtom } from './StateAtom.ts';
import { ReducerAtom } from './ReducerAtom.ts';
import { WiredAtom } from './WiredAtom.ts';
import { StateWiredAtom } from './StateWiredAtom.ts';
import { ReducerWiredAtom } from './ReducerWiredAtom.ts';

export class Store {
    private container: Map<Atom, WiredAtom>;

    constructor() {
        this.container = new Map();
    }

    wire<STATE>(atom: StateAtom<STATE>, initialState: STATE): StateWiredAtom<STATE>;
    wire<STATE, ACTION>(
        atom: ReducerAtom<STATE, ACTION>,
        initialState: STATE
    ): ReducerWiredAtom<STATE, ACTION>;
    wire<STATE, ACTION>(
        atom: StateAtom<STATE> | ReducerAtom<STATE, ACTION>,
        initialState: STATE
    ): WiredAtom<STATE, ACTION>;
    wire<STATE, ACTION>(
        atom: StateAtom<STATE> | ReducerAtom<STATE, ACTION>,
        initialState: STATE
    ): WiredAtom<STATE, ACTION> {
        if (!this.container.has(atom)) {
            if (atom.type === 'state') {
                const nucleus = new Nucleus(atom, initialState)
                const wiredAtom = new StateWiredAtom(nucleus)
                this.container.set(atom, wiredAtom)
            } else {
                const nucleus = new Nucleus(atom, initialState)
                const wiredAtom = new ReducerWiredAtom(nucleus)
                this.container.set(atom, wiredAtom)
            }
        }
        return this.container.get(atom)!;
    }
}
