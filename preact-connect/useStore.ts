import * as hooks from 'preact/hooks';
import { storeContext } from './storeContext.ts';

export function useStore() {
    const store = hooks.useContext(storeContext);

    if (store === undefined) {
        throw Error('can\'t use atom hooks outside of a StoreProvider');
    }

    return store;
}
