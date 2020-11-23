import * as store from "./store"

enum ActionType {
    REQUEST = 'REQUEST',
    SUCCESS = 'SUCCCESS',
    FAILURE = 'FAILURE',
    VOID = 'VOID',
    MUTATE = 'MUTATE'
}

type RequestAction = { type: ActionType.REQUEST, timestamp:number }
type SuccessAction<DATA> = { type: ActionType.SUCCESS, data: DATA, timestamp:number }
type FailureAction<ERROR> = { type: ActionType.FAILURE, error: ERROR, timestamp:number }
type VoidAction = { type: ActionType.VOID }
type MutateAction<DATA> = { type: ActionType.MUTATE, data: DATA }

type Action<ERROR, DATA> = RequestAction | SuccessAction<DATA> | FailureAction<ERROR> | VoidAction | MutateAction<DATA>

export enum Status {
    STARVING = 'STARVING',
    PRISTINE = 'PRISTINE',
    PENDING = 'PENDING',
    FAILURE = 'FAILURE',
    SUCCESS = 'SUCCESS'
}

type PristineReslt = { status: Status.PRISTINE, data: undefined }
type PendingResult<DATA> = { status: Status.PENDING, data?: DATA }
type FailureResult<ERROR, DATA> = { status: Status.FAILURE, error:ERROR, data?: DATA }
type SuccessResult<SUCCESS> = { status: Status.SUCCESS, data:SUCCESS }
type StarvingResult = { status: Status.STARVING }

type State<ERROR, DATA> = (PristineReslt | PendingResult<DATA> | FailureResult<ERROR, DATA> | SuccessResult<DATA>) & { timestamp:number }

function reducer<ERROR, DATA>(state: State<ERROR, DATA>, action:Action<ERROR, DATA>): State<ERROR, DATA> {
    console.log(state, action)
    switch (action.type) {
        case ActionType.REQUEST: {
            return {
                timestamp: action.timestamp,
                status: Status.PENDING,
                data: state.data,
            }
        }
        case ActionType.FAILURE: { 
            // failure of an earlier request, but another request was
            // dispatched since then, so we discard it
            if (action.timestamp < state.timestamp) {
                return state;
            }
            return {
                timestamp: state.timestamp,
                status: Status.FAILURE,
                error: action.error,
                data: state.data,
            }
        }
        case ActionType.SUCCESS: {
            // success of an earlier request, but another request was
            // dispatched since then, so we discard it
            if (action.timestamp < state.timestamp) {
                return state;
            }
            return {
                timestamp: state.timestamp,
                status: Status.SUCCESS,
                data: action.data,
            }
        }
        case ActionType.VOID: {
            return {
                status: Status.PRISTINE,
                data: undefined,
                timestamp: -1
            }
        }
        case ActionType.MUTATE: {
            return {
                timestamp: state.timestamp,
                status: Status.SUCCESS,
                data: action.data,
            }
        }
    }
}

type StaticKey = string|string[]
export type Key = StaticKey|(() => StaticKey|false)

type FETCH_SUCCESS = 'success'
type FETCH_FAILURE = 'failure'

type FetchResult<ERROR, DATA> = { type: FETCH_SUCCESS, data:DATA } | { type: FETCH_FAILURE, error:ERROR }
type Fetcher<ERROR, DATA> = (key:StaticKey) => Promise<FetchResult<ERROR, DATA>>

type StaticMutation<DATA> = DATA|Promise<DATA>
type FunctionMutation<DATA> = (data?:DATA) => StaticMutation<DATA>
export type Mutation<DATA> = StaticMutation<DATA>|FunctionMutation<DATA>

export type Config<ERROR, DATA> = {
    dedupingInterval: number
    fetcher: Fetcher<ERROR, DATA>
    revalidate: boolean
    voidCache: boolean
}

type InnerCacheEntry<ERROR, DATA> = store.Atom<State<ERROR, DATA>, Action<ERROR, DATA>>

const DEFAULT_CONFIG: Config<any, any> = { 
    dedupingInterval: 2 * 1000,
    fetcher: (key) => fetch(Array.isArray(key) ? key[0] : key).then(response => response.json()),
    revalidate: true,
    voidCache: false,
}

function getConfig<ERROR, DATA>(cacheConfig:Partial<Config<any, any>>, entryConfig:Partial<Config<ERROR, DATA>>, callConfig: Partial<Config<ERROR, DATA>>): Config<ERROR, DATA> {
    return {
        ...DEFAULT_CONFIG,
        ...cacheConfig,
        ...entryConfig,
        ...callConfig,
    }
}

export type Cache = {
    entry<ERROR, DATA>(key: Key, entryConfig?: Partial<Config<ERROR, DATA>>): Entry<ERROR, DATA>
}

type Entry<ERROR, DATA> = {
    fetch(callConfig?: Partial<Config<ERROR, DATA>>): Result<ERROR, DATA>
    mutate(mutation: Mutation<DATA>, callConfig?: Partial<Config<ERROR, DATA>>): Promise<DATA|undefined>
    addChangeListener(handler: (state: State<ERROR, DATA>) => void): () => void
    removeChangeListener(handler: (state: State<ERROR, DATA>) => void): void
    ready: () => boolean
}

