import * as React from 'react'
import { Cache } from '../cache'
import * as messages from '../messages'

type FetchRootProps = {
    cache: Cache,
    children: React.ReactNode
}

const fetchContext = React.createContext<Cache|undefined>(undefined)

export function FetchRoot({ children, cache }: FetchRootProps): React.ReactElement<FetchRootProps> {
    return <fetchContext.Provider value={cache}>{children}</fetchContext.Provider>
}

export function useCache(): Cache {
    const cache = React.useContext(fetchContext)
    if (cache === undefined) {
        throw Error(messages.ERROR_FETCH_OUTSIDE_CONTEXT)
    }
    return cache
}

