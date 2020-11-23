import * as messages from "./messages"

export enum AtomType {
    REDUCER,
    STATE
}

const idKey = Symbol('id')

export type Atom<STATE, ACTION> = {
    [idKey]: string,
    type: AtomType,
    addChangeListener: (handler: ChangeHandler<STATE>) => () => void
    removeChangeListener: (handler: ChangeHandler<STATE>) => void
}

type Nucleus<STATE, ACTION> = {
    state: STATE,
    reducer: Reducer<STATE, ACTION>
    handlers: ChangeHandler<STATE>[]
}

type ChangeHandler<STATE> = (state: STATE) => void

type Reducer<STATE, ACTION> = (state:STATE, action:ACTION) => STATE
type FunctionSet<STATE> = (state:STATE) => STATE
export type Set<STATE> = STATE | FunctionSet<STATE>

type Container = {
    id: string,
    nucleus: { [s:string]: Nucleus<any, any> }
}

export type Store = {
    state<STATE>(atom: Atom<STATE, any>): STATE,
    reducerAtom<STATE, ACTION>(reducer:Reducer<STATE, ACTION>, state:STATE): Atom<STATE, ACTION>
    dispatch<ACTION>(atom: Atom<any, ACTION>, action:ACTION): void
    stateAtom<STATE>(state:STATE): Atom<STATE, STATE>
    set<STATE>(atom: Atom<STATE, STATE>, set:Set<STATE>): void
    isAtom<STATE, ACTION>(atom: unknown): atom is Atom<STATE, ACTION>
}

let storeId = 0;
export function create(): Store {
    let atomId = 0;
    const container: Container = {
        id: String(storeId+=1),
        nucleus: {},
    }

    return { reducerAtom, stateAtom, state, dispatch, set, isAtom }

    function isAtom<STATE, ACTION>(atom: unknown): atom is Atom<STATE, ACTION> {
        return _isAtom(atom) && atom[idKey].startsWith(`store:${container.id}`)
    }
    
    function reducerAtom<STATE, ACTION>(reducer:Reducer<STATE, ACTION>, state:STATE): Atom<STATE, ACTION> {
        const id = `store:${container.id}:atom:${atomId+=1}`;
        const nucleus: Nucleus<STATE, ACTION> = {
            state: state,
            reducer,
            handlers: []
        }
        const atom:Atom<STATE, ACTION> = {
            [idKey]: id,
            type: AtomType.REDUCER,
            addChangeListener,
            removeChangeListener
        }

        container.nucleus[id] = nucleus;

        return atom;

        function addChangeListener(handler: ChangeHandler<STATE>) {
            nucleus.handlers.push(handler)
            return () => removeChangeListener(handler)
        }

        function removeChangeListener(handler: ChangeHandler<STATE>) {
            const index = nucleus.handlers.indexOf(handler)
            if (index !== -1) {
                nucleus.handlers.splice(index, 1)
            }
        }
    }

    function stateAtom<STATE>(state:STATE): Atom<STATE, STATE> {
        const atom = reducerAtom<STATE, STATE>((_, state) => state, state);
        return {
            ...atom,
            type: AtomType.STATE
        }
    }

    function state<STATE>(atom: Atom<STATE, any>): STATE {
        if (!isAtom(atom)) {
            throw Error(messages.ERROR_STATE_NOT_AN_ATOM)
        }
        const nucleus = container.nucleus[atom[idKey]];
        return nucleus.state
    }

    function dispatch<STATE, ACTION>(atom: Atom<STATE, ACTION>, action: ACTION): void {
        if (!isAtom(atom)) {
            throw Error(messages.ERROR_STATE_NOT_AN_ATOM)
        }
        if (atom.type !== AtomType.REDUCER) {
            throw Error(messages.ERROR_STATE_NOT_A_REDUCER_ATOM)
        }

        const nucleus: Nucleus<STATE, ACTION> = container.nucleus[atom[idKey]];
        nucleus.state = nucleus.reducer(nucleus.state, action)
    
        for (const handler of nucleus.handlers) {
            handler(nucleus.state)
        }
    }

    function set<STATE>(atom: Atom<STATE, STATE>, set: Set<STATE>): void {
        if (!isAtom(atom)) {
            throw Error(messages.ERROR_STATE_NOT_AN_ATOM)
        }
        if (atom.type !== AtomType.STATE) {
            throw Error(messages.ERROR_STATE_NOT_A_STATE_ATOM)
        }

        const nucleus: Nucleus<STATE, STATE> = container.nucleus[atom[idKey]];
        const nextState = isFunctionSet(set) ? set(nucleus.state) : set
        nucleus.state = nucleus.reducer(nucleus.state, nextState)

        for (const handler of nucleus.handlers) {
            handler(nucleus.state)
        }
    }
}

function isFunctionSet<STATE>(set:Set<STATE>): set is FunctionSet<STATE> {
    return typeof set === "function"
}

function _isAtom(object: unknown): object is Atom<unknown, unknown> {
    return typeof object === 'object' && object !== null && idKey in object
}
