import * as React from 'react'
import * as messages from '../messages';
import { Atom, Set, AtomType } from '../store';
import { useStore } from './context';

export function useState<STATE>(atom: Atom<STATE, STATE>): [STATE, (set:Set<STATE>) => void]
export function useState<STATE, SELECTED>(atom: Atom<STATE, STATE>, selector: (state:STATE) => SELECTED): [SELECTED, (set:Set<STATE>) => void]
export function useState<STATE>(atom: Atom<STATE, STATE>, selector?: (state:STATE) => STATE): [STATE, (set:Set<STATE>) => void] {
    const store = useStore()
    if (!store.isAtom(atom)) {
        throw Error(messages.ERROR_STATE_NOT_AN_ATOM)
    }
    if (atom.type !== AtomType.STATE) {
        throw Error(messages.ERROR_STATE_NOT_A_STATE_ATOM)
    }

    const [innerState, setInnerState] = React.useState(selector ? selector(store.state(atom)) : store.state(atom));

    const memoizedSetState = React.useCallback(setState, [atom])

    let mounted = true;
    React.useEffect(() => {
        const removeChangeListener = atom.addChangeListener(onChange)
        return () => {
            mounted = false;
            removeChangeListener()
        }
    }, []);

    return [innerState, memoizedSetState]

    function setState(set: Set<STATE>) {
        if (mounted) {
            store.set(atom, set)
        }
    }

    function onChange(state: STATE) {
        setInnerState(selector ? selector(state) : state)
    }
}
