export type ChangeHandler<STATE> = (state: STATE) => void;
export type Reducer<STATE, ACTION> = (state: STATE, action: ACTION) => STATE;

export interface Nucleus<STATE, ACTION> {
    state: STATE,
    dispatch: (action: ACTION) => void
}

export interface Atom<STATE, ACTION> {
    state(): STATE
}

export interface Linker {
    getNucleusOf<STATE, ACTION>(atom: Atom<STATE, ACTION>): Nucleus<STATE, ACTION>
}
