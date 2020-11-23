import t = require('tap')
import * as React from 'react'
import { renderHook, act, RenderHookOptions, RenderHookResult } from '@testing-library/react-hooks'
import { StateRoot } from './context'
import { useReducer } from './useReducer'
import * as store from '../store'
import * as messages from '../messages'

const myStore = store.create()
const myOtherStore = store.create()

t.test("useReducer fails when not called in context", t => {
    const atom = myStore.reducerAtom(() => {}, void 0);
    t.throws(() => {
        const { result } = renderHook(() => useReducer(atom))
        const [state, dispatch] = result.current
    }, Error(messages.ERROR_STATE_OUTSIDE_CONTEXT), "useReducer outside of context should fail")
    t.end()
})

t.test("useReducer fails when not called with an atom of its own store", t => {
    t.throws(() => {
        const { result } = renderHookInContext(() => useReducer({} as unknown as store.Atom<any, any>))
        const [state, dispatch] = result.current
    }, Error(messages.ERROR_STATE_NOT_AN_ATOM), "useReducer with not an atom should fail")
    t.throws(() => {
        const { result } = renderHookInContext(() => useReducer([] as unknown as store.Atom<any, any>))
        const [state, dispatch] = result.current
    }, Error(messages.ERROR_STATE_NOT_AN_ATOM), "useReducer with not an atom should fail")
    t.throws(() => {
        const { result } = renderHookInContext(() => useReducer('' as unknown as store.Atom<any, any>))
        const [state, dispatch] = result.current
    }, Error(messages.ERROR_STATE_NOT_AN_ATOM), "useReducer with not an atom should fail")
    t.throws(() => {
        const { result } = renderHookInContext(() => useReducer(1 as unknown as store.Atom<any, any>))
        const [state, dispatch] = result.current
    }, Error(messages.ERROR_STATE_NOT_AN_ATOM), "useReducer with not an atom should fail")
    t.throws(() => {
        const { result } = renderHookInContext(() => useReducer(true as unknown as store.Atom<any, any>))
        const [state, dispatch] = result.current
    }, Error(messages.ERROR_STATE_NOT_AN_ATOM), "useReducer with not an atom should fail")
    t.throws(() => {
        const { result } = renderHookInContext(() => useReducer(myOtherStore.reducerAtom(() => {}, void 0)))
        const [state, dispatch] = result.current
    }, Error(messages.ERROR_STATE_NOT_AN_ATOM), "useReducer with not an atom should fail")
    t.throws(() => {
        const { result } = renderHookInContext(() => useReducer(myStore.stateAtom({})))
        const [state, dispatch] = result.current
    }, Error(messages.ERROR_STATE_NOT_A_REDUCER_ATOM), "useState with a reducer atom should fail")
    t.end()
})

t.test("useReducer returns the state", t => {
    const initialState = { count: 1 };
    const atom = myStore.reducerAtom((s,a) => s, initialState);
    const { result, rerender } = renderHookInContext(() => useReducer(atom))

    act(() => {
        const [state, dispatch] = result.current
        t.equals(state, initialState, 'useReducer should return the same state on each render')
    })
    rerender()
    act(() => {
        const [state, dispatch] = result.current
        t.equals(state, initialState, 'useReducer should return the same state on each render')
    })

    t.end()
})

t.test("useReducer can dispatch an action", t => {
    const atom = myStore.reducerAtom((state, action: number) => {
        return { ...state, count: state.count + action }
    }, { count: 1 })
    const { result } = renderHookInContext(() => useReducer(atom))
    const current = result.current;

    act(() => {
        const [state, dispatch] = result.current
        dispatch(1)
    })

    t.notEquals(current, result.current, 'dispatch should trigger rerender')

    const [state] = result.current
    t.same(state, { count: 2 }, 'state should be updated according to reducer')
    t.end()
})

