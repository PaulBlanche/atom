import { UseReducerAtom, useReducerAtom } from './useReducerAtom.ts';
import { UseStateAtom, useStateAtom } from './useStateAtom.ts';
import { ReducerAtom, StateAtom } from '../store/mod.ts';

export function useAtom<STATE>(atom: StateAtom<STATE>, initialState: STATE): UseStateAtom<STATE>;
export function useAtom<STATE, ACTION>(
    atom: ReducerAtom<STATE, ACTION>,
    initialState: STATE
): UseReducerAtom<STATE, ACTION>;
export function useAtom<STATE, ACTION>(
    atom: StateAtom<STATE> | ReducerAtom<STATE, ACTION>,
    initialState: STATE
): UseStateAtom<STATE> | UseReducerAtom<STATE, ACTION> {
    if (atom.type === 'state') {
        return useStateAtom(atom, initialState);
    } else {
        return useReducerAtom(atom, initialState);
    }
}
