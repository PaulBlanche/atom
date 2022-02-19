import * as hooks from 'preact/hooks';

import { BaseAtom } from '../store/BaseAtom.ts'

export function useAtomCallback<STATE extends object>(atom: BaseAtom<STATE, any>, callback: (state: STATE) => void, deps: hooks.Inputs[]) {
    return hooks.useCallback(() => {
        callback(atom.state())
    }, deps)
}