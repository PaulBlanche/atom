import * as hooks from 'preact/hooks';

import { ReducerAtom } from '../store/mod.ts';
import { useRerender } from './useRerender.ts';
import { useStore } from './useStore.ts';

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

export type UseReducerAtom<STATE, ACTION> = [STATE, Dispatch<STATE, ACTION>];

export function useReducerAtom<STATE, ACTION, SELECTED = STATE>(
    atom: ReducerAtom<STATE, ACTION>,
    initialState: STATE
): UseReducerAtom<STATE, ACTION> {
    const rerender = useRerender();
    const store = useStore();

    const wiredAtom = store.wire(atom, initialState);

    hooks.useEffect(() => {
        return wiredAtom.addChangeListener(rerender);
    }, []);

    return [wiredAtom.state(), dispatch];

    function dispatch<RETURN = void>(
        action: Action<STATE, ACTION, RETURN>,
    ): RETURN {
        if (isThunk(action)) {
            return action(dispatch, wiredAtom.state.bind(wiredAtom));
        } else {
            // @ts-ignore: We ignore the warning saying that `void` is not
            // asignable to RETURN, because when the `action` is not a thunk,
            // there is nothing to return, and `RETURN` should default to void.
            // Since it is difficult to express this constraint, we simply ignore
            // the typescript error.
            return wiredAtom.dispatch(action);
        }
    }
}

function isThunk<STATE, ACTION, RETURN>(
    action: Action<STATE, ACTION, RETURN>,
): action is Thunk<STATE, ACTION, RETURN> {
    return typeof action === 'function';
}
