import * as hooks from 'preact/hooks';

import { StateAtom, Set } from '../store/StateAtom.ts';
import { useRerender } from './useRerender.ts'

export function useStateAtom<STATE extends object>(
    atom: StateAtom<STATE>,
): [STATE, (state: Set<STATE>) => void] {
    const rerender = useRerender();

    hooks.useEffect(() => {
        return atom.addChangeListener(rerender);
    }, []);

    return [atom.state(), atom.set.bind(atom)];
}

