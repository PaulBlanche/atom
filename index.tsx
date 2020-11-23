import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as cache from './src/cache'
import { FetchRoot } from './src/fetch/context'
import { useFetch } from './src/fetch/useFetch'
import { StateRoot } from './src/state/context'
import { useState } from './src/state/useState'
import * as store from './src/store'

const endpoints = {
    '/user/1': () => ({ username: state.username1, id: 1 }),
    '/user/2': () => ({ username: state.username2, id: 2 }),
} as const

const state = {
    loggedin: false,
    password1: 'pass1',
    password2: 'pass2',
    username1: 'user1',
    username2: 'user2'
}

type FetchFailure = { message: string }
type User = { username: string, id:number }

const myCache = cache.create({
    fetcher: async key => {
        console.log('fetch', key)
        if (Array.isArray(key)) {
            key = key.join(':')
        }
        await new Promise((resolve, reject) => setTimeout(resolve, 200 + Math.random() * 1000))
        if (!state.loggedin) {
            return { type: 'failure', error: { message: 'not loggedin' } }
        }
        if (key in endpoints) {
            return { type: 'success', data: (endpoints as any)[key]() }
        }
        return { type: 'failure', error: {  message: 'not found' } }
    }
})

async function postNewUsername(id:number, username:string): Promise<User> {
    console.log('postNewUsername')
    return new Promise((res, rej) => setTimeout(() => {
        if (id === 1) {
            if (Math.random() < 0.5) {
                console.log('failure postNewUsername')  
            } else {  
                state.username1 = username
            }
            res(endpoints['/user/1']())
        }
        if (id === 2) {
            if (Math.random() < 0.5) {
                console.log('failure postNewUsername')  
            } else {  
                state.username2 = username
            }
            res(endpoints['/user/2']())
        }
    }, 200 + Math.random() * 1000))
}

async function postLogin(password: string): Promise<User|undefined> {
    console.log('login')
    return new Promise((res, rej) => setTimeout(() => {
        if (password === state.password1) {
            state.loggedin = true
            res(endpoints['/user/1']())
        }
        if (password === state.password2) {
            state.loggedin = true
            res(endpoints['/user/1']())
        }
        res(undefined)
    }, 200 + Math.random() * 1000))
}

async function postLogout(): Promise<void> {
    console.log('logout')
    return new Promise((res, rej) => setTimeout(() => {
        state.loggedin = false
        res()
    }, 200 + Math.random() * 1000))
}

const myStore = store.create()
const userIdAtom = myStore.stateAtom<undefined|number>(undefined)

ReactDOM.render(<StateRoot store={myStore}>
    <FetchRoot cache={myCache}>
        <A/>
        <B/>
    </FetchRoot>
</StateRoot>, document.getElementById('root'))

export function useDebounce<ARGS extends any[]>(
    call: (...args: ARGS) => void,
    immediate = true,
    timeout = 200,
): (...args: ARGS) => void {
    const handle = React.useRef<number>()

    return (...args: ARGS) => {
        const firstCall = handle.current === undefined
        if (!firstCall) {
            clearTimeout(handle.current)
        }

        handle.current = setTimeout(() => {
            call(...args)
            handle.current = undefined
        }, timeout) as any

        if (firstCall && immediate) {
            call(...args)
        }
    }
}
  
function A() {
    const [userId, setUserId] = useState(userIdAtom)
    const { result } = useFetch<User, FetchFailure>(() => userId === undefined ? false : `/user/${userId}`)

    if (result.status === cache.Status.FAILURE || result.status === cache.Status.STARVING) {
        return <NotLoggedIn />
    }

    if (result.data === undefined) {
        return <Loading />
    }

    
    return <LoggedIn user={result.data}/>

}


function NotLoggedIn() {
    const [userId, setUserId] = useState(userIdAtom)
    const [password, setPassword] = React.useState('')

    return <div>
        <p>You are not loggedin</p>
        <input value={password} onChange={(event) => setPassword(event.target.value)} />
        <button onClick={login}>Login</button>
    </div>

    async function login() {
        const user = await postLogin(password)
        if (user !== undefined) {
            setUserId(user.id)
        }
    }
}

type LoadingProps = {}

function Loading({}: LoadingProps) {
    return <div>
        <p>Chargement ...</p>
    </div>
}

type LoggedInProps = {
    user: User
}

function LoggedIn({ user }: LoggedInProps) {
    const { mutate, refetch, result } = useFetch<User, FetchFailure>(`/user/${user.id}`)
    const [username, setUsername] = React.useState('')
    const debouncedOnChange = useDebounce(onChange, false, 500)

    React.useEffect(() => {
        if (result.status !== cache.Status.STARVING && result.data !== undefined) {
            setUsername(result.data.username)
        }
    }, [result])

    return <div>
        <p>Welcome {user.username} !</p>
        <input type="text" value={username} onChange={(event) => {
            setUsername(event.target.value)
            debouncedOnChange(event)
        }}/>
    </div>

    async function onChange(event:React.ChangeEvent<HTMLInputElement>) {
        mutate({ ...user, username: event.target.value }, { revalidate: false })
        await postNewUsername(user.id, event.target.value)
        refetch({ dedupingInterval: 0 })
    }
}

function B() {
    const [userId, setUserId] = useState(userIdAtom)
    const { result, refetch } = useFetch<User, FetchFailure>(() => userId === undefined ? false : `/user/${userId}`)

    if (result.status === cache.Status.FAILURE) {
        return <div>
            <p>{result.error.message}</p>
        </div>
    }

    if (!('data' in result) || result.data === undefined) {
        return <div>
            <p>Chargement ...</p>
        </div>
    }

    return <div>
        <p>{result.data.username}</p>
        <button onClick={onClick}>Logout</button>
    </div>

    async function onClick() {
        console.log('click')
        await postLogout()
        setUserId(undefined)
        refetch({ dedupingInterval: 0, voidCache: true })
    }
}