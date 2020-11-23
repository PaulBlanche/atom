import t = require('tap')
import * as React from 'react'
import { renderHook, act, RenderHookOptions, RenderHookResult } from '@testing-library/react-hooks'
import { FetchRoot } from './context'
import { useFetch } from './useFetch'
import * as cache from '../cache'
import * as messages from '../messages'

let networkDelay = 0;
let data = { id: 0 };
let error = { id: 0 };

const myCache = cache.create({
    dedupingInterval: 0,
    fetcher: async (key) => {
        await new Promise(resolve => setTimeout(resolve, networkDelay))
        if (key === '/success') {
            return { type: 'success', data };
        }
        if (key === '/failure') {
            return { type: 'failure', error };
        }
        
        return { type: 'failure', error }
    }
})

t.test("useFetch fails when not called in context", t => {
    t.throws(() => {
        const { result } = renderHook(() => useFetch('/success'))
        const hook = result.current
    }, Error(messages.ERROR_FETCH_OUTSIDE_CONTEXT), "useReducer outside of context should fail")
    t.end()
})

t.test("useFetch success status flow", async t => {
    data = { id: 0 };

    let first = true;
    const { result, waitForNextUpdate } = renderHookInContext(() => {
        const hook = useFetch('/success')
        if (first) {
            t.equals(hook.result.status, cache.Status.PRISTINE, 'fetch status at first should be PRISTINE')
            first = false;
        }
        return hook
    })
    
    act(() => {
        const hook = result.current
        t.equals(hook.result.status, cache.Status.PENDING, 'fetch status immediatly after PRISTINE should be PENDING')
        if (hook.result.status === cache.Status.PENDING) {
            t.equals(hook.result.data, undefined, 'useFetch immediatly after first fetch shoud have no data')
        }
    })

    await waitForNextUpdate()

    let oldData = data;
    act(() => {
        const hook = result.current
        t.equals(hook.result.status, cache.Status.SUCCESS, 'fetch status should be SUCCESS after PENDING in case of success')
        if (hook.result.status === cache.Status.SUCCESS) {
            t.equals(hook.result.data, data, "fetch SUCCESS should have data")
        }

        data = { id: 1 }
        hook.refetch()
    })

    act(() => {
        const hook = result.current
        t.equals(hook.result.status, cache.Status.PENDING, 'fetch status immediatly after refetch should be PENDING')
        if (hook.result.status === cache.Status.PENDING) {
            t.equals(hook.result.data, oldData, 'refetch after SUCCESS fetch shoud have cached data')
        }
    })

    await waitForNextUpdate()

    act(() => {
        const hook = result.current
        t.equals(hook.result.status, cache.Status.SUCCESS, 'refetch status should be SUCCESS after PENDING in case of success')
        if (hook.result.status === cache.Status.SUCCESS) {
            t.equals(hook.result.data, data, "refetch SUCCESS should have new data")
        }
    })

    t.end()
})

t.test("useFetch failure status flow", async t => {
    error = { id: 0 }

    let first = true;
    const { result, waitForNextUpdate } = renderHookInContext(() => {
        const hook = useFetch('/failure')
        if (first) {
            t.equals(hook.result.status, cache.Status.PRISTINE, 'fetch status at first should be PRISTINE')
            first = false;
        }
        return hook
    })
    
    act(() => {
        const hook = result.current
        t.equals(hook.result.status, cache.Status.PENDING, 'fetch status immediatly after PRISTINE should be PENDING')
        if (hook.result.status === cache.Status.PENDING) {
            t.equals(hook.result.data, undefined, 'useFetch immediatly after first fetch shoud have no data')
        }
    })

    await waitForNextUpdate()

    act(() => {
        const hook = result.current
        t.equals(hook.result.status, cache.Status.FAILURE, 'fetch status should be FAILURE after PENDING in case of failure')
        if (hook.result.status === cache.Status.FAILURE) {
            t.equals(hook.result.error, error, "fetch FAILURE should have error")
            t.equals(hook.result.data, undefined, "fetch FAILURE without any prior SUCCESS should have no data")
        }
    })
    t.end()
})

t.test("useFetch mutate", async t => {
    console.log('test')
    data = { id : 0 }
    const { result, waitForNextUpdate } = renderHookInContext(() => useFetch<typeof data, typeof error>('/success'))
    
    await waitForNextUpdate()

    const mutatedData = { id: 1 }
    act(() => {
        const hook = result.current
        t.equals(hook.result.status, cache.Status.SUCCESS, 'should fetch with SUCCESS')
        if (hook.result.status === cache.Status.SUCCESS) {
            t.equals(hook.result.data, data, 'should have server data')
        }

        hook.mutate(mutatedData)
    })

    await waitForNextUpdate()

    act(() => {
        const hook = result.current
        t.equals(hook.result.status, cache.Status.PENDING, 'right after mutate with revalidation, status should be PENDING')
        if (hook.result.status === cache.Status.PENDING) {
            t.equals(hook.result.data, mutatedData, 'should have mutated data')
        }
    })

    await waitForNextUpdate()
    
    act(() => {
        const hook = result.current
        t.equals(hook.result.status, cache.Status.SUCCESS, 'should fetch with SUCCESS')
        if (hook.result.status === cache.Status.SUCCESS) {
            t.equals(hook.result.data, data, 'should replace mutated data with server data')
        }
    })
})

function renderHookInContext<P, R>(callback: (props: P) => R, options?: RenderHookOptions<P>): RenderHookResult<P, R> {
    return renderHook(callback, { wrapper: ContextWrapper, ...options })
}

function ContextWrapper({ children }: React.PropsWithChildren<unknown>) {
    return React.createElement(FetchRoot, { cache: myCache, children }, children);
}