export type Result<ERROR, DATA> = PristineReslt | PendingResult<DATA> | FailureResult<ERROR, DATA> | SuccessResult<DATA> | StarvingResult

export function create(cacheConfig: Partial<Config<any, any>> = {}): Cache {
    const cacheStore = store.create()
    const cache: Map<StaticKey, InnerCacheEntry<any, any>> = new Map()

    return { entry }

    function entry<DATA, ERROR = any>(key: Key, entryConfig: Partial<Config<ERROR, DATA>> = {}): Entry<ERROR, DATA> {
        const computedKey = getKey(key)
        if (computedKey === undefined) {
            return {
                fetch() { return { status: Status.STARVING } },
                async mutate() { return undefined },
                addChangeListener() { return () => {} },
                removeChangeListener() {},
                ready() { return false }
            }
        }

        return { 
            fetch(callConfig) { return fetch(computedKey, callConfig); }, 
            mutate(mutation, callConfig) { return mutate(computedKey, mutation, callConfig); },
            addChangeListener(handler) { return addChangeListener(computedKey, handler); },
            removeChangeListener(handler) { return removeChangeListener(computedKey, handler); },
            ready() { return true }
        }

        function addChangeListener(key:StaticKey, handler: (state: State<ERROR, DATA>) => void): () => void {
            const atom = get<DATA, any>(key);

            atom.addChangeListener(handler)

            return () => removeChangeListener(key, handler)
        }

        function removeChangeListener(key:StaticKey, handler: (state: State<ERROR, DATA>) => void): void {
            const atom = get<DATA, any>(key);

            atom.removeChangeListener(handler)
        }

        async function revalidate(key:StaticKey, callConfig: Partial<Config<ERROR, DATA>> = {}): Promise<DATA|undefined> {
            const config = getConfig(cacheConfig, entryConfig, callConfig);
            const revalidateTimestamp = Date.now()
    
            const atom = get<DATA, any>(key);
            const state = cacheStore.state(atom)
    
            // Don't revalidate if a request is already pending
            if (state.status === Status.PENDING) {
                return undefined
            }
    
            // Don't revalidate if a request was done less than `config.dedupingInterval` ms ago
            if (revalidateTimestamp - state.timestamp < config.dedupingInterval) {
                return undefined
            }
    
            // Void cache before revalidation if needed
            if (config.voidCache) {
                cacheStore.dispatch<VoidAction>(atom, { type: ActionType.VOID })
            }
            
            cacheStore.dispatch<RequestAction>(atom, { 
                type: ActionType.REQUEST, 
                timestamp: revalidateTimestamp 
            })
    
            const response = await config.fetcher(key)

            if (response.type === "success") {
                cacheStore.dispatch<SuccessAction<DATA>>(atom, { 
                    type: ActionType.SUCCESS, 
                    data: response.data, 
                    timestamp: revalidateTimestamp 
                })
                return response.data;
            } else {
                cacheStore.dispatch<FailureAction<any>>(atom, { type: ActionType.FAILURE, error: response.error, timestamp: revalidateTimestamp })
                return cacheStore.state(atom).data
            }
        }
    
        function fetch(
            key: StaticKey, 
            callConfig: Partial<Config<ERROR, DATA>> = {}
        ): Result<ERROR, DATA> {
            const config = getConfig(cacheConfig, entryConfig, callConfig);
            
            const atom = get<DATA, ERROR>(key);
    
            if (!config.revalidate) {
                return cacheStore.state(atom)
            }
            
            revalidate(key, callConfig)
    
            return cacheStore.state(atom)
        }
    
        async function mutate(key:StaticKey, mutation: Mutation<DATA>, callConfig:Partial<Config<ERROR, DATA>> ={}): Promise<DATA|undefined> {
            const config = getConfig(cacheConfig, entryConfig, callConfig);
    
    
            const atom = get<DATA, any>(key);
    
            const computedMutation = isFunctionMutation(mutation) ? mutation(cacheStore.state(atom).data) : mutation
            const data = await computedMutation;
    
            cacheStore.dispatch<MutateAction<DATA>>(atom, { type: ActionType.MUTATE, data })
    
            if (!config.revalidate) {
                return data
            }
    
            return revalidate(key, callConfig)
        }
    }

    function getKey(key: Key): StaticKey|undefined {
        if (typeof key === 'function') {
            const computedKey = key()
            if (computedKey === false) {
                return undefined
            }
            key = computedKey
        }

        return key
    }

    function get<DATA, ERROR>(key:StaticKey): InnerCacheEntry<ERROR, DATA> {
        if (!cache.has(key)) {
            const entry = cacheStore.reducerAtom<State<ERROR, DATA>, Action<ERROR, DATA>>(reducer, { 
                status: Status.PRISTINE, 
                data: undefined,
                timestamp: -1 
            })
            cache.set(key, entry)
        }

        return cache.get(key)! 
    }
}

function isFunctionMutation<DATA>(mutation:Mutation<DATA>): mutation is FunctionMutation<DATA> {
    return typeof mutation === 'function'
}