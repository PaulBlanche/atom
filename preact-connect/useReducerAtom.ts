import * as hooks from 'preact/hooks';

import { ReducerAtom } from '../store/ReducerAtom.ts'
import { useRerender } from './useRerender.ts'

type Action<STATE extends object, ACTION extends object, RETURN = void> =
    | Thunk<STATE, ACTION, RETURN>
    | ACTION;
type Dispatch<STATE extends object, ACTION extends object> = <RETURN = void>(
    action: Action<STATE, ACTION, RETURN>,
) => RETURN;
export type Thunk<STATE extends object, ACTION extends object, RETURN = void> = (
    dispatch: Dispatch<STATE, ACTION>,
    getState: () => STATE,
) => RETURN;


export function useReducerAtom<STATE extends object, ACTION extends object>(
    atom: ReducerAtom<STATE, ACTION>,
): [STATE, Dispatch<STATE, ACTION>] {
    const rerender = useRerender();

    hooks.useEffect(() => {
        return atom.addChangeListener(rerender);
    }, []);

    return [atom.state(), dispatch];

    function dispatch<RETURN = void>(
        action: Action<STATE, ACTION, RETURN>,
    ): RETURN {
        if (typeof action === 'function') {
            return action(dispatch, atom.state.bind(atom));
        } else {
            return atom.dispatch(action) as any;
        }
    }
}
