# atom

atomic state hook and swr hook system

## State

first, create a store and an atom. The atom will encapsulate your state :

```ts
import { store } from 'atom/store/mod.ts';

// you can create state Atoms, that you can use with a `React.useState`-like API
type State1 = { count: number };
const atom1 = store.stateAtom<State1>({ count: 0 }); // useState api

// you can create reducer Atoms, that you can use with a `React.useReducer`-like API
type State2 = { count: number };
type Increment = { type: 'increment'; value: number };
function reducer(state: State2, action: Increment) {
    switch (action.type) {
        case 'increment': {
            return { ...state, count: state.count + action.value };
        }
        default: {
            return state;
        }
    }
}
const atom2 = store.reducerAtom<State, Increment>(reducer, { count: 0 });
```

You can now use those atom everywhere in your code with `useState` and `useReducer` hooks

```ts
import { useReducer, useState } from 'atom/preact-connect/mod.ts';

const [state, setState] = useState(atom1);
const [state, dispatch] = useReducer(atom2);
```

You can reuse the same atom in different component to access the same shared state. When the state of an atom is updated, all components using it will rerender.
