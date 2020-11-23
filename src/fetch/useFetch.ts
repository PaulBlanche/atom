import * as React from 'react'
import { Mutation, Config, Result, Key } from '../cache'
import { useCache } from './context'

type useFetch<ERROR, DATA> = {
    mutate(mutation: Mutation<DATA>, callConfig?:Partial<Config<ERROR, DATA>>): Promise<DATA|undefined>
    refetch(callConfig?:Partial<Config<ERROR, DATA>>): void
    result: Result<ERROR, DATA>
}

export function useFetch<DATA, ERROR = any>(key: Key, entryConfig?:Partial<Config<ERROR, DATA>>): useFetch<ERROR, DATA> {
    const cache = useCache()

    const entry = cache.entry(key, entryConfig)

    const [, forceRender] = React.useReducer(() => ({}), {})

    React.useEffect(() => {
        const removeChangeListener = entry.addChangeListener((s) => {
            forceRender()
        })
        entry.fetch()
        return () => removeChangeListener()
    }, [entry.ready()])

    const result = entry.fetch({ revalidate: false })

    return { mutate, refetch, result }

    function refetch(callConfig?:Partial<Config<ERROR, DATA>>): void {
        entry.fetch(callConfig)
    }

    async function mutate(mutation: Mutation<DATA>, callConfig?:Partial<Config<ERROR, DATA>>): Promise<DATA|undefined> {
        return entry.mutate(mutation, callConfig)
    }
}
