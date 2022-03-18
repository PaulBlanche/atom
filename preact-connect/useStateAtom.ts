import * as hooks from 'preact/hooks';

import { Set, StateAtom } from '../store/mod.ts';
import { useRerender } from './useRerender.ts';
import { useStore } from './useStore.ts';

export type UseStateAtom<STATE> = [STATE, (state: Set<STATE>) => void];

export function useStateAtom<STATE, SELECTED = STATE>(
    atom: StateAtom<STATE>,
    initialState: STATE
): UseStateAtom<STATE> {
    const rerender = useRerender();
    const store = useStore();

    const wiredAtom = store.wire(atom, initialState);

    hooks.useEffect(() => {
        return wiredAtom.addChangeListener(rerender);
    }, []);

    return [wiredAtom.state(), wiredAtom.set.bind(wiredAtom)];
}
