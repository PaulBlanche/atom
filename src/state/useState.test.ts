import t = require('tap')
import * as React from 'react'
import { renderHook, act, RenderHookOptions, RenderHookResult } from '@testing-library/react-hooks'
import { StateRoot } from './context'
import { useState } from './useState'
import * as store from '../store'
import * as messages from '../messages'

const myStore = store.create()
const myOtherStore = store.create()

t.test("useState fails when not called in context", t => {
    const atom = myStore.stateAtom(true)
    t.throws(() => {
        const { result } = renderHook(() => useState(atom))
        const [state, setState] = result.current
    }, Error(messages.ERROR_STATE_OUTSIDE_CONTEXT), "useState outside of context should fail")
    t.end()
})

t.test("useState fails when not called with an atom of its own store", t => {
    t.throws(() => {
        const { result } = renderHookInContext(() => useState({} as unknown as store.Atom<any, any>))
        const [state, setState] = result.current
    }, Error(messages.ERROR_STATE_NOT_AN_ATOM), "useState with not an atom should fail")
    t.throws(() => {
        const { result } = renderHookInContext(() => useState([] as unknown as store.Atom<any, any>))
        const [state, setState] = result.current
    }, Error(messages.ERROR_STATE_NOT_AN_ATOM), "useState with not an atom should fail")
    t.throws(() => {
        const { result } = renderHookInContext(() => useState('' as unknown as store.Atom<any, any>))
        const [state, setState] = result.current
    }, Error(messages.ERROR_STATE_NOT_AN_ATOM), "useState with not an atom should fail")
    t.throws(() => {
        const { result } = renderHookInContext(() => useState(1 as unknown as store.Atom<any, any>))
        const [state, setState] = result.current
    }, Error(messages.ERROR_STATE_NOT_AN_ATOM), "useState with not an atom should fail")
    t.throws(() => {
        const { result } = renderHookInContext(() => useState(true as unknown as store.Atom<any, any>))
        const [state, setState] = result.current
    }, Error(messages.ERROR_STATE_NOT_AN_ATOM), "useState with not an atom should fail")
    t.throws(() => {
        const { result } = renderHookInContext(() => useState(myOtherStore.stateAtom({ count: 1 })))
        const [state, setState] = result.current
    }, Error(messages.ERROR_STATE_NOT_AN_ATOM), "useState with an atom from another store should fail")
    t.throws(() => {
        const { result } = renderHookInContext(() => useState(myStore.reducerAtom(() => {}, void 0)))
        const [state, setState] = result.current
    }, Error(messages.ERROR_STATE_NOT_A_STATE_ATOM), "useState with a reducer atom should fail")
    t.end()
})

t.test("useState returns the state", t => {
    const initialState = { count: 1 };
    const atom = myStore.stateAtom(initialState);
    const { result, rerender } = renderHookInContext(() => useState(atom))

    act(() => {
        const [state, setState] = result.current
        t.equals(state, initialState, 'useState should return the same state on each render')
    })
    rerender()
    act(() => {
        const [state, setState] = result.current
        t.equals(state, initialState, 'useState should return the same state on each render')
    })

    t.end()
})

t.test("useState can update the state", t => {
    t.test("with an object", t => {
        const previousState = { count: 1 };
        const atom = myStore.stateAtom(previousState)
        const { result } = renderHookInContext(() => useState(atom))
        const current = result.current;

        const nextState = { count: 2 }
        act(() => {
            const [state, setState] = result.current
            setState(nextState)
        })

        t.notEquals(current, result.current, 'setState should trigger rerender')

        const [state] = result.current
        t.equals(state, nextState, 'state should be updated to nextState')
        t.end()
    })

    t.test("with a function", t => {
        const previousState = { count: 1 };
        const atom = myStore.stateAtom(previousState)
        const { result } = renderHookInContext(() => useState(atom))
        const current = result.current;

        const nextState = { count: 2 }
        act(() => {
            const [state, setState] = result.current
            setState((state) => {
                t.equals(state, previousState, 'state passed to update function should be previousState')
                return nextState
            })
        })

        t.notEquals(current, result.current, 'setState should trigger rerender')

        const [state] = result.current
        t.equals(state, nextState, 'state was updated to nextState')
        t.end()
    })

    t.end()
})

t.test("useState with selector", t => {
    t.test("will return selected state", t => {
        const selected = { value:'foo' }
        const atom = myStore.stateAtom({ count: 1, selected })
        const { result } = renderHookInContext(() => useState(atom, state => state.selected))
        const [state, setState] = result.current

        t.equals(state, selected, 'useState should return the selected state')
        t.end()
    })

    t.test("wont rerender if selected state did not change", t => {
        const atom = myStore.stateAtom({ count: 1, selected: { value:'foo' } })
        const { result } = renderHookInContext(() => useState(atom, state => state.selected))
        const current = result.current;

        act(() => {
            const [state, setState] = result.current
            setState(state => ({ ...state, count: 2 }))
        })

        t.equals(current, result.current, 'setState should not trigger rerender')
        t.end()
    })

    t.test("will rerender if selected state changes", t => {
        const atom = myStore.stateAtom({ count: 1, selected: { value: 'foo' } })
        const { result } = renderHookInContext(() => useState(atom, state => state.selected))
        const current = result.current;

        const nextSelected = { value: 'bar' };
        act(() => {
            const [state, setState] = result.current
            setState(state => ({ ...state, count: 2, selected: nextSelected }))
        })

        t.notEquals(current, result.current, 'setState should trigger rerender')
        const [state] = result.current
        t.equals(state, nextSelected, 'state should be updated to nextSelected')
        t.end()
    })

    t.end()
})

t.test("useState update function stability", t => {
    t.test("update is stable if called with the same atom", t => {
        const atom = myStore.stateAtom({ count: 1 })
        const { result, rerender } = renderHookInContext(() => useState(atom))
        const [, setStatePrevious] = result.current

        rerender()
        act(() => {
            const [state, setState] = result.current
            setState({ count: 2 })
        })

        const [,setStateNext] = result.current
        t.equals(setStatePrevious, setStateNext, 'setState should always be the same function')
        t.end()
    })

    t.test("update change if called with another atom", t => {
        const atom1 = myStore.stateAtom({ count: 1 })
        const atom2 = myStore.stateAtom({ count: 1 })
        const { result, rerender } = renderHookInContext((atom) => useState(atom), { initialProps: atom1 })
        const [, setStatePrevious] = result.current
        
        rerender(atom2)

        const [,setStateNext] = result.current

        t.notEquals(setStatePrevious, setStateNext, 'setState should not be the same function')
        t.end()
    })
    t.end()
})

t.test("useState won't try to rerender if unmounted", t => {
    const initialState = { count: 1 }
    const atom = myStore.stateAtom(initialState)
    const { result, unmount } = renderHookInContext(() => useState(atom))
    const [, setState] = result.current

    // make react throw on error
    console.error = (...args: any[]) => {
        throw new Error(...args);
    }

    unmount()

    act(() => {
        t.notThrow(() => {
            setState({ count: 2 })
        }, 'setState after unmount should not throw an error')
    })
    
    t.equals(myStore.state(atom), initialState, 'setState after unmount should be a noop')
    t.end()
})


function renderHookInContext<P, R>(callback: (props: P) => R, options?: RenderHookOptions<P>): RenderHookResult<P, R> {
    return renderHook(callback, { wrapper: ContextWrapper, ...options })
}

function ContextWrapper({ children }: React.PropsWithChildren<unknown>) {
    return React.createElement(React.StrictMode, {} , React.createElement(StateRoot, { store: myStore, children }, children));
}
