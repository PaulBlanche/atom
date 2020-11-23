# atom
atomic state hook and swr hook system

## State

first, create a store and an atom. The atom will encapsulate your state :
```ts
import { create } store from './src/store' 

const store = create();

// you can create state Atoms, that you can use with a `React.useState`-like API
type State1 = { count: number }
const atom1 = store.stateAtom<State1>({ count: 0 }); // useState api

// you can create reducer Atoms, that you can use with a `React.useReducer`-like API
type State2 = { count: number }
type Increment = { type: 'increment', value: number }
function reducer(state:State2, action:Increment) {
  switch(action.type) {
    case 'increment': {
      return { ...state, count: state.count + action.value }
    }
    default: {
      return state
    }
  }
}
const atom2 = store.reducerAtom<State, Increment>(reducer, { count: 0 });

```

Then wrap yout component tree with `<StateRoot>` : 
```tsx
function App() {
  return <StateRoot store={store} />
    {/* your application */}
  </StateRoot>
}
```

You can now use those atom everywhere in your code with `useState` and `useReducer` hooks 
```ts
import { useState } from './src/state/useState'
import { useReducer } from './src/state/useReducer'

const [state, setState] = useState(atom1)
const [state, dispatch] = useReducer(atom2)
```

You can reuse the same atom in different component to access the same shared state. When the atom state is updated, all component using it will rerender.

## Fetch

First create a cache
```ts
import { create } from './src/cache'

const cache = create()
```

Then wrap yout component tree with `<FetchRoot>` : 
```tsx
function App() {
  return <FetchRoot cache={cache} />
    {/* your application */}
  </FetchRoot>
}
```

You can now use `useFetch` everywhere in your code :
```
const { result, refetch, mutate } = useFetch(key, config)
```

On mount, this hook will call `fetcher` with the given key. The cache for the `key` is shared, wich means that any action on the `key` (a call to `refetch` or `mutate`) will trigger rerender for all components using the key.
```
type Config = { 
  fetcher?: (key) => { type:'success', data: any } | { type:'failure', error: any }, // how data is fetched from server given the key
  dedupingInterval?: number // delay after witch the same key can be fetched again
  revalidate?: boolean // wether refetch and mutate should trigger a server fetch
  voidCache?: boolean // wether the cache should be voided before revalidation
}
```

### `result`
The result object will depend on the fetching status. The `data` key will be populated either with value in cache from previous fetch, or the fresh value.
```
type Result<DATA, ERROR> = {
  type: 'PRISTINE'|'PENDING'|'SUCCESS'|'FAILURE',
  data?: DATA,
  error?: ERROR
}

### `refetch`
calling this will trigger a refetch for the key (and a rerender for all components using this key). You can override the `useFetch` config on call.
```
function refetch(config: Config): void
```

### `mutate`
calling this will set the `mutation` value in the cache, before triggering a revalidation (depending on the config). This function return in a promise the fresh data if a revalidation took place, or the mutated data otherwise.
```
async function mutate(mutation: DATA, config: Config): Promise<DATA>
```
