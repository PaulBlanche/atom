import * as React from 'react'
import { ERROR_STATE_OUTSIDE_CONTEXT } from '../messages'
import { Store } from '../store'

type StateRootProps = {
    store: Store,
    children: React.ReactNode
}
const stateContext = React.createContext<Store|undefined>(undefined)

export function StateRoot({ children, store }: StateRootProps): React.ReactElement<StateRootProps> {
    return <stateContext.Provider value={store}>{children}</stateContext.Provider>
}

export function useStore(): Store {
    const store = React.useContext(stateContext)
    if (store === undefined) {
        throw Error(ERROR_STATE_OUTSIDE_CONTEXT)
    }
    return store
}

