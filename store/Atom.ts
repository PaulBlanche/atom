import { Reducer, ChangeHandler } from './types.ts';

export class Atom<
    STATE = any,
    ACTION = any,
    TYPE extends 'reducer' | 'state' = 'reducer' | 'state',
> {
    readonly type: TYPE;
    readonly reducer: Reducer<STATE, ACTION>;
    readonly handlers: ChangeHandler<STATE>[];

    constructor(
        reducer: Reducer<STATE, ACTION>,
        type: TYPE,
        handlers: ChangeHandler<STATE>[] = []
    ) {
        this.type = type;
        this.reducer = reducer;
        this.handlers = [...handlers]
    }
}
