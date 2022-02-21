import * as hooks from 'preact/hooks';

import { ReducerAtom } from '../store/ReducerAtom.ts'
import { useRerender } from './useRerender.ts'

type Action<STATE, ACTION, RETURN = void> =
    | Thunk<STATE, ACTION, RETURN>
    | ACTION;
type Dispatch<STATE, ACTION> = <RETURN = void>(
    action: Action<STATE, ACTION, RETURN>,
) => RETURN;
export type Thunk<STATE, ACTION, RETURN = void> = (
    dispatch: Dispatch<STATE, ACTION>,
    getState: () => STATE,
) => RETURN;


export function useReducerAtom<STATE, ACTION>(
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
        if (isThunk(action)) {
            return action(dispatch, atom.state.bind(atom));
        } else {
            // @ts-ignore: We ignore the warning saying that `void` is not 
            // asignable to RETURN, because when the `action` is not a thunk,
            // there is nothing to return, and `RETURN` should default to void.
            // Since it is difficult to express this constraint, we simply ignore
            // the typescript error.
            return atom.dispatch(action)
        }
    }
}

function isThunk<STATE, ACTION, RETURN>(action: Action<STATE, ACTION, RETURN>): action is Thunk<STATE, ACTION, RETURN> {
    return typeof action === 'function'
}
