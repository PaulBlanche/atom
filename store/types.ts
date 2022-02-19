export type ChangeHandler<STATE extends object> = (state: STATE) => void;
export type Reducer<STATE extends object, ACTION extends object> = (state: STATE, action: ACTION) => STATE;

export interface Nucleus<STATE extends object, ACTION extends object> {
    state: STATE,
    dispatch: (action: ACTION) => void
}

export interface Atom<STATE extends object, ACTION extends object> {}

export interface Linker {
    getNucleusOf<STATE extends object, ACTION extends object>(atom: Atom<STATE, ACTION>): Nucleus<STATE, ACTION>
}