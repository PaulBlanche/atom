import * as preact from 'preact';
import { Store } from '../store/mod.ts';

export const storeContext = preact.createContext<Store | undefined>(undefined);
