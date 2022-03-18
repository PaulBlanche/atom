/* @jsx preact.h */
/* @jsxFrag preact.Fragment */
import * as preact from 'preact';

import { storeContext } from './storeContext.ts';
import { Store } from '../store/mod.ts';

type StoreProviderProps = {
    store: Store
    children: preact.ComponentChildren;
};

export function StoreProvider({ store, children }: StoreProviderProps) {
    return (
        <storeContext.Provider value={store}>
            {children}
        </storeContext.Provider>
    );
}
