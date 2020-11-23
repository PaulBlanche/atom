import * as React from 'react'
import * as messages from '../messages';
import { Atom, AtomType } from '../store';
import { useStore } from './context';

export function useReducer<STATE, ACTION>(atom: Atom<STATE, ACTION>): [STATE, (action:ACTION) => void]
export function useReducer<STATE, ACTION, SELECTED>(atom: Atom<STATE, ACTION>, selector: (state:STATE) => SELECTED): [STATE, (action:ACTION) => void]
export function useReducer<STATE, ACTION>(atom: Atom<STATE, ACTION>, selector?: (state:STATE) => STATE): [STATE, (action:ACTION) => void] {
    const store = useStore()
    if (!store.isAtom(atom)) {
        throw Error(messages.ERROR_STATE_NOT_AN_ATOM)
    }
    if (atom.type !== AtomType.REDUCER) {
        throw Error(messages.ERROR_STATE_NOT_A_REDUCER_ATOM)
    }
    const [innerState, setInnerState] = React.useState(selector ? selector(store.state(atom)) : store.state(atom));
    
    const memoizedDispatch = React.useCallback(dispatch, [atom])

    let mounted = true;
    React.useEffect(() => {
        const removeChangeListener = atom.addChangeListener(onChange)
        return () => {
            mounted = false;
            removeChangeListener()
        }
    }, []);

    return [innerState, memoizedDispatch]

    function dispatch(action: ACTION) {
        if (mounted) {
            store.dispatch(atom, action)
        }
    }

    function onChange(state: STATE) {
        setInnerState(selector ? selector(state) : state)
    }
}