t.test("useReducer with selector", t => {
    t.test("will return selected state", t => {
        const initialState = { count: 1, selected: { value:'foo' } }
        const atom = myStore.reducerAtom((state, action: number) => {
            return { ...state, count: state.count + action }
        }, initialState)
        const { result } = renderHookInContext(() => useReducer(atom, state => state.selected))
        const [state, dispatch] = result.current

        t.equals(state, initialState.selected, 'useReducer should return the selected state')
        t.end()
    })

    t.test("wont rerender if selected state did not change", t => {
        const initialState = { count: 1, selected: { value:'foo' } }
        const atom = myStore.reducerAtom((state, action: number) => {
            return { ...state, count: state.count + action }
        }, initialState)
        const { result } = renderHookInContext(() => useReducer(atom, state => state.selected))
        const current = result.current;

        act(() => {
            const [state, dispatch] = result.current
            dispatch(1)
        })

        t.equals(current, result.current, 'dispatch should not trigger rerender')
        t.end()
    })

    t.test("will rerender if selected state changes", t => {
        const initialState = { count: 1, selected: { value:'foo' } }
        const atom = myStore.reducerAtom((state, action: string) => {
            return { ...state, selected: { value: action } }
        }, initialState)
        const { result } = renderHookInContext(() => useReducer(atom, state => state.selected))
        const current = result.current;

        act(() => {
            const [state, dispatch] = result.current
            dispatch('bar')
        })

        t.notEquals(current, result.current, 'dispatch should trigger rerender')
        const [state] = result.current
        t.same(state, { value: 'bar' }, 'selected state should be updated according to reducer')
        t.end()
    })

    t.end()
})

t.test("useReducer dispatch function stability", t => {
    t.test("dispatch is stable if called with the same atom", t => {
        const atom = myStore.reducerAtom((state, action:number) => {
            return { ...state, count: state.count + action }
        }, { count: 1 })
        const { result, rerender } = renderHookInContext(() => useReducer(atom))
        const [, dispatchPrevious] = result.current

        rerender()
        act(() => {
            const [state, dispatch] = result.current
            dispatch(1)
        })

        const [, dispatchNext] = result.current
        t.equals(dispatchPrevious, dispatchNext, 'dispatch should always be the same function')
        t.end()
    })

    t.test("dispatch change if called with another atom", t => {
        const atom1 = myStore.reducerAtom((state, action:number) => {
            return { ...state, count: state.count + action }
        }, { count: 1 })
        const atom2 = myStore.reducerAtom((state, action:number) => {
            return { ...state, count: state.count + action }
        }, { count: 1 })
        const { result, rerender } = renderHookInContext((atom) => useReducer(atom), { initialProps: atom1 })
        const [, dispatchPrevious] = result.current
        
        rerender(atom2)

        const [, dispatchNext] = result.current

        t.notEquals(dispatchPrevious, dispatchNext, 'dispatch should not be the same function')
        t.end()
    })
    t.end()
})

t.test("useReducer won't try to rerender if unmounted", t => {
    const initialState = { count: 1 }
    const atom = myStore.reducerAtom((state, action:number) => {
        return { ...state, count: state.count + action }
    }, initialState)
    const { result, unmount } = renderHookInContext(() => useReducer(atom))
    const [, dispatch] = result.current

    // make react throw on error
    console.error = (...args: any[]) => {
        throw new Error(...args);
    }

    unmount()

    act(() => {
        t.notThrow(() => {
            dispatch(1)
        }, 'dispatch after unmount should not throw an error')
    })
    
    t.equals(myStore.state(atom), initialState, 'setState after unmount should be a noop')
    t.end()
})

function renderHookInContext<P, R>(callback: (props: P) => R, options?: RenderHookOptions<P>): RenderHookResult<P, R> {
    return renderHook(callback, { wrapper: ContextWrapper, ...options })
}

function ContextWrapper({ children }: React.PropsWithChildren<unknown>) {
    return React.createElement(StateRoot, { store: myStore, children }, children);
}
